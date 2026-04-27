import { compareCode, compareValue, computePriority, getItemSortValue } from './helpers';

export function getSelectedItems(data) {
  return data.items.filter((item) => item.ownerId === data.selectedPersonId);
}

export function getMainItems(items) {
  return items.filter((item) => item.type === 'main');
}

export function getStats(items) {
  const mains = items.filter((x) => x.type === 'main');
  const subs = items.filter((x) => x.type === 'sub');
  const completed = items.filter((x) => (x.status || '').toLowerCase().includes('complete')).length;

  return {
    mains: mains.length,
    milestones: subs.length,
    highPriority: mains.filter((m) => computePriority(m.urgency, m.importance) >= 8).length,
    completed,
  };
}

export function getFilteredRows(items, ui) {
  const mains = items
    .filter((item) => item.type === 'main')
    .sort((a, b) => {
      if (ui.sort.key === 'code') return compareCode(a.code, b.code, ui.sort.dir);
      return compareValue(getItemSortValue(a, ui.sort.key), getItemSortValue(b, ui.sort.key), ui.sort.dir);
    });

  const subs = items.filter((item) => item.type === 'sub');

  const rows = [];
  for (const main of mains) {
    rows.push({ ...main, marks: computePriority(main.urgency, main.importance) });
    const children = subs
      .filter((sub) => sub.parentCode === main.code)
      .sort((a, b) => compareCode(a.code, b.code, 'asc'));
    rows.push(...children);
  }

  return rows.filter((item) => {
    if (ui.filterType !== 'all' && item.type !== ui.filterType) return false;
    if (!ui.query.trim()) return true;

    const haystack = [item.code, item.description, item.position, item.status, item.remarks]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(ui.query.toLowerCase());
  });
}

export function getPersonName(data, ownerId) {
  return data.people.find((p) => p.id === ownerId)?.name || 'Unknown';
}
