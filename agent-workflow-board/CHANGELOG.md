# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-12

### Added

- **Canvas mode** in the Graph view: one stage lane per generation with a per-stage count,
  status bar and token total, plus 50–160 % zoom controls. Tree mode keeps the compact layout.
- **Node detail drawer**: clicking any agent node opens a panel with status, model, mode,
  tokens, duration, parent, children, workspace, last activity and a copyable session id.
- **Run summary** in the Timeline: agent counts by status, token total, and per-agent
  model / tokens / duration read from each child Session's projections.

## [1.0.0] - 2026-11-11

### Added

- Initial release of the `agent-workflow-board` bundle.
