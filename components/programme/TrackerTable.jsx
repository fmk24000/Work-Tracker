import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatMonthLabel } from '@/lib/tracker/helpers';
import TrackerRow from './TrackerRow';

function SortableHeader({ label, sortKey, sort, setSort }) {
  const active = sort.key === sortKey;

  function toggle() {
    setSort({
      key: sortKey,
      dir: sort.key === sortKey && sort.dir === 'asc' ? 'desc' : 'asc',
    });
  }

  return (
    <th onClick={toggle} className="cursor-pointer border-b border-neutral-200 px-3 py-2 text-left dark:border-neutral-800">
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex flex-col">
          <ChevronUp className={`h-3 w-3 ${active && sort.dir === 'asc' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600'}`} />
          <ChevronDown className={`-mt-1 h-3 w-3 ${active && sort.dir === 'desc' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600'}`} />
        </span>
      </div>
    </th>
  );
}

export default function TrackerTable({ selectedPersonName, rows, monthBuckets, sort, setSort, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
      <table className="min-w-[1500px] w-full border-collapse text-sm">
        <thead>
          <tr>
            <th colSpan={9} className="border-b border-neutral-200 bg-neutral-950 px-3 py-2 text-left text-white dark:border-neutral-800">
              {selectedPersonName} programme board
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
            <SortableHeader label="Position" sortKey="position" sort={sort} setSort={setSort} />
            <SortableHeader label="Urgency" sortKey="urgency" sort={sort} setSort={setSort} />
            <SortableHeader label="Importance" sortKey="importance" sort={sort} setSort={setSort} />
            <SortableHeader label="Marks" sortKey="marks" sort={sort} setSort={setSort} />
            <SortableHeader label="Status" sortKey="status" sort={sort} setSort={setSort} />
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10 + monthBuckets.length * 4} className="px-4 py-10 text-center text-neutral-400 dark:text-neutral-500">
                未有資料。加個 main item 先，張表就會醒神。🙂
              </td>
            </tr>
          ) : (
            rows.map((item) => <TrackerRow key={item.id} item={item} monthBuckets={monthBuckets} onEdit={onEdit} onDelete={onDelete} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
