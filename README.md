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
- CSV export
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

## Release

- Latest planned release version: `v1.1.0`
- See [CHANGELOG.md](./CHANGELOG.md) for the detailed release notes and feature summary
- Release includes source code archive asset and GitHub auto-generated source archives
