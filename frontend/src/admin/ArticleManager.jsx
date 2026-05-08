import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ArticleManager() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data);
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    } finally {
      setLoading(false);
    }
  };

  const createArticle = async () => {
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Article',
          category: 'Markets',
        }),
      });
      const article = await res.json();
      navigate(`/admin/editor/${article.id}`);
    } catch (e) {
      alert('Failed to create article: ' + e.message);
    }
  };

  const deleteArticle = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert('Failed to delete article: ' + e.message);
    }
  };

  const publishArticle = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/articles/${id}/publish`, { method: 'POST' });
      fetchArticles(); // Refresh
    } catch (e) {
      alert('Failed to publish: ' + e.message);
    }
  };

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const classes = status === 'published'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes}`}>
        {status?.toUpperCase() || 'DRAFT'}
      </span>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Markets': 'text-blue-600 dark:text-blue-400',
      'Tech': 'text-green-600 dark:text-green-400',
      'Energy': 'text-amber-600 dark:text-amber-400',
      'Forex': 'text-purple-600 dark:text-purple-400',
      'Earnings': 'text-pink-600 dark:text-pink-400',
      'Economy': 'text-gray-600 dark:text-gray-400',
    };
    return colors[category] || 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return <div className="text-center py-12 text-body dark:text-dark-body">Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-headline dark:text-dark-headline">Articles</h2>
          <p className="text-body dark:text-dark-body mt-1">Manage your financial news articles</p>
        </div>
        <button
          onClick={createArticle}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span>New Article</span>
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full"
        />
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="card p-8 text-center text-body dark:text-dark-body">
            <p>No articles yet. Click "New Article" to create one.</p>
          </div>
        ) : (
          filteredArticles.map(article => (
            <div
              key={article.id}
              onClick={() => navigate(`/admin/editor/${article.id}`)}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-semibold ${getCategoryColor(article.category)}`}>
                      {article.category?.toUpperCase()}
                    </span>
                    {getStatusBadge(article.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-headline dark:text-dark-headline">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(article.updatedAt || article.createdAt)}
                    {article.blockCount && ` · ${article.blockCount} blocks`}
                  </p>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/admin/editor/${article.id}`)}
                    className="btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  {article.status !== 'published' && (
                    <button
                      onClick={(e) => publishArticle(article.id, e)}
                      className="btn-primary text-sm"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteArticle(article.id, e)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}