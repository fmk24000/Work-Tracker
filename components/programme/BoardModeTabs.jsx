import Link from 'next/link';

const TABS = [
  { href: '/', label: 'All items', key: 'all' },
  { href: '/projects', label: 'Project views', key: 'projects' },
];

export default function BoardModeTabs({ view = 'all' }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.key === view;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
