import { Outlet } from 'react-router-dom';

export default function ReaderLayout({ darkMode, setDarkMode }) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg text-body dark:text-dark-body">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card dark:bg-dark-card border-b border-border dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-headline dark:text-dark-headline serif-title tracking-tight">
                The Daily Mubin
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {today}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/admin"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-dark-accent transition-colors"
              >
                Admin
              </a>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-dark-accent transition-colors"
              >
                {darkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border dark:border-gray-700 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>The Daily Mubin &middot; AI-powered financial news</p>
          <p className="mt-2">
            <a href="/admin" className="text-accent hover:text-blue-700 dark:text-dark-accent">
              Open Admin Studio
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}