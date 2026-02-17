const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

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
                console.log(`Found JSON-LD block...`);
                if (json.datePublished) {
                    publishedAt = json.datePublished;
                    console.log(`  -> datePublished: ${publishedAt}`);
                }
                if (Array.isArray(json)) {
                    const obj = json.find(item => item.datePublished);
                    if (obj) {
                        publishedAt = obj.datePublished;
                        console.log(`  -> Array datePublished: ${publishedAt}`);
                    }
                }
            } catch (e) { }
        });

        // Try Meta Tags (Substack/Common)
        if (!publishedAt) {
            publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                $('meta[name="publish-date"]').attr('content') ||
                $('time').attr('datetime');
            if (publishedAt) console.log(`Found in Meta: ${publishedAt}`);
        }

        if (!publishedAt) {
            publishedAt = "2000-01-01T00:00:00.000Z";
        }

        return { publishedAt };
    } catch (e) {
        console.error(`Error: ${e.message}`);
        return { publishedAt: "2000-01-01T00:00:00.000Z" };
    }
}

const url = 'https://www.therundown.ai/p/sam-altmans-openai-succession-plan';
getArticleMetadata(url).then(res => console.log('Final Result:', res));
