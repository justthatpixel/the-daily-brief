const axios = require('axios');
const config = require('./config');

// Curated Unsplash photo IDs per category — stable URLs, no key required to display
const FALLBACK_IMAGES = {
  Markets: [
    { id: '1611974789855-9c2a0a7236a3', alt: 'Stock market trading screen' },
    { id: '1590283603385-17ffb3a7f29f', alt: 'Financial market chart' },
    { id: '1579621970590-9d152b17bcb3', alt: 'Stock market data' },
    { id: '1526304640581-d334cdbbf45e', alt: 'Trading floor' },
  ],
  Tech: [
    { id: '1518770660439-4636190af475', alt: 'Technology circuit board' },
    { id: '1550745165-9bc0b252726f', alt: 'Tech data center' },
    { id: '1639762681485-074b7f938ba0', alt: 'Technology innovation' },
    { id: '1531297484001-80022131f5a1', alt: 'Laptop and code' },
  ],
  Energy: [
    { id: '1509391366360-2e959784a276', alt: 'Oil refinery at sunset' },
    { id: '1473341304170-971dccb5ac1e', alt: 'Power grid at night' },
    { id: '1466611653911-0265b213558d', alt: 'Wind turbines' },
    { id: '1545128485-c35305d114e9', alt: 'Energy infrastructure' },
  ],
  Forex: [
    { id: '1559526324-593bc073d938', alt: 'Currency exchange rates' },
    { id: '1526304640581-d334cdbbf45e', alt: 'Foreign exchange trading' },
    { id: '1622790698141-94e30457ef12', alt: 'Dollar bills' },
    { id: '1611974789855-9c2a0a7236a3', alt: 'Forex market data' },
  ],
  Earnings: [
    { id: '1554224155-6726b3ff858f', alt: 'Business earnings report' },
    { id: '1507679799987-c73779587ccf', alt: 'Corporate earnings' },
    { id: '1444653614773-995cb1ef9efa', alt: 'Financial report chart' },
    { id: '1460925895917-afdab827c52f', alt: 'Quarterly results' },
  ],
  Economy: [
    { id: '1454165804606-c3d57bc86b40', alt: 'Global economy business' },
    { id: '1486406529344-f9b1c5bb6ba9', alt: 'City financial district' },
    { id: '1444653614773-995cb1ef9efa', alt: 'Economic data' },
    { id: '1611974789855-9c2a0a7236a3', alt: 'Economic overview' },
  ],
};

const DEFAULT_IMAGES = [
  { id: '1611974789855-9c2a0a7236a3', alt: 'Financial markets' },
  { id: '1590283603385-17ffb3a7f29f', alt: 'Market data' },
  { id: '1486406529344-f9b1c5bb6ba9', alt: 'Business district' },
];

function getUnsplashUrl(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?w=1200&q=80&auto=format&fit=crop`;
}

function getFallbackImage(category) {
  const pool = FALLBACK_IMAGES[category] || DEFAULT_IMAGES;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return {
    url: getUnsplashUrl(pick.id),
    alt: pick.alt,
    caption: '',
    source: 'unsplash',
  };
}

/**
 * Fetch a relevant hero image from Pexels.
 * Falls back to curated Unsplash URLs if no Pexels key is set.
 */
async function fetchHeroImage(category, keywords = '') {
  const { key } = config.pexels;

  if (key && key !== 'your_pexels_key_here') {
    const query = keywords
      ? keywords.slice(0, 60)
      : `${category} finance market`;

    try {
      const res = await axios.get('https://api.pexels.com/v1/search', {
        params: { query, per_page: 5, orientation: 'landscape' },
        headers: { Authorization: key },
        timeout: 8000,
      });

      const photos = res.data?.photos || [];
      if (photos.length > 0) {
        const photo = photos[Math.floor(Math.random() * photos.length)];
        return {
          url: photo.src.large2x || photo.src.large,
          alt: photo.alt || query,
          caption: `Photo by ${photo.photographer} on Pexels`,
          source: 'pexels',
        };
      }
    } catch (err) {
      console.log(`  ⚠ Pexels fetch failed (${err.message}), using fallback image`);
    }
  }

  return getFallbackImage(category);
}

module.exports = { fetchHeroImage };
