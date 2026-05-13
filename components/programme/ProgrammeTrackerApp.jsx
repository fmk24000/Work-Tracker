'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import HeaderCard from '@/components/programme/HeaderCard';
import ToolbarCard from '@/components/programme/ToolbarCard';
import TrackerTable from '@/components/programme/TrackerTable';
import ItemModal from '@/components/programme/ItemModal';
import SettingsModal from '@/components/programme/SettingsModal';
import ManagePeopleModal from '@/components/programme/ManagePeopleModal';
import StatCard from '@/components/programme/StatCard';
import {
  DEFAULT_ITEM_BOARD,
  DEFAULT_PROJECT_NAME,
  ROUTINE_ITEM_BOARD,
  STORAGE_KEY,
  THEME_STORAGE_KEY,
  emptyMainForm,
  emptySubForm,
  normalizeGanttColor,
  makeSeed,
  normalizeItemBoard,
  normalizeProjectName,
  normalizeTrackerData,
  uid,
} from '@/lib/tracker/constants';
import { buildMonthBuckets, exportRowsToCsv, importRowsFromCsv } from '@/lib/tracker/helpers';
import {
  getColumnFilterOptions,
  getFilteredGroups,
  getFilteredRows,
  getMainItems,
  getPersonName,
  getSelectedItems,
  getStats,
} from '@/lib/tracker/selectors';
import BoardModeTabs from './BoardModeTabs';

function sortProjectNames(a, b) {
  if (a === DEFAULT_PROJECT_NAME && b !== DEFAULT_PROJECT_NAME) return -1;
  if (b === DEFAULT_PROJECT_NAME && a !== DEFAULT_PROJECT_NAME) return 1;
  return a.localeCompare(b);
}

function makeProjectAnchor(projectName) {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `project-${slug || 'general'}`;
}

function buildProjectSections(rowGroups, filterType) {
  const grouped = new Map();

  rowGroups.forEach((group) => {
    const projectName = normalizeProjectName(group.main.projectName);
    const current = grouped.get(projectName) || [];
    current.push(group);
    grouped.set(projectName, current);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => sortProjectNames(a, b))
    .map(([projectName, groups]) => {
      const visibleRows =
        filterType === 'main'
          ? groups.map((group) => group.main)
          : filterType === 'sub'
            ? groups.flatMap((group) => group.children)
            : groups.flatMap((group) => [group.main, ...group.children]);

      return {
        id: makeProjectAnchor(projectName),
        projectName,
        rowGroups: groups,
        monthBuckets: buildMonthBuckets(visibleRows),
        mainCount: groups.length,
        subCount: groups.reduce((total, group) => total + group.children.length, 0),
      };
    });
}

function getItemsForView(items, view) {
  if (view !== 'routine') {
    return items;
  }

  return items.filter((item) => normalizeItemBoard(item.board) === ROUTINE_ITEM_BOARD);
}

function getViewConfig(view) {
  if (view === 'routine') {
    return {
      title: 'Routine Jobs',
      description: 'Capture recurring work here. Anything you add on this page still appears on the main board for the same owner.',
      boardLabelSuffix: 'routine board',
      mainButtonLabel: 'Routine main',
      subButtonLabel: 'Routine sub',
      newItemBoard: ROUTINE_ITEM_BOARD,
    };
  }

  if (view === 'projects') {
    return {
      title: 'Programme Tracker',
      description: 'Review the same tracker data through project-specific boards, while keeping one shared source of truth.',
      boardLabelSuffix: 'programme board',
      mainButtonLabel: 'Main item',
      subButtonLabel: 'Sub item',
      newItemBoard: DEFAULT_ITEM_BOARD,
    };
  }

  return {
    title: 'Programme Tracker',
    description: 'Track programme work, milestones, and routine jobs in one shared board backed by server storage.',
    boardLabelSuffix: 'programme board',
    mainButtonLabel: 'Main item',
    subButtonLabel: 'Sub item',
    newItemBoard: DEFAULT_ITEM_BOARD,
  };
}

export default function ProgrammeTrackerApp({ view = 'all' }) {
  const viewConfig = getViewConfig(view);
  const [data, setData] = useState(makeSeed);
  const [ui, setUi] = useState({
    query: '',
    filterType: 'all',
    columnFilters: {},
    sort: { key: 'createdAt', dir: 'asc' },
    modalOpen: false,
    configOpen: false,
    managePeopleOpen: false,
    editingId: null,
  });
  const [draftPerson, setDraftPerson] = useState('');
  const [form, setForm] = useState(emptyMainForm());
  const [theme, setTheme] = useState('light');
  const [syncStatus, setSyncStatus] = useState('loading');
  const [serverReady, setServerReady] = useState(false);
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef('');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setSyncStatus('loading');
      try {
        const response = await fetch('/api/tracker', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch tracker data');
        const payload = await response.json();
        const remoteData = normalizeTrackerData(payload.data);

        const legacyRaw = window.localStorage.getItem(STORAGE_KEY);
        const shouldMigrateLegacy = payload.meta?.createdDefault && legacyRaw;

        if (shouldMigrateLegacy) {
          try {
            const legacyData = normalizeTrackerData(JSON.parse(legacyRaw));
            const confirmed = window.confirm('Server storage is empty. Import the older browser-only data into Docker volume now?');
            if (confirmed) {
              await saveToServer(legacyData, false);
              if (!cancelled) {
                setData(legacyData);
                lastSavedRef.current = JSON.stringify(legacyData);
                setSyncStatus('saved');
                setServerReady(true);
              }
              return;
            }
          } catch {
            console.warn('Legacy local data migration skipped');
          }
        }

        if (!cancelled) {
          setData(remoteData);
          lastSavedRef.current = JSON.stringify(remoteData);
          setSyncStatus('saved');
          setServerReady(true);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setSyncStatus('error');
          setServerReady(true);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!serverReady) return;

    const nextJson = JSON.stringify(data);
    if (nextJson === lastSavedRef.current) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setSyncStatus('saving');
    saveTimerRef.current = window.setTimeout(() => {
      saveToServer(data, true);
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, serverReady]);

  async function saveToServer(nextData, markReadyAfterSave) {
    try {
      const payload = normalizeTrackerData(nextData);
      const response = await fetch('/api/tracker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save tracker data');
      const result = await response.json();
      const normalized = normalizeTrackerData(result.data);
      lastSavedRef.current = JSON.stringify(normalized);
      setData(normalized);
      setSyncStatus('saved');
      if (markReadyAfterSave) setServerReady(true);
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
      if (markReadyAfterSave) setServerReady(true);
    }
  }

  const selectedItems = useMemo(() => getSelectedItems(data), [data]);
  const viewItems = useMemo(() => getItemsForView(selectedItems, view), [selectedItems, view]);
  const mainItems = useMemo(() => getMainItems(viewItems), [viewItems]);
  const columnFilterOptions = useMemo(() => getColumnFilterOptions(viewItems), [viewItems]);
  const projectOptions = useMemo(() => {
    const names = new Set([DEFAULT_PROJECT_NAME]);
    mainItems.forEach((item) => names.add(normalizeProjectName(item.projectName)));
    return Array.from(names).sort(sortProjectNames);
  }, [mainItems]);
  const monthBuckets = useMemo(() => buildMonthBuckets(viewItems), [viewItems]);
  const rowGroups = useMemo(() => getFilteredGroups(viewItems, ui), [viewItems, ui]);
  const rows = useMemo(() => getFilteredRows(viewItems, ui), [viewItems, ui]);
  const projectSections = useMemo(() => buildProjectSections(rowGroups, ui.filterType), [rowGroups, ui.filterType]);
  const stats = useMemo(() => getStats(viewItems), [viewItems]);
  const selectedPersonName = useMemo(() => getPersonName(data, data.selectedPersonId), [data]);
  const activeColumnFilterCount = useMemo(
    () => Object.values(ui.columnFilters || {}).filter((values) => Array.isArray(values) && values.length > 0).length,
    [ui.columnFilters]
  );
  const collapseEnabled = Boolean(!ui.query.trim() && activeColumnFilterCount === 0 && ui.filterType === 'all');

  function updateUi(patch) {
    setUi((prev) => ({ ...prev, ...patch }));
  }

  function setColumnFilter(key, values) {
    setUi((prev) => {
      const columnFilters = { ...(prev.columnFilters || {}) };

      if (!values.length) {
        delete columnFilters[key];
      } else {
        columnFilters[key] = values;
      }

      return { ...prev, columnFilters };
    });
  }

  function clearColumnFilters() {
    updateUi({ columnFilters: {} });
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function openNewMain() {
    setForm({
      ...emptyMainForm(),
      board: viewConfig.newItemBoard,
    });
    updateUi({ modalOpen: true, editingId: null });
  }

  function openNewSub() {
    setForm({
      ...emptySubForm(),
      board: viewConfig.newItemBoard,
    });
    updateUi({ modalOpen: true, editingId: null });
  }

  function openEdit(item) {
    if (item.type === 'main') {
      setForm({
        type: 'main',
        board: normalizeItemBoard(item.board),
        projectName: normalizeProjectName(item.projectName),
        description: item.description || '',
        position: item.position || '',
        urgency: item.urgency || 1,
        importance: item.importance || 1,
        status: item.status || '',
        remarks: item.remarks || '',
        startDate: item.startDate || '',
        completionDate: item.completionDate || '',
        ganttColor: normalizeGanttColor(item.ganttColor, 'main'),
      });
    } else {
      setForm({
        type: 'sub',
        board: normalizeItemBoard(item.board),
        parentId: item.parentId || '',
        description: item.description || '',
        status: item.status || '',
        remarks: item.remarks || '',
        targetDate: item.targetDate || '',
        ganttColor: normalizeGanttColor(item.ganttColor, 'sub'),
      });
    }

    updateUi({ modalOpen: true, editingId: item.id });
  }

  function closeModal() {
    updateUi({ modalOpen: false, editingId: null });
  }

  function setSelectedPersonId(personId) {
    setData((prev) => ({ ...prev, selectedPersonId: personId }));
  }

  function addPerson() {
    const name = draftPerson.trim();
    if (!name) return;

    const existing = data.people.find((person) => person.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelectedPersonId(existing.id);
      setDraftPerson('');
      return;
    }

    const person = { id: uid(), name };
    setData((prev) => ({
      ...prev,
      people: [...prev.people, person],
      selectedPersonId: person.id,
    }));
    setDraftPerson('');
  }

  function renamePerson(person) {
    const nextName = window.prompt(`Rename ${person.name}`, person.name)?.trim();
    if (!nextName || nextName === person.name) return;

    if (data.people.some((entry) => entry.id !== person.id && entry.name.toLowerCase() === nextName.toLowerCase())) {
      window.alert('A person with the same name already exists.');
      return;
    }

    setData((prev) => ({
      ...prev,
      people: prev.people.map((entry) => (entry.id === person.id ? { ...entry, name: nextName } : entry)),
    }));
  }

  function deletePerson(person) {
    if (data.people.length <= 1) {
      window.alert('At least one person must remain on the board.');
      return;
    }

    const confirmed = window.confirm(`Delete ${person.name} and all of their items?`);
    if (!confirmed) return;

    setData((prev) => {
      const people = prev.people.filter((entry) => entry.id !== person.id);
      const selectedPersonId = prev.selectedPersonId === person.id ? people[0]?.id || '' : prev.selectedPersonId;
      return {
        ...prev,
        people,
        selectedPersonId,
        items: prev.items.filter((item) => item.ownerId !== person.id),
      };
    });
  }

  function saveItem() {
    if (!data.selectedPersonId) return;
    const editingItem = ui.editingId ? data.items.find((item) => item.id === ui.editingId) : null;
    const formBoard = normalizeItemBoard(form.board || editingItem?.board || viewConfig.newItemBoard);

    if (form.type === 'main') {
      if (!form.description.trim()) return;
      if (!form.startDate || !form.completionDate) return;
      if (form.completionDate < form.startDate) {
        alert('Completion date cannot be earlier than the start date.');
        return;
      }
    }

    if (form.type === 'sub') {
      if (!form.description.trim()) return;
      if (!form.parentId || !form.targetDate) return;

      if (editingItem?.type === 'main') {
        const hasChildren = data.items.some(
          (item) => item.ownerId === editingItem.ownerId && item.type === 'sub' && item.parentId === editingItem.id
        );

        if (hasChildren) {
          window.alert('This main item still has sub items. Please move or remove them before converting it to a sub item.');
          return;
        }
      }
    }

    setData((prev) => {
      const items = [...prev.items];

      if (ui.editingId) {
        const index = items.findIndex((item) => item.id === ui.editingId);
        if (index === -1) return prev;

        const existing = items[index];
        const nextBoard = formBoard;
        const selectedParentIndex =
          form.type === 'sub' ? items.findIndex((item) => item.id === form.parentId && item.type === 'main') : -1;

        if (form.type === 'sub' && nextBoard === ROUTINE_ITEM_BOARD && selectedParentIndex !== -1) {
          items[selectedParentIndex] = {
            ...items[selectedParentIndex],
            board: ROUTINE_ITEM_BOARD,
          };
        }

        if (existing.type === 'main' && form.type === 'main') {
          items[index] = {
            ...existing,
            ...form,
            board: formBoard,
            projectName: normalizeProjectName(form.projectName),
            urgency: Number(form.urgency),
            importance: Number(form.importance),
            ganttColor: normalizeGanttColor(form.ganttColor, 'main'),
            ownerId: prev.selectedPersonId,
          };
        }

        if (existing.type === 'sub' && form.type === 'sub') {
          items[index] = {
            ...existing,
            ...form,
            board: nextBoard,
            ganttColor: normalizeGanttColor(form.ganttColor, 'sub'),
            ownerId: prev.selectedPersonId,
          };
        }

        if (existing.type === 'sub' && form.type === 'main') {
          items[index] = {
            id: existing.id,
            ownerId: prev.selectedPersonId,
            type: 'main',
            board: formBoard,
            code: existing.code,
            createdAt: existing.createdAt,
            projectName: normalizeProjectName(form.projectName),
            description: form.description,
            position: form.position,
            urgency: Number(form.urgency),
            importance: Number(form.importance),
            status: form.status,
            remarks: form.remarks,
            startDate: form.startDate,
            completionDate: form.completionDate,
            ganttColor: normalizeGanttColor(form.ganttColor, 'main'),
          };
        }

        if (existing.type === 'main' && form.type === 'sub') {
          items[index] = {
            id: existing.id,
            ownerId: prev.selectedPersonId,
            type: 'sub',
            board: nextBoard,
            parentId: form.parentId,
            parentCode: '',
            code: existing.code,
            createdAt: existing.createdAt,
            description: form.description,
            status: form.status,
            remarks: form.remarks,
            targetDate: form.targetDate,
            ganttColor: normalizeGanttColor(form.ganttColor, 'sub'),
          };
        }
      } else {
        if (form.type === 'main') {
          items.push({
            id: uid(),
            ownerId: prev.selectedPersonId,
            type: 'main',
            board: formBoard,
            code: uid(),
            createdAt: new Date().toISOString(),
            ...form,
            projectName: normalizeProjectName(form.projectName),
            urgency: Number(form.urgency),
            importance: Number(form.importance),
            ganttColor: normalizeGanttColor(form.ganttColor, 'main'),
          });
        }

        if (form.type === 'sub') {
          const nextBoard = formBoard;
          const selectedParentIndex = items.findIndex((item) => item.id === form.parentId && item.type === 'main');

          if (nextBoard === ROUTINE_ITEM_BOARD && selectedParentIndex !== -1) {
            items[selectedParentIndex] = {
              ...items[selectedParentIndex],
              board: ROUTINE_ITEM_BOARD,
            };
          }

          items.push({
            id: uid(),
            ownerId: prev.selectedPersonId,
            type: 'sub',
            board: nextBoard,
            parentId: form.parentId,
            parentCode: '',
            code: uid(),
            createdAt: new Date().toISOString(),
            ...form,
            ganttColor: normalizeGanttColor(form.ganttColor, 'sub'),
          });
        }
      }

      return { ...prev, items };
    });

    closeModal();
  }

  function removeItem(item) {
    const confirmed = window.confirm(
      item.type === 'main' ? `Delete ${item.code} and its sub items?` : `Delete ${item.code}?`
    );
    if (!confirmed) return;

    setData((prev) => ({
      ...prev,
      items: prev.items.filter((current) => {
        if (current.id === item.id) return false;
        if (item.type === 'main' && current.type === 'sub' && current.ownerId === item.ownerId && current.parentId === item.id) {
          return false;
        }
        return true;
      }),
    }));
  }

  function exportCsv() {
    exportRowsToCsv(rows, selectedPersonName);
  }

  function exportJsonBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programme-tracker-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeTrackerData(JSON.parse(String(reader.result)));
        setData(parsed);
      } catch {
        alert('JSON format is invalid.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      'Import this CSV and replace existing tracker items for the owners included in the file?'
    );
    if (!confirmed) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = importRowsFromCsv(data, String(reader.result), data.selectedPersonId, viewConfig.newItemBoard);
        setData(normalizeTrackerData(parsed));
        alert('CSV imported.');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'CSV format is invalid.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async function exportToGoogleSheets() {
    if (!data.settings.sheetWebhook.trim()) {
      alert('Please set the Google Apps Script webhook URL in Settings before exporting.');
      return;
    }

    const payload = rows.map((item) => ({
      owner: selectedPersonName,
      type: item.type,
      code: item.code,
      description: item.description || '',
      position: item.position || '',
      projectName: normalizeProjectName(item.projectName),
      urgency: item.urgency || '',
      importance: item.importance || '',
      marks: item.type === 'main' ? Number(item.urgency || 0) * Number(item.importance || 0) : '',
      status: item.status || '',
      remarks: item.remarks || '',
      startDate: item.startDate || '',
      completionDate: item.completionDate || '',
      targetDate: item.targetDate || '',
    }));

    try {
      const response = await fetch(data.settings.sheetWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person: selectedPersonName,
          exportedAt: new Date().toISOString(),
          rows: payload,
        }),
      });

      if (!response.ok) throw new Error('Webhook failed');
      alert('Exported to Google Sheets.');
    } catch {
      alert('Google Sheets export failed. Please check the webhook URL, Apps Script deployment, or CORS settings.');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <BoardModeTabs view={view} />

        <HeaderCard
          title={viewConfig.title}
          description={viewConfig.description}
          mainButtonLabel={viewConfig.mainButtonLabel}
          subButtonLabel={viewConfig.subButtonLabel}
          people={data.people}
          selectedPersonId={data.selectedPersonId}
          setSelectedPersonId={setSelectedPersonId}
          openNewMain={openNewMain}
          openNewSub={openNewSub}
          exportCsv={exportCsv}
          exportToGoogleSheets={exportToGoogleSheets}
          exportJsonBackup={exportJsonBackup}
          importJson={importJson}
          importCsv={importCsv}
          openSettings={() => updateUi({ configOpen: true })}
          openManagePeople={() => updateUi({ managePeopleOpen: true })}
          stats={stats}
          theme={theme}
          toggleTheme={toggleTheme}
          syncStatus={syncStatus}
        />

        <ToolbarCard
          query={ui.query}
          filterType={ui.filterType}
          activeColumnFilterCount={activeColumnFilterCount}
          sort={ui.sort}
          setQuery={(query) => updateUi({ query })}
          setFilterType={(filterType) => updateUi({ filterType })}
          setSort={(sort) => updateUi({ sort })}
          clearColumnFilters={clearColumnFilters}
        />

        {view === 'projects' ? (
          <div className="space-y-4">
            {projectSections.length > 1 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Project navigation</p>
                    <h2 className="mt-1 text-lg font-semibold">Jump to a dedicated project board</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projectSections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="rounded-2xl border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        {section.projectName}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {projectSections.length ? (
              projectSections.map((section) => (
                <section key={section.id} id={section.id} className="space-y-3 scroll-mt-6">
                  <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Dedicated board</p>
                        <h2 className="mt-1 text-2xl font-semibold">{section.projectName}</h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          This section isolates {section.projectName} from the combined overview, while keeping the same filters and edit actions.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatCard label="Visible mains" value={section.mainCount} />
                        <StatCard label="Visible milestones" value={section.subCount} />
                      </div>
                    </div>
                  </div>

                  <TrackerTable
                    boardLabel={`${selectedPersonName} ${section.projectName} board`}
                    selectedPersonName={selectedPersonName}
                    rowGroups={section.rowGroups}
                    monthBuckets={section.monthBuckets}
                    filterType={ui.filterType}
                    collapseEnabled={collapseEnabled}
                    sort={ui.sort}
                    setSort={(sort) => updateUi({ sort })}
                    columnFilters={ui.columnFilters}
                    columnFilterOptions={columnFilterOptions}
                    setColumnFilter={setColumnFilter}
                    onEdit={openEdit}
                    onDelete={removeItem}
                  />
                </section>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                No project boards match the current search or filters.
              </div>
            )}
          </div>
        ) : (
          <TrackerTable
            boardLabel={`${selectedPersonName} ${viewConfig.boardLabelSuffix}`}
            selectedPersonName={selectedPersonName}
            rowGroups={rowGroups}
            monthBuckets={monthBuckets}
            filterType={ui.filterType}
            collapseEnabled={collapseEnabled}
            sort={ui.sort}
            setSort={(sort) => updateUi({ sort })}
            columnFilters={ui.columnFilters}
            columnFilterOptions={columnFilterOptions}
            setColumnFilter={setColumnFilter}
            onEdit={openEdit}
            onDelete={removeItem}
          />
        )}
      </div>

      {ui.modalOpen ? (
        <ItemModal
          form={form}
          setForm={setForm}
          editing={Boolean(ui.editingId)}
          mainItems={mainItems.filter((item) => item.id !== ui.editingId)}
          projectOptions={projectOptions}
          onClose={closeModal}
          onSave={saveItem}
        />
      ) : null}

      {ui.configOpen ? (
        <SettingsModal
          webhook={data.settings.sheetWebhook}
          onChange={(value) => setData((prev) => ({ ...prev, settings: { ...prev.settings, sheetWebhook: value } }))}
          onClose={() => updateUi({ configOpen: false })}
        />
      ) : null}

      {ui.managePeopleOpen ? (
        <ManagePeopleModal
          people={data.people}
          selectedPersonId={data.selectedPersonId}
          draftPerson={draftPerson}
          setDraftPerson={setDraftPerson}
          onAddPerson={addPerson}
          onRenamePerson={renamePerson}
          onDeletePerson={deletePerson}
          onSelectPerson={setSelectedPersonId}
          onClose={() => updateUi({ managePeopleOpen: false })}
        />
      ) : null}
    </div>
  );
}
