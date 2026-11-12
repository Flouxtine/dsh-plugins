/**
 * Host half of the Model Cascade bundle.
 *
 * Runs a two-stage model cascade: a strong "decision" model classifies the
 * task, then either the small "simple" model or the strong "complex" model
 * executes it. The panel reads state and triggers runs through the HTTP routes
 * below.
 *
 * The cascade is an explicit run requested from the panel. It deliberately does
 * not intercept the agent loop: DeepSeek Harness freezes every agent-loop
 * request and treats the session log as the only source of truth, so silently
 * re-routing a logged request to another model would break replay.
 *
 * The routes are same-origin only. A browser page elsewhere on the internet can
 * otherwise POST here without a preflight (`text/plain` is CORS-safelisted) and
 * spend model credit or rewrite the configuration, so every handler rejects a
 * mismatched `Origin` and a non-JSON body.
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DATA_DIR = process.env.DSH_HOME || join(homedir(), '.dsh');
const SETTINGS_PATH = join(DATA_DIR, 'model-cascade-settings.json');
const HISTORY_PATH = join(DATA_DIR, 'model-cascade-history.json');
const API = '/api/model-cascade';
const MAX_HISTORY = 50;
const MAX_PROMPT_CHARS = 20000;
const MAX_BODY_BYTES = 64 * 1024;
const TARGET_MAX_CHARS = 200;
const DECISION_MAX_TOKENS = 240;
const EXECUTION_MAX_TOKENS = 8192;
const ANSWER_MAX_CHARS = 20000;
const DECISION_TEXT_MAX_CHARS = 2000;
const RUN_TIMEOUT_MS = 5 * 60 * 1000;
const RUN_WINDOW_MS = 60 * 1000;
const MAX_RUNS_PER_WINDOW = 20;

const DEFAULT_SETTINGS = {
  enabled: true,
  decision: { provider: '', model: '' },
  complex: { provider: '', model: '' },
  simple: { provider: '', model: '' },
};

const DECISION_SYSTEM = [
  'You are the routing stage of a two-stage model cascade.',
  'A user task is about to be executed by one of two models: a small fast model or a large capable model.',
  'Decide which one should execute it.',
  '',
  'Answer with ONLY a JSON object and nothing else. No markdown, no prose, no code fence.',
  '{"route":"simple"|"complex","reason":"one short sentence"}',
  '',
  'Choose "simple" when a small fast model is clearly enough: formatting or rewriting short text,',
  'summarising a short passage, simple transformations, looking up well-known facts,',
  'short generic replies, and other routine well-scoped work.',
  'Choose "complex" when the task needs reasoning, code, multi-step planning, judgement under',
  'ambiguity, specialised knowledge, or careful instruction following.',
  'When in doubt choose "complex".',
].join('\n');

/** Required for the HTTP routes; the Client half never runs without the Web server. */
export const inject = ['webServer'];

function readJson(path, fallback) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // A missing or unreadable file starts from the fallback.
  }
  return fallback;
}

function writeJson(path, value) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  } catch {
    // Persistence is a derived cache; losing it must not break the panel.
  }
}

function writeResponse(res, status, payload) {
  if (res.writableEnded) return;
  // A peer that goes away mid-response must not turn into an unhandled error.
  res.on('error', () => {});
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload));
}

/**
 * Reject requests whose browser origin is not this server. A missing `Origin`
 * is allowed so non-browser clients (and same-origin navigations) still work;
 * a present but mismatched one is a cross-site request.
 */
function isSameOrigin(req) {
  const host = req.headers.host;
  const origin = req.headers.origin;
  if (typeof host !== 'string' || host === '') return false;
  if (typeof origin !== 'string' || origin === '') return true;
  let originHost = '';
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  return originHost === host;
}

/** Only an explicit JSON body is accepted, so a cross-site form post is rejected. */
function isJsonBody(req) {
  const type = req.headers['content-type'];
  if (typeof type !== 'string' || type === '') return false;
  return type.split(';', 1)[0].trim().toLowerCase() === 'application/json';
}

/**
 * Read a bounded request body. Chunks past the limit are dropped rather than
 * buffered, and the rejection happens on `end` so the handler can still answer.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let received = 0;
    let overLimit = false;
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      received += chunk.byteLength;
      if (received > MAX_BODY_BYTES) {
        overLimit = true;
        body = '';
        return;
      }
      if (!overLimit) body += String(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      if (overLimit) reject(new Error('payload-too-large'));
      else resolve(body);
    });
    req.on('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

function sanitizeTarget(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { provider: '', model: '' };
  }
  return {
    provider: typeof value.provider === 'string' ? value.provider.slice(0, TARGET_MAX_CHARS) : '',
    model: typeof value.model === 'string' ? value.model.slice(0, TARGET_MAX_CHARS) : '',
  };
}

function sanitizeSettings(value) {
  const source = value === null || typeof value !== 'object' || Array.isArray(value) ? {} : value;
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    decision: sanitizeTarget(source.decision),
    complex: sanitizeTarget(source.complex),
    simple: sanitizeTarget(source.simple),
  };
}

function isTarget(target) {
  return target.provider !== '' && target.model !== '';
}

function readHistory() {
  const parsed = readJson(HISTORY_PATH, {});
  const runs = Array.isArray(parsed.runs) ? parsed.runs : [];
  return runs
    .filter((run) => run !== null && typeof run === 'object' && typeof run.id === 'string')
    .slice(0, MAX_HISTORY);
}

function totalTokens(usage) {
  if (usage === null || typeof usage !== 'object') return 0;
  if (Number.isFinite(usage.totalTokens)) return usage.totalTokens;
  const input = Number.isFinite(usage.inputTokens) ? usage.inputTokens : 0;
  const output = Number.isFinite(usage.outputTokens) ? usage.outputTokens : 0;
  return input + output;
}

/** Collect the provider directory and the models each provider advertises. */
async function collectModels(llm) {
  if (llm === undefined) return { providers: [], models: {} };
  const providers = [];
  try {
    for (const info of llm.listProviders()) {
      if (info === null || typeof info !== 'object') continue;
      const id = typeof info.id === 'string' ? info.id : '';
      if (id === '') continue;
      providers.push({ id, name: typeof info.name === 'string' && info.name !== '' ? info.name : id });
    }
  } catch {
    // A provider directory that cannot be read leaves the picker empty.
  }
  const entries = await Promise.all(providers.map(async (provider) => {
    try {
      const list = await llm.listModels(provider.id);
      const models = (Array.isArray(list) ? list : [])
        .filter((entry) => entry !== null && typeof entry === 'object' && typeof entry.id === 'string')
        .map((entry) => ({
          id: entry.id,
          name: typeof entry.name === 'string' && entry.name !== '' ? entry.name : entry.id,
        }));
      return [provider.id, models];
    } catch {
      return [provider.id, []];
    }
  }));
  return { providers, models: Object.fromEntries(entries) };
}

/** Stream one model call and accumulate its text and usage. */
async function callModel(llm, target, { system = '', prompt, maxTokens = 0, signal }) {
  const options = {
    provider: target.provider,
    model: target.model,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  };
  if (system !== '') options.system = system;
  if (maxTokens > 0) options.maxTokens = maxTokens;
  if (signal !== undefined) options.signal = signal;
  if (signal !== undefined && signal.aborted) throw new Error('run cancelled');

  let text = '';
  let usage = null;
  let failure = null;
  try {
    for await (const chunk of llm.stream(options)) {
      if (chunk === null || typeof chunk !== 'object') continue;
      if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text;
      else if (chunk.type === 'usage' && chunk.usage !== null && typeof chunk.usage === 'object') usage = chunk.usage;
      else if (chunk.type === 'finish' && chunk.reason !== null && typeof chunk.reason === 'object') {
        if (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted') failure = chunk.reason;
      }
    }
  } catch (error) {
    if (signal !== undefined && signal.aborted) throw new Error('run cancelled');
    throw error instanceof Error ? error : new Error(String(error));
  }
  if (failure !== null) {
    if (failure.kind === 'aborted' || (signal !== undefined && signal.aborted)) throw new Error('run cancelled');
    const detail = failure.failure !== null && typeof failure.failure === 'object' ? failure.failure : {};
    throw new Error(
      typeof detail.message === 'string' && detail.message !== '' ? detail.message : `model call ${failure.kind}`,
    );
  }
  return { text: text.trim(), usage };
}

/** Read the route and reason out of the decision model's reply, or null. */
function parseDecision(text) {
  const match = /\{[\s\S]*\}/.exec(text);
  if (match === null) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    if (parsed.route !== 'simple' && parsed.route !== 'complex') return null;
    return {
      route: parsed.route,
      reason: typeof parsed.reason === 'string' ? parsed.reason.trim().slice(0, 400) : '',
    };
  } catch {
    return null;
  }
}

export function apply(ctx) {
  const llm = typeof ctx.get === 'function' ? ctx.get('llm') : undefined;
  let settings = sanitizeSettings(readJson(SETTINGS_PATH, DEFAULT_SETTINGS));
  let history = readHistory();
  let running = false;
  const runTimestamps = [];

  const saveSettings = () => writeJson(SETTINGS_PATH, { savedAt: Date.now(), settings });
  const saveHistory = () => writeJson(HISTORY_PATH, { savedAt: Date.now(), runs: history });

  const stats = () => {
    let simple = 0;
    let complex = 0;
    let tokens = 0;
    let decisionTokens = 0;
    for (const run of history) {
      if (run.route === 'simple') simple += 1;
      else if (run.route === 'complex') complex += 1;
      tokens += totalTokens(run.usage);
      decisionTokens += totalTokens(run.decisionUsage);
    }
    return { runs: history.length, simple, complex, tokens, decisionTokens };
  };

  /** The list only needs enough to draw a row; full answers stay in the run record. */
  const summarize = (run) => ({
    id: run.id,
    createdAt: run.createdAt,
    prompt: run.prompt,
    route: run.route,
    durationMs: run.durationMs,
    error: run.error,
  });

  const tooManyRuns = () => {
    const now = Date.now();
    while (runTimestamps.length > 0 && now - runTimestamps[0] > RUN_WINDOW_MS) runTimestamps.shift();
    return runTimestamps.length >= MAX_RUNS_PER_WINDOW;
  };

  const runCascade = async (prompt, signal) => {
    const startedAt = Date.now();
    const record = {
      id: randomUUID(),
      createdAt: startedAt,
      prompt: prompt.slice(0, MAX_PROMPT_CHARS),
      enabled: settings.enabled,
      route: 'complex',
      reason: '',
      decisionText: '',
      decisionProvider: '',
      decisionModel: '',
      executorProvider: '',
      executorModel: '',
      answer: '',
      usage: null,
      decisionUsage: null,
      durationMs: 0,
      error: '',
    };
    try {
      if (llm === undefined) throw new Error('the LLM service is unavailable in this profile');
      let target = settings.complex;
      if (settings.enabled) {
        if (!isTarget(settings.decision)) throw new Error('configure the decision model first');
        const decision = await callModel(llm, settings.decision, {
          system: DECISION_SYSTEM,
          prompt: record.prompt,
          maxTokens: DECISION_MAX_TOKENS,
          signal,
        });
        record.decisionText = decision.text.slice(0, DECISION_TEXT_MAX_CHARS);
        record.decisionUsage = decision.usage;
        record.decisionProvider = settings.decision.provider;
        record.decisionModel = settings.decision.model;
        const parsed = parseDecision(decision.text);
        // Fail closed: an unreadable decision keeps the strong model.
        record.route = parsed === null ? 'complex' : parsed.route;
        record.reason = parsed === null ? 'decision unparsed; kept the strong model' : parsed.reason;
        target = record.route === 'simple' ? settings.simple : settings.complex;
      }
      if (!isTarget(target)) {
        throw new Error(record.route === 'simple' ? 'configure the simple model first' : 'configure the complex model first');
      }
      const answer = await callModel(llm, target, {
        prompt: record.prompt,
        maxTokens: EXECUTION_MAX_TOKENS,
        signal,
      });
      record.executorProvider = target.provider;
      record.executorModel = target.model;
      record.answer = answer.text.slice(0, ANSWER_MAX_CHARS);
      record.usage = answer.usage;
    } catch (error) {
      record.route = 'error';
      record.error = signal !== undefined && signal.aborted
        ? 'run cancelled'
        : (error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500));
    }
    record.durationMs = Date.now() - startedAt;
    history = [record, ...history].slice(0, MAX_HISTORY);
    saveHistory();
    return record;
  };

  const routes = [
    {
      kind: 'exact',
      path: `${API}/state`,
      handler: async (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405, { allow: 'GET' });
          res.end();
          return;
        }
        if (!isSameOrigin(req)) {
          writeResponse(res, 403, { ok: false, error: 'forbidden' });
          return;
        }
        const catalog = await collectModels(llm);
        writeResponse(res, 200, {
          settings,
          providers: catalog.providers,
          models: catalog.models,
          history: history.map(summarize),
          stats: stats(),
          llmAvailable: llm !== undefined,
        });
      },
    },
    {
      kind: 'exact',
      path: `${API}/run`,
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { allow: 'POST' });
          res.end();
          return;
        }
        if (!isSameOrigin(req) || !isJsonBody(req)) {
          writeResponse(res, 403, { ok: false, error: 'forbidden' });
          return;
        }
        try {
          const parsed = JSON.parse((await readBody(req)) || '{}');
          const prompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : '';
          if (prompt === '') {
            writeResponse(res, 200, { ok: false, error: 'prompt-required' });
            return;
          }
          if (running) {
            writeResponse(res, 200, { ok: false, error: 'run-in-progress' });
            return;
          }
          if (tooManyRuns()) {
            writeResponse(res, 429, { ok: false, error: 'rate-limited' });
            return;
          }
          running = true;
          const controller = new AbortController();
          let settled = false;
          // A peer that disconnects mid-run must not keep spending tokens.
          const onClose = () => { if (!settled) controller.abort(); };
          res.on('close', onClose);
          const timer = setTimeout(() => { if (!settled) controller.abort(); }, RUN_TIMEOUT_MS);
          try {
            runTimestamps.push(Date.now());
            const record = await runCascade(prompt.slice(0, MAX_PROMPT_CHARS), controller.signal);
            settled = true;
            writeResponse(res, 200, { ok: true, run: record, stats: stats() });
          } finally {
            settled = true;
            clearTimeout(timer);
            res.removeListener('close', onClose);
            running = false;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
          writeResponse(res, message === 'payload-too-large' ? 413 : 200, { ok: false, error: message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${API}/settings`,
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { allow: 'POST' });
          res.end();
          return;
        }
        if (!isSameOrigin(req) || !isJsonBody(req)) {
          writeResponse(res, 403, { ok: false, error: 'forbidden' });
          return;
        }
        try {
          const parsed = JSON.parse((await readBody(req)) || '{}');
          settings = sanitizeSettings(parsed);
          saveSettings();
          writeResponse(res, 200, { ok: true, settings });
        } catch (error) {
          const message = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
          writeResponse(res, message === 'payload-too-large' ? 413 : 200, { ok: false, error: message });
        }
      },
    },
  ];

  for (const route of routes) {
    ctx.effect(() => ctx.webServer.register(route), `model-cascade: ${route.path}`);
  }
}
