const { scrapeBensBites, scrapeAIRundown } = require('./newsletter_scraper.cjs');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../public/data.json');

async function main() {
    console.log('🚀 Starting Master Scraper (v5 - Strict 72h Real-Date Filter)...');

    let existingArticles = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            existingArticles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) {
            existingArticles = [];
        }
    }

    try {
        console.log('Running deep scrapers...');
        const results = await Promise.all([
            scrapeBensBites(),
            scrapeAIRundown()
        ]);

        const newArticles = results.flat();

        // Use a map to handle duplicates and maintain state (like hearts)
        const articleMap = new Map();

        // Add new articles first to ensure they have real dates
        newArticles.forEach(article => {
            articleMap.set(article.id, article);
        });

        // Add existing articles if they don't conflict, preserving manual updates if any
        existingArticles.forEach(article => {
            if (!articleMap.has(article.id)) {
                articleMap.set(article.id, article);
            }
        });

        const allMerged = Array.from(articleMap.values());

        // STRICT FILTER: Only last 72 hours based on REAL publication date
        const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
        console.log(`Filtering for articles newer than: ${seventyTwoHoursAgo.toISOString()}`);

        const validArticles = allMerged.filter(article => {
            const pubDate = new Date(article.published_at);
            const isRecent = pubDate >= seventyTwoHoursAgo;

            // Domain check: Only allow articles hosted on the primary source websites
            const isInternalSource = article.url.toLowerCase().includes('bensbites.com') ||
                article.url.toLowerCase().includes('therundown.ai');

            const isNotReddit = article.source !== 'Reddit' && !article.url.includes('reddit.com');

            if (!isRecent) console.log(`  - Skipping old: ${article.title} (${article.published_at})`);
            if (!isInternalSource) console.log(`  - Skipping external URL: ${article.url}`);

            return isRecent && isInternalSource && isNotReddit;
        });

        // Sort by newest first
        validArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

        fs.writeFileSync(DATA_FILE, JSON.stringify(validArticles.slice(0, 100), null, 2));
        console.log(`✅ Success! ${validArticles.length} strictly recent articles saved to data.json`);
    } catch (error) {
        console.error('❌ Master Scraper Error:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
