export default function ToolbarCard({
  query,
  filterType,
  activeColumnFilterCount,
  sort,
  setQuery,
  setFilterType,
  setSort,
  clearColumnFilters,
}) {
  const usingCompletionSort = sort.key === 'completionDate';

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search project / description / status / remarks"
            className="h-10 w-72 rounded-xl border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            <option value="all">All</option>
            <option value="main">Main only</option>
            <option value="sub">Sub only</option>
          </select>
          <button
            type="button"
            onClick={clearColumnFilters}
            disabled={!activeColumnFilterCount}
            className="h-10 rounded-xl border border-neutral-300 px-3 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Clear column filters{activeColumnFilterCount ? ` (${activeColumnFilterCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setSort(usingCompletionSort ? { key: 'createdAt', dir: 'asc' } : { key: 'completionDate', dir: 'asc' })}
            className={`h-10 rounded-xl border px-3 text-sm ${
              usingCompletionSort
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300'
                : 'border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {usingCompletionSort ? 'Back to added date' : 'Sort by completion date'}
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Default order follows added date. Completion-date mode renumbers items from earliest to latest.</p>
      </div>
    </div>
  );
}
