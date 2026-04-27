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

export default function ItemModal({ form, setForm, editing, mainItems, onClose, onSave }) {
  const title = editing ? 'Edit item' : 'Add item';

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-4">
        {!editing ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setForm(emptyMainForm())}
              className={`rounded-2xl border px-4 py-3 text-left ${form.type === 'main' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-neutral-200 dark:border-neutral-700'}`}
            >
              <div className="font-medium">Main item</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">有 urgency / importance / start / completion</div>
            </button>
            <button
              onClick={() => setForm(emptySubForm())}
              className={`rounded-2xl border px-4 py-3 text-left ${form.type === 'sub' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-neutral-200 dark:border-neutral-700'}`}
            >
              <div className="font-medium">Sub item</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Milestone，只收 target date</div>
            </button>
          </div>
        ) : null}

        {form.type === 'main' ? (
          <MainItemForm form={form} setForm={setForm} />
        ) : (
          <SubItemForm form={form} setForm={setForm} mainItems={mainItems} />
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
