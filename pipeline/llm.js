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
  const systemPrompt = `You are a financial news writer. Write a concise daily market brief.

STYLE:
- Clear, sharp, and analytical (Finimize-style)
- Short sentences, plain English
- No fluff, no opinions, no hype

FORMAT (FOLLOW EXACTLY):

# Daily Brief

## What are the top stories today?
Write 1 short paragraph (2-3 sentences) summarising the biggest combined market story and why it matters.

## What does this mean?
Write up to 5 short sections. Each section:
- Start with a short headline (no markdown formatting)
- Follow with 2-3 sentences explanation

Focus on key themes (e.g. Big Tech, central banks, currencies, geopolitics).

## Why should I care?

For markets:
Write 2-3 sentences explaining market impact.

The bigger picture:
Write 2-3 sentences explaining macro/global implications.

## What are some emerging opportunities?
Write 3-5 bullet points.
Each bullet = one clear opportunity based on trends.
Keep each to one sentence.

## What are some emerging risks?
Write 3-5 bullet points.
Each bullet = one clear risk based on trends.
Keep each to one sentence.

RULES:
- Use Markdown headings only (#, ##)
- DO NOT use bold, italics, or asterisks for emphasis
- DO NOT use HTML
- Keep everything concise
- Base content ONLY on provided stories
- Combine overlapping stories into clear themes
- Do NOT hallucinate data or events
- Output ONLY the final article`;

  const userPrompt = `Here are today's top stories:\n\n${JSON.stringify(rankedStories, null, 2)}\n\nWrite today's briefing.`;

  const response = await callMinimax(systemPrompt, userPrompt, {
    temperature: 0.3,
    max_tokens: 1500
  });
  
  return response;
}

module.exports = {
  cleanOutput,
  callMinimax,
  aggregateStories,
  writeColumn,
};