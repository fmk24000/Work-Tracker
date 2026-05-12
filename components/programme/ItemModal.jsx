import { X } from 'lucide-react';
import {
  DEFAULT_ITEM_BOARD,
  ROUTINE_ITEM_BOARD,
  emptyMainForm,
  emptySubForm,
  getDefaultGanttColor,
  normalizeItemBoard,
} from '@/lib/tracker/constants';
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

export default function ItemModal({ form, setForm, editing, mainItems, projectOptions, onClose, onSave }) {
  const title = editing ? 'Edit item' : 'Add item';
  const typeCards = [
    {
      type: 'main',
      title: 'Main item',
      description: 'Track urgency / importance / start / completion',
      activeClass: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
    },
    {
      type: 'sub',
      title: 'Sub item',
      description: 'Milestone under a main item with target date',
      activeClass: 'border-violet-500 bg-violet-50 dark:bg-violet-950/30',
    },
  ];

  function switchType(nextType) {
    if (nextType === form.type) return;

    if (nextType === 'main') {
      setForm((prev) => ({
        ...emptyMainForm(),
        projectName: prev.projectName || '',
        board: normalizeItemBoard(prev.board),
        ganttColor: getDefaultGanttColor('main'),
        description: prev.description || '',
        status: prev.status || '',
        remarks: prev.remarks || '',
      }));
      return;
    }

    setForm((prev) => ({
      ...emptySubForm(),
      board: normalizeItemBoard(prev.board),
      ganttColor: getDefaultGanttColor('sub'),
      description: prev.description || '',
      status: prev.status || '',
      remarks: prev.remarks || '',
    }));
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          {typeCards.map((card) => (
            <button
              key={card.type}
              onClick={() => switchType(card.type)}
              className={`rounded-2xl border px-4 py-3 text-left ${
                form.type === card.type ? card.activeClass : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="font-medium">{card.title}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">{card.description}</div>
            </button>
          ))}
        </div>

        {editing ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            You can convert this item between main and sub. If this main item still has sub items, move or remove them before converting it to a sub item.
          </p>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950">
          <input
            type="checkbox"
            checked={normalizeItemBoard(form.board) === ROUTINE_ITEM_BOARD}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                board: event.target.checked ? ROUTINE_ITEM_BOARD : DEFAULT_ITEM_BOARD,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
          />
          <span>
            <span className="block font-medium text-neutral-800 dark:text-neutral-100">Routine item</span>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400">
              Tick this when the item should appear on the Routine Jobs board.
            </span>
          </span>
        </label>

        {form.type === 'main' ? (
          <MainItemForm form={form} setForm={setForm} projectOptions={projectOptions} />
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
