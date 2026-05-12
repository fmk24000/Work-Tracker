export const STORAGE_KEY = 'programme-tracker-v3';
export const THEME_STORAGE_KEY = 'programme-tracker-theme-v1';
export const DEFAULT_PROJECT_NAME = 'General';
export const DEFAULT_ITEM_BOARD = 'programme';
export const ROUTINE_ITEM_BOARD = 'routine';
export const DEFAULT_MAIN_GANTT_COLOR = '#3b82f6';
export const DEFAULT_SUB_GANTT_COLOR = '#8b5cf6';
export const GANTT_COLOR_PRESETS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

export function normalizeProjectName(value) {
  const name = String(value || '').trim();
  return name || DEFAULT_PROJECT_NAME;
}

export function normalizeItemBoard(value) {
  return value === ROUTINE_ITEM_BOARD ? ROUTINE_ITEM_BOARD : DEFAULT_ITEM_BOARD;
}

export function getDefaultGanttColor(type) {
  return type === 'sub' ? DEFAULT_SUB_GANTT_COLOR : DEFAULT_MAIN_GANTT_COLOR;
}

export function normalizeGanttColor(value, type = 'main') {
  const color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : getDefaultGanttColor(type);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function makeSeed() {
  const louisId = uid();
  const i3UpgradeId = uid();

  return {
    people: [
      { id: louisId, name: 'Louis' },
      { id: uid(), name: 'Alfred' },
      { id: uid(), name: 'Adeline' },
    ],
    selectedPersonId: louisId,
    settings: {
      sheetWebhook: '',
    },
    items: [
      {
        id: uid(),
        ownerId: louisId,
        type: 'main',
        board: ROUTINE_ITEM_BOARD,
        code: '1',
        projectName: 'General',
        description: 'i3 Server bi-weekly reboot',
        position: 'IC',
        urgency: 3,
        importance: 3,
        status: 'Completed',
        remarks: 'Routine maintenance',
        startDate: '2026-04-01',
        completionDate: '2026-04-05',
        createdAt: new Date().toISOString(),
        ganttColor: DEFAULT_MAIN_GANTT_COLOR,
      },
      {
        id: i3UpgradeId,
        ownerId: louisId,
        type: 'main',
        board: DEFAULT_ITEM_BOARD,
        code: '2',
        projectName: 'i3 Upgrade',
        description: 'Add environmental sensor for i3',
        position: 'IC',
        urgency: 3,
        importance: 3,
        status: 'In progress',
        remarks: 'Point mapping pending',
        startDate: '2026-04-10',
        completionDate: '2026-04-30',
        createdAt: new Date().toISOString(),
        ganttColor: DEFAULT_MAIN_GANTT_COLOR,
      },
      {
        id: uid(),
        ownerId: louisId,
        type: 'sub',
        board: DEFAULT_ITEM_BOARD,
        parentId: i3UpgradeId,
        parentCode: '2',
        code: '2.1',
        description: 'Sensor hardware setup',
        status: 'Pending',
        remarks: 'Vendor slot to confirm',
        targetDate: '2026-04-20',
        createdAt: new Date().toISOString(),
        ganttColor: DEFAULT_SUB_GANTT_COLOR,
      },
    ],
  };
}

export function emptyMainForm() {
  return {
    type: 'main',
    board: DEFAULT_ITEM_BOARD,
    projectName: '',
    description: '',
    position: '',
    urgency: 1,
    importance: 1,
    status: '',
    remarks: '',
    startDate: today(),
    completionDate: today(),
    ganttColor: DEFAULT_MAIN_GANTT_COLOR,
  };
}

export function emptySubForm() {
  return {
    type: 'sub',
    board: DEFAULT_ITEM_BOARD,
    parentId: '',
    description: '',
    status: '',
    remarks: '',
    targetDate: today(),
    ganttColor: DEFAULT_SUB_GANTT_COLOR,
  };
}

export function normalizeTrackerData(input) {
  const seed = makeSeed();
  const value = input && typeof input === 'object' ? input : {};
  const people = Array.isArray(value.people) && value.people.length ? value.people : seed.people;
  const selectedPersonId = people.some((p) => p.id === value.selectedPersonId)
    ? value.selectedPersonId
    : people[0]?.id || seed.selectedPersonId;
  const sourceItems = Array.isArray(value.items) ? value.items : seed.items;
  const normalizedItems = sourceItems.map((item) =>
    item?.type === 'main'
      ? {
          ...item,
          board: normalizeItemBoard(item.board),
          projectName: normalizeProjectName(item.projectName),
          ganttColor: normalizeGanttColor(item.ganttColor, 'main'),
        }
      : item?.type === 'sub'
        ? {
            ...item,
            board: normalizeItemBoard(item.board),
            ganttColor: normalizeGanttColor(item.ganttColor, 'sub'),
          }
      : item
  );
  const mainLookup = new Map(
    normalizedItems
      .filter((item) => item?.type === 'main')
      .map((item) => [`${item.ownerId}:${item.code}`, item.id])
  );
  const mainItemLookup = new Map(
    normalizedItems
      .filter((item) => item?.type === 'main')
      .map((item) => [item.id, item])
  );

  return {
    people,
    selectedPersonId,
    settings: {
      sheetWebhook: value.settings?.sheetWebhook || '',
    },
    items: normalizedItems.map((item) =>
      item?.type !== 'sub'
        ? item
        : (() => {
            const parentId = item.parentId || mainLookup.get(`${item.ownerId}:${item.parentCode}`) || '';
            const parent = mainItemLookup.get(parentId);

            return {
              ...item,
              board: normalizeItemBoard(item.board || parent?.board),
              parentId,
            };
          })()
    ),
  };
}
