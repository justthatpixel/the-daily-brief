import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

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

function formatBulletText(text) {
  const content = text.startsWith('• ') ? text.slice(2) : text;
  const colonIdx = content.indexOf(':');
  if (colonIdx > 0 && colonIdx < 50) {
    return (
      <>
        <strong className="font-bold text-headline dark:text-dark-headline">
          {content.substring(0, colonIdx)}:
        </strong>
        {content.substring(colonIdx + 1)}
      </>
    );
  }
  return content;
}

function estimateReadTime(blocks) {
  if (!blocks) return '1 min read';
  const words = blocks.reduce((acc, b) => acc + (b.content?.split(' ').length || 0), 0);
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/articles/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Article not found');
        return r.json();
      })
      .then(setArticle)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pt-8 space-y-4 animate-pulse">
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-40 mt-4" />
        <div className="space-y-3 mt-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 border border-border dark:border-dark-border">
        <p className="serif text-2xl font-bold text-headline dark:text-dark-headline mb-2">{error}</p>
        <Link to="/reader" className="text-sm text-accent dark:text-dark-accent hover:underline">
          ← Back to feed
        </Link>
      </div>
    );
  }

  if (!article) return null;

  const cat = getCat(article.category);
  const publishDate = new Date(article.publishedAt || article.updatedAt).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Find hero image block (first image block in the article)
  const heroBlock = article.blocks?.find(b => b.type === 'image' && b.url);
  const contentBlocks = article.blocks?.filter(b => !(b.type === 'image' && b.url === heroBlock?.url));

  return (
    <div className="max-w-2xl mx-auto">

      {/* Back */}
      <div className="mb-6">
        <Link
          to="/reader"
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted dark:text-dark-muted hover:text-accent dark:hover:text-dark-accent transition-colors"
        >
          ← All Stories
        </Link>
      </div>

      {/* Category */}
      <div className={`category-badge ${cat.color} mb-3`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cat.bar}`} />
        {article.category}
      </div>

      {/* Title */}
      <h1 className="serif text-3xl md:text-4xl font-bold text-headline dark:text-dark-headline leading-tight mb-5">
        {article.title}
      </h1>

      {/* Meta bar */}
      <div className="flex items-center justify-between py-3 border-t border-b-2 border-t-border border-b-headline dark:border-t-dark-border dark:border-b-dark-headline mb-8">
        <div className="flex items-center gap-3 text-xs text-muted dark:text-dark-muted">
          <span className="font-semibold text-headline dark:text-dark-headline">By Your AI Correspondent</span>
          <span>·</span>
          <span>{publishDate}</span>
          <span>·</span>
          <span>{estimateReadTime(article.blocks)}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-muted dark:text-dark-muted hover:text-accent dark:hover:text-dark-accent transition-colors font-medium"
        >
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>

      {/* Hero image */}
      {heroBlock && (
        <figure className="mb-8 -mx-0">
          <img
            src={heroBlock.url}
            alt={heroBlock.alt || ''}
            className="w-full object-cover"
            style={{ maxHeight: '420px' }}
          />
          {heroBlock.caption && (
            <figcaption className="text-xs text-muted dark:text-dark-muted mt-2 font-sans">
              {heroBlock.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article body */}
      <div className="article-body">
        {(contentBlocks || article.blocks)?.map((block, i) => {
          switch (block.type) {
            case 'h1':
              return (
                <h1 key={i} className="serif text-3xl font-bold text-headline dark:text-dark-headline mt-8 mb-4 leading-tight">
                  {block.content}
                </h1>
              );
            case 'h2':
              return (
                <h2 key={i}>
                  {block.content}
                </h2>
              );
            case 'h3':
              return (
                <h3 key={i}>
                  {block.content}
                </h3>
              );
            case 'text':
              if (block.content?.startsWith('• ') || block.content?.match(/^[•\d]/)) {
                return (
                  <p key={i} className="pl-4 border-l-2 border-border dark:border-dark-border my-3">
                    {formatBulletText(block.content)}
                  </p>
                );
              }
              return <p key={i}>{block.content}</p>;
            case 'quote':
              return (
                <blockquote key={i}>
                  {block.content}
                </blockquote>
              );
            case 'image':
              return block.url ? (
                <figure key={i} className="my-8">
                  <img src={block.url} alt={block.alt || ''} className="w-full" />
                  {block.caption && (
                    <figcaption className="text-xs text-muted dark:text-dark-muted mt-2 text-center font-sans">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              ) : null;
            case 'hr':
              return <hr key={i} />;
            default:
              return null;
          }
        })}
      </div>

      {/* Footer nav */}
      <div className="mt-12 pt-6 border-t-2 border-headline dark:border-dark-headline flex items-center justify-between">
        <Link
          to="/reader"
          className="text-xs font-semibold tracking-wider uppercase text-muted dark:text-dark-muted hover:text-accent dark:hover:text-dark-accent transition-colors"
        >
          ← Back to feed
        </Link>
        <span className="serif text-sm font-bold text-headline dark:text-dark-headline opacity-40">
          The Daily Brief
        </span>
      </div>
    </div>
  );
}
