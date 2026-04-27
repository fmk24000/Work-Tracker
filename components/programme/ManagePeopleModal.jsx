import { Pencil, Trash2, UserRoundPlus, X } from 'lucide-react';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

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

export default function ManagePeopleModal({
  people,
  selectedPersonId,
  draftPerson,
  setDraftPerson,
  onAddPerson,
  onRenamePerson,
  onDeletePerson,
  onSelectPerson,
  onClose,
}) {
  return (
    <Modal title="Manage people" onClose={onClose}>
      <div className="space-y-5">
        <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/60">
          <Field label="Add person">
            <div className="flex gap-2">
              <input
                value={draftPerson}
                onChange={(e) => setDraftPerson(e.target.value)}
                placeholder="例如 Alfred"
                className="h-10 flex-1 rounded-xl border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <button
                onClick={onAddPerson}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
              >
                <UserRoundPlus className="h-4 w-4" />
                Add
              </button>
            </div>
          </Field>
        </div>

        <div className="space-y-3">
          {people.map((person) => {
            const isSelected = person.id === selectedPersonId;
            return (
              <div
                key={person.id}
                className={`rounded-2xl border p-4 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{person.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{isSelected ? 'Current person' : 'Available person'}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isSelected ? (
                      <button
                        onClick={() => onSelectPerson(person.id)}
                        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        Switch here
                      </button>
                    ) : null}
                    <button
                      onClick={() => onRenamePerson(person)}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={() => onDeletePerson(person)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
