# agent-workflow-board

Live multi-agent workflow board for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

One panel, four views over the same multi-agent workspace:

- **Overview** — workspace totals (sessions, agents, running, tokens, workflow runs), the
  lead Session card (title, status, model route, token usage, duration, agent count) and a
  recent-activity feed assembled from session updates and the subagent catalog.
- **Graph** — the session lineage (`Lead → members → grandchildren`) drawn as a live agent
  DAG with status pills, model routes, token usage and turn duration. Wide containers render
  a node-link graph; narrow containers collapse to an indented list. Root selector and an
  "active only" filter bound the tree; clicking a node opens that conversation (subagents in
  the right sidebar, other sessions in the main view).
- **Timeline** — durable workflow runs reconstructed from the host's `workflow/*` engine
  events (`workflow/start`, `phase`, `log`, `agent-start`, `agent-end`, `end`), grouped into
  phase stations with one pill per agent, above an agent-spawning rail derived from the
  subagent catalog. Runs are persisted under `~/.dsh`, so history survives a restart; a lost
  `workflow/end` is resolved by a staleness sweep.
- **Team** — the Agent Team roster and shared task board read from the lead Session's
  `agentTeam` projection, with per-member live status, model route, and task
  ownership / blocker / write-scope facts. Without a Team record it falls back to the
  lineage roster so the view is never empty.

Entries: a left-sidebar panel icon, a center panel, and a right-sidebar tab (reachable from
the guide menu). All copy is localized through the Client locale service (English and
Simplified Chinese).

## Install

```sh
dsh plugin --profile <profile> add github:zhangzh_anch/dsh-plugins#main&path:/agent-workflow-board
```

or from a clone of this repository:

```sh
dsh plugin --profile <profile> add ./agent-workflow-board
```

Requires DeepSeek Harness `>= 0.2.1-rc.2`.

## How it works

The Host half subscribes to the `workflow/*` emit events, folds them into run records, serves
them at `GET /api/agent-workflow-board/runs`, and debounce-persists them to
`~/.dsh/agent-workflow-board-runs.json`. It never controls a run.

The Client half derives the graph and the team view from the shared Session store
(`ctx.sessions.list`, `subagentCatalog` / `subagent` / `subagentTiming` / `tokenUsage` /
`modelSelection` / `agentTeam`), so both update with projection frames and need no polling.
Only the timeline polls, every two seconds.

## License

MIT
