export default function ToolbarCard({ query, filterType, setQuery, setFilterType }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search description / status / remarks"
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
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">資料儲存層搬咗去 server 端，依家電話同電腦終於唔使各自平行宇宙。</p>
      </div>
    </div>
  );
}
