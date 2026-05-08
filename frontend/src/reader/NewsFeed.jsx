import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const categoryColors = {
  'Markets': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  'Tech': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
  'Energy': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  'Forex': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
  'Earnings': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', dot: 'bg-pink-500' },
  'Economy': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' },
};

export default function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      // Filter to published articles only for the reader
      const published = data.filter(a => a.status === 'published');
      setArticles(published);
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getCategoryStyle = (category) => {
    return categoryColors[category] || categoryColors['Economy'];
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-4xl mb-4">📰</div>
        <p className="text-gray-500 dark:text-gray-400">Loading articles...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📰</div>
        <h2 className="text-2xl font-bold text-headline dark:text-dark-headline mb-2">
          No articles yet
        </h2>
        <p className="text-body dark:text-dark-body">
          Run the pipeline in the Admin Studio to generate today's column.
        </p>
        <a
          href="/admin"
          className="inline-block mt-4 px-6 py-3 bg-accent text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Admin Studio
        </a>
      </div>
    );
  }

  // Split into featured (first) and grid (rest)
  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="space-y-8">
      {/* Featured Article */}
      {featuredArticle && (
        <Link
          to={`/reader/article/${featuredArticle.id}`}
          className="block card p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2 h-2 rounded-full ${getCategoryStyle(featuredArticle.category).dot}`} />
            <span className={`text-sm font-semibold ${getCategoryStyle(featuredArticle.category).text}`}>
              {featuredArticle.category?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-headline dark:text-dark-headline mb-3 leading-tight">
            {featuredArticle.title}
          </h2>
          <p className="text-body dark:text-dark-body mb-4 leading-relaxed">
            {featuredArticle.blocks?.[1]?.content?.slice(0, 200) || 'Read the full story...'}
            {(featuredArticle.blocks?.[1]?.content?.length || 0) > 200 ? '...' : ''}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>3 min read · {formatDate(featuredArticle.publishedAt || featuredArticle.updatedAt)}</span>
            <span className="text-accent dark:text-dark-accent">Read more →</span>
          </div>
        </Link>
      )}

      {/* In Brief Section */}
      {gridArticles.length > 0 && (
        <>
          <div className="border-t border-border dark:border-gray-700 pt-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 tracking-wider">
              IN BRIEF
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gridArticles.map((article) => (
              <Link
                key={article.id}
                to={`/reader/article/${article.id}`}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${getCategoryStyle(article.category).dot}`} />
                  <span className={`text-xs font-semibold ${getCategoryStyle(article.category).text}`}>
                    {article.category?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-headline dark:text-dark-headline mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  1 min · {formatDate(article.publishedAt || article.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}