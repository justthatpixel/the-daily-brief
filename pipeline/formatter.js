const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Convert markdown string to CMS blocks
 * - Skips H1 (title is stored separately)
 * - Splits bullet points at ':' to style topic separately
 * - Uses • for bullet points
 */
function markdownToBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let i = 0;
  let currentParagraph = [];
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push({ type: 'text', content: text });
      }
      currentParagraph = [];
    }
  };
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Empty line - flush current paragraph
    if (trimmed === '') {
      flushParagraph();
      i++;
      continue;
    }
    
    // H1 heading - SKIP (title stored separately)
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      i++;
      continue;
    }
    
    // H2 heading
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'h2', content: trimmed.slice(3) });
      i++;
      continue;
    }
    
    // H3 heading
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      blocks.push({ type: 'h3', content: trimmed.slice(4) });
      i++;
      continue;
    }
    
    // Bullet list item - use • instead of -
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      flushParagraph();
      const content = trimmed.slice(2);
      blocks.push({ type: 'text', content: `• ${content}` });
      i++;
      continue;
    }
    
    // Numbered list item - convert to bullet with number
    if (trimmed.match(/^\d+\.\s/)) {
      flushParagraph();
      const num = trimmed.match(/^(\d+)\.\s/)[1];
      const content = trimmed.replace(/^\d+\.\s/, '');
      blocks.push({ type: 'text', content: `${num}. ${content}` });
      i++;
      continue;
    }
    
    // Italic line (date attribution) - remove asterisks, keep text
    if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
      flushParagraph();
      const cleanText = trimmed.slice(1, -1); // Remove surrounding *
      blocks.push({ type: 'text', content: cleanText });
      i++;
      continue;
    }
    
    // Date attribution line - skip entirely (e.g. "Date · By Your AI Correspondent")
    if (trimmed.match(/^Date\s*·\s*By\s*/i) || trimmed.match(/^\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4}/)) {
      flushParagraph();
      i++;
      continue;
    }
    
    // Regular paragraph text
    currentParagraph.push(trimmed);
    i++;
  }
  
  // Flush any remaining paragraph
  flushParagraph();
  
  return blocks;
}

/**
 * Format a bullet point with topic styled bold
 * Input: "• BERKSHIRE HATHAWAY: Warren Buffett revealed..."
 * Output: "  BERKSHIRE HATHAWAY: Warren Buffett revealed..." (with topic bolded in terminal)
 */
function formatBulletWithBold(text) {
  // Split at first colon after CAPS topic
  const colonIndex = text.indexOf(':');
  if (colonIndex > 0 && colonIndex < 50) {
    const topic = text.substring(0, colonIndex);
    const body = text.substring(colonIndex + 1);
    return chalk.bold.white(topic + ':') + chalk.white(body);
  }
  return chalk.white(text);
}

/**
 * Display formatted column in terminal
 */
function toTerminal(markdown) {
  const blocks = markdownToBlocks(markdown);
  const w = 60;
  const bar = '━'.repeat(w);
  
  console.log('\n' + chalk.dim(bar));
  console.log(chalk.bold.white('  THE DAILY FINANCIAL COLUMN'));
  console.log(chalk.dim(bar));
  
  for (const block of blocks) {
    switch (block.type) {
      case 'h2':
        console.log('\n' + chalk.dim('  ' + block.content.toUpperCase()));
        break;
      case 'h3':
        console.log('\n' + chalk.white('  ' + block.content));
        break;
      case 'text':
        if (block.content.startsWith('• ') || block.content.match(/^\d+\./)) {
          console.log('  ' + formatBulletWithBold(block.content));
        } else {
          console.log(chalk.white('  ' + block.content));
        }
        break;
    }
  }
  
  console.log('\n' + chalk.dim(bar) + '\n');
}

/**
 * Save markdown to file
 */
function toMarkdownFile(markdown, date) {
  const dir = path.join(__dirname, '../content/published');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, `${date}.md`);
  fs.writeFileSync(filePath, markdown);
  return filePath;
}

/**
 * Get blocks from markdown (for CMS)
 */
function getBlocks(markdown) {
  return markdownToBlocks(markdown);
}

module.exports = { toTerminal, toMarkdownFile, getBlocks, markdownToBlocks };