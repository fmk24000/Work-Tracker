import { normalizeProjectName } from './constants';

export const BLANK_FILTER_TOKEN = '__blank__';

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatMonthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function computePriority(urgency, importance) {
  return Number(urgency || 0) * Number(importance || 0);
}

export function isCompletedStatus(status) {
  return String(status || '').toLowerCase().includes('complete');
}

export function getWeekIndex(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

export function compareCode(a, b, dir = 'asc') {
  const result = String(a).localeCompare(String(b), undefined, { numeric: true });
  return dir === 'asc' ? result : -result;
}

export function compareValue(a, b, dir = 'asc') {
  const av = a ?? '';
  const bv = b ?? '';
  if (typeof av === 'number' && typeof bv === 'number') {
    return dir === 'asc' ? av - bv : bv - av;
  }
  const result = String(av).localeCompare(String(bv), undefined, { numeric: true });
  return dir === 'asc' ? result : -result;
}

export function compareItemsByCreatedAt(a, b, dir = 'asc') {
  const createdAtResult = compareValue(a.createdAt || '', b.createdAt || '', dir);
  if (createdAtResult !== 0) return createdAtResult;
  return compareCode(a.code, b.code, dir);
}

export function getItemSortValue(item, key) {
  if (key === 'marks') return computePriority(item.urgency, item.importance);
  if (key === 'projectName') return normalizeProjectName(item.projectName);
  if (key === 'createdAt') return item.createdAt || '';
  if (key === 'sortDate') return item.type === 'main' ? item.startDate || '' : item.targetDate || '';
  return item[key] ?? '';
}

export function getItemFilterValue(item, key) {
  if (key === 'marks') return item.type === 'main' ? String(computePriority(item.urgency, item.importance)) : '';
  if (key === 'projectName') return normalizeProjectName(item.projectName);
  if (key === 'sortDate') return item.type === 'main' ? item.startDate || '' : item.targetDate || '';

  const value = item[key];
  return value === null || value === undefined ? '' : String(value);
}

export function buildMonthBuckets(items) {
  const dates = items
    .flatMap((item) => [item.startDate, item.completionDate, item.targetDate])
    .filter(Boolean)
    .map(parseDate)
    .filter(Boolean);

  if (!dates.length) {
    const now = new Date();
    return [{ year: now.getFullYear(), month: now.getMonth() + 1 }];
  }

  let min = new Date(Math.min(...dates.map((d) => d.getTime())));
  let max = new Date(Math.max(...dates.map((d) => d.getTime())));
  min = new Date(min.getFullYear(), min.getMonth(), 1);
  max = new Date(max.getFullYear(), max.getMonth() + 1, 1);

  const result = [];
  const cursor = new Date(min);
  while (cursor <= max) {
    result.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

export function isInBucket(item, year, month, week) {
  if (item.type === 'sub') {
    const d = parseDate(item.targetDate);
    if (!d) return false;
    return d.getFullYear() === year && d.getMonth() + 1 === month && getWeekIndex(item.targetDate) === week;
  }

  const start = parseDate(item.startDate);
  const end = parseDate(item.completionDate);
  if (!start || !end) return false;

  const bucketStart = new Date(year, month - 1, week === 1 ? 1 : week === 2 ? 8 : week === 3 ? 15 : 22);
  const bucketEnd = new Date(year, month - 1, week === 1 ? 7 : week === 2 ? 14 : week === 3 ? 21 : 31, 23, 59, 59, 999);
  return start <= bucketEnd && end >= bucketStart;
}

export function buildNextMainCode(items, ownerId) {
  const maxCode = Math.max(
    0,
    ...items.filter((x) => x.ownerId === ownerId && x.type === 'main').map((x) => Number(x.code) || 0)
  );
  return String(maxCode + 1);
}

export function buildNextSubCode(items, ownerId, parentCode, excludeId) {
  const siblings = items.filter(
    (x) => x.ownerId === ownerId && x.type === 'sub' && x.parentCode === parentCode && x.id !== excludeId
  );
  return `${parentCode}.${siblings.length + 1}`;
}

export function exportRowsToCsv(rows, ownerName) {
  const headers = [
    'Owner',
    'Type',
    'Code',
    'Project Name',
    'Description',
    'Position',
    'Urgency',
    'Importance',
    'Priority Marks',
    'Status',
    'Remarks',
    'Start Date',
    'Completion Date',
    'Target Date',
  ];

  const body = rows.map((item) => [
    ownerName,
    item.type,
    item.code,
    normalizeProjectName(item.projectName),
    item.description || '',
    item.position || '',
    item.urgency || '',
    item.importance || '',
    item.type === 'main' ? computePriority(item.urgency, item.importance) : '',
    item.status || '',
    item.remarks || '',
    item.startDate || '',
    item.completionDate || '',
    item.targetDate || '',
  ]);

  const csv = [headers, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ownerName || 'programme'}-tracker.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
