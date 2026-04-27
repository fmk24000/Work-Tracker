import fs from 'fs/promises';
import path from 'path';
import { makeSeed, normalizeTrackerData } from './constants';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tracker-data.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
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
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return {
      data: seed,
      meta: { createdDefault: true },
    };
  }
}

export async function writeTrackerData(input) {
  await ensureDataDir();
  const normalized = normalizeTrackerData(input);
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}
