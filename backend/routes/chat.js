const express = require('express');
const router = express.Router();
const axios = require('axios');

// POST /api/chat - Proxy to Minimax with SSE streaming
router.post('/', async (req, res) => {
  const { messages, articleContext, model } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }
  
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MINIMAX_API_KEY not configured' });
  }
  
  // Build system prompt
  let systemPrompt = `You are a helpful financial journalism assistant. You help with writing, editing, and discussing financial news articles. Be concise, professional, and use Financial Times style.`;
  
  // Add article context if provided
  if (articleContext) {
    systemPrompt += `\n\nThe user is working with this article:\n\n${articleContext}\n\nProvide specific suggestions based on this content.`;
  }
  
  // Prepare messages for Minimax
  const minimaxMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  try {
    // Use OpenAI-compatible endpoint
    const response = await axios.post(
      `${process.env.MINIMAX_BASE_URL || 'https://api.minimax.io'}/v1/chat/completions`,
      {
        model: model || process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
        messages: minimaxMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        responseType: 'stream',
        timeout: 120000
      }
    );
    
    let fullContent = '';
    
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.choices && parsed.choices[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              fullContent += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    });
    
    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
    
    response.data.on('error', (err) => {
      console.error('Stream error:', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    console.error('Minimax API error:', error.message);
    
    if (error.response) {
      res.write(`data: ${JSON.stringify({ error: `API error: ${error.response.status}` })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
    res.end();
  }
});

// POST /api/chat/non-stream - Non-streaming version for testing
router.post('/non-stream', async (req, res) => {
  const { messages, articleContext } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }
  
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MINIMAX_API_KEY not configured' });
  }
  
  let systemPrompt = `You are a helpful financial journalism assistant.`;
  
  if (articleContext) {
    systemPrompt += `\n\nArticle context:\n\n${articleContext}`;
  }
  
  try {
    const response = await axios.post(
      `${process.env.MINIMAX_BASE_URL || 'https://api.minimax.io'}/v1/chat/completions`,
      {
        model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000
      }
    );
    
    const content = response.data.choices[0]?.message?.content || '';
    res.json({ content, usage: response.data.usage });
    
  } catch (error) {
    console.error('Minimax API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;