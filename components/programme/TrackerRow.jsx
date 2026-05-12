import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { computePriority, isInBucket } from '@/lib/tracker/helpers';
import { ROUTINE_ITEM_BOARD, normalizeGanttColor } from '@/lib/tracker/constants';

export default function TrackerRow({
  item,
  monthBuckets,
  onEdit,
  onDelete,
  showCollapseToggle = false,
  collapsed = false,
  childCount = 0,
  onToggleCollapse,
}) {
  const isMain = item.type === 'main';
  const marks = isMain ? computePriority(item.urgency, item.importance) : '';
  const isRoutine = item.board === ROUTINE_ITEM_BOARD;
  const ganttColor = normalizeGanttColor(item.ganttColor, item.type);

  return (
    <tr
      className={
        isMain
          ? 'bg-white hover:bg-blue-50/40 dark:bg-neutral-900 dark:hover:bg-blue-950/20'
          : 'bg-violet-50/40 hover:bg-violet-100/40 dark:bg-violet-950/10 dark:hover:bg-violet-950/20'
      }
    >
      <td className="border-b border-neutral-200 px-3 py-2 font-mono text-xs dark:border-neutral-800">{item.code}</td>
      <td className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <div className="flex items-start gap-2">
          {isMain && showCollapseToggle ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="mt-0.5 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              aria-label={collapsed ? 'Expand sub items' : 'Collapse sub items'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          ) : null}
          <div className={isMain ? 'font-medium text-neutral-900 dark:text-neutral-100' : 'pl-4 text-neutral-700 dark:text-neutral-300'}>
            {isMain ? item.description : `-> ${item.description}`}
          </div>
        </div>
        {isRoutine ? (
          <div className="mt-1">
            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Routine
            </span>
          </div>
        ) : null}
        {item.remarks ? <div className="text-xs text-neutral-400 dark:text-neutral-500">{item.remarks}</div> : null}
        {isMain && collapsed && childCount > 0 ? (
          <div className="text-xs text-neutral-400 dark:text-neutral-500">
            {childCount} sub item{childCount === 1 ? '' : 's'} collapsed
          </div>
        ) : null}
      </td>
      <td className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <span
          className={
            isMain
              ? 'inline-flex rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
              : 'text-xs text-neutral-500 dark:text-neutral-400'
          }
        >
          {isMain ? item.projectName : `-> ${item.projectName}`}
        </span>
      </td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.position || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.urgency || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.importance || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">
        {isMain ? (
          <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            {marks}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">{item.status || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{isMain ? item.startDate || '-' : item.targetDate || '-'}</td>
      <td className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">{item.completionDate || '-'}</td>

      {monthBuckets.flatMap((m) =>
        [1, 2, 3, 4].map((week) => {
          const active = isInBucket(item, m.year, m.month, week);
          return (
            <td key={`${item.id}-${m.year}-${m.month}-${week}`} className="border-b border-l border-neutral-200 px-1 py-1 dark:border-neutral-800">
              {active ? (
                <div
                  className={isMain ? 'h-4 rounded-md' : 'mx-auto h-3 w-3 rounded-full'}
                  style={{ backgroundColor: ganttColor }}
                />
              ) : null}
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
