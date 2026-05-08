#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { fetchAllNews } = require('./fetcher');
const { aggregateStories, writeColumn } = require('./llm');
const { toTerminal, toMarkdownFile, getBlocks } = require('./formatter');
const { fetchHeroImage } = require('./images');

/**
 * Generate UUID v4
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Save column to CMS as JSON article
 */
async function saveToCMS(markdown, rankedStories) {
  const articlesDir = path.join(__dirname, '../content/articles');

  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
  }

  const id = generateId();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Extract title from first H1 — use top story headline as fallback
  const titleMatch = markdown.match(/^#\s+(.+)/m);
  const topStoryHeadline = rankedStories?.[0]?.headline || '';
  const title = (titleMatch ? titleMatch[1].trim() : topStoryHeadline) || `Market Brief — ${dateStr}`;

  // Derive category from most common category in ranked stories
  const categoryCounts = {};
  (rankedStories || []).forEach(s => {
    const c = s.category || 'Markets';
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });
  const category = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Markets';

  // Fetch hero image
  const topKeywords = rankedStories?.slice(0, 2).map(s => s.headline).join(' ').slice(0, 80) || '';
  console.log(chalk.gray('    Fetching hero image...'));
  const heroImage = await fetchHeroImage(category, topKeywords);
  console.log(chalk.green(`    ✓ Hero image: ${heroImage.source}`));

  // Build blocks — inject image as first block
  const contentBlocks = getBlocks(markdown);
  const imageBlock = {
    type: 'image',
    url: heroImage.url,
    alt: heroImage.alt,
    caption: heroImage.caption,
  };
  const blocks = [imageBlock, ...contentBlocks];

  // Slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);

  const article = {
    id,
    title,
    slug,
    status: 'published',
    category,
    heroImage: heroImage.url,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: now.toISOString(),
    blocks,
  };

  const jsonPath = path.join(articlesDir, `${id}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(article, null, 2));

  console.log(chalk.green(`    ✓ Article saved: "${title}"`));
  return jsonPath;
}

/**
 * Main orchestrator for the Financial Column pipeline
 */
async function main() {
  console.log(chalk.bold.cyan('\n📰 THE DAILY BRIEF — PIPELINE\n'));
  console.log(chalk.gray('  Generating your financial brief...\n'));

  try {
    // Step 1: Fetch news from all configured sources
    console.log(chalk.bold.cyan('  [1/4] Fetching news...'));
    const headlines = await fetchAllNews();
    
    if (headlines.length === 0) {
      console.log(chalk.red('\n❌ No headlines collected. Please configure at least one news API.'));
      console.log(chalk.gray('  Edit .env file with your API keys.'));
      process.exit(1);
    }

    // Step 2: Aggregate and rank stories using LLM
    console.log(chalk.bold.cyan('\n  [2/4] Aggregating stories (Minimax)...'));
    console.log(chalk.gray('    Deduplicating and ranking...\n'));
    
    const rankedStories = await aggregateStories(headlines);
    
    if (!rankedStories || rankedStories.length === 0) {
      throw new Error('No stories returned from aggregation');
    }
    
    console.log(chalk.green(`    ✓ Ranked ${rankedStories.length} unique stories`));

    // Step 3: Write the newspaper column using LLM
    console.log(chalk.bold.cyan('\n  [3/4] Writing column (Minimax)...'));
    console.log(chalk.gray('    Crafting the narrative...\n'));
    
    const columnMarkdown = await writeColumn(rankedStories);
    
    if (!columnMarkdown || columnMarkdown.length < 100) {
      throw new Error('Column generation returned invalid content');
    }
    
    console.log(chalk.green('    ✓ Column written'));

    // Step 4: Format and output
    console.log(chalk.bold.cyan('\n  [4/4] Formatting output...\n'));
    
    // Determine output format from command line args
    const saveOnly = process.argv.includes('--silent');
    const date = new Date().toISOString().split('T')[0];
    
    // Save markdown file
    const mdPath = toMarkdownFile(columnMarkdown, date);
    console.log(chalk.green(`\n✅ Saved to: ${mdPath}`));
    
    // Display in terminal unless --silent
    if (!saveOnly) {
      toTerminal(columnMarkdown);
    }

    // Save to CMS
    await saveToCMS(columnMarkdown, rankedStories);

    console.log(chalk.green('\n✅ Done!\n'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

// Run if executed directly
main();

module.exports = { main };