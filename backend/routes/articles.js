const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const articlesDir = path.join(__dirname, '../../content/articles');
const publishedDir = path.join(__dirname, '../../content/published');

// Ensure directories exist
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

// GET /api/articles - List all articles
router.get('/', async (req, res) => {
  try {
    await ensureDir(articlesDir);
    const files = await fs.readdir(articlesDir);
    const articles = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(articlesDir, file), 'utf8');
          const article = JSON.parse(content);
          // Don't include full blocks in list view (performance)
          const { blocks, ...summary } = article;
          // Compute excerpt from first substantial text block
          const excerptBlock = (blocks || []).find(b => b.type === 'text' && b.content && b.content.length > 60);
          const excerptRaw = excerptBlock ? excerptBlock.content.replace(/^[•\d]\s*/, '') : '';
          const excerpt = excerptRaw.length > 180 ? excerptRaw.slice(0, 180) + '…' : excerptRaw;
          articles.push({
            ...summary,
            excerpt,
            blockCount: blocks ? blocks.length : 0
          });
        } catch (e) {
          console.error(`Error reading article ${file}:`, e.message);
        }
      }
    }
    
    // Sort by date, newest first
    articles.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    res.json(articles);
  } catch (error) {
    console.error('Error listing articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/articles/:id - Get single article
router.get('/:id', async (req, res) => {
  try {
    const filePath = path.join(articlesDir, `${req.params.id}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    const article = JSON.parse(content);
    res.json(article);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Article not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /api/articles - Create new article
router.post('/', async (req, res) => {
  try {
    await ensureDir(articlesDir);
    
    const id = uuidv4();
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    const article = {
      id,
      title: req.body.title || 'Untitled Article',
      slug: req.body.slug || `article-${today}-${id.slice(0, 8)}`,
      status: req.body.status || 'draft',
      category: req.body.category || 'Markets',
      createdAt: now,
      updatedAt: now,
      blocks: req.body.blocks || [
        { type: 'h1', content: req.body.title || 'Untitled Article' },
        { type: 'text', content: '' }
      ],
      publishedAt: null
    };
    
    await fs.writeFile(path.join(articlesDir, `${id}.json`), JSON.stringify(article, null, 2));
    
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/articles/:id - Update article
router.put('/:id', async (req, res) => {
  try {
    const filePath = path.join(articlesDir, `${req.params.id}.json`);
    
    // Check if exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Read existing
    const content = await fs.readFile(filePath, 'utf8');
    const existing = JSON.parse(content);
    
    // Merge updates
    const blocks = req.body.blocks !== undefined ? req.body.blocks : existing.blocks;
    // Derive heroImage from first image block whenever blocks are updated
    const firstImageBlock = blocks?.find(b => b.type === 'image' && b.url);
    const updated = {
      ...existing,
      title: req.body.title !== undefined ? req.body.title : existing.title,
      slug: req.body.slug !== undefined ? req.body.slug : existing.slug,
      status: req.body.status !== undefined ? req.body.status : existing.status,
      category: req.body.category !== undefined ? req.body.category : existing.category,
      blocks,
      heroImage: firstImageBlock ? firstImageBlock.url : existing.heroImage,
      updatedAt: new Date().toISOString()
    };

    if (req.body.status === 'published' && !existing.publishedAt) {
      updated.publishedAt = new Date().toISOString();
    }
    
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/articles/:id
router.delete('/:id', async (req, res) => {
  try {
    const filePath = path.join(articlesDir, `${req.params.id}.json`);
    
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Article not found' });
      }
      throw err;
    }
    
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/articles/:id/publish - Publish article (export to .md)
router.post('/:id/publish', async (req, res) => {
  try {
    const filePath = path.join(articlesDir, `${req.params.id}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    const article = JSON.parse(content);
    
    await ensureDir(publishedDir);
    
    // Convert blocks to markdown
    let md = '';
    const date = new Date(article.publishedAt || article.updatedAt);
    const dateStr = date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Masthead
    md += `# THE DAILY FINANCIAL COLUMN | ${dateStr}\n\n`;
    
    for (const block of article.blocks) {
      switch (block.type) {
        case 'h1':
          md += `# ${block.content}\n\n`;
          break;
        case 'h2':
          md += `## ${block.content}\n\n`;
          break;
        case 'h3':
          md += `### ${block.content}\n\n`;
          break;
        case 'text':
          md += `${block.content}\n\n`;
          break;
        case 'quote':
          md += `> ${block.content}\n\n`;
          break;
        case 'image':
          if (block.url) {
            md += `![${block.alt || ''}](${block.url})\n\n`;
          }
          break;
        case 'hr':
          md += `---\n\n`;
          break;
      }
    }
    
    // Save to published folder
    const filename = `${article.slug}.md`;
    const mdPath = path.join(publishedDir, filename);
    await fs.writeFile(mdPath, md);
    
    // Update article status
    article.status = 'published';
    article.publishedAt = new Date().toISOString();
    article.updatedAt = new Date().toISOString();
    article.publishedPath = mdPath;
    await fs.writeFile(filePath, JSON.stringify(article, null, 2));
    
    res.json({ success: true, path: mdPath, filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;