# dsh-plugins

Personal [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin bundles.

Each top-level directory is one installable DSH bundle package, laid out the way
the published plugin ecosystem is: `lib/` holds the built Host and Client halves,
`locale/` the panel translations, and `cordis.patch.yml` the bundle mount
declaration. Install a bundle from GitHub with a subdirectory git spec, for
example:

```
github:Flouxtine/dsh-plugins#main&path:/quick-notes
```

## Bundles

- `quick-notes` — a left-sidebar Todoist-style task list with projects, labels,
  P1–P4 priorities, recurring tasks, subtasks and smart views (`@local/quick-notes`).
- `agent-workflow-board` — a live multi-agent workflow panel: agent lineage graph,
  workflow run timeline and Agent Team task board (`@local/agent-workflow-board`).
- `agent-runtimes` — one console for the mainstream agent runtimes on this machine
  (WorkBuddy, CodeBuddy CN, Codex/Codex++, Cursor and DeepSeek Harness) with
  approval reminders (`@local/agent-runtimes`).

## Repository layout

```
.
├── .github/workflows/ci.yml   # syntax + manifest checks
├── agent-runtimes/
│   ├── lib/
│   │   ├── index.js           # Host half (Cordis entry)
│   │   ├── client.js          # Client half (browser module)
│   │   └── types/*.d.ts       # public type declarations
│   ├── locale/{en,zh}.json
│   ├── cordis.patch.yml
│   ├── icon.svg
│   ├── package.json
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   └── LICENSE
├── agent-workflow-board/…
└── quick-notes/…
```

## Development

Every bundle is plain ES modules (`"type": "module"`) with no build step:

```sh
node --check agent-runtimes/lib/index.js
node --check agent-runtimes/lib/client.js
```

Install a bundle from a local checkout:

```sh
dsh plugin --profile <name> add link:<absolute path to the bundle directory>
```

See each bundle's `CONTRIBUTING.md` for details.

## License

MIT — see each bundle's `LICENSE`.
