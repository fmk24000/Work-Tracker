import { useState } from 'react';
import { DEFAULT_PROJECT_NAME } from '@/lib/tracker/constants';
import GanttColorField from './GanttColorField';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

export default function MainItemForm({ form, setForm, projectOptions }) {
  const inputClass = 'w-full rounded-xl border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100';
  const customProjectValue = '__custom__';
  const currentProjectName = String(form.projectName || '').trim();
  const hasPresetProject = projectOptions.includes(currentProjectName || DEFAULT_PROJECT_NAME);
  const [isCustomProject, setIsCustomProject] = useState(() => Boolean(currentProjectName && !hasPresetProject));
  const projectSelectValue = isCustomProject
    ? customProjectValue
    : currentProjectName
      ? hasPresetProject
        ? currentProjectName
        : customProjectValue
      : DEFAULT_PROJECT_NAME;

  return (
    <>
      <Field label="Project name">
        <select
          className={inputClass}
          value={projectSelectValue}
          onChange={(e) => {
            const nextValue = e.target.value;
            const nextIsCustom = nextValue === customProjectValue;
            setIsCustomProject(nextIsCustom);
            setForm((prev) => ({
              ...prev,
              projectName: nextIsCustom ? '' : nextValue,
            }));
          }}
        >
          {projectOptions.map((projectName) => (
            <option key={projectName} value={projectName}>
              {projectName}
            </option>
          ))}
          <option value={customProjectValue}>Custom</option>
        </select>
        {isCustomProject ? (
          <input
            className={`${inputClass} mt-2`}
            value={form.projectName}
            placeholder="Enter custom project name"
            onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))}
          />
        ) : null}
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Choose an existing project or switch to Custom for your own label.</p>
      </Field>

      <Field label="Description">
        <input className={inputClass} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
      </Field>

      <Field label="Status">
        <input className={inputClass} value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} />
      </Field>

      <Field label="Remarks">
        <textarea className={inputClass} rows={3} value={form.remarks} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} />
      </Field>

      <GanttColorField form={form} setForm={setForm} />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Position">
          <input className={inputClass} value={form.position} onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))} />
        </Field>
        <Field label="Urgency (1-5)">
          <input type="number" min="1" max="5" className={inputClass} value={form.urgency} onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value }))} />
        </Field>
        <Field label="Importance (1-5)">
          <input type="number" min="1" max="5" className={inputClass} value={form.importance} onChange={(e) => setForm((prev) => ({ ...prev, importance: e.target.value }))} />
        </Field>
        <Field label="Priority marks (auto)">
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 font-semibold text-orange-600 dark:border-neutral-700 dark:bg-neutral-800">
            {Number(form.urgency || 0) * Number(form.importance || 0)}
          </div>
        </Field>
        <Field label="Start date">
          <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
        </Field>
        <Field label="Completion date">
          <input type="date" className={inputClass} value={form.completionDate} onChange={(e) => setForm((prev) => ({ ...prev, completionDate: e.target.value }))} />
        </Field>
      </div>
    </>
  );
}
