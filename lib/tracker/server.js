import fs from 'fs/promises';
import path from 'path';
import { makeSeed, normalizeTrackerData } from './constants';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tracker-data.json');
const BACKUP_DIR = process.env.TRACKER_BACKUP_DIR?.trim() || '';
const BACKUP_FILE = BACKUP_DIR ? path.join(BACKUP_DIR, 'tracker-data.json') : '';
const BACKUP_HISTORY_DIR = BACKUP_DIR ? path.join(BACKUP_DIR, 'history') : '';

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function syncBackupFile(content) {
  if (!BACKUP_DIR || !BACKUP_FILE) {
    return { enabled: false, synced: false };
  }

  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(BACKUP_HISTORY_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const historyFile = path.join(BACKUP_HISTORY_DIR, `tracker-data-${timestamp}.json`);

    await fs.writeFile(BACKUP_FILE, content, 'utf8');
    await fs.writeFile(historyFile, content, 'utf8');

    return { enabled: true, synced: true, path: BACKUP_FILE, historyPath: historyFile };
  } catch (error) {
    console.error('Failed to sync tracker backup', error);
    return { enabled: true, synced: false, path: BACKUP_FILE, error: error.message };
  }
}

export async function readTrackerData() {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      data: normalizeTrackerData(parsed),
      meta: { createdDefault: false },
    };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const seed = makeSeed();
    const seedJson = JSON.stringify(seed, null, 2);
    await fs.writeFile(DATA_FILE, seedJson, 'utf8');
    await syncBackupFile(seedJson);
    return {
      data: seed,
      meta: { createdDefault: true },
    };
  }
}

export async function writeTrackerData(input) {
  await ensureDataDir();
  const normalized = normalizeTrackerData(input);
  const content = JSON.stringify(normalized, null, 2);
  await fs.writeFile(DATA_FILE, content, 'utf8');
  await syncBackupFile(content);
  return normalized;
}
