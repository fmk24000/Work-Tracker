'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import HeaderCard from '@/components/programme/HeaderCard';
import ToolbarCard from '@/components/programme/ToolbarCard';
import TrackerTable from '@/components/programme/TrackerTable';
import ItemModal from '@/components/programme/ItemModal';
import SettingsModal from '@/components/programme/SettingsModal';
import ManagePeopleModal from '@/components/programme/ManagePeopleModal';
import { STORAGE_KEY, THEME_STORAGE_KEY, emptyMainForm, emptySubForm, makeSeed, normalizeTrackerData, uid } from '@/lib/tracker/constants';
import { buildMonthBuckets, buildNextMainCode, buildNextSubCode, exportRowsToCsv } from '@/lib/tracker/helpers';
import { getFilteredRows, getMainItems, getPersonName, getSelectedItems, getStats } from '@/lib/tracker/selectors';

export default function Page() {
  const [data, setData] = useState(makeSeed);
  const [ui, setUi] = useState({
    query: '',
    filterType: 'all',
    sort: { key: 'code', dir: 'asc' },
    modalOpen: false,
    configOpen: false,
    managePeopleOpen: false,
    editingId: null
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
            const confirmed = window.confirm('偵測到你瀏覽器入面有舊版 local data。要唔要即刻搬上 Docker volume？');
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
        body: JSON.stringify(payload)
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
  const mainItems = useMemo(() => getMainItems(selectedItems), [selectedItems]);
  const monthBuckets = useMemo(() => buildMonthBuckets(selectedItems), [selectedItems]);
  const rows = useMemo(() => getFilteredRows(selectedItems, ui), [selectedItems, ui]);
  const stats = useMemo(() => getStats(selectedItems), [selectedItems]);
  const selectedPersonName = useMemo(() => getPersonName(data, data.selectedPersonId), [data]);
  const editingItem = useMemo(() => data.items.find((item) => item.id === ui.editingId) || null, [data.items, ui.editingId]);

  function updateUi(patch) {
    setUi((prev) => ({ ...prev, ...patch }));
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function openNewMain() {
    setForm(emptyMainForm());
    updateUi({ modalOpen: true, editingId: null });
  }

  function openNewSub() {
    setForm(emptySubForm());
    updateUi({ modalOpen: true, editingId: null });
  }

  function openEdit(item) {
    if (item.type === 'main') {
      setForm({
        type: 'main',
        description: item.description || '',
        position: item.position || '',
        urgency: item.urgency || 1,
        importance: item.importance || 1,
        status: item.status || '',
        remarks: item.remarks || '',
        startDate: item.startDate || '',
        completionDate: item.completionDate || ''
      });
    } else {
      setForm({
        type: 'sub',
        parentCode: item.parentCode || '',
        description: item.description || '',
        status: item.status || '',
        remarks: item.remarks || '',
        targetDate: item.targetDate || ''
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
      selectedPersonId: person.id
    }));
    setDraftPerson('');
  }

  function renamePerson(person) {
    const nextName = window.prompt(`Rename ${person.name}`, person.name)?.trim();
    if (!nextName || nextName === person.name) return;

    if (data.people.some((entry) => entry.id !== person.id && entry.name.toLowerCase() === nextName.toLowerCase())) {
      window.alert('已經有同名 person。');
      return;
    }

    setData((prev) => ({
      ...prev,
      people: prev.people.map((entry) => (entry.id === person.id ? { ...entry, name: nextName } : entry))
    }));
  }

  function deletePerson(person) {
    if (data.people.length <= 1) {
      window.alert('至少要留返一個 person，唔係成個 board 會變空城。');
      return;
    }

    const confirmed = window.confirm(`刪除 ${person.name}？佢名下 items 都會一齊刪走。`);
    if (!confirmed) return;

    setData((prev) => {
      const people = prev.people.filter((entry) => entry.id !== person.id);
      const selectedPersonId = prev.selectedPersonId === person.id ? people[0]?.id || '' : prev.selectedPersonId;
      return {
        ...prev,
        people,
        selectedPersonId,
        items: prev.items.filter((item) => item.ownerId !== person.id)
      };
    });
  }

  function saveItem() {
    if (!data.selectedPersonId) return;

    if (form.type === 'main') {
      if (!form.description.trim()) return;
      if (!form.startDate || !form.completionDate) return;
      if (form.completionDate < form.startDate) {
        alert('Completion date 唔可以早過 start date。😶');
        return;
      }
    }

    if (form.type === 'sub') {
      if (!form.description.trim()) return;
      if (!form.parentCode || !form.targetDate) return;
    }

    setData((prev) => {
      let items = [...prev.items];

      if (ui.editingId) {
        const index = items.findIndex((item) => item.id === ui.editingId);
        if (index === -1) return prev;

        const existing = items[index];
        if (existing.type === 'main' && form.type === 'main') {
          items[index] = {
            ...existing,
            ...form,
            ownerId: prev.selectedPersonId,
            urgency: Number(form.urgency),
            importance: Number(form.importance)
          };
        }

        if (existing.type === 'sub' && form.type === 'sub') {
          items[index] = {
            ...existing,
            ...form,
            code:
              existing.parentCode === form.parentCode
                ? existing.code
                : buildNextSubCode(items, prev.selectedPersonId, form.parentCode, existing.id),
            ownerId: prev.selectedPersonId
          };
        }

        if (existing.type === 'main' && form.type === 'sub') {
          const oldCode = existing.code;
          const newParentCode = form.parentCode;
          const convertedSub = {
            id: existing.id,
            ownerId: prev.selectedPersonId,
            type: 'sub',
            parentCode: newParentCode,
            code: '',
            description: form.description.trim(),
            status: form.status || '',
            remarks: form.remarks || '',
            targetDate: form.targetDate,
            createdAt: existing.createdAt || new Date().toISOString()
          };

          items[index] = convertedSub;
          items = items.map((item) => {
            if (item.type === 'sub' && item.ownerId === existing.ownerId && item.parentCode === oldCode) {
              return { ...item, parentCode: newParentCode };
            }
            return item;
          });

          let sequence = 0;
          items = items.map((item) => {
            if (item.type === 'sub' && item.ownerId === prev.selectedPersonId && item.parentCode === newParentCode) {
              sequence += 1;
              return { ...item, code: `${newParentCode}.${sequence}` };
            }
            return item;
          });
        }

        if (existing.type === 'sub' && form.type === 'main') {
          items[index] = {
            id: existing.id,
            ownerId: prev.selectedPersonId,
            type: 'main',
            code: buildNextMainCode(items, prev.selectedPersonId),
            description: form.description.trim(),
            position: form.position || '',
            urgency: Number(form.urgency),
            importance: Number(form.importance),
            status: form.status || '',
            remarks: form.remarks || '',
            startDate: form.startDate,
            completionDate: form.completionDate,
            createdAt: existing.createdAt || new Date().toISOString()
          };
        }
      } else {
        if (form.type === 'main') {
          items.push({
            id: uid(),
            ownerId: prev.selectedPersonId,
            type: 'main',
            code: buildNextMainCode(items, prev.selectedPersonId),
            createdAt: new Date().toISOString(),
            ...form,
            urgency: Number(form.urgency),
            importance: Number(form.importance)
          });
        }

        if (form.type === 'sub') {
          items.push({
            id: uid(),
            ownerId: prev.selectedPersonId,
            type: 'sub',
            code: buildNextSubCode(items, prev.selectedPersonId, form.parentCode),
            createdAt: new Date().toISOString(),
            ...form
          });
        }
      }

      return { ...prev, items };
    });

    closeModal();
  }

  function removeItem(item) {
    const confirmed = window.confirm(item.type === 'main' ? `刪除 ${item.code} 同下面所有 sub item？` : `刪除 ${item.code}？`);
    if (!confirmed) return;

    setData((prev) => ({
      ...prev,
      items: prev.items.filter((current) => {
        if (current.id === item.id) return false;
        if (item.type === 'main' && current.type === 'sub' && current.ownerId === item.ownerId && current.parentCode === item.code) {
          return false;
        }
        return true;
      })
    }));
  }

  function exportCsv() {
    exportRowsToCsv(rows, selectedPersonName);
  }

  function exportJsonBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
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
        alert('JSON 格式唔啱。');
      }
    };
    reader.readAsText(file);
  }

  async function exportToGoogleSheets() {
    if (!data.settings.sheetWebhook.trim()) {
      alert('請先喺 Settings 填 Google Apps Script Webhook URL。未駁 webhook 前先用 CSV 最穩陣。');
      return;
    }

    const payload = rows.map((item) => ({
      owner: selectedPersonName,
      type: item.type,
      code: item.code,
      description: item.description || '',
      position: item.position || '',
      urgency: item.urgency || '',
      importance: item.importance || '',
      marks: item.type === 'main' ? Number(item.urgency || 0) * Number(item.importance || 0) : '',
      status: item.status || '',
      remarks: item.remarks || '',
      startDate: item.startDate || '',
      completionDate: item.completionDate || '',
      targetDate: item.targetDate || ''
    }));

    try {
      const response = await fetch(data.settings.sheetWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person: selectedPersonName,
          exportedAt: new Date().toISOString(),
          rows: payload
        })
      });

      if (!response.ok) throw new Error('Webhook failed');
      alert('已送去 Google Sheets。📦');
    } catch {
      alert('Google Sheets export 失敗。檢查 webhook URL、Apps Script 權限，同埋 CORS 設定。');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <HeaderCard
          people={data.people}
          selectedPersonId={data.selectedPersonId}
          setSelectedPersonId={setSelectedPersonId}
          openNewMain={openNewMain}
          openNewSub={openNewSub}
          exportCsv={exportCsv}
          exportToGoogleSheets={exportToGoogleSheets}
          exportJsonBackup={exportJsonBackup}
          importJson={importJson}
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
          setQuery={(query) => updateUi({ query })}
          setFilterType={(filterType) => updateUi({ filterType })}
        />

        <TrackerTable
          selectedPersonName={selectedPersonName}
          rows={rows}
          monthBuckets={monthBuckets}
          sort={ui.sort}
          setSort={(sort) => updateUi({ sort })}
          onEdit={openEdit}
          onDelete={removeItem}
        />
      </div>

      {ui.modalOpen ? (
        <ItemModal
          form={form}
          setForm={setForm}
          editing={Boolean(ui.editingId)}
          mainItems={mainItems}
          excludeParentCode={editingItem?.type === 'main' ? editingItem.code : ''}
          onClose={closeModal}
          onSave={saveItem}
        />
      ) : null}

      {ui.configOpen ? (
        <SettingsModal
          webhook={data.settings.sheetWebhook}
          onChange={(value) =>
            setData((prev) => ({
              ...prev,
              settings: { ...prev.settings, sheetWebhook: value }
            }))
          }
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
