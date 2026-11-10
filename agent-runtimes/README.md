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
- **Recent activity** — a cross-runtime feed of what just changed: runtime
  status transitions, new sessions, session status changes and newly raised
  approvals.
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
| CodeBuddy CN | `pgrep` on the app bundle | process state plus the chat mode from `CodeBuddy.settings`; its conversation list is not exposed yet |
| Codex/Codex++ | `pgrep` + rollout freshness | `~/.codex/session_index.jsonl` and the newest `~/.codex/sessions/**/rollout-*.jsonl` |
| Cursor | `pgrep` on the app bundle | `composerHeaders` in `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| DeepSeek Harness | always | live DSH sessions refined by `sessionController.state` (`running`, `pendingInput`) |

SQLite is read through `node:sqlite` when the runtime provides it, with the
`sqlite3` CLI as a fallback. Nothing outside `~/.dsh` is written, and no other
application's state is ever modified.

The activity feed is a diff between consecutive snapshots, kept in memory for
the lifetime of the plugin (most recent 40 events).

## Limits

- External runtimes (WorkBuddy, Codex, Cursor) expose no approval API, so the
  console can only open the app that is waiting; deciding there stays in the
  product's own UI. Only DeepSeek Harness approvals can be decided in the panel,
  and only while the opt-in switch is on.
- Console approvals fail closed after five minutes, so a closed browser page
  cannot hang an agent forever; the pending decision is then `unavailable`,
  exactly like a missing answerer.
- Stopping an external runtime is not offered — killing another GUI agent can
  lose its state. Only DeepSeek Harness agents can be stopped from the console.
- CodeBuddy CN does not expose readable session state yet, so its row shows the
  chat mode and presence only.
- The Codex approval signal is heuristic: an unfinished turn whose last record
  is a `function_call` while the approval policy asks.

## License

MIT
