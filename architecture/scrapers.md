# SOP: AI News Scrapers (Node.js)

## Reddit Scraper
- **Source:** `https://www.reddit.com/r/ArtificialIntelligence/top.json?t=day`
- **Method:** HTTPS GET using `axios`.
- **Payload:** Map `data.children` to the Article Schema.
- **Date Filter:** Check `created_utc` vs Current Time - 86400s.

## Newsletter Scraper
- **Source:** `https://www.bensbites.com/archive`, `https://www.therundown.ai/archive`
- **Method:** GET using `axios` + `cheerio` parsing.
- **Payload:** Extract article titles and absolute URLs.

## Data Normalization
- **ID:** MD5 hash of the URL.
- **Timestamps:** ISO 8601.
