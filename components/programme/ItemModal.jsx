import { X } from 'lucide-react';
import { emptyMainForm, emptySubForm } from '@/lib/tracker/constants';
import MainItemForm from './MainItemForm';
import SubItemForm from './SubItemForm';

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function toMainForm(form) {
  const fallback = emptyMainForm();
  if (form.type === 'main') return form;

  return {
    ...fallback,
    description: form.description || '',
    status: form.status || '',
    remarks: form.remarks || '',
    startDate: form.targetDate || fallback.startDate,
    completionDate: form.targetDate || fallback.completionDate
  };
}

function toSubForm(form) {
  const fallback = emptySubForm();
  if (form.type === 'sub') return form;

  return {
    ...fallback,
    description: form.description || '',
    status: form.status || '',
    remarks: form.remarks || '',
    targetDate: form.completionDate || form.startDate || fallback.targetDate
  };
}

export default function ItemModal({ form, setForm, editing, mainItems, excludeParentCode = '', onClose, onSave }) {
  function changeType(type) {
    setForm((prev) => (type === 'main' ? toMainForm(prev) : toSubForm(prev)));
  }

  return (
    <Modal title={editing ? 'Edit item' : 'Add item'} onClose={onClose}>
      <div className="space-y-4">
        {editing ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            轉換類型會保留 description、status 同 remarks；main 轉 sub 時，原本下面嘅 sub item 會移去新 parent。
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => changeType('main')}
            className={`rounded-2xl border px-4 py-3 text-left ${form.type === 'main' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-neutral-200 dark:border-neutral-700'}`}
          >
            <div className="font-medium">Main item</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">有 urgency / importance / start / completion</div>
          </button>
          <button
            onClick={() => changeType('sub')}
            className={`rounded-2xl border px-4 py-3 text-left ${form.type === 'sub' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-neutral-200 dark:border-neutral-700'}`}
          >
            <div className="font-medium">Sub item</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Milestone，只收 target date</div>
          </button>
        </div>

        {form.type === 'main' ? (
          <MainItemForm form={form} setForm={setForm} />
        ) : (
          <SubItemForm form={form} setForm={setForm} mainItems={mainItems} excludeParentCode={excludeParentCode} />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-xl border border-neutral-300 px-4 py-2 dark:border-neutral-700">
            Cancel
          </button>
          <button onClick={onSave} className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
