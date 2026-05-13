# Work Tracker

Work Tracker is a Next.js web app for tracking team tasks with a simple main-item/sub-item structure.
It is built for daily execution tracking, status updates, and lightweight reporting.

中文版本: [README.zh-HK.md](README.zh-HK.md)

## Introduction

This project includes:

- Main item and sub item task management
- Person-based boards
- Gantt-style month/week timeline view
- Priority scoring (urgency x importance)
- CSV export and import
- JSON backup and import
- Google Sheets webhook export
- Light and dark mode
- Server-side data persistence with Docker volume

## Instructions

### 1. Run with Docker (recommended)

Set `TEMP_SHARE_PATH` to your NAS temp share before starting Docker if you want every save mirrored there.
Example for a Synology-style share:

```bash
TEMP_SHARE_PATH=/volume1/temp docker compose up -d --build
```

If `TEMP_SHARE_PATH` is not set, Docker falls back to `./temp` on the host.

Open:

```txt
http://localhost:31005
```

Stop:

```bash
docker compose down
```

### 2. Run locally (without Docker)

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:31005
```

### 3. Build for production

```bash
npm run build
npm run start
```

## Data Persistence

When running with Docker, tracker data is stored in:

- Container path: `/app/data/tracker-data.json`
- Docker volume: `programme_tracker_data`
- Backup mirror inside container: `/backup/temp/tracker-data.json`
- Timestamp backup history: `/backup/temp/history/tracker-data-<timestamp>.json`
- Backup host path: `${TEMP_SHARE_PATH}` or `./temp` if unset

Each tracker update writes to the main Docker volume first, then syncs a mirrored latest copy and a timestamped backup copy to the backup path.

## CSV Import

Use the CSV upload button beside CSV export to import a schedule prepared in Excel.
The importer supports the same columns produced by CSV export: `Owner`, `Type`, `Code`, `Project Name`, `Description`, `Position`, `Urgency`, `Importance`, `Status`, `Remarks`, `Gantt Color`, `Start Date`, `Completion Date`, and `Target Date`.

Rows with `Type` set to `main` create main items. Rows with `Type` set to `sub` create sub items and are linked to a main item by the parent code inferred from values like `2.1`, or by an optional `Parent Code` column. Importing replaces existing tracker items for the owners included in the CSV, while keeping other owners untouched.

## Release

- Latest planned release version: `v1.2.0`
- See [CHANGELOG.md](./CHANGELOG.md) for the detailed release notes and feature summary
- Release includes source code archive asset and GitHub auto-generated source archives
