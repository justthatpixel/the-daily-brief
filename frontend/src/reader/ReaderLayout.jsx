import { Outlet, NavLink } from 'react-router-dom';

const categories = ['Markets', 'Tech', 'Energy', 'Forex', 'Earnings', 'Economy'];

export default function ReaderLayout({ darkMode, setDarkMode }) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg text-body dark:text-dark-body">

      {/* Top utility bar */}
      <div className="bg-masthead dark:bg-dark-masthead text-white text-xs">
        <div className="max-w-[1200px] mx-auto px-6 py-1.5 flex items-center justify-between">
          <span className="opacity-60">{today}</span>
          <div className="flex items-center gap-4 opacity-80">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="hover:opacity-100 transition-opacity"
            >
              {darkMode ? '☀ Light' : '☾ Dark'}
            </button>
            <span className="opacity-30">|</span>
            <a href="/admin" className="hover:opacity-100 transition-opacity">
              Admin Studio
            </a>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <header className="bg-card dark:bg-dark-card">
        <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-4">
          <div className="border-b-2 border-t-2 border-headline dark:border-dark-headline py-4 text-center">
            <h1 className="serif text-4xl md:text-5xl font-bold tracking-tight text-headline dark:text-dark-headline leading-none">
              The Daily Brief
            </h1>
            <p className="text-xs text-muted dark:text-dark-muted mt-2 tracking-widest uppercase font-medium">
              Intelligent Financial News
            </p>
          </div>

          {/* Category nav */}
          <nav className="flex items-center justify-center gap-1 mt-3 flex-wrap">
            <NavLink
              to="/reader"
              end
              className={({ isActive }) =>
                `text-xs font-semibold tracking-wider uppercase px-3 py-1 transition-colors ${
                  isActive
                    ? 'text-accent dark:text-dark-accent border-b-2 border-accent dark:border-dark-accent'
                    : 'text-muted dark:text-dark-muted hover:text-headline dark:hover:text-dark-headline'
                }`
              }
            >
              All
            </NavLink>
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-xs font-semibold tracking-wider uppercase px-3 py-1 text-muted dark:text-dark-muted hover:text-headline dark:hover:text-dark-headline cursor-pointer transition-colors"
              >
                {cat}
              </span>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-headline dark:border-dark-headline mt-16">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="serif text-xl font-bold text-headline dark:text-dark-headline">The Daily Brief</p>
              <p className="text-xs text-muted dark:text-dark-muted mt-1">Intelligent financial news aggregation</p>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted dark:text-dark-muted">
              <a href="/admin" className="hover:text-accent dark:hover:text-dark-accent transition-colors">
                Admin Studio
              </a>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
