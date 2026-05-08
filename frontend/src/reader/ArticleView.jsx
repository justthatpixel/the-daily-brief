import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const categoryColors = {
  'Markets': { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  'Tech': { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  'Energy': { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  'Forex': { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  'Earnings': { dot: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400' },
  'Economy': { dot: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400' },
};

/**
 * Format bullet text with CAPS topic styled bold
 * Input: "• BERKSHIRE HATHAWAY: Warren Buffett revealed..."
 * Output: JSX with topic in bold
 */
function formatBulletText(text) {
  // Remove bullet character for processing
  const content = text.startsWith('• ') ? text.slice(2) : text;
  
  // Split at first colon after CAPS topic
  const colonIndex = content.indexOf(':');
  if (colonIndex > 0 && colonIndex < 50) {
    const topic = content.substring(0, colonIndex);
    const body = content.substring(colonIndex + 1);
    return (
      <>
        <strong className="font-bold text-headline dark:text-dark-headline">{topic}:</strong>
        {body}
      </>
    );
  }
  return content;
}

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) {
        throw new Error('Article not found');
      }
      const data = await res.json();
      setArticle(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryStyle = (category) => {
    return categoryColors[category] || categoryColors['Economy'];
  };

  const estimateReadTime = (blocks) => {
    if (!blocks) return '1 min read';
    const wordCount = blocks.reduce((acc, block) => {
      return acc + (block.content?.split(' ').length || 0);
    }, 0);
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-4xl mb-4">📖</div>
        <p className="text-gray-500 dark:text-gray-400">Loading article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-headline dark:text-dark-headline mb-2">
          {error}
        </h2>
        <Link
          to="/reader"
          className="inline-block mt-4 text-accent hover:text-blue-700 dark:text-dark-accent"
        >
          ← Back to feed
        </Link>
      </div>
    );
  }

  if (!article) return null;

  const categoryStyle = getCategoryStyle(article.category);

  return (
    <article className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        to="/reader"
        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-accent dark:hover:text-dark-accent mb-8 transition-colors"
      >
        ← Back to feed
      </Link>

      {/* Category */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-3 h-3 rounded-full ${categoryStyle.dot}`} />
        <span className={`text-sm font-bold ${categoryStyle.text}`}>
          {article.category?.toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-headline dark:text-dark-headline mb-4 leading-tight">
        {article.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-border dark:border-gray-700">
        <span>By Your AI Correspondent</span>
        <span>·</span>
        <span>{formatDate(article.publishedAt || article.updatedAt)}</span>
        <span>·</span>
        <span>{estimateReadTime(article.blocks)}</span>
      </div>

      {/* Content Blocks */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {article.blocks?.map((block, index) => {
          switch (block.type) {
            case 'h1':
              return (
                <h1 key={index} className="text-3xl font-bold text-headline dark:text-dark-headline mt-8 mb-4">
                  {block.content}
                </h1>
              );
            case 'h2':
              return (
                <h2 key={index} className="text-2xl font-semibold text-headline dark:text-dark-headline mt-8 mb-4">
                  {block.content}
                </h2>
              );
            case 'h3':
              return (
                <h3 key={index} className="text-xl font-semibold text-headline dark:text-dark-headline mt-6 mb-3">
                  {block.content}
                </h3>
              );
            case 'text':
              // Check if this is a bullet point
              if (block.content.startsWith('• ') || block.content.match(/^[•\d]/)) {
                return (
                  <p key={index} className="text-body dark:text-dark-body leading-relaxed mb-4">
                    • {formatBulletText(block.content)}
                  </p>
                );
              }
              return (
                <p key={index} className="text-body dark:text-dark-body leading-relaxed mb-4">
                  {block.content}
                </p>
              );
            case 'quote':
              return (
                <blockquote key={index} className="border-l-4 border-accent dark:border-dark-accent pl-6 my-6 italic text-body dark:text-dark-body">
                  {block.content}
                </blockquote>
              );
            case 'image':
              return block.url ? (
                <figure key={index} className="my-6">
                  <img
                    src={block.url}
                    alt={block.alt || ''}
                    className="w-full rounded-lg"
                  />
                  {block.caption && (
                    <figcaption className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              ) : null;
            case 'hr':
              return <hr key={index} className="my-8 border-border dark:border-gray-700" />;
            default:
              return null;
          }
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-border dark:border-gray-700">
        <Link
          to="/reader"
          className="inline-flex items-center gap-2 text-accent hover:text-blue-700 dark:text-dark-accent transition-colors"
        >
          ← Back to feed
        </Link>
      </div>
    </article>
  );
}