# Gemini: Project Constitution

## North Star
A premium, interactive AI News Dashboard that aggregates and stylizes the latest 24-hour articles from Ben's Bytes, AI Rundown, and Reddit, allowing users to save and persist their favorite reads.

## Data Schemas
### Article Object
```json
{
  "id": "string (uuid)",
  "title": "string",
  "source": "string (Ben's Bytes | AI Rundown | Reddit)",
  "url": "string (full url)",
  "summary": "string",
  "published_at": "datetime (ISO 8601)",
  "scraped_at": "datetime (ISO 8601)",
  "is_saved": "boolean"
}
```

## Behavioral Rules
- **Aesthetics First:** Dashboard must match the "nixito" inspiration: Dark mode (`#000000`), Purple accents (`#a855f7`), Glassmorphism, and rounded corners (80px for main container, 16-24px for cards).
- **Logo:** Use the white geometric mark from `favicon.svg` on dark backgrounds.
- **Deterministic Scraping (Node.js):** Scrapers must be written in Node.js (v24+) for reliability in this environment. Use `axios` for requests and `cheerio` for parsing.
- **24-Hour Freshness:** Focus exclusively on the last 24 hours of data.
- **Persistence:** User "Saved" state must survive refreshes (local storage initially, Supabase later).

## Architectural Invariants
- 3-Layer Build (SOPs, Navigation, Tools)
- Deterministic Logic (Node.js Tools)
- Self-Annealing Loop
