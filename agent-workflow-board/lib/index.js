/**
 * Host half of the Agent Workflow Board bundle.
 *
 * Aggregates durable `workflow/*` engine events into run records and serves
 * them to the Client panel. The timeline is an observer: it never controls a
 * run, and a lost `workflow/end` is resolved by a staleness sweep.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const MAX_RUNS = 50;
const DATA_DIR = process.env.DSH_HOME || join(homedir(), '.dsh');
const RUNS_PATH = join(DATA_DIR, 'agent-workflow-board-runs.json');
const API = '/api/agent-workflow-board';
const STALE_MS = 30 * 60 * 1000;

function readRuns() {
  try {
    const parsed = JSON.parse(readFileSync(RUNS_PATH, 'utf8'));
    if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.runs)) {
      return parsed.runs.filter((run) => run !== null && typeof run === 'object' && typeof run.id === 'string');
    }
  } catch {
    // A missing or unreadable history starts empty.
  }
  return [];
}

function writeRuns(runs) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(RUNS_PATH, `${JSON.stringify({ savedAt: Date.now(), runs }, null, 2)}\n`, 'utf8');
  } catch {
    // History is a derived cache; losing persistence must not break the panel.
  }
}

/** Required for the HTTP routes; the Client half never runs without the Web server. */
export const inject = ['webServer'];

export function apply(ctx) {
  const runs = new Map();
  const order = [];
  for (const run of readRuns().slice(-MAX_RUNS)) {
    runs.set(run.id, run);
    order.push(run.id);
  }

  let saveTimer;
  const save = () => {
    if (saveTimer !== undefined) return;
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      writeRuns(order.map((id) => runs.get(id)).filter(Boolean));
    }, 2000);
  };

  const ensure = (info) => {
    let run = runs.get(info.id);
    if (run === undefined) {
      run = {
        id: info.id,
        name: (info.meta && info.meta.name) || 'workflow',
        description: (info.meta && info.meta.description) || '',
        startedAt: Date.now(),
        endedAt: 0,
        stopReason: '',
        phases: [],
        agents: [],
        logs: [],
      };
      runs.set(info.id, run);
      order.push(info.id);
      while (order.length > MAX_RUNS) {
        const dropped = order.shift();
        if (dropped !== undefined) runs.delete(dropped);
      }
    }
    save();
    return run;
  };

  const subscriptions = [
    ['workflow/start', (info) => { ensure(info); }],
    ['workflow/phase', (info, title) => {
      const run = ensure(info);
      if (typeof title === 'string' && title !== '') run.phases.push({ title, at: Date.now() });
    }],
    ['workflow/log', (info, message) => {
      const run = ensure(info);
      if (typeof message === 'string' && message !== '') {
        run.logs.push(message.slice(0, 300));
        if (run.logs.length > 40) run.logs.shift();
      }
    }],
    ['workflow/agent-start', (info, agent) => {
      const run = ensure(info);
      run.agents.push({
        seq: agent.seq,
        label: agent.label,
        phase: agent.phase,
        childId: agent.childId,
        status: 'running',
        at: Date.now(),
      });
    }],
    ['workflow/agent-end', (info, agent) => {
      const run = ensure(info);
      const entry = run.agents.find((item) => item.seq === agent.seq);
      if (entry !== undefined) {
        entry.status = agent.outcome === 'completed' ? 'done' : 'failed';
        entry.outcome = agent.outcome;
        entry.endedAt = Date.now();
      }
    }],
    ['workflow/end', (info, result) => {
      const run = ensure(info);
      run.endedAt = Date.now();
      run.stopReason = (result && result.stopReason) || '';
      if (result && typeof result.agentsStarted === 'number') run.agentsStarted = result.agentsStarted;
      for (const entry of run.agents) {
        if (entry.status === 'running') entry.status = 'done';
      }
    }],
  ];

  for (const [event, handler] of subscriptions) {
    ctx.effect(() => ctx.on(event, handler), `agent-workflow-board: ${event}`);
  }

  // A run whose end event was lost (crash, fork boundary) must not spin forever.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const id of order) {
      const run = runs.get(id);
      if (run !== undefined && run.endedAt === 0 && now - run.startedAt > STALE_MS) {
        run.endedAt = now;
        run.stopReason = run.stopReason || 'interrupted';
        for (const entry of run.agents) {
          if (entry.status === 'running') entry.status = 'failed';
        }
      }
    }
    save();
  }, 30000);
  ctx.effect(() => () => {
    clearInterval(sweep);
    if (saveTimer !== undefined) clearTimeout(saveTimer);
  }, 'agent-workflow-board: sweep');

  const routes = [
    {
      kind: 'exact',
      path: `${API}/runs`,
      handler: (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405);
          res.end();
          return;
        }
        const body = JSON.stringify({
          now: Date.now(),
          runs: order.map((id) => runs.get(id)).filter(Boolean),
        });
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(body);
      },
    },
  ];
  for (const route of routes) {
    ctx.effect(() => ctx.webServer.register(route), `agent-workflow-board: ${route.path}`);
  }
}
