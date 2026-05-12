# Changelog

## v1.2.1 - 2026-05-13

### Added

- Gantt color presets and a custom color picker for both main and sub items.
- Saved Gantt colors now render directly on timeline bars and markers.
- CSV export now includes each item's Gantt color for easier handoff and review.

### Changed

- New items opened from a specific board keep that board assignment in the form.
- Routine item assignment can now be toggled directly from the item modal.
- Sub items marked as routine also promote their selected parent main item to the routine board.

### Fixed

- Custom project selection now keeps the custom project input visible while editing.
- Existing items without saved Gantt colors are normalized to safe default colors.
- Production builds now use webpack explicitly to avoid Turbopack build issues.

## v1.2.0 - 2026-05-11

### Added

- A dedicated `/routine` board for recurring work, with its own tab and page-level call-to-action labels.
- Routine badges on tracker rows so recurring jobs stand out inside the shared dataset.
- Board-aware item creation so new entries opened from the routine view automatically stay on the routine board.

### Changed

- Tracker items now carry a normalized `board` field, allowing the app to separate programme and routine views while keeping one shared data source per owner.
- Sub items now inherit their board assignment from the selected parent main item to avoid cross-board mismatches.
- Header copy and board labels now adapt to the active view instead of always showing the generic programme wording.

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
