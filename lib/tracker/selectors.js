import { normalizeItemBoard, normalizeProjectName } from './constants';
import {
  BLANK_FILTER_TOKEN,
  compareCode,
  compareItemsByCreatedAt,
  compareValue,
  computePriority,
  getItemFilterValue,
  getItemSortValue,
  isCompletedStatus,
} from './helpers';

const COLUMN_FILTER_KEYS = ['projectName', 'position', 'urgency', 'importance', 'marks', 'status'];

const DEFAULT_MAIN_SORT = { key: 'createdAt', dir: 'asc' };

function decorateMainItem(item, code) {
  const projectName = normalizeProjectName(item.projectName);
  return {
    ...item,
    board: normalizeItemBoard(item.board),
    legacyCode: item.code,
    code,
    projectName,
    marks: computePriority(item.urgency, item.importance),
    isCompletedMain: isCompletedStatus(item.status),
  };
}

function decorateSubItem(item, mainItem, code) {
  return {
    ...item,
    board: normalizeItemBoard(item.board || mainItem.board),
    legacyCode: item.code,
    code,
    parentId: mainItem.id,
    parentCode: mainItem.code,
    projectName: mainItem.projectName,
  };
}

function sortMainItems(items, sort = DEFAULT_MAIN_SORT) {
  const nextSort = sort?.key ? sort : DEFAULT_MAIN_SORT;
  const mains = items.filter((item) => item.type === 'main').slice();

  mains.sort((a, b) => {
    const completedResult = Number(isCompletedStatus(a.status)) - Number(isCompletedStatus(b.status));
    if (completedResult !== 0) return completedResult;
    if (nextSort.key === 'code') return compareItemsByCreatedAt(a, b, nextSort.dir);
    return compareValue(getItemSortValue(a, nextSort.key), getItemSortValue(b, nextSort.key), nextSort.dir);
  });

  return mains;
}

function buildDisplayGroups(items, sort = DEFAULT_MAIN_SORT) {
  const mains = sortMainItems(items, sort);
  const subs = items.filter((item) => item.type === 'sub');

  return mains.map((main, mainIndex) => {
    const mainRow = decorateMainItem(main, String(mainIndex + 1));
    const children = subs
      .filter((sub) => sub.parentId === main.id || (!sub.parentId && sub.parentCode === main.code))
      .slice()
      .sort((a, b) => compareItemsByCreatedAt(a, b, 'asc'))
      .map((sub, childIndex) => decorateSubItem(sub, mainRow, `${mainRow.code}.${childIndex + 1}`));

    return { main: mainRow, children };
  });
}

function matchesColumnFilters(item, columnFilters = {}) {
  return COLUMN_FILTER_KEYS.every((key) => {
    const selectedValues = columnFilters[key];
    if (!Array.isArray(selectedValues) || selectedValues.length === 0) return true;

    const token = getItemFilterValue(item, key) || BLANK_FILTER_TOKEN;
    return selectedValues.includes(token);
  });
}

function matchesQuery(item, query) {
  if (!query.trim()) return true;

  const haystack = [item.code, item.projectName, item.description, item.position, item.status, item.remarks]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function matchesRowFilters(item, ui) {
  if (ui.filterType !== 'all' && item.type !== ui.filterType) return false;
  if (!matchesColumnFilters(item, ui.columnFilters)) return false;
  return matchesQuery(item, ui.query);
}

export function getSelectedItems(data) {
  return data.items.filter((item) => item.ownerId === data.selectedPersonId);
}

export function getMainItems(items) {
  return buildDisplayGroups(items, DEFAULT_MAIN_SORT).map((group) => group.main);
}

export function getStats(items) {
  const mains = items.filter((x) => x.type === 'main');
  const subs = items.filter((x) => x.type === 'sub');
  const completed = items.filter((x) => isCompletedStatus(x.status)).length;

  return {
    mains: mains.length,
    milestones: subs.length,
    highPriority: mains.filter((m) => computePriority(m.urgency, m.importance) >= 8).length,
    completed,
  };
}

export function getFilteredGroups(items, ui) {
  const groups = buildDisplayGroups(items, ui.sort);
  const filteredGroups = [];
  for (const { main: mainRow, children } of groups) {
    const mainMatches = matchesRowFilters(mainRow, ui);
    const matchingChildren = children.filter((child) => matchesRowFilters(child, ui));

    if (ui.filterType === 'main') {
      if (mainMatches) {
        filteredGroups.push({ main: mainRow, children: [], totalChildren: children.length });
      }
      continue;
    }

    if (ui.filterType === 'sub') {
      if (matchingChildren.length > 0) {
        filteredGroups.push({ main: mainRow, children: matchingChildren, totalChildren: children.length });
      }
      continue;
    }

    if (mainMatches || matchingChildren.length > 0) {
      filteredGroups.push({ main: mainRow, children: matchingChildren, totalChildren: children.length });
    }
  }

  return filteredGroups;
}

export function getFilteredRows(items, ui) {
  const groups = getFilteredGroups(items, ui);

  if (ui.filterType === 'main') {
    return groups.map((group) => group.main);
  }

  if (ui.filterType === 'sub') {
    return groups.flatMap((group) => group.children);
  }

  return groups.flatMap((group) => [group.main, ...group.children]);
}

export function getColumnFilterOptions(items) {
  const optionsMap = Object.fromEntries(COLUMN_FILTER_KEYS.map((key) => [key, new Map()]));
  const groups = buildDisplayGroups(items, DEFAULT_MAIN_SORT);

  for (const { main: mainRow, children } of groups) {
    const rows = [mainRow, ...children];
    rows.forEach((row) => {
      COLUMN_FILTER_KEYS.forEach((key) => {
        const value = getItemFilterValue(row, key);
        const token = value || BLANK_FILTER_TOKEN;
        const label = value || '(Blank)';
        optionsMap[key].set(token, label);
      });
    });
  }

  return Object.fromEntries(
    Object.entries(optionsMap).map(([key, valueMap]) => [
      key,
      Array.from(valueMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => {
          if (a.value === BLANK_FILTER_TOKEN) return 1;
          if (b.value === BLANK_FILTER_TOKEN) return -1;
          return compareValue(a.label, b.label, 'asc');
        }),
    ])
  );
}

export function getPersonName(data, ownerId) {
  return data.people.find((p) => p.id === ownerId)?.name || 'Unknown';
}
