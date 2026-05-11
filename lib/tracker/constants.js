export const STORAGE_KEY = 'programme-tracker-v3';
export const THEME_STORAGE_KEY = 'programme-tracker-theme-v1';
export const DEFAULT_PROJECT_NAME = 'General';

export function normalizeProjectName(value) {
  const name = String(value || '').trim();
  return name || DEFAULT_PROJECT_NAME;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function makeSeed() {
  const louisId = uid();

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
      },
      {
        id: uid(),
        ownerId: louisId,
        type: 'main',
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
      },
      {
        id: uid(),
        ownerId: louisId,
        type: 'sub',
        parentCode: '2',
        code: '2.1',
        description: 'Sensor hardware setup',
        status: 'Pending',
        remarks: 'Vendor slot to confirm',
        targetDate: '2026-04-20',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function emptyMainForm() {
  return {
    type: 'main',
    projectName: '',
    description: '',
    position: '',
    urgency: 1,
    importance: 1,
    status: '',
    remarks: '',
    startDate: today(),
    completionDate: today(),
  };
}

export function emptySubForm() {
  return {
    type: 'sub',
    parentId: '',
    description: '',
    status: '',
    remarks: '',
    targetDate: today(),
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
          projectName: normalizeProjectName(item.projectName),
        }
      : item
  );
  const mainLookup = new Map(
    normalizedItems
      .filter((item) => item?.type === 'main')
      .map((item) => [`${item.ownerId}:${item.code}`, item.id])
  );

  return {
    people,
    selectedPersonId,
    settings: {
      sheetWebhook: value.settings?.sheetWebhook || '',
    },
    items: normalizedItems.map((item) =>
      item?.type === 'sub'
        ? {
            ...item,
            parentId: item.parentId || mainLookup.get(`${item.ownerId}:${item.parentCode}`) || '',
          }
        : item
    ),
  };
}
