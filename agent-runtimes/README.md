# agent-runtimes

One console for the mainstream agent runtimes on your machine, built as a
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin.

- **Runtimes** — WorkBuddy, CodeBuddy CN, Codex/Codex++, Cursor and DeepSeek
  Harness itself, each with its live process state, current session, model,
  working directory, token usage and recent sessions in one list.
- **Approval reminders** — when a runtime reports something waiting for you
  (a WorkBuddy session pending on your answer, a Codex tool call awaiting
  approval, a Cursor composer with blocking pending actions, or a DeepSeek
  Harness session with a pending approval or question), the console raises an
  in-panel banner, a sidebar badge, an overlay toast and an optional desktop
  notification.
- **Console approvals (opt-in)** — the "控制台审批" switch in the panel header
  takes over DeepSeek Harness approval requests: they appear here with
  **允许一次 / 拒绝** buttons instead of the conversation prompt. It is off by
  default, persists in `~/.dsh/agent-runtimes-settings.json`, fails closed after
  five minutes, and hands any pending decision back to the normal answerer chain
  when switched off. External runtimes still only offer "jump to the app".
- **External approvals (permission-gated)** — WorkBuddy, CodeBuddy CN, Cursor and
  Codex expose no approval API, so the console drives their prompt with macOS UI
  scripting. Grant DeepSeek Harness **Accessibility** and **Automation** in
  System Settings → Privacy & Security and the approval card offers
  **允许一次 / 拒绝** for those runtimes too; without the permission it says so
  and offers "jump to the app".
- **Recent activity** — a cross-runtime feed of what just changed: runtime
  status transitions, new sessions, session status changes and newly raised
  approvals.
- **Credential management** — a "凭据管理" page in Settings stores a third-party
  agent app's API key in the DSH credential store, binds it to a runtime and
  records its purpose: name, agent, purpose and key go in, the list shows name,
  bound runtime, purpose and whether the secret is still configured. The secret
  is written as a `ref` in `~/.dsh/.credentials.yaml` and never rendered back —
  the panel only shows its name and configured state. Deleting a binding removes
  both the record and the ref.
- **Actions** — open or activate any installed runtime, open a DeepSeek Harness
  session, and request a stop for a running Harness agent.

## Install

```sh
dsh plugin --profile <profile> add github:zhangzh_anch/dsh-plugins#main&path:/agent-runtimes
```

or from a clone of this repository:

```sh
dsh plugin --profile <profile> add ./agent-runtimes
```

Requires DeepSeek Harness `>= 0.2.1-rc.2`.

## How it works

The Host half is a read-only observer. It polls every three seconds:

| Runtime | Presence | Live state |
| --- | --- | --- |
| WorkBuddy | `pgrep` on the app bundle | `~/.workbuddy/sessions/*.json` heartbeats + `~/.workbuddy/workbuddy.db` (`sessions`, `automation_runs`, `session_usage`) |
| CodeBuddy CN | `pgrep` on the app bundle | the coding-copilot extension's global storage: `genie-history/*/current.json` (workspace ↔ conversation), `message-queue` (runtime state, queued previews, model) and `edit-sessions` mtimes |
| Codex/Codex++ | `pgrep` + rollout freshness | `~/.codex/session_index.jsonl` and the newest `~/.codex/sessions/**/rollout-*.jsonl` |
| Cursor | `pgrep` on the app bundle | `composerHeaders` in `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| DeepSeek Harness | always | live DSH sessions refined by `sessionController.state` (`running`, `pendingInput`) |

SQLite is read through `node:sqlite` when the runtime provides it, with the
`sqlite3` CLI as a fallback. Nothing outside `~/.dsh` is written, and no other
application's state is ever modified.

The activity feed is a diff between consecutive snapshots, kept in memory for
the lifetime of the plugin (most recent 40 events).

## Status model

Statuses are derived from each product's own notion of "working", then held for
30 seconds before they are reported so an oscillating signal cannot make the
panel flicker:

| Status | Meaning |
| --- | --- |
| `running` | the agent has work in flight |
| `waiting` | the agent is blocked on the user (approval or question) |
| `idle` | installed and running, nothing in flight |
| `stopped` | installed but the app is not running |

Sources: WorkBuddy uses the session row's own `working` / `pending` status;
CodeBuddy uses its per-conversation todo list (an `in_progress` entry) plus a
10-minute activity window and shows `待办 done/total`; Codex uses an unfinished
turn in the newest rollout; Cursor uses `hasBlockingPendingActions`; DeepSeek
Harness uses the open-turn boundary plus `sessionController.state.pendingInput`.

## Limits

- External runtimes (WorkBuddy, Codex, Cursor) expose no approval API, so the
  console can only open the app that is waiting unless the UI-scripting
  permission is granted (see above). Deciding there stays in the product's own
  UI otherwise.
- Console approvals fail closed after five minutes, so a closed browser page
  cannot hang an agent forever; the pending decision is then `unavailable`,
  exactly like a missing answerer.
- Stopping an external runtime is not offered — killing another GUI agent can
  lose its state. Only DeepSeek Harness agents can be stopped from the console.
- CodeBuddy CN exposes no session status of its own, so its row derives the
  conversation list, the workspace (decoded from the history directory name),
  the last user message as the title and an activity-based running state; it
  does not detect CodeBuddy approvals.
- The Codex approval signal is heuristic: an unfinished turn whose last record
  is a `function_call` while the approval policy asks.

## License

MIT
