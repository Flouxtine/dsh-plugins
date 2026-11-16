# Contributing

Thanks for your interest in improving this plugin.

## Layout

- `lib/index.js` — Host half: Cordis plugin entry, DSH services and HTTP routes.
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

## Code style

The bundle is plain JavaScript with no build step, so the source is what runs.
Keep it consistent with the existing halves:

- Indent with 2 spaces, never tabs.
- Quote strings with single quotes. Use double quotes only inside templates that
  require them (AppleScript, SQL, JSON literals) and in prose comments.
- Finish statements with semicolons.
- Document exported functions and non-obvious entry points with a short JSDoc
  block. Comments explain *why* a choice was made, not what the code does.
- No trailing whitespace.
- Keep lines within reason. Long `h(...)` element trees and the inline CSS
  strings in `client.js` are the expected exceptions.

## Pull requests

1. Keep changes focused: one concern per pull request.
2. Update `CHANGELOG.md` for user-visible changes and bump `version`.
3. Follow the code style above and keep the bundle self-contained.
4. Never commit secrets, credentials, or machine-specific absolute paths.
