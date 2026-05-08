import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Blockquote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';

const categories = ['Markets', 'Tech', 'Energy', 'Forex', 'Earnings', 'Economy'];

export default function CMSEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Markets');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchArticle = async (articleId) => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();
      setArticle(data);
      setTitle(data.title);
      setSlug(data.slug);
      setCategory(data.category || 'Markets');
      setStatus(data.status || 'draft');
      
      if (editor && data.blocks) {
        // Convert blocks to HTML for TipTap
        const html = blocksToHtml(data.blocks);
        editor.commands.setContent(html);
      }
    } catch (e) {
      alert('Failed to load article: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({
        placeholder: 'Start writing your article...',
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full rounded-lg' },
      }),
      HorizontalRule,
      Blockquote,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  const blocksToHtml = (blocks) => {
    if (!blocks || !blocks.length) return '';
    return blocks.map(block => {
      switch (block.type) {
        case 'h1': return `<h1>${block.content}</h1>`;
        case 'h2': return `<h2>${block.content}</h2>`;
        case 'h3': return `<h3>${block.content}</h3>`;
        case 'text': return `<p>${block.content}</p>`;
        case 'quote': return `<blockquote><p>${block.content}</p></blockquote>`;
        case 'image': return block.url ? `<img src="${block.url}" alt="${block.alt || ''}" />` : '';
        case 'hr': return '<hr>';
        default: return '';
      }
    }).join('');
  };

  const htmlToBlocks = (html) => {
    if (!html) return [];
    const blocks = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    doc.body.childNodes.forEach(node => {
      if (node.nodeName === 'H1') {
        blocks.push({ type: 'h1', content: node.textContent });
      } else if (node.nodeName === 'H2') {
        blocks.push({ type: 'h2', content: node.textContent });
      } else if (node.nodeName === 'H3') {
        blocks.push({ type: 'h3', content: node.textContent });
      } else if (node.nodeName === 'P') {
        blocks.push({ type: 'text', content: node.textContent });
      } else if (node.nodeName === 'BLOCKQUOTE') {
        blocks.push({ type: 'quote', content: node.textContent });
      } else if (node.nodeName === 'IMG') {
        blocks.push({ type: 'image', url: node.src, alt: node.alt || '' });
      } else if (node.nodeName === 'HR') {
        blocks.push({ type: 'hr' });
      }
    });
    
    return blocks;
  };

  const saveArticle = async (publish = false) => {
    if (!editor) return;
    
    setSaving(true);
    
    try {
      const blocks = htmlToBlocks(editor.getHTML());
      
      const articleData = {
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        category,
        status: publish ? 'published' : status,
        blocks,
      };
      
      let res;
      if (id) {
        res = await fetch(`/api/articles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        });
      } else {
        res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        });
      }
      
      const result = await res.json();
      
      if (publish && !id) {
        await fetch(`/api/articles/${result.id}/publish`, { method: 'POST' });
      }
      
      if (!id) {
        navigate(`/admin/editor/${result.id}`, { replace: true });
      }
      
      setStatus(result.status);
    } catch (e) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (e) {
      alert('Failed to upload image: ' + e.message);
    }
  };

  const insertHeading = (level) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const insertBlockquote = () => {
    editor.chain().focus().toggleBlockquote().run();
  };

  const insertHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  if (loading) {
    return <div className="text-center py-12 text-body dark:text-dark-body">Loading editor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-headline dark:text-dark-headline">
            {id ? 'Edit Article' : 'New Article'}
          </h2>
          <p className="text-body dark:text-dark-body mt-1">
            {saving ? 'Saving...' : 'Write and edit your article'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => saveArticle(false)}
            disabled={saving}
            className="btn-secondary"
          >
            Save
          </button>
          <button
            onClick={() => saveArticle(true)}
            disabled={saving}
            className="btn-primary"
          >
            {status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Meta Fields */}
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-body dark:text-dark-body mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Article title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-body dark:text-dark-body mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="input"
              placeholder="article-slug"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-body dark:text-dark-body mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-auto"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-body dark:text-dark-body mb-1">
              Status
            </label>
            <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
              status === 'published'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {status?.toUpperCase() || 'DRAFT'}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => insertHeading(1)}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => insertHeading(2)}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => insertHeading(3)}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 font-bold ${editor?.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 italic ${editor?.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Italic"
        >
          I
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        <button
          onClick={insertBlockquote}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${editor?.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Quote"
        >
          "
        </button>
        <button
          onClick={insertHorizontalRule}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Divider"
        >
          —
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        <label className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
          <span className="text-sm">🖼️ Image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
        </label>
      </div>

      {/* Editor */}
      <div className="card">
        <EditorContent editor={editor} className="prose dark:prose-invert max-w-none p-6" />
      </div>
    </div>
  );
}