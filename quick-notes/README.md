# quick-notes

A Todoist-style task list for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness),
reachable from a left-sidebar entry.

Tasks are organised into projects and labels, carry a P1–P4 priority and an
optional due date, and can repeat on a schedule or nest under a parent task.
Smart views collect the inbox, what is due today, what is upcoming and what is
completed, and a task past its due date is flagged red wherever it appears.

## Install

From a local checkout:

```sh
dsh plugin --profile <name> add link:<absolute path to this directory>
```

Or from GitHub with a subdirectory git spec:

```
github:Flouxtine/dsh-plugins#main&path:/quick-notes
```

## Use

1. Open the **To-Do** panel from the left sidebar.
2. Add a task, then set its project, label, priority and due date.
3. Nest subtasks under a parent, or give a task a repeat rule to make it recur.
4. Use the smart views to work through the inbox, today and upcoming.

## Design notes

Everything is stored in this browser, so the list is machine-local and needs no
backend or account. Clearing the browser storage for the panel resets it.

## License

MIT — see [LICENSE](LICENSE).
