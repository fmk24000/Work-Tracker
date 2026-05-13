import {
  DEFAULT_ITEM_BOARD,
  normalizeGanttColor,
  normalizeItemBoard,
  normalizeProjectName,
  uid,
} from './constants';

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
    'Gantt Color',
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
    item.ganttColor || '',
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

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const source = String(text || '').replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => String(value).trim())) rows.push(row);
  return rows;
}

function normalizeCsvKey(value) {
  return String(value || '').replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function makeCsvRecord(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, String(row[index] || '').trim()]));
}

function getCsvValue(record, aliases) {
  for (const alias of aliases) {
    const value = record[normalizeCsvKey(alias)];
    if (value !== undefined && value !== '') return value;
  }
  return '';
}

function normalizeCsvDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, first, second, year] = slash;
    const dayFirst = Number(first) > 12;
    const day = dayFirst ? first : second;
    const month = dayFirst ? second : first;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function normalizeScore(value, fallback = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(5, Math.max(1, Math.round(number)));
}

function getSelectedPersonName(data, selectedPersonId) {
  return data.people.find((person) => person.id === selectedPersonId)?.name || data.people[0]?.name || 'Imported';
}

export function importRowsFromCsv(currentData, csvText, selectedPersonId, defaultBoard = DEFAULT_ITEM_BOARD) {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    throw new Error('CSV has no importable rows.');
  }

  const headers = rows[0].map(normalizeCsvKey);
  const records = rows.slice(1).map((row) => makeCsvRecord(headers, row));
  const people = currentData.people.map((person) => ({ ...person }));
  const peopleByName = new Map(people.map((person) => [person.name.toLowerCase(), person]));
  const selectedFallbackName = getSelectedPersonName(currentData, selectedPersonId);
  const importedOwnerIds = new Set();
  const importedItems = [];
  const mainByOwnerAndCode = new Map();
  const normalizedDefaultBoard = normalizeItemBoard(defaultBoard);

  function getOwnerId(record) {
    const ownerName = getCsvValue(record, ['Owner', 'Person', 'Assignee']) || selectedFallbackName;
    const key = ownerName.toLowerCase();
    let person = peopleByName.get(key);

    if (!person) {
      person = { id: uid(), name: ownerName };
      people.push(person);
      peopleByName.set(key, person);
    }

    importedOwnerIds.add(person.id);
    return person.id;
  }

  records.forEach((record) => {
    const type = getCsvValue(record, ['Type']).toLowerCase();
    const code = getCsvValue(record, ['Code', 'ID']);
    const description = getCsvValue(record, ['Description', 'Task', 'Item']);
    const targetDate = normalizeCsvDate(getCsvValue(record, ['Target Date', 'Target']));
    const startDate = normalizeCsvDate(getCsvValue(record, ['Start Date', 'Start']));
    const completionDate = normalizeCsvDate(getCsvValue(record, ['Completion Date', 'Completion', 'End Date', 'End']));
    const isSub = type === 'sub' || (!type && (targetDate || code.includes('.')));

    if (isSub || !description) return;

    const ownerId = getOwnerId(record);
    const item = {
      id: uid(),
      ownerId,
      type: 'main',
      board: normalizeItemBoard(getCsvValue(record, ['Board']) || normalizedDefaultBoard),
      code: code || uid(),
      projectName: normalizeProjectName(getCsvValue(record, ['Project Name', 'Project'])),
      description,
      position: getCsvValue(record, ['Position']),
      urgency: normalizeScore(getCsvValue(record, ['Urgency']), 1),
      importance: normalizeScore(getCsvValue(record, ['Importance']), 1),
      status: getCsvValue(record, ['Status']),
      remarks: getCsvValue(record, ['Remarks', 'Notes']),
      startDate,
      completionDate,
      createdAt: new Date().toISOString(),
      ganttColor: normalizeGanttColor(getCsvValue(record, ['Gantt Color', 'Color']), 'main'),
    };

    importedItems.push(item);
    if (code) mainByOwnerAndCode.set(`${ownerId}:${code}`, item);
  });

  records.forEach((record) => {
    const type = getCsvValue(record, ['Type']).toLowerCase();
    const code = getCsvValue(record, ['Code', 'ID']);
    const description = getCsvValue(record, ['Description', 'Task', 'Item']);
    const targetDate = normalizeCsvDate(getCsvValue(record, ['Target Date', 'Target']));
    const isSub = type === 'sub' || (!type && (targetDate || code.includes('.')));

    if (!isSub || !description) return;

    const ownerId = getOwnerId(record);
    const explicitParentCode = getCsvValue(record, ['Parent Code', 'Parent']);
    const inferredParentCode = code.includes('.') ? code.split('.').slice(0, -1).join('.') : '';
    const parentCode = explicitParentCode || inferredParentCode;
    const parent = parentCode ? mainByOwnerAndCode.get(`${ownerId}:${parentCode}`) : null;

    if (!parent) {
      throw new Error(`Sub item "${description}" cannot find parent code "${parentCode || '(blank)'}".`);
    }

    importedItems.push({
      id: uid(),
      ownerId,
      type: 'sub',
      board: normalizeItemBoard(getCsvValue(record, ['Board']) || parent.board),
      parentId: parent.id,
      parentCode: parent.code,
      code: code || uid(),
      description,
      status: getCsvValue(record, ['Status']),
      remarks: getCsvValue(record, ['Remarks', 'Notes']),
      targetDate,
      createdAt: new Date().toISOString(),
      ganttColor: normalizeGanttColor(getCsvValue(record, ['Gantt Color', 'Color']), 'sub'),
    });
  });

  if (!importedItems.length) {
    throw new Error('CSV has no importable tracker items.');
  }

  return {
    people,
    selectedPersonId: importedOwnerIds.has(selectedPersonId) ? selectedPersonId : importedItems[0].ownerId,
    settings: currentData.settings,
    items: [
      ...currentData.items.filter((item) => !importedOwnerIds.has(item.ownerId)),
      ...importedItems,
    ],
  };
}
