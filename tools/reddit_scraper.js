const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Fixed URL structure (some subreddits require slightly different top pathing or just .json)
const REDDIT_URL = 'https://www.reddit.com/r/ArtificialInteligence/.json?sort=top&t=day&limit=25';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function scrapeReddit() {
    console.log('Scraping Reddit (Restoring Access)...');
    try {
        const response = await axios.get(REDDIT_URL, { headers: HEADERS });
        const items = response.data.data.children;

        return items.map(item => {
            const d = item.data;
            let imageUrl = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800';

            if (d.preview && d.preview.images && d.preview.images[0]) {
                imageUrl = d.preview.images[0].source.url.replace(/&amp;/g, '&');
            } else if (d.thumbnail && d.thumbnail.startsWith('http')) {
                imageUrl = d.thumbnail;
            }

            return {
                id: crypto.createHash('md5').update(d.url).digest('hex'),
                title: d.title,
                source: 'Reddit',
                url: `https://www.reddit.com${d.permalink}`,
                summary: d.selftext ? d.selftext.substring(0, 200) + '...' : 'Community discussion and trending topics.',
                image: imageUrl,
                published_at: new Date(d.created_utc * 1000).toISOString(),
                scraped_at: new Date().toISOString()
            };
        });
    } catch (error) {
        console.error('Reddit Scraper Failed:', error.message);
        // Fallback to a broader search if specific sub fails
        return [];
    }
}

module.exports = { scrapeReddit };
