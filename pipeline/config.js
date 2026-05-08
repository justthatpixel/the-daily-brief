require('dotenv').config({ path: '../.env' });

module.exports = {
  // Minimax LLM settings
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY,
    baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimax.io',
    model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
  },

  // News API sources
  newsapi: {
    key: process.env.NEWSAPI_KEY,
    baseUrl: 'https://newsapi.org/v2',
  },

  finnhub: {
    key: process.env.FINNHUB_KEY,
    baseUrl: 'https://finnhub.io/api/v1',
  },

  alphaVantage: {
    key: process.env.ALPHA_VANTAGE_KEY,
    baseUrl: 'https://www.alphavantage.co/query',
  },

  // Pexels — free image API (https://www.pexels.com/api/)
  pexels: {
    key: process.env.PEXELS_API_KEY || '',
  },
};