# Work Tracker

Work Tracker is a Next.js web app for tracking team tasks with a simple main-item/sub-item structure.
It is built for daily execution tracking, status updates, and lightweight reporting.

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

```bash
docker compose up -d --build
```

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

## Release

- Initial release version: `v0.0.1`
- Release includes source code archive asset and GitHub auto-generated source archives
