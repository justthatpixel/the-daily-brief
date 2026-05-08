import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const categoryMeta = {
  Markets:  { color: 'text-blue-600 dark:text-blue-400',     bar: 'bg-blue-500'    },
  Tech:     { color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  Energy:   { color: 'text-amber-600 dark:text-amber-400',   bar: 'bg-amber-500'   },
  Forex:    { color: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500'  },
  Earnings: { color: 'text-blue-600 dark:text-blue-400',     bar: 'bg-blue-500'    },
  Economy:  { color: 'text-slate-600 dark:text-slate-400',   bar: 'bg-slate-400'   },
};

function getCat(cat) {
  return categoryMeta[cat] || categoryMeta.Economy;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getExcerpt(blocks) {
  if (!blocks) return '';
  const para = blocks.find(b => b.type === 'text' && b.content?.length > 60);
  if (!para) return '';
  const text = para.content.replace(/^[•\d]\s*/, '');
  return text.length > 180 ? text.slice(0, 180) + '…' : text;
}

function CategoryBadge({ category }) {
  const { color, bar } = getCat(category);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${bar}`} />
      {category}
    </span>
  );
}

function DateLabel({ date }) {
  return (
    <span className="text-[13px]" style={{ color: '#999' }}>
      {formatDate(date)}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-border dark:border-dark-border">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-5 space-y-3">
        <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

export default function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => setArticles(data.filter(a => a.status === 'published')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border dark:border-dark-border">
          <div className="md:col-span-2 p-8 border-r border-border dark:border-dark-border">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
          <div className="flex flex-col divide-y divide-border dark:divide-dark-border">
            {[1,2,3].map(i => <div key={i} className="p-4"><SkeletonCard /></div>)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-24 rounded-xl border border-border dark:border-dark-border bg-white dark:bg-dark-card">
        <p className="serif text-2xl font-bold text-headline dark:text-dark-headline mb-2">No articles yet</p>
        <p className="text-muted dark:text-dark-muted text-sm mb-6">
          Run the pipeline in Admin Studio to generate today's briefing.
        </p>
        <a
          href="/admin"
          className="inline-block px-6 py-2.5 bg-masthead text-white text-sm font-semibold hover:bg-gray-800 transition-colors rounded"
        >
          Open Admin Studio
        </a>
      </div>
    );
  }

  const [featured, ...rest] = articles;
  const sidebar = rest.slice(0, 3);
  const secondary = rest.slice(3);

  return (
    <div className="space-y-12">

      {/* ── Top section: featured + sidebar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-border dark:border-dark-border rounded-lg overflow-hidden shadow-sm">

        {/* Featured */}
        <Link
          to={`/reader/article/${featured.id}`}
          className="md:col-span-2 flex flex-col border-b md:border-b-0 md:border-r border-border dark:border-dark-border group bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card/80 transition-colors"
        >
          {featured.heroImage && (
            <div className="overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img
                src={featured.heroImage}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          )}
          <div className="p-7 flex flex-col flex-1 justify-between">
            <div>
              <CategoryBadge category={featured.category} />
              <h2 className="serif text-2xl md:text-3xl font-bold text-headline dark:text-dark-headline leading-tight mt-3 mb-4 group-hover:text-accent dark:group-hover:text-dark-accent transition-colors">
                {featured.title}
              </h2>
              <p className="body-serif text-[15px] text-body dark:text-dark-body leading-relaxed line-clamp-3">
                {getExcerpt(featured.blocks)}
              </p>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border dark:border-dark-border">
              <DateLabel date={featured.publishedAt || featured.updatedAt} />
              <span className="text-sm font-semibold text-accent dark:text-dark-accent">Read →</span>
            </div>
          </div>
        </Link>

        {/* Sidebar */}
        <div className="flex flex-col divide-y divide-border dark:divide-dark-border bg-white dark:bg-dark-card">
          {sidebar.map((article) => (
            <Link
              key={article.id}
              to={`/reader/article/${article.id}`}
              className="flex gap-4 p-5 hover:bg-gray-50 dark:hover:bg-dark-card/80 transition-colors group"
            >
              {article.heroImage && (
                <div className="shrink-0 rounded-md overflow-hidden" style={{ width: '110px', height: '80px' }}>
                  <img
                    src={article.heroImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0 py-0.5">
                <CategoryBadge category={article.category} />
                <h3 className="serif text-[15px] font-semibold text-headline dark:text-dark-headline leading-snug group-hover:text-accent dark:group-hover:text-dark-accent transition-colors line-clamp-3">
                  {article.title}
                </h3>
                <DateLabel date={article.publishedAt || article.updatedAt} />
              </div>
            </Link>
          ))}
          {sidebar.length === 0 && (
            <div className="p-5 text-sm text-muted dark:text-dark-muted italic">More stories coming soon</div>
          )}
        </div>
      </div>

      {/* ── More Stories ── */}
      {secondary.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-7">
            <div className="h-0.5 w-6 bg-headline dark:bg-dark-headline" />
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-headline dark:text-dark-headline">
              More Stories
            </span>
            <div className="flex-1 h-px bg-border dark:bg-dark-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {secondary.map((article) => (
              <Link
                key={article.id}
                to={`/reader/article/${article.id}`}
                className="flex flex-col rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                {article.heroImage && (
                  <div className="overflow-hidden" style={{ height: '210px' }}>
                    <img
                      src={article.heroImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <CategoryBadge category={article.category} />
                  <h3 className="serif text-[18px] font-bold text-headline dark:text-dark-headline leading-snug group-hover:text-accent dark:group-hover:text-dark-accent transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-[14px] text-muted dark:text-dark-muted line-clamp-2 leading-relaxed">
                    {getExcerpt(article.blocks)}
                  </p>
                  <DateLabel date={article.publishedAt || article.updatedAt} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
