import { Download, Link2, Moon, Settings, Sun, Upload, UserCog } from 'lucide-react';
import StatCard from './StatCard';

export default function HeaderCard({
  people,
  selectedPersonId,
  setSelectedPersonId,
  openNewMain,
  openNewSub,
  title,
  description,
  mainButtonLabel = 'Main item',
  subButtonLabel = 'Sub item',
  exportCsv,
  exportToGoogleSheets,
  exportJsonBackup,
  importJson,
  openSettings,
  openManagePeople,
  stats,
  theme,
  toggleTheme,
  syncStatus,
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${syncStatus === 'saved' ? 'bg-emerald-500' : syncStatus === 'saving' ? 'bg-amber-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-neutral-400'}`} />
              <span>
                {syncStatus === 'loading' && 'Loading server data'}
                {syncStatus === 'saving' && 'Saving to Docker volume'}
                {syncStatus === 'saved' && 'Saved in Docker volume'}
                {syncStatus === 'error' && 'Save failed'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-neutral-100">{title}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatCard label="Main items" value={stats.mains} />
            <StatCard label="Milestones" value={stats.milestones} />
            <StatCard label="High priority" value={stats.highPriority} />
            <StatCard label="Completed tagged" value={stats.completed} />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Current person</label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={openNewMain} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
            {mainButtonLabel}
          </button>
          <button onClick={openNewSub} className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700">
            {subButtonLabel}
          </button>
          <button
            onClick={openManagePeople}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 px-3 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <UserCog className="h-4 w-4" />
            Manage people
          </button>
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 px-3 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button onClick={exportCsv} className="h-10 rounded-xl border border-neutral-300 px-3 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={exportToGoogleSheets} className="h-10 rounded-xl border border-neutral-300 px-3 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
            <Link2 className="h-4 w-4" />
          </button>
          <button onClick={exportJsonBackup} className="h-10 rounded-xl border border-neutral-300 px-3 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
            <Upload className="h-4 w-4 rotate-180" />
          </button>
          <label className="flex h-10 cursor-pointer items-center rounded-xl border border-neutral-300 px-3 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
            <input type="file" accept="application/json" className="hidden" onChange={importJson} />
            <Upload className="h-4 w-4" />
          </label>
          <button onClick={openSettings} className="h-10 rounded-xl border border-neutral-300 px-3 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
