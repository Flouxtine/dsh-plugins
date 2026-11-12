# Contributing

Thanks for your interest in improving this plugin.

## Layout

- `lib/index.js` — Host half: Cordis plugin entry, LLM calls and HTTP routes.
- `lib/client.js` — Client half: browser module registered through
  `window.__ModuleLoader__.load`.
- `lib/types/*.d.ts` — public type declarations for both halves.
- `locale/*.json` — panel metadata translations.
- `cordis.patch.yml` — the bundle mount declaration DSH installs.
- `icon.svg` — the icon shown in the plugin list.

The bundle is plain ES modules (`"type": "module"`); there is no build step.

## Development

Install the bundle from a local checkout:

```sh
dsh plugin --profile <name> add link:<absolute path to this directory>
```

Check both halves parse before installing:

```sh
node --check lib/index.js
node --check lib/client.js
```

## Pull requests

1. Keep changes focused: one concern per pull request.
2. Update `CHANGELOG.md` for user-visible changes and bump `version`.
3. Follow the existing code style and keep the bundle self-contained.
4. Never commit secrets, credentials, or machine-specific absolute paths.
