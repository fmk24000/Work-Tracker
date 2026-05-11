# Changelog

## v1.1.0 - 2026-05-11

### Added

- Project-aware tracker boards with a dedicated `/projects` view and quick navigation between project sections.
- Project name support for main items, with inherited project labels for sub items and project-aware CSV export.
- Column-level filters for project, position, urgency, importance, marks, and status.
- Expand and collapse controls for main items so the board stays easier to scan.
- A secondary sort mode that reorders the board by completion date.
- Docker backup mirroring to `${TEMP_SHARE_PATH}` or `./temp`, including a latest snapshot and timestamped history copies.
- A shared `ProgrammeTrackerApp` shell so the all-items board and project boards stay in sync.

### Changed

- Main and sub item relationships now rely on stable parent IDs instead of display codes.
- Main items are renumbered from display order, while sub items are rebuilt under their visible parent grouping.
- Search now includes project names in addition to description, status, and remarks.
- The app now normalizes empty project names to `General`.
- The Docker and Next.js runtime configuration was updated for standalone builds, backup volumes, and Turbopack root stability.

### Fixed

- Production Docker images no longer copy a missing `public` directory during build.
- Dark mode hydration is handled more safely with `suppressHydrationWarning` and explicit color-scheme styling.
- Seed-data creation and server writes now also create mirrored backup files when Docker storage is initialized.
