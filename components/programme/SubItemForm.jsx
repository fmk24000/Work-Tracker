import GanttColorField from './GanttColorField';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

export default function SubItemForm({ form, setForm, mainItems }) {
  const inputClass = 'w-full rounded-xl border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100';

  return (
    <>
      <Field label="Parent main item">
        <select className={inputClass} value={form.parentId} onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}>
          <option value="">Select parent</option>
          {mainItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} - {item.description}
            </option>
          ))}
        </select>
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

      <Field label="Target date">
        <input type="date" className={inputClass} value={form.targetDate} onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))} />
      </Field>
    </>
  );
}
