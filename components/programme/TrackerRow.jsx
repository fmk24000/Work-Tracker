import { Pencil, Trash2 } from 'lucide-react';
import { computePriority, isInBucket } from '@/lib/tracker/helpers';

export default function TrackerRow({ item, monthBuckets, onEdit, onDelete }) {
  const isMain = item.type === 'main';
  const marks = isMain ? computePriority(item.urgency, item.importance) : '';

  return (
    <tr className={isMain ? 'bg-white hover:bg-blue-50/40 dark:bg-neutral-900 dark:hover:bg-blue-950/20' : 'bg-violet-50/40 hover:bg-violet-100/40 dark:bg-violet-950/10 dark:hover:bg-violet-950/20'}>
      <td className="border-b border-neutral-200 px-3 py-2 font-mono text-xs dark:border-neutral-800">{item.code}</td>
      <td className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <div className={isMain ? 'font-medium text-neutral-900 dark:text-neutral-100' : 'pl-4 text-neutral-700 dark:text-neutral-300'}>
          {isMain ? item.description : `↳ ${item.description}`}
        </div>
        {item.remarks ? <div className="text-xs text-neutral-400 dark:text-neutral-500">{item.remarks}</div> : null}
      </td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.position || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.urgency || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.importance || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">
        {isMain ? <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">{marks}</span> : '-'}
      </td>
      <td className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">{item.status || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{isMain ? item.startDate || '-' : item.targetDate || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.completionDate || '-'}</td>

      {monthBuckets.flatMap((m) =>
        [1, 2, 3, 4].map((week) => {
          const active = isInBucket(item, m.year, m.month, week);
          return (
            <td key={`${item.id}-${m.year}-${m.month}-${week}`} className="border-b border-l border-neutral-200 px-1 py-1 dark:border-neutral-800">
              {active ? <div className={isMain ? 'h-4 rounded-md bg-blue-500' : 'mx-auto h-3 w-3 rounded-full bg-violet-500'} /> : null}
            </td>
          );
        })
      )}

      <td className="border-b border-l border-neutral-200 px-2 py-2 dark:border-neutral-800">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(item)} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(item)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
