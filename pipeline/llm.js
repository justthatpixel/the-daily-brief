const axios = require('axios');
const config = require('./config');

/**
 * Clean output — strip any think tags that bleed through
 */
function cleanOutput(raw) {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .trim();
}

/**
 * Call Minimax API with OpenAI-compatible format
 * Using reasoning_split: true to isolate thinking in reasoning_details field
 */
async function callMinimax(systemPrompt, userPrompt, options = {}) {
  const { apiKey, baseUrl, model } = config.minimax;
  
  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY not configured in .env');
  }

  try {
    const response = await axios.post(`${baseUrl}/v1/chat/completions`, {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.max_tokens || 1500,
      // Use reasoning_split to isolate thinking in reasoning_details field
      reasoning_split: true,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 120000,
    });

    // Clean content — no think tags ever
    let content = response.data.choices[0].message.content;
    content = cleanOutput(content);
    
    return content;
  } catch (error) {
    if (error.response) {
      throw new Error(`Minimax API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Minimax API error: ${error.message}`);
  }
}

/**
 * Aggregate and rank news stories using Minimax LLM
 */
async function aggregateStories(headlines) {
  const systemPrompt = `You are a senior financial editor. Given a list of raw headlines and summaries from various news sources, you must:
1. Remove duplicate stories (stories about the same event)
2. Rank by importance/significance (most important first)
3. Identify the single most important story as #1
4. Return ONLY valid JSON - no explanation, no markdown, just a JSON array

Return format:
[
  { "rank": 1, "headline": "...", "summary": "...", "category": "Markets" },
  { "rank": 2, "headline": "...", "summary": "...", "category": "Tech" }
]

Return up to 8 unique stories. Categories can be: Markets, Tech, Energy, Forex, Earnings, Economy.`;

  const userPrompt = `Here are today's financial headlines:\n\n${headlines.map((h, i) => `${i + 1}. [${h.source}] ${h.title}\n   ${h.description || ''}`).join('\n\n')}`;

  const response = await callMinimax(systemPrompt, userPrompt, { temperature: 0.7, max_tokens: 2048 });
  
  // Parse JSON response
  try {
    const jsonMatch = response.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (parseError) {
    const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse LLM response as JSON: ${response.substring(0, 200)}`);
    }
  }
}

/**
 * Write the newspaper column using Minimax LLM
 * Output in standard Markdown format that our CMS/editor understands
 */
async function writeColumn(rankedStories) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const systemPrompt = `You are a senior financial analyst writing a daily market intelligence brief for retail investors who use Trading 212. Your readers want clear analysis, specific stock ideas, and actionable intelligence.

WRITING STYLE:
- Sharp, analytical, and direct — Bloomberg Terminal meets plain English
- Lead with what matters, cut the filler
- Specific and actionable — real tickers, real numbers where available
- Professional but accessible

FORMAT (follow exactly, no deviations):

# [Write a compelling headline that captures today's single biggest market story — NOT "Daily Brief". Make it specific, e.g. "Oil Surges as Strait of Hormuz Tensions Escalate" or "Fed Signals Pause as Inflation Cools"]

## What's Happening
Write 2-3 sentences as a sharp executive summary of the most significant combined market development today and why it matters for investors.

## Market Breakdown
Write 3-5 short analytical sections. Each section:
- First line: a short descriptive section title (no # or ** formatting)
- Then 2-3 sentences of sharp, factual analysis

Focus on the dominant themes from today's stories (e.g. central banks, Big Tech, energy, geopolitics, earnings).

## Opportunities
Write exactly 4-5 bullet points. Each bullet must name a specific publicly-traded company and its ticker symbol, and explain in one sentence why today's news makes it worth examining. Only name stocks genuinely relevant to today's stories.

Format each bullet as:
• TICKER (Company Name): One sentence on the opportunity, tied directly to today's news.

Example: • XOM (ExxonMobil): Benefits directly from the oil supply disruption as Brent crude climbs above $90.

## Risks
Write exactly 3-4 bullet points. Each names a stock or sector being directly pressured by today's developments, with one sentence on the specific risk.

Format each bullet as:
• TICKER (Company Name): One sentence on the specific risk and what could make it worse.

## The Bigger Picture
Write 2-3 sentences on the macro trend that connects today's stories — what the next 2-4 weeks could look like for retail investors holding a diversified portfolio.

RULES:
- Use Markdown headings (#, ##) ONLY — no bold (**), no italics (*), no asterisks, no HTML, no em-dashes (—)
- Every ticker named must be real and listed on a major exchange (NYSE, NASDAQ, LSE, or Euronext)
- ONLY base content on the provided stories — never hallucinate data, prices, or events
- The H1 headline must be specific to today's top story
- Output ONLY the final article, nothing else`;

  const userPrompt = `Today is ${today}. Here are today's top stories:\n\n${JSON.stringify(rankedStories, null, 2)}\n\nWrite today's The Daily Brief.`;

  const response = await callMinimax(systemPrompt, userPrompt, {
    temperature: 0.4,
    max_tokens: 2200
  });
  
  return response;
}

module.exports = {
  cleanOutput,
  callMinimax,
  aggregateStories,
  writeColumn,
};