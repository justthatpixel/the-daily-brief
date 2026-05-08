import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin', label: 'Pipeline', icon: '▶', exact: true },
  { path: '/admin/articles', label: 'Articles', icon: '📄' },
  { path: '/admin/editor', label: 'Editor', icon: '✏️' },
  { path: '/admin/chat', label: 'Chat', icon: '💬' },
];

export default function AdminLayout() {
  const location = useLocation();
  const [pipelineStatus, setPipelineStatus] = useState({ step: 'idle', status: 'idle' });

  useEffect(() => {
    // Fetch pipeline status on mount
    fetch('/api/pipeline/status')
      .then(res => res.json())
      .then(data => setPipelineStatus(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-background dark:bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-card dark:bg-dark-card border-r border-border dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-border dark:border-gray-700">
          <h1 className="text-lg font-bold text-headline dark:text-dark-headline flex items-center gap-2">
            <span className="text-2xl">📰</span>
            Daily Column Studio
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-body dark:text-dark-body hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border dark:border-gray-700">
          <a
            href="/reader"
            target="_blank"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-body dark:text-dark-body rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span>📖</span>
            <span>Open Reader App</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}