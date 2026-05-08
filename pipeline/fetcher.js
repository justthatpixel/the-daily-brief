const axios = require('axios');
const config = require('./config');

/**
 * Fetch financial news from NewsAPI
 */
async function fetchNewsAPI() {
  const { key, baseUrl } = config.newsapi;
  
  if (!key || key === 'your_newsapi_key_here') {
    console.log('⚠️  NewsAPI key not configured, skipping...');
    return [];
  }

  try {
    const response = await axios.get(`${baseUrl}/top-headlines`, {
      params: {
        category: 'business',
        language: 'en',
        pageSize: 20,
        apiKey: key,
      },
      timeout: 10000,
    });

    return (response.data.articles || []).map(article => ({
      source: 'NewsAPI',
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.log(`⚠️  NewsAPI error: ${error.message}`);
    return [];
  }
}

/**
 * Fetch market news from Finnhub
 */
async function fetchFinnhub() {
  const { key, baseUrl } = config.finnhub;
  
  if (!key || key === 'your_finnhub_key_here') {
    console.log('⚠️  Finnhub key not configured, skipping...');
    return [];
  }

  try {
    // Get general market news
    const response = await axios.get(`${baseUrl}/news`, {
      params: {
        category: 'general',
        token: key,
      },
      timeout: 10000,
    });

    return (response.data || []).slice(0, 20).map(article => ({
      source: 'Finnhub',
      title: article.headline,
      description: article.summary,
      url: article.url,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
    }));
  } catch (error) {
    console.log(`⚠️  Finnhub error: ${error.message}`);
    return [];
  }
}

/**
 * Fetch market data from Alpha Vantage (market mover summary)
 */
async function fetchAlphaVantage() {
  const { key, baseUrl } = config.alphaVantage;
  
  if (!key || key === 'your_alpha_vantage_key_here') {
    console.log('⚠️  Alpha Vantage key not configured, skipping...');
    return [];
  }

  try {
    // Get top gainers
    const response = await axios.get(baseUrl, {
      params: {
        function: 'TOP_GAINERS',
        apikey: key,
      },
      timeout: 10000,
    });

    const topGainers = response.data?.top_gainers?.slice(0, 5) || [];
    
    return topGainers.map(stock => ({
      source: 'AlphaVantage',
      title: `${stock.ticker} surges ${stock.change_percent}%`,
      description: `${stock.ticker} trading at $${stock.price} with ${stock.change_percent}% gain`,
      url: '',
      publishedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.log(`⚠️  Alpha Vantage error: ${error.message}`);
    return [];
  }
}

/**
 * Fetch all news from configured sources
 * @returns {Promise<Array>} - Combined list of headlines
 */
async function fetchAllNews() {
  console.log('\n📰 Fetching news from sources...\n');
  
  const results = await Promise.allSettled([
    fetchNewsAPI(),
    fetchFinnhub(),
    fetchAlphaVantage(),
  ]);

  const headlines = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      headlines.push(...result.value);
      const sourceNames = ['NewsAPI', 'Finnhub', 'Alpha Vantage'];
      console.log(`  ✓ ${sourceNames[index]}: ${result.value.length} articles`);
    } else {
      console.log(`  ✗ ${result.reason?.message || 'Failed'}`);
    }
  });

  console.log(`\n📊 Total headlines collected: ${headlines.length}`);
  return headlines;
}

module.exports = {
  fetchAllNews,
  fetchNewsAPI,
  fetchFinnhub,
  fetchAlphaVantage,
};