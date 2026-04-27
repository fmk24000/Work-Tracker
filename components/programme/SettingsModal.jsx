import { X } from 'lucide-react';

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

export default function SettingsModal({ webhook, onChange, onClose }) {
  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Google Apps Script Webhook URL">
          <input
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={webhook}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
        <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          建議用 Apps Script 做 Google Sheets 匯出。前端直駁 Google API，權限同 token 會開始跳探戈。
        </div>
      </div>
    </Modal>
  );
}
