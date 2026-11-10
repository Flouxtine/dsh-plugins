# dsh-plugins

Personal [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin bundles.

Each top-level directory is one installable DSH bundle package. Install a bundle from
GitHub with a subdirectory git spec, for example:

```
github:zhangzh_anch/dsh-plugins#main&path:/quick-notes
```

## Bundles

- `quick-notes` — a left-sidebar Todoist-style task list with projects, labels,
  P1–P4 priorities, recurring tasks, subtasks and smart views (`@local/quick-notes`).
- `agent-workflow-board` — a live multi-agent workflow panel: agent lineage graph,
  workflow run timeline and Agent Team task board (`@local/agent-workflow-board`).
- `agent-runtimes` — one console for the mainstream agent runtimes on this machine
  (WorkBuddy, CodeBuddy CN, Codex/Codex++, Cursor and DeepSeek Harness) with
  approval reminders (`@local/agent-runtimes`).
