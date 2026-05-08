import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const navItems = [
  { path: '/admin',          label: 'Pipeline',  icon: '▶',  exact: true },
  { path: '/admin/articles', label: 'Articles',  icon: '≡'              },
  { path: '/admin/editor',   label: 'Editor',    icon: '✎'              },
  { path: '/admin/chat',     label: 'Chat',      icon: '⌘'              },
];

export default function AdminLayout() {
  const [pipelineStatus, setPipelineStatus] = useState({ status: 'idle' });

  useEffect(() => {
    fetch('/api/pipeline/status')
      .then(r => r.json())
      .then(setPipelineStatus)
      .catch(console.error);
  }, []);

  const statusColor = {
    idle:    'bg-gray-400',
    running: 'bg-amber-500 animate-pulse',
    done:    'bg-green-500',
    error:   'bg-red-500',
  }[pipelineStatus.status] || 'bg-gray-400';

  return (
    <div className="flex h-screen bg-background dark:bg-dark-bg font-sans">

      {/* Sidebar */}
      <aside className="w-56 bg-masthead text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <p className="serif text-base font-bold leading-tight">The Daily Brief</p>
          <p className="text-xs text-white/50 mt-0.5 tracking-wider uppercase">Admin Studio</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pipeline status */}
        <div className="px-5 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="capitalize">Pipeline: {pipelineStatus.status}</span>
          </div>
        </div>

        {/* Open reader link */}
        <div className="px-3 pb-4">
          <a
            href="/reader"
            target="_blank"
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded transition-colors"
          >
            <span>↗</span>
            <span>Open Reader</span>
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-background dark:bg-dark-bg">
        <div className="p-6 max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
