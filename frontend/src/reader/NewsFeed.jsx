import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const categoryMeta = {
  Markets:  { color: 'text-blue-600 dark:text-blue-400',   bar: 'bg-blue-500'   },
  Tech:     { color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  Energy:   { color: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500'  },
  Forex:    { color: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
  Earnings: { color: 'text-pink-600 dark:text-pink-400',   bar: 'bg-pink-500'   },
  Economy:  { color: 'text-slate-600 dark:text-slate-400', bar: 'bg-slate-400'  },
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
  return text.length > 220 ? text.slice(0, 220) + '…' : text;
}

/* ── Skeleton loader ── */
function SkeletonCard({ tall }) {
  return (
    <div className={`animate-pulse ${tall ? 'space-y-4' : 'space-y-3'}`}>
      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className={`h-5 bg-gray-200 dark:bg-gray-700 rounded ${tall ? 'w-3/4' : 'w-full'}`} />
      {tall && <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />}
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Featured skeleton */}
        <div className="md:col-span-2 p-6 border border-border dark:border-dark-border">
          <SkeletonCard tall />
        </div>
        {/* Side skeletons */}
        <div className="flex flex-col divide-y divide-border dark:divide-dark-border border border-border dark:border-dark-border border-l-0">
          {[1,2,3].map(i => (
            <div key={i} className="p-4"><SkeletonCard /></div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20 border border-border dark:border-dark-border">
        <p className="serif text-2xl font-bold text-headline dark:text-dark-headline mb-2">No articles yet</p>
        <p className="text-muted dark:text-dark-muted text-sm mb-6">
          Run the pipeline in Admin Studio to generate today's briefing.
        </p>
        <a
          href="/admin"
          className="inline-block px-6 py-2.5 bg-masthead text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
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
    <div className="space-y-0">

      {/* ── Top grid: featured + sidebar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-border dark:border-dark-border">

        {/* Featured */}
        <Link
          to={`/reader/article/${featured.id}`}
          className="md:col-span-2 flex flex-col border-b md:border-b-0 md:border-r border-border dark:border-dark-border group hover:bg-gray-50 dark:hover:bg-dark-card/60 transition-colors"
        >
          {featured.heroImage && (
            <div className="overflow-hidden">
              <img
                src={featured.heroImage}
                alt={featured.title}
                className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                style={{ height: '220px' }}
              />
            </div>
          )}
          <div className="p-6 md:p-8 flex flex-col flex-1 justify-between">
          <div>
            <div className={`category-badge ${getCat(featured.category).color} mb-3`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getCat(featured.category).bar}`} />
              {featured.category}
            </div>
            <h2 className="serif text-2xl md:text-hero font-bold text-headline dark:text-dark-headline leading-tight mb-4 group-hover:text-accent dark:group-hover:text-dark-accent transition-colors">
              {featured.title}
            </h2>
            <p className="body-serif text-base text-body dark:text-dark-body leading-relaxed line-clamp-3">
              {getExcerpt(featured.blocks)}
            </p>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border dark:border-dark-border text-xs text-muted dark:text-dark-muted">
            <span>By Your AI Correspondent · {formatDate(featured.publishedAt || featured.updatedAt)}</span>
            <span className="font-semibold text-accent dark:text-dark-accent">Read →</span>
          </div>
          </div>
        </Link>

        {/* Sidebar articles */}
        <div className="flex flex-col divide-y divide-border dark:divide-dark-border">
          {sidebar.map((article) => (
            <Link
              key={article.id}
              to={`/reader/article/${article.id}`}
              className="p-4 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-dark-card/60 transition-colors group"
            >
              <div className={`category-badge ${getCat(article.category).color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getCat(article.category).bar}`} />
                {article.category}
              </div>
              <h3 className="serif text-base font-semibold text-headline dark:text-dark-headline leading-snug group-hover:text-accent dark:group-hover:text-dark-accent transition-colors line-clamp-3">
                {article.title}
              </h3>
              <span className="text-xs text-muted dark:text-dark-muted mt-auto">
                {formatDate(article.publishedAt || article.updatedAt)}
              </span>
            </Link>
          ))}
          {sidebar.length === 0 && (
            <div className="p-4 text-xs text-muted dark:text-dark-muted italic">More stories coming soon</div>
          )}
        </div>
      </div>

      {/* ── Section divider ── */}
      {secondary.length > 0 && (
        <>
          <div className="flex items-center gap-3 pt-8 pb-3">
            <div className="h-0.5 w-6 bg-headline dark:bg-dark-headline" />
            <span className="text-xs font-bold tracking-widest uppercase text-headline dark:text-dark-headline">
              More Stories
            </span>
            <div className="flex-1 h-px bg-border dark:bg-dark-border" />
          </div>

          {/* ── Secondary grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border dark:border-dark-border">
            {secondary.map((article) => (
              <Link
                key={article.id}
                to={`/reader/article/${article.id}`}
                className="border-b border-r border-border dark:border-dark-border p-5 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-dark-card/60 transition-colors group"
              >
                <div className={`category-badge ${getCat(article.category).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getCat(article.category).bar}`} />
                  {article.category}
                </div>
                <h3 className="serif text-base font-semibold text-headline dark:text-dark-headline leading-snug group-hover:text-accent dark:group-hover:text-dark-accent transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-muted dark:text-dark-muted line-clamp-2 leading-relaxed">
                  {getExcerpt(article.blocks)}
                </p>
                <span className="text-xs text-muted dark:text-dark-muted mt-auto pt-1">
                  {formatDate(article.publishedAt || article.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
