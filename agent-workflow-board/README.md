# agent-workflow-board

Live multi-agent workflow board for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

One panel, four views over the same multi-agent workspace:

- **Overview** — workspace totals (sessions, agents, running, tokens, workflow runs), the
  lead Session card (title, status, model route, token usage, duration, agent count), a
  **pending-approval gate** card listing every Session waiting on a human decision (tool,
  reason, jump into the Session), and a recent-activity feed assembled from session updates
  and the subagent catalog.
- **Graph** — the session lineage (`Workspace → Lead → members → grandchildren`) as a live
  agent graph with status pills, model routes, token usage and turn duration. Two modes:
  **Canvas** lays the lineage out as stage lanes (one column per generation, each with its own
  count, status bar and token total) and supports 50–160 % zoom; **Tree** keeps the compact
  DFS layout. Root selector and an "active only" filter bound the graph; clicking a node
  opens a detail drawer (status, model, mode, tokens, duration, parent, children, workspace,
  last activity, session id with copy) and the 💬 button opens that conversation (subagents in
  the right sidebar, other sessions in the main view). Very narrow containers fall back to an
  indented list.
- **Manual arrangement** — in Canvas mode drag a stage header onto another header to reorder
  the columns, or drag an agent card onto another stage to reassign it; the drawer also offers
  one-click stage buttons. The arrangement is stored in this browser and **Reset
  arrangement** restores the automatic generation layout. Sessions with a pending approval
  carry a 🔒 gate badge on their card and in the drawer.
- **Timeline** — durable workflow runs reconstructed from the host's `workflow/*` engine
  events (`workflow/start`, `phase`, `log`, `agent-start`, `agent-end`, `end`), grouped into
  phase stations. Each run expands into a summary (agents, done/running/failed, token total)
  and one row per agent with its status, model, tokens and duration read from that child
  Session's projections; the 💬 button jumps straight into the agent conversation. Repeated
  `(phase, label)` pairs inside one run are tagged `↻ N`, and a run name that appears more
  than once is numbered as an attempt. **Compare runs** (2+ runs) selects two of them and
  shows a side-by-side table of status, agent counts by status, phases and duration. Below
  the runs, an agent-spawning rail derived from the subagent catalog keeps the view useful
  even with no recorded run. Runs are persisted under `~/.dsh`, so history survives a
  restart; a lost `workflow/end` is resolved by a staleness sweep.
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
