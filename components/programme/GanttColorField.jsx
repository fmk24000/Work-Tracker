import { GANTT_COLOR_PRESETS, normalizeGanttColor } from '@/lib/tracker/constants';

export default function GanttColorField({ form, setForm }) {
  const color = normalizeGanttColor(form.ganttColor, form.type);

  function setColor(nextColor) {
    setForm((prev) => ({
      ...prev,
      ganttColor: normalizeGanttColor(nextColor, prev.type),
    }));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Gantt color</label>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950">
        {GANTT_COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setColor(preset)}
            className={`h-7 w-7 rounded-full border-2 ${
              color === preset ? 'border-neutral-900 dark:border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: preset }}
            aria-label={`Use ${preset} as Gantt color`}
            title={preset}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-neutral-300 bg-transparent p-0.5 dark:border-neutral-700"
          aria-label="Custom Gantt color"
          title="Custom Gantt color"
        />
        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{color}</span>
      </div>
    </div>
  );
}
