'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { BLANK_FILTER_TOKEN, formatMonthLabel } from '@/lib/tracker/helpers';
import TrackerRow from './TrackerRow';

function HeaderFilterMenu({ label, filterKey, options, selectedValues, setColumnFilter }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const active = selectedValues.length > 0;

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function toggleValue(value) {
    if (selectedValues.includes(value)) {
      setColumnFilter(
        filterKey,
        selectedValues.filter((entry) => entry !== value)
      );
      return;
    }

    setColumnFilter(filterKey, [...selectedValues, value]);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`rounded-md p-1 ${
          active
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
            : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
        }`}
        aria-label={`Filter ${label}`}
      >
        <Filter className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">{label}</span>
            {active ? (
              <button
                type="button"
                onClick={() => setColumnFilter(filterKey, [])}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label={`Clear ${label} filter`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {options.length ? (
              options.map((option) => {
                const checked = selectedValues.includes(option.value);
                return (
                  <label
                    key={`${filterKey}-${option.value}`}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleValue(option.value)}
                        className="h-3.5 w-3.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
                      />
                      <span className={option.value === BLANK_FILTER_TOKEN ? 'italic text-neutral-400 dark:text-neutral-500' : ''}>
                        {option.label}
                      </span>
                    </span>
                    {checked ? <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> : null}
                  </label>
                );
              })
            ) : (
              <div className="px-2 py-3 text-xs text-neutral-400 dark:text-neutral-500">No values</div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-neutral-200 px-1 pt-2 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setColumnFilter(filterKey, [])}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Show all
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-neutral-900 px-2 py-1 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortableHeader({ label, sortKey, sort, setSort, filterKey, columnFilters, columnFilterOptions, setColumnFilter }) {
  const active = sort.key === sortKey;
  const selectedValues = filterKey ? columnFilters?.[filterKey] || [] : [];

  function toggle() {
    setSort({
      key: sortKey,
      dir: sort.key === sortKey && sort.dir === 'asc' ? 'desc' : 'asc',
    });
  }

  return (
    <th className="border-b border-neutral-200 px-3 py-2 text-left dark:border-neutral-800">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={toggle} className="flex items-center gap-1 text-left">
          <span>{label}</span>
          <span className="inline-flex flex-col">
            <ChevronUp className={`h-3 w-3 ${active && sort.dir === 'asc' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600'}`} />
            <ChevronDown className={`-mt-1 h-3 w-3 ${active && sort.dir === 'desc' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600'}`} />
          </span>
        </button>
        {filterKey ? (
          <HeaderFilterMenu
            label={label}
            filterKey={filterKey}
            options={columnFilterOptions?.[filterKey] || []}
            selectedValues={selectedValues}
            setColumnFilter={setColumnFilter}
          />
        ) : null}
      </div>
    </th>
  );
}

export default function TrackerTable({
  boardLabel,
  selectedPersonName,
  rowGroups,
  monthBuckets,
  filterType,
  collapseEnabled,
  sort,
  setSort,
  columnFilters,
  columnFilterOptions,
  setColumnFilter,
  onEdit,
  onDelete,
}) {
  const [collapsedMainIds, setCollapsedMainIds] = useState({});
  const previousCompletionRef = useRef({});

  useEffect(() => {
    const previousCompletion = previousCompletionRef.current;
    const nextCompletion = Object.fromEntries(rowGroups.map(({ main }) => [main.id, Boolean(main.isCompletedMain)]));

    setCollapsedMainIds((current) => {
      const next = {};

      rowGroups.forEach(({ main }) => {
        const wasCompleted = previousCompletion[main.id];
        const isCompleted = nextCompletion[main.id];
        const hasExistingState = Object.prototype.hasOwnProperty.call(current, main.id);

        if (!hasExistingState) {
          next[main.id] = isCompleted;
          return;
        }

        next[main.id] = !wasCompleted && isCompleted ? true : current[main.id];
      });

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      const unchanged =
        currentKeys.length === nextKeys.length && nextKeys.every((key) => current[key] === next[key]);

      return unchanged ? current : next;
    });

    previousCompletionRef.current = nextCompletion;
  }, [rowGroups]);

  function toggleMainCollapse(mainId) {
    setCollapsedMainIds((current) => ({ ...current, [mainId]: !current[mainId] }));
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
      <table className="min-w-[1620px] w-full border-collapse text-sm">
        <thead>
          <tr>
            <th colSpan={10} className="border-b border-neutral-200 bg-neutral-950 px-3 py-2 text-left text-white dark:border-neutral-800">
              {boardLabel || `${selectedPersonName} programme board`}
            </th>
            {monthBuckets.map((m) => (
              <th key={`${m.year}-${m.month}`} colSpan={4} className="border-b border-l border-neutral-700 bg-neutral-950 px-2 py-2 text-center text-white">
                {formatMonthLabel(m.year, m.month)}
              </th>
            ))}
            <th className="border-b border-l border-neutral-700 bg-neutral-950 px-2 py-2 text-white">Actions</th>
          </tr>
          <tr className="bg-neutral-50 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            <SortableHeader label="Item" sortKey="code" sort={sort} setSort={setSort} />
            <SortableHeader label="Description" sortKey="description" sort={sort} setSort={setSort} />
            <SortableHeader
              label="Project"
              sortKey="projectName"
              sort={sort}
              setSort={setSort}
              filterKey="projectName"
              columnFilters={columnFilters}
              columnFilterOptions={columnFilterOptions}
              setColumnFilter={setColumnFilter}
            />
            <SortableHeader
              label="Position"
              sortKey="position"
              sort={sort}
              setSort={setSort}
              filterKey="position"
              columnFilters={columnFilters}
              columnFilterOptions={columnFilterOptions}
              setColumnFilter={setColumnFilter}
            />
            <SortableHeader
              label="Urgency"
              sortKey="urgency"
              sort={sort}
              setSort={setSort}
              filterKey="urgency"
              columnFilters={columnFilters}
              columnFilterOptions={columnFilterOptions}
              setColumnFilter={setColumnFilter}
            />
            <SortableHeader
              label="Importance"
              sortKey="importance"
              sort={sort}
              setSort={setSort}
              filterKey="importance"
              columnFilters={columnFilters}
              columnFilterOptions={columnFilterOptions}
              setColumnFilter={setColumnFilter}
            />
            <SortableHeader
              label="Marks"
              sortKey="marks"
              sort={sort}
              setSort={setSort}
              filterKey="marks"
              columnFilters={columnFilters}
              columnFilterOptions={columnFilterOptions}
              setColumnFilter={setColumnFilter}
            />
            <SortableHeader
              label="Status"
              sortKey="status"
              sort={sort}
              setSort={setSort}
              filterKey="status"
              columnFilters={columnFilters}
              columnFilterOptions={columnFilterOptions}
              setColumnFilter={setColumnFilter}
            />
            <SortableHeader label="Start / Target" sortKey="sortDate" sort={sort} setSort={setSort} />
            <SortableHeader label="Completion" sortKey="completionDate" sort={sort} setSort={setSort} />
            {monthBuckets.flatMap((m) =>
              [1, 2, 3, 4].map((week) => (
                <th key={`${m.year}-${m.month}-${week}`} className="border-b border-l border-neutral-200 px-2 py-2 text-center dark:border-neutral-800">
                  {week}
                </th>
              ))
            )}
            <th className="border-b border-l border-neutral-200 px-2 py-2 text-center dark:border-neutral-800">Edit</th>
          </tr>
        </thead>
        <tbody>
          {rowGroups.length === 0 ? (
            <tr>
              <td colSpan={11 + monthBuckets.length * 4} className="px-4 py-10 text-center text-neutral-400 dark:text-neutral-500">
                No matching rows. Try clearing the column filters or search.
              </td>
            </tr>
          ) : (
            rowGroups.map(({ main, children, totalChildren }) => {
              const showCollapseToggle = collapseEnabled && totalChildren > 0;
              const collapsed = showCollapseToggle && collapsedMainIds[main.id];

              return (
                <Fragment key={main.id}>
                  <TrackerRow
                    item={main}
                    monthBuckets={monthBuckets}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showCollapseToggle={showCollapseToggle}
                    collapsed={collapsed}
                    childCount={totalChildren}
                    onToggleCollapse={() => toggleMainCollapse(main.id)}
                  />
                  {(filterType === 'all' && collapsed ? [] : children).map((item) => (
                    <TrackerRow key={item.id} item={item} monthBuckets={monthBuckets} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
