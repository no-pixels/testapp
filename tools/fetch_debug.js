const axios = require('axios');
const fs = require('fs');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function fetch(url) {
    try {
        const response = await axios.get(url, { headers: HEADERS });
        fs.writeFileSync('tools/debug.html', response.data);
        console.log('Saved HTML to tools/debug.html');
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

fetch('https://www.therundown.ai/p/sam-altmans-openai-succession-plan');
