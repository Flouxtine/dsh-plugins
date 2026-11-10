/**
 * Host half of the Agent Runtimes bundle.
 *
 * Watches the mainstream agent runtimes installed on this machine — WorkBuddy,
 * CodeBuddy CN, Codex/Codex++ and Cursor — plus DeepSeek Harness itself, and
 * serves one live snapshot to the Client console. Approval reminders come from
 * each runtime's own pending-review state; this plugin observes and never
 * takes over another runtime's approval flow.
 *
 * Everything here is a derived cache: the plugin only reads files, processes
 * and its own DSH services. It never writes to another application's state.
 */
import { execFile } from 'node:child_process';
import {
  closeSync,
  existsSync,
  fstatSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HOME = homedir();
const API = '/api/agent-runtimes';
const POLL_MS = 3000;
const HEARTBEAT_MS = 3 * 60 * 1000;
const SESSION_ACTIVE_MS = 10 * 60 * 1000;
const APPROVAL_WINDOW_MS = 48 * 60 * 60 * 1000;
const LIVE_FILE_MS = 2 * 60 * 1000;
const SQLITE_BUSY_MS = 2000;
const TAIL_BYTES = 512 * 1024;
const PGREP = '/usr/bin/pgrep';
const SQLITE = '/usr/bin/sqlite3';
const OPEN = '/usr/bin/open';

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

function pathExists(path) {
  try {
    return existsSync(path);
  } catch {
    return false;
  }
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function readJsonFile(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return parsed !== null && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function readJsonLines(path) {
  const out = [];
  for (const line of readText(path).split('\n')) {
    const text = line.trim();
    if (text === '') continue;
    try {
      const parsed = JSON.parse(text);
      if (parsed !== null && typeof parsed === 'object') out.push(parsed);
    } catch {
      // A partially written last line is normal for an append-only log.
    }
  }
  return out;
}

function listDir(path) {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function mtimeMs(path) {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}

/** Show the user's home directory as `~` in the console. */
function shortenPath(path) {
  if (typeof path !== 'string' || path === '') return '';
  if (path === HOME) return '~';
  if (path.startsWith(`${HOME}/`)) return `~/${path.slice(HOME.length + 1)}`;
  return path;
}

/** Last lines of a growing file, without reading the whole thing. */
function readTailLines(path, maxLines) {
  let fd;
  try {
    fd = openSync(path, 'r');
    const size = fstatSync(fd).size;
    if (size === 0) return [];
    const chunk = Math.min(size, TAIL_BYTES);
    const offset = Math.max(0, size - chunk);
    const buffer = Buffer.alloc(chunk);
    readSync(fd, buffer, 0, chunk, offset);
    const lines = buffer.toString('utf8').split('\n');
    // Only a read that started mid-file can begin with a partial record.
    if (offset > 0 && lines.length > 1) lines.shift();
    return lines.slice(-maxLines);
  } catch {
    return [];
  } finally {
    try {
      if (fd !== undefined) closeSync(fd);
    } catch {
      // Already closed.
    }
  }
}

/** `pgrep -f` presence check; a non-zero exit simply means "not running". */
async function isRunning(pattern) {
  try {
    await execFileAsync(PGREP, ['-f', pattern], { timeout: 2500 });
    return true;
  } catch {
    return false;
  }
}

async function runCommand(argv) {
  try {
    await execFileAsync(argv[0], argv.slice(1), { timeout: 8000 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : String(error) };
  }
}

/* ------------------------------------------------------------------ */
/* SQLite (node:sqlite with a sqlite3 CLI fallback)                    */
/* ------------------------------------------------------------------ */

let sqliteModule; // undefined = not attempted, null = unavailable

async function loadSqlite() {
  if (sqliteModule !== undefined) return sqliteModule;
  try {
    sqliteModule = await import('node:sqlite');
  } catch {
    sqliteModule = null;
  }
  return sqliteModule;
}

async function querySqlite(path, sql) {
  const sqlite = await loadSqlite();
  if (sqlite !== null) {
    let db;
    try {
      db = new sqlite.DatabaseSync(path, { readOnly: true });
      db.exec(`PRAGMA busy_timeout = ${SQLITE_BUSY_MS}`);
      return db.prepare(sql).all();
    } catch {
      // Fall through to the CLI reader.
    } finally {
      try {
        if (db !== undefined) db.close();
      } catch {
        // Already closed.
      }
    }
  }
  const { stdout } = await execFileAsync(
    SQLITE,
    ['-json', `-cmd`, `PRAGMA busy_timeout=${SQLITE_BUSY_MS}`, path, sql],
    { timeout: 10000, maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(stdout || '[]');
}

/* ------------------------------------------------------------------ */
/* runtime collectors                                                  */
/* ------------------------------------------------------------------ */

function absentRuntime(id, name) {
  return {
    id,
    name,
    installed: false,
    running: false,
    status: 'absent',
    active: null,
    sessions: [],
    approvals: [],
    extra: {},
  };
}

function normalizeRows(rows, map) {
  const out = [];
  for (const row of rows) {
    if (row === null || typeof row !== 'object') continue;
    const mapped = map(row);
    if (mapped) out.push(mapped);
  }
  return out;
}

/* --------------------------- WorkBuddy ----------------------------- */

function workbuddyPaths() {
  const dir = join(HOME, '.workbuddy');
  return {
    app: '/Applications/WorkBuddy.app',
    dir,
    db: join(dir, 'workbuddy.db'),
    sessions: join(dir, 'sessions'),
  };
}

async function collectWorkBuddy() {
  const paths = workbuddyPaths();
  const installed = pathExists(paths.app) || pathExists(paths.dir);
  if (!installed) return absentRuntime('workbuddy', 'WorkBuddy');

  const now = Date.now();
  const running = await isRunning('/Applications/WorkBuddy.app');

  // One heartbeat file per live window; the newest one is the active session.
  const heartbeats = [];
  for (const file of listDir(paths.sessions)) {
    if (!file.endsWith('.json')) continue;
    const parsed = readJsonFile(join(paths.sessions, file));
    if (parsed !== null) heartbeats.push(parsed);
  }
  heartbeats.sort((a, b) => (b.lastHeartbeat || b.updatedAt || 0) - (a.lastHeartbeat || a.updatedAt || 0));
  const heartbeat = heartbeats[0] || null;
  const heartbeatFresh = heartbeat !== null
    && now - (heartbeat.lastHeartbeat || heartbeat.updatedAt || 0) < HEARTBEAT_MS;

  let sessions = [];
  let automations = [];
  let usage = [];
  if (pathExists(paths.db)) {
    try {
      sessions = await querySqlite(paths.db, [
        'SELECT id, title, status, model, cwd, updated_at, last_activity_at, permission_mode, unread',
        'FROM sessions WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 40',
      ].join(' '));
    } catch {
      sessions = [];
    }
    try {
      automations = await querySqlite(paths.db, [
        'SELECT thread_id, thread_title, status, updated_at, created_at',
        'FROM automation_runs ORDER BY updated_at DESC LIMIT 40',
      ].join(' '));
    } catch {
      automations = [];
    }
    try {
      usage = await querySqlite(paths.db, 'SELECT session_id, used, size FROM session_usage');
    } catch {
      usage = [];
    }
  }

  const usageById = new Map();
  for (const row of usage) {
    if (typeof row.session_id === 'string' && typeof row.used === 'number') {
      usageById.set(row.session_id, { tokens: row.used, context: typeof row.size === 'number' ? row.size : 0 });
    }
  }

  const rows = normalizeRows(sessions, (row) => ({
    sessionId: typeof row.id === 'string' ? row.id : '',
    title: typeof row.title === 'string' && row.title !== '' ? row.title : (typeof row.id === 'string' ? row.id : 'Session'),
    status: typeof row.status === 'string' ? row.status : 'unknown',
    model: typeof row.model === 'string' ? row.model : '',
    cwd: typeof row.cwd === 'string' ? row.cwd : '',
    updatedAt: typeof row.updated_at === 'number' ? row.updated_at : 0,
    lastActivityAt: typeof row.last_activity_at === 'number' ? row.last_activity_at : 0,
    permissionMode: typeof row.permission_mode === 'string' ? row.permission_mode : '',
    unread: Boolean(row.unread),
    tokens: (typeof row.id === 'string' ? usageById.get(row.id) : undefined)?.tokens || 0,
    context: (typeof row.id === 'string' ? usageById.get(row.id) : undefined)?.context || 0,
    kind: 'session',
  })).filter((row) => row.sessionId !== '');

  const active = (heartbeat !== null && rows.find((row) => row.sessionId === heartbeat.sessionId))
    || rows.find((row) => row.status === 'working')
    || rows[0]
    || null;

  // A WorkBuddy session in `pending` is waiting on the user (the agent asked a
  // question or is requesting a decision); that is the clearest reminder.
  const pendingSessions = rows.filter((row) => row.status === 'pending'
    && now - (row.updatedAt || 0) < APPROVAL_WINDOW_MS);
  const pendingApprovals = pendingSessions.map((row) => ({
    id: `session:${row.sessionId}`,
    tool: 'question',
    reason: row.title,
    since: row.updatedAt || 0,
    sessionId: row.sessionId,
  }));

  const approvals = [
    ...pendingApprovals,
    ...normalizeRows(
      automations.filter((row) => row.status === 'PENDING_REVIEW'
        && now - (typeof row.updated_at === 'number' ? row.updated_at : 0) < APPROVAL_WINDOW_MS),
      (row) => ({
        id: `automation:${row.thread_id}`,
        tool: 'automation review',
        reason: typeof row.thread_title === 'string' && row.thread_title !== ''
          ? row.thread_title
          : 'Background automation waiting for review',
        since: typeof row.updated_at === 'number' ? row.updated_at : (typeof row.created_at === 'number' ? row.created_at : 0),
        sessionId: typeof row.thread_id === 'string' ? row.thread_id : '',
      }),
    ).filter((row) => row.id !== 'automation:undefined'),
  ];

  const sessionActive = active !== null
    && active.status === 'working'
    && now - (active.lastActivityAt || active.updatedAt || 0) < SESSION_ACTIVE_MS;
  const status = pendingSessions.length > 0
    ? 'waiting'
    : (heartbeatFresh || sessionActive)
      ? 'running'
      : (active !== null && active.status === 'error' ? 'error' : (running ? 'idle' : 'stopped'));

  return {
    id: 'workbuddy',
    name: 'WorkBuddy',
    installed: true,
    running,
    status,
    active,
    sessions: rows.slice(0, 12),
    approvals,
    extra: heartbeat !== null
      ? { heartbeatAt: heartbeat.lastHeartbeat || heartbeat.updatedAt || 0, pid: heartbeat.pid }
      : {},
  };
}

/* --------------------------- CodeBuddy ----------------------------- */

function codeBuddyPaths() {
  const dir = join(HOME, 'Library', 'Application Support', 'CodeBuddy CN');
  return {
    app: '/Applications/CodeBuddy CN.app',
    dir,
    globalState: join(dir, 'User', 'globalStorage', 'state.vscdb'),
  };
}

async function collectCodeBuddy() {
  const paths = codeBuddyPaths();
  const installed = pathExists(paths.app) || pathExists(paths.dir);
  if (!installed) return absentRuntime('codebuddy', 'CodeBuddy CN');

  const running = await isRunning('/Applications/CodeBuddy CN.app');

  // CodeBuddy keeps its chat index in the workspace/global state. It is empty
  // until a conversation exists, so the runtime stays presence-only then.
  let sessions = [];
  if (pathExists(paths.globalState)) {
    try {
      const rows = await querySqlite(paths.globalState, [
        "SELECT value FROM ItemTable WHERE key = 'chat.ChatSessionStore.index'",
      ].join(' '));
      const parsed = rows.length > 0 && typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : null;
      const entries = parsed && typeof parsed === 'object' && parsed.entries !== null && typeof parsed.entries === 'object'
        ? Object.values(parsed.entries)
        : [];
      sessions = normalizeRows(entries, (row) => ({
        sessionId: typeof row.id === 'string' ? row.id : '',
        title: typeof row.title === 'string' && row.title !== '' ? row.title : 'Conversation',
        status: typeof row.status === 'string' ? row.status : 'unknown',
        model: typeof row.model === 'string' ? row.model : '',
        cwd: typeof row.cwd === 'string' ? row.cwd : '',
        updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : 0,
        lastActivityAt: 0,
        permissionMode: '',
        unread: false,
        kind: 'session',
      })).filter((row) => row.sessionId !== '');
    } catch {
      sessions = [];
    }
  }

  const active = sessions[0] || null;

  // The chat mode (Agent / Plan / Ask) is the closest thing CodeBuddy exposes
  // to a live route; its conversation list stays empty until one exists.
  let mode = '';
  if (pathExists(paths.globalState)) {
    try {
      const rows = await querySqlite(paths.globalState, "SELECT value FROM ItemTable WHERE key = 'CodeBuddy.settings'");
      if (rows.length > 0 && typeof rows[0].value === 'string') {
        const settings = JSON.parse(rows[0].value);
        const chat = settings !== null && typeof settings === 'object' ? settings.chat : null;
        if (chat !== null && typeof chat === 'object' && typeof chat.defaultMode === 'string') mode = chat.defaultMode;
      }
    } catch {
      mode = '';
    }
  }

  return {
    id: 'codebuddy',
    name: 'CodeBuddy CN',
    installed: true,
    running,
    status: running ? (active !== null ? 'running' : 'idle') : 'stopped',
    active,
    sessions,
    approvals: [],
    extra: { source: 'presence', mode },
  };
}

/* ----------------------------- Codex ------------------------------- */

function codexPaths() {
  const dir = join(HOME, '.codex');
  return {
    app: '/Applications/Codex.app',
    appPlus: '/Applications/Codex++.app',
    dir,
    index: join(dir, 'session_index.jsonl'),
    sessions: join(dir, 'sessions'),
  };
}

let codexRolloutIndex = { at: 0, map: new Map() };

function codexRolloutFile(sessionsDir, sessionId) {
  const now = Date.now();
  if (now - codexRolloutIndex.at > 60000) {
    const map = new Map();
    for (const year of listDir(sessionsDir)) {
      for (const month of listDir(join(sessionsDir, year))) {
        for (const day of listDir(join(sessionsDir, year, month))) {
          const dir = join(sessionsDir, year, month, day);
          for (const file of listDir(dir)) {
            if (!file.endsWith('.jsonl')) continue;
            const match = file.match(/rollout-.*-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/);
            if (match !== null) map.set(match[1], join(dir, file));
          }
        }
      }
    }
    codexRolloutIndex = { at: now, map };
  }
  return codexRolloutIndex.map.get(sessionId) || null;
}

function analyzeRollout(lines) {
  let lastEvent = '';
  let turnContext = null;
  let totalTokens = 0;
  const itemTail = [];
  for (const line of lines) {
    if (line.trim() === '') continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (parsed.type === 'turn_context' && parsed.payload !== null && typeof parsed.payload === 'object') {
      turnContext = parsed.payload;
      continue;
    }
    if (parsed.type === 'event_msg' && parsed.payload !== null && typeof parsed.payload === 'object') {
      if (typeof parsed.payload.type === 'string') lastEvent = parsed.payload.type;
      if (parsed.payload.type === 'token_count') {
        const usage = parsed.payload.info && parsed.payload.info.total_token_usage;
        if (usage !== null && typeof usage === 'object' && typeof usage.total_tokens === 'number') {
          totalTokens = usage.total_tokens;
        }
      }
      continue;
    }
    if (parsed.type === 'response_item' && parsed.payload !== null && typeof parsed.payload === 'object') {
      const kind = parsed.payload.type;
      if (kind === 'function_call' || kind === 'custom_tool_call') itemTail.push('call');
      else if (kind === 'function_call_output' || kind === 'custom_tool_call_output') itemTail.push('output');
      else itemTail.push('other');
      if (itemTail.length > 10) itemTail.shift();
    }
  }
  const pendingTool = itemTail.length > 0 && itemTail[itemTail.length - 1] === 'call';
  const done = lastEvent === 'task_complete';
  return {
    lastEvent,
    turnContext,
    pendingTool,
    totalTokens,
    status: done ? 'idle' : (pendingTool || lastEvent === 'task_started' ? 'running' : 'idle'),
  };
}

async function collectCodex() {
  const paths = codexPaths();
  const installed = pathExists(paths.dir) || pathExists(paths.appPlus) || pathExists(paths.app);
  if (!installed) return absentRuntime('codex', 'Codex++');

  const running = (await isRunning('/Applications/Codex++'))
    || (await isRunning('/Applications/Codex.app'))
    || (await isRunning('codex app-server'));

  const threads = readJsonLines(paths.index).sort((a, b) => {
    const left = Date.parse(a.updated_at || '') || 0;
    const right = Date.parse(b.updated_at || '') || 0;
    return right - left;
  });

  const now = Date.now();
  const sessions = [];
  const approvals = [];
  let active = null;

  for (const thread of threads.slice(0, 8)) {
    if (typeof thread.id !== 'string' || thread.id === '') continue;
    const updatedAt = Date.parse(thread.updated_at || '') || 0;
    const file = codexRolloutFile(paths.sessions, thread.id);
    if (file === null) continue;
    const analysis = analyzeRollout(readTailLines(file, 500));
    const context = analysis.turnContext || {};
    const fileFresh = mtimeMs(file) > 0 && now - mtimeMs(file) < LIVE_FILE_MS;
    const row = {
      sessionId: thread.id,
      title: typeof thread.thread_name === 'string' && thread.thread_name !== '' ? thread.thread_name : thread.id,
      status: analysis.status === 'running' && fileFresh ? 'running' : 'idle',
      model: typeof context.model === 'string' ? context.model : '',
      cwd: typeof context.cwd === 'string' ? context.cwd : '',
      updatedAt,
      lastActivityAt: mtimeMs(file),
      permissionMode: typeof context.approval_policy === 'string' ? context.approval_policy : '',
      unread: false,
      tokens: analysis.totalTokens,
      context: 0,
      kind: 'thread',
    };
    sessions.push(row);
    if (active === null && (row.status === 'running' || (row.lastActivityAt > 0 && now - row.lastActivityAt < LIVE_FILE_MS))) {
      active = row;
    }
    // A function call with no output after it means the turn is waiting on the
    // user; with an approval policy that asks, that is an approval reminder.
    if (analysis.pendingTool && analysis.status === 'running' && fileFresh
      && row.permissionMode !== '' && row.permissionMode !== 'never') {
      approvals.push({
        id: `codex:${row.sessionId}`,
        tool: 'tool approval',
        reason: row.title,
        since: row.lastActivityAt || row.updatedAt || now,
        sessionId: row.sessionId,
      });
    }
  }

  if (active === null && sessions.length > 0) active = sessions[0];
  const status = active !== null && active.status === 'running' ? 'running' : (running ? 'idle' : 'stopped');

  return {
    id: 'codex',
    name: 'Codex++',
    installed: true,
    running,
    status,
    active,
    sessions: sessions.slice(0, 12),
    approvals,
    extra: { approvalPolicy: active !== null ? active.permissionMode : '' },
  };
}

/* ----------------------------- Cursor ------------------------------ */

function cursorPaths() {
  const dir = join(HOME, 'Library', 'Application Support', 'Cursor');
  return {
    app: '/Applications/Cursor.app',
    dir,
    state: join(dir, 'User', 'globalStorage', 'state.vscdb'),
    search: join(dir, 'User', 'globalStorage', 'conversation-search.db'),
  };
}

async function collectCursor() {
  const paths = cursorPaths();
  const installed = pathExists(paths.app) || pathExists(paths.dir);
  if (!installed) return absentRuntime('cursor', 'Cursor');

  const now = Date.now();
  const running = await isRunning('/Applications/Cursor.app');

  let titles = new Map();
  if (pathExists(paths.search)) {
    try {
      const rows = await querySqlite(paths.search, 'SELECT id, title FROM conversations WHERE is_archived = 0');
      for (const row of rows) {
        if (typeof row.id === 'string' && typeof row.title === 'string' && row.title !== '') titles.set(row.id, row.title);
      }
    } catch {
      titles = new Map();
    }
  }

  let sessions = [];
  if (pathExists(paths.state)) {
    try {
      const rows = await querySqlite(paths.state, [
        'SELECT composerId, workspaceId, lastUpdatedAt, isArchived, isSubagent, value',
        'FROM composerHeaders ORDER BY lastUpdatedAt DESC LIMIT 60',
      ].join(' '));
      sessions = normalizeRows(rows, (row) => {
        if (typeof row.composerId !== 'string' || row.composerId === '' || row.composerId === 'empty-state-draft') return null;
        let value = null;
        if (typeof row.value === 'string' && row.value !== '') {
          try {
            value = JSON.parse(row.value);
          } catch {
            value = null;
          }
        }
        const isDraft = value !== null && value.isDraft === true;
        if (isDraft) return null;
        const id = row.composerId;
        return {
          sessionId: id,
          title: titles.get(id) || `Conversation ${id.slice(0, 8)}`,
          status: value !== null && value.hasBlockingPendingActions === true ? 'waiting' : 'idle',
          model: '',
          cwd: typeof row.workspaceId === 'string' ? row.workspaceId : '',
          updatedAt: typeof row.lastUpdatedAt === 'number' ? row.lastUpdatedAt : 0,
          lastActivityAt: typeof row.lastUpdatedAt === 'number' ? row.lastUpdatedAt : 0,
          permissionMode: value !== null && value.unifiedMode === 'agent' ? 'agent' : '',
          unread: false,
          kind: 'composer',
          pendingActions: value !== null && value.hasBlockingPendingActions === true,
        };
      }).filter((row) => row.sessionId !== '');
    } catch {
      sessions = [];
    }
  }

  const active = sessions[0] || null;
  const approvals = sessions
    .filter((row) => row.pendingActions === true)
    .map((row) => ({
      id: `cursor:${row.sessionId}`,
      tool: 'pending action',
      reason: row.title,
      since: row.updatedAt || now,
      sessionId: row.sessionId,
    }));

  const status = active !== null && active.status === 'waiting'
    ? 'waiting'
    : (active !== null && now - active.updatedAt < LIVE_FILE_MS ? 'running' : (running ? 'idle' : 'stopped'));

  return {
    id: 'cursor',
    name: 'Cursor',
    installed: true,
    running,
    status,
    active,
    sessions: sessions.slice(0, 12),
    approvals,
    extra: {},
  };
}

/* ------------------------------ DSH -------------------------------- */

async function collectDsh(ctx) {
  let sessions = [];
  try {
    const all = ctx.sessions && typeof ctx.sessions.list === 'function' ? ctx.sessions.list() : [];
    sessions = all.map((session) => {
      const id = session.id;
      const header = session.header;
      let lastEventTime = 0;
      let running = false;
      try {
        const events = session.ownEvents();
        if (events.length > 0) lastEventTime = events[events.length - 1].time || 0;
      } catch {
        // Fall back to the creation time.
      }
      try {
        if (ctx.agents && typeof ctx.agents.turnBoundaryOf === 'function') {
          const boundary = ctx.agents.turnBoundaryOf(session);
          const openTurn = boundary.openTurnStartSeq !== null && boundary.openTurnStartSeq !== undefined;
          const openStep = boundary.lastStepBoundary !== null
            && boundary.lastStepBoundary !== undefined
            && boundary.lastStepBoundary.kind === 'start';
          running = openTurn || openStep;
        }
      } catch {
        // A session without a readable turn boundary counts as idle.
      }
      const seq = typeof session.seq === 'number' ? session.seq : 0;
      const createdAt = header && typeof header.createdAt === 'number' ? header.createdAt : 0;
      return {
        sessionId: id,
        title: '',
        status: running ? 'running' : 'idle',
        model: '',
        cwd: header && typeof header.cwd === 'string' ? header.cwd : '',
        updatedAt: Math.max(lastEventTime, createdAt),
        lastActivityAt: lastEventTime,
        permissionMode: '',
        unread: false,
        tokens: 0,
        context: 0,
        kind: 'session',
        parentSession: header && typeof header.parentSession === 'string' ? header.parentSession : '',
        agentPreset: header && typeof header.agentPreset === 'string' ? header.agentPreset : '',
        blank: seq <= 0,
        pending: [],
      };
    });
  } catch {
    sessions = [];
  }

  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  const visible = sessions.filter((row) => row.blank !== true);
  const shown = visible.slice(0, 12);

  // `sessionController.state` is the authoritative passive state: it tells us
  // whether the agent is running and whether the session is waiting on an
  // approval or a question. The turn boundary above is only the fallback.
  const controller = typeof ctx.get === 'function' ? ctx.get('sessionController') : undefined;
  if (controller !== undefined && typeof controller.state === 'function') {
    const signal = new AbortController().signal;
    for (const row of shown) {
      try {
        const state = await controller.state({ sessionId: row.sessionId }, signal);
        if (state !== null && typeof state === 'object') {
          if (typeof state.running === 'boolean') row.status = state.running ? 'running' : 'idle';
          if (Array.isArray(state.pendingInput)) {
            for (const kind of state.pendingInput) {
              if ((kind === 'approval' || kind === 'question') && !row.pending.includes(kind)) row.pending.push(kind);
            }
          }
        }
      } catch {
        // Keep the turn-boundary fallback for this session.
      }
    }
  }

  const approvals = [];
  for (const row of shown) {
    for (const kind of row.pending) {
      approvals.push({
        id: `dsh:${row.sessionId}:${kind}`,
        tool: kind,
        reason: row.cwd !== '' ? row.cwd.split('/').pop() : '',
        since: row.updatedAt,
        sessionId: row.sessionId,
      });
    }
  }

  const active = visible[0] || sessions[0] || null;
  const runningCount = visible.filter((row) => row.status === 'running').length;

  return {
    id: 'dsh',
    name: 'DeepSeek Harness',
    installed: true,
    running: true,
    status: runningCount > 0 ? 'running' : 'idle',
    active,
    sessions: shown,
    approvals,
    extra: { runningCount, sessionCount: visible.length, self: true },
  };
}

/* ------------------------------------------------------------------ */
/* snapshot                                                            */
/* ------------------------------------------------------------------ */

const COLLECTORS = [
  { id: 'workbuddy', name: 'WorkBuddy', app: '/Applications/WorkBuddy.app', collect: () => collectWorkBuddy() },
  { id: 'codebuddy', name: 'CodeBuddy CN', app: '/Applications/CodeBuddy CN.app', collect: () => collectCodeBuddy() },
  { id: 'codex', name: 'Codex++', app: '/Applications/Codex++.app', collect: () => collectCodex() },
  { id: 'cursor', name: 'Cursor', app: '/Applications/Cursor.app', collect: () => collectCursor() },
  { id: 'dsh', name: 'DeepSeek Harness', app: '', collect: (ctx) => collectDsh(ctx) },
];

async function collectSnapshot(ctx) {
  const now = Date.now();
  const runtimes = [];
  for (const entry of COLLECTORS) {
    try {
      runtimes.push(await entry.collect(ctx));
    } catch (error) {
      runtimes.push({
        id: entry.id,
        name: entry.name,
        installed: true,
        running: false,
        status: 'error',
        active: null,
        sessions: [],
        approvals: [],
        extra: { error: error && error.message ? error.message : String(error) },
      });
    }
  }

  const approvals = [];
  for (const runtime of runtimes) {
    if (runtime.active !== null && typeof runtime.active === 'object') {
      runtime.active = { ...runtime.active, cwd: shortenPath(runtime.active.cwd) };
    }
    if (Array.isArray(runtime.sessions)) {
      runtime.sessions = runtime.sessions.map((session) => ({ ...session, cwd: shortenPath(session.cwd) }));
    }
    for (const approval of runtime.approvals || []) {
      approvals.push({
        runtimeId: runtime.id,
        runtimeName: runtime.name,
        approvalId: approval.id,
        tool: approval.tool,
        reason: approval.reason,
        since: approval.since,
        sessionId: approval.sessionId,
      });
    }
  }
  approvals.sort((a, b) => a.since - b.since);

  return { now, schemaVersion: 1, runtimes, approvals };
}

/* ------------------------------------------------------------------ */
/* activity feed                                                       */
/* ------------------------------------------------------------------ */

const MAX_ACTIVITY = 40;

/**
 * Compare two snapshots and describe what changed. The first comparison is
 * skipped so a fresh start does not flood the feed with "new session" rows.
 */
function diffActivity(prev, next) {
  const events = [];
  const previousRuntimes = Array.isArray(prev.runtimes) ? prev.runtimes : [];
  if (previousRuntimes.length === 0) return events;
  const before = new Map(previousRuntimes.map((runtime) => [runtime.id, runtime]));

  for (const runtime of next.runtimes) {
    const earlier = before.get(runtime.id);
    if (earlier === undefined) continue;

    if (earlier.status !== runtime.status) {
      events.push({
        id: `${runtime.id}:status:${next.now}`,
        at: next.now,
        kind: 'status',
        runtimeId: runtime.id,
        runtimeName: runtime.name,
        from: earlier.status,
        to: runtime.status,
      });
    }

    const earlierSessions = new Map(
      (Array.isArray(earlier.sessions) ? earlier.sessions : []).map((session) => [session.sessionId, session]),
    );
    for (const session of Array.isArray(runtime.sessions) ? runtime.sessions : []) {
      const beforeSession = earlierSessions.get(session.sessionId);
      if (beforeSession === undefined) {
        events.push({
          id: `${runtime.id}:session:${session.sessionId}:${next.now}`,
          at: next.now,
          kind: 'session',
          runtimeId: runtime.id,
          runtimeName: runtime.name,
          title: session.title || session.sessionId,
        });
      } else if (beforeSession.status !== session.status) {
        events.push({
          id: `${runtime.id}:session:${session.sessionId}:status:${next.now}`,
          at: next.now,
          kind: 'session-status',
          runtimeId: runtime.id,
          runtimeName: runtime.name,
          title: session.title || session.sessionId,
          from: beforeSession.status,
          to: session.status,
        });
      }
    }
  }

  const earlierApprovals = new Set(
    (Array.isArray(prev.approvals) ? prev.approvals : []).map((approval) => approval.approvalId),
  );
  for (const approval of next.approvals) {
    if (earlierApprovals.has(approval.approvalId)) continue;
    events.push({
      id: `approval:${approval.approvalId}:${next.now}`,
      at: next.now,
      kind: 'approval',
      runtimeId: approval.runtimeId,
      runtimeName: approval.runtimeName,
      reason: approval.reason || approval.tool,
    });
  }

  return events;
}

/* ------------------------------------------------------------------ */
/* plugin                                                              */
/* ------------------------------------------------------------------ */

/** Required for the HTTP routes, the live Session store and the agent turn boundaries. */
export const inject = ['webServer', 'sessions', 'agents'];

export function apply(ctx) {
  let snapshot = { now: Date.now(), runtimes: [], approvals: [], activity: [] };
  const activity = [];
  let collecting = false;

  const refresh = async () => {
    if (collecting) return;
    collecting = true;
    try {
      const next = await collectSnapshot(ctx);
      const events = diffActivity(snapshot, next);
      if (events.length > 0) {
        activity.unshift(...events);
        if (activity.length > MAX_ACTIVITY) activity.splice(MAX_ACTIVITY);
      }
      next.activity = activity.slice();
      snapshot = next;
    } finally {
      collecting = false;
    }
  };

  const timer = setInterval(() => { void refresh(); }, POLL_MS);
  ctx.effect(() => () => clearInterval(timer), 'agent-runtimes: poll');
  void refresh();

  const routes = [
    {
      kind: 'exact',
      path: `${API}/snapshot`,
      handler: (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405);
          res.end();
          return;
        }
        const body = JSON.stringify(snapshot);
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(body);
      },
    },
    {
      kind: 'exact',
      path: `${API}/action`,
      handler: (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end();
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += String(chunk);
          if (body.length > 16 * 1024) req.destroy();
        });
        req.on('end', () => {
          const reply = (status, payload) => {
            res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            res.end(JSON.stringify(payload));
          };
          let parsed;
          try {
            parsed = JSON.parse(body || '{}');
          } catch {
            reply(400, { ok: false, error: 'invalid-json' });
            return;
          }
          const action = typeof parsed.action === 'string' ? parsed.action : '';
          const runtimeId = typeof parsed.runtimeId === 'string' ? parsed.runtimeId : '';
          const sessionId = typeof parsed.sessionId === 'string' ? parsed.sessionId : '';
          const entry = COLLECTORS.find((item) => item.id === runtimeId);
          if (entry === undefined) {
            reply(404, { ok: false, error: 'unknown-runtime' });
            return;
          }
          if (action === 'open' || action === 'activate') {
            if (entry.app === '' || runtimeId === 'dsh') {
              // The Client opens its own session; the Host has nothing to launch.
              reply(200, { ok: true, handledByClient: true });
              return;
            }
            void runCommand([OPEN, '-a', entry.app]).then((result) => reply(200, result));
            return;
          }
          if (action === 'interrupt') {
            if (runtimeId !== 'dsh' || sessionId === '') {
              reply(200, { ok: false, error: 'not-supported' });
              return;
            }
            void (async () => {
              try {
                const controller = ctx.get('sessionController');
                if (controller === undefined || typeof controller.cancel !== 'function') {
                  reply(200, { ok: false, error: 'interrupt-unavailable' });
                  return;
                }
                const result = await controller.cancel({ sessionId });
                reply(200, { ok: true, result });
              } catch (error) {
                reply(200, { ok: false, error: error && error.message ? error.message : String(error) });
              }
            })();
            return;
          }
          reply(400, { ok: false, error: 'unknown-action' });
        });
      },
    },
  ];

  for (const route of routes) {
    ctx.effect(() => ctx.webServer.register(route), `agent-runtimes: ${route.path}`);
  }
}
