const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

/**
 * Cleans newsletter headlines to remove clickbait/fluff
 */
function cleanHeadline(title) {
    if (!title) return "";
    // 1. Remove "PLUS: ..." or "PLUS ..."
    let clean = title.split(/PLUS[:\s]/i)[0];
    // 2. Remove author attributions like "Zach Mink, +4" at the end
    clean = clean.replace(/[A-Z][a-z]+ [A-Z][a-z]+, \+\d+.*$/, "");
    // 3. Remove trailing separators and trim
    return clean.replace(/[|:-]\s*$/, "").trim();
}

/**
 * Enhanced metadata extraction - follow the link to get real date and image
 */
async function getArticleMetadata(url) {
    try {
        const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const html = response.data;
        const $ = cheerio.load(html);

        // 1. EXTRACTION: Publication Date
        let publishedAt = null;

        // Try JSON-LD (Beehiiv/Standard)
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html());
                if (json.datePublished) publishedAt = json.datePublished;
                if (Array.isArray(json)) {
                    const obj = json.find(item => item.datePublished);
                    if (obj) publishedAt = obj.datePublished;
                }
            } catch (e) { }
        });

        // Try Meta Tags (Substack/Common)
        if (!publishedAt) {
            publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                $('meta[name="publish-date"]').attr('content') ||
                $('time').attr('datetime');
        }

        // Final fallback: Regex search in raw HTML (safety)
        if (!publishedAt) {
            const dateMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
            if (dateMatch) publishedAt = dateMatch[1];
        }

        // If still nothing, default to a very old date so it gets filtered out
        if (!publishedAt) {
            publishedAt = "2000-01-01T00:00:00.000Z";
        }

        // 2. EXTRACTION: Image
        let image = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('article img').first().attr('src');

        if (!image || !image.startsWith('http')) {
            image = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800';
        }

        // 3. EXTRACTION: Description (Sub-headline)
        let description = $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            '';

        // If meta description is generic or too short, try first paragraph
        if (!description || description.length < 30) {
            description = $('p').first().text().trim() || description;
        }

        // Clean description (remove generic newsletter footers)
        if (description.includes("Subscribe to")) description = "";

        return { publishedAt, image, description: description.substring(0, 200).trim() };
    } catch (e) {
        return {
            publishedAt: "2000-01-01T00:00:00.000Z",
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
            description: ""
        };
    }
}

/**
 * Deep extraction for The Rundown AI - extracts EVERY story with categorization
 */
async function extractRundownStories(editionUrl, editionDate) {
    try {
        const response = await axios.get(editionUrl, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(response.data);
        const stories = [];

        // 1. ADD THE MAIN STORY
        const mainTitle = $('h1').first().text().trim();
        if (mainTitle) {
            stories.push({
                title: cleanHeadline(mainTitle),
                url: editionUrl,
                summary: $('meta[property="og:description"]').attr('content') || "Main feature news from The Rundown AI.",
                category: 'News'
            });
        }

        // 2. GREEDY LINK CAPTURE
        $('p, h4, li, h2').each((i, el) => {
            const text = $(el).text().trim();
            const link = $(el).find('a').first();
            const url = link.attr('href');

            if (url && url.startsWith('http') && text.length > 25) {
                // FILTER JUNK
                const junk = ['twitter.com', 'linkedin.com', 'subscribe', 'archive', 'buy', 'merch', 'discord', 'substack.com', 'facebook.com', 'instagram.com'];
                if (junk.some(j => url.toLowerCase().includes(j))) return;
                if (url.includes('rundown.ai') && !url.includes('/p/')) return;

                // Determine Category
                let category = 'News';
                const containerText = $(el).closest('div').prevAll('h3, h2').first().text().toUpperCase();

                if (containerText.includes('TOOL')) category = 'Tools';
                else if (containerText.includes('HEALTH')) category = 'Health';
                else if (containerText.includes('TRAINING')) category = 'Tutorial';
                if (text.toUpperCase().includes('TOOL')) category = 'Tools';

                // CLEAN TITLE
                let title = link.text().trim();
                if (title.length < 10) title = text.split(/[.!?\n[()]/)[0].trim();

                // If title is still very long, trim it
                if (title.length > 150) title = title.substring(0, 147) + "...";
                if (title.length < 15) return; // Too short to be useful news

                // FILTER NOISY TITLES
                const noisyTitles = ['Read on', 'Click here', 'Check out', 'Follow us', 'Last issue', 'Download'];
                if (noisyTitles.some(nt => title.toLowerCase().includes(nt.toLowerCase()))) return;

                stories.push({
                    title: cleanHeadline(title),
                    url: url.split('/?')[0].split('?')[0], // Normalize URL
                    summary: text.substring(0, 300),
                    category: category
                });
            }
        });

        return stories.map(s => ({
            ...s,
            source: 'AI Rundown',
            published_at: editionDate,
            image: $('meta[property="og:image"]').attr('content') || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
        }));
    } catch (e) {
        console.error(`Failed to deep-scrape Rundown edition: ${editionUrl}`);
        return [];
    }
}

/**
 * Deep extraction for Ben's Bites - extracts sub-stories from an edition page
 */
async function extractBitesStories(editionUrl, editionDate) {
    try {
        const response = await axios.get(editionUrl, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(response.data);
        const stories = [];

        // 1. Extract Dev Dish and Tools sections
        $('h3:contains("Dev Dish"), h3:contains("Tools and demos")').nextAll('ul, div').first().find('li, p').each((i, el) => {
            const link = $(el).find('a').first();
            const text = $(el).text().trim();
            if (link.length > 0 && text.length > 20) {
                const url = link.attr('href');
                if (url && url.startsWith('http') && !url.includes('bensbites.com')) {
                    stories.push({
                        title: cleanHeadline(link.text().trim() || text.split('\n')[0]),
                        url: url,
                        summary: text.substring(0, 200)
                    });
                }
            }
        });

        // 2. Extract top-level editorial links
        $('.body.markup a').each((i, el) => {
            const title = $(el).text().trim();
            const url = $(el).attr('href');
            if (title.length > 30 && url && url.startsWith('http') && !url.includes('bensbites.com')) {
                stories.push({
                    title: cleanHeadline(title),
                    url: url,
                    summary: "Featured insight from Ben's Bites."
                });
            }
        });

        return stories.map(s => {
            let category = 'News';
            const context = (s.title + ' ' + s.summary + ' ' + s.url).toUpperCase();
            if (context.includes('TOOL') || context.includes('DEMO') || context.includes('GITHUB.COM') || context.includes('.AI') || context.includes('.COM') || context.includes('APP')) category = 'Tools';
            if (context.includes('DEV DISH') || context.includes('UPDATE')) category = 'Update';
            if (context.includes('HEALTH') || context.includes('MEDICINE') || context.includes('DOCTOR')) category = 'Health';
            if (context.includes('TUTORIAL') || context.includes('GUIDE') || context.includes('HOW TO')) category = 'Tutorial';

            return {
                ...s,
                source: 'Ben\'s Bites',
                published_at: editionDate,
                category: category,
                image: $('meta[property="og:image"]').attr('content') || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
            };
        });
    } catch (e) {
        console.error(`Failed to deep-scrape Ben's Bites edition: ${editionUrl}`);
        return [];
    }
}

async function scrapeBensBites() {
    console.log('Scraping Ben\'s Bites (Deep Content Explosion)...');
    try {
        const response = await axios.get('https://www.bensbites.com/archive', { headers: HEADERS });
        const $ = cheerio.load(response.data);
        const articles = [];
        const links = [];

        $('a[href*="/p/"]').each((i, el) => {
            const title = $(el).text().trim();
            const url = $(el).attr('href');
            if (title && url && !url.includes('substack.com')) {
                const fullUrl = url.startsWith('http') ? url : `https://www.bensbites.com${url}`;
                links.push({ title, url: fullUrl });
            }
        });

        // Only process the 10 most recent editions to keep it fast
        for (const link of links.slice(0, 10)) {
            const meta = await getArticleMetadata(link.url);
            const subStories = await extractBitesStories(link.url, meta.publishedAt);

            subStories.forEach(story => {
                articles.push({
                    id: crypto.createHash('md5').update(story.url).digest('hex'),
                    ...story,
                    scraped_at: new Date().toISOString()
                });
            });
        }
        return articles;
    } catch (error) {
        console.error('Ben\'s Bites Scraper Failed:', error.message);
        return [];
    }
}

async function scrapeAIRundown() {
    console.log('Scraping AI Rundown (Deep Content Explosion)...');
    try {
        const response = await axios.get('https://www.therundown.ai/archive', { headers: HEADERS });
        const $ = cheerio.load(response.data);
        const articles = [];
        const links = [];

        $('a[href*="/p/"]').each((i, el) => {
            const title = $(el).text().trim();
            const url = $(el).attr('href');
            if (title && url) {
                const fullUrl = url.startsWith('http') ? url : `https://www.therundown.ai${url}`;
                links.push({ title, url: fullUrl });
            }
        });

        // Only process the 10 most recent editions
        for (const link of links.slice(0, 10)) {
            const meta = await getArticleMetadata(link.url);
            const subStories = await extractRundownStories(link.url, meta.publishedAt);

            subStories.forEach(story => {
                articles.push({
                    id: crypto.createHash('md5').update(story.url).digest('hex'),
                    ...story,
                    scraped_at: new Date().toISOString()
                });
            });
        }
        return articles;
    } catch (error) {
        console.error('AI Rundown Scraper Failed:', error.message);
        return [];
    }
}

module.exports = { scrapeBensBites, scrapeAIRundown };
