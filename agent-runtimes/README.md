# agent-runtimes

One console for the mainstream agent runtimes on your machine, built as a
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin.

- **Runtimes** — WorkBuddy, CodeBuddy CN, Codex/Codex++, Cursor and DeepSeek
  Harness itself, each with its live process state, current session, model,
  working directory and recent sessions in one list.
- **Approval reminders** — when a runtime reports something waiting for you
  (a WorkBuddy automation pending review, a Codex tool call awaiting approval, a
  Cursor composer with blocking pending actions), the console raises an
  in-panel banner, a sidebar badge, an overlay toast and an optional desktop
  notification.
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
| WorkBuddy | `pgrep` on the app bundle | `~/.workbuddy/sessions/*.json` heartbeats + `~/.workbuddy/workbuddy.db` (`sessions`, `automation_runs`) |
| CodeBuddy CN | `pgrep` on the app bundle | process state; chat storage is not exposed yet |
| Codex/Codex++ | `pgrep` + rollout freshness | `~/.codex/session_index.jsonl` and the newest `~/.codex/sessions/**/rollout-*.jsonl` |
| Cursor | `pgrep` on the app bundle | `composerHeaders` in `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| DeepSeek Harness | always | live DSH sessions, with open-turn boundaries for the running state |

SQLite is read through `node:sqlite` when the runtime provides it, with the
`sqlite3` CLI as a fallback. Nothing outside `~/.dsh` is written, and no other
application's state is ever modified.

## Limits

- Approval reminders are observational. The console can open the runtime that
  is waiting, but it cannot decide another product's approval for you; that
  decision stays in the product's own UI.
- Stopping an external runtime is not offered — killing another GUI agent can
  lose its state. Only DeepSeek Harness agents can be stopped from the console.
- CodeBuddy CN does not expose readable session state yet, so its row is
  presence-only until its storage format is understood.

## License

MIT
