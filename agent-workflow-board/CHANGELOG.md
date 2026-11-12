# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-12

### Added

- **Manual stage arrangement** in Canvas mode: drag a stage header to reorder columns or an
  agent card onto another stage to reassign it, plus one-click stage buttons in the node
  drawer. The arrangement persists in this browser and can be reset.
- **Approval gates**: Sessions waiting on a human decision show a 🔒 badge on their graph
  card, and the Overview gains a pending-approvals card with tool, reason and a jump into
  the Session.
- **Run comparison**: pick two workflow runs and compare status, agent counts by status,
  phases and duration side by side.
- **Retry markers**: repeated `(phase, label)` pairs inside a run are tagged with their
  attempt count, and runs sharing a name are numbered as attempts.

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
