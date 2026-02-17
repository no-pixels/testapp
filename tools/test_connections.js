const axios = require('axios');

async function testConnection(name, url) {
    console.log(`Testing ${name} (${url})...`);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'AntigravityAINewsDashboard/1.0.0 (by /u/NoelS)'
            },
            timeout: 10000
        });
        if (response.status === 200) {
            console.log(`✅ ${name} responded successfully.`);
            return true;
        } else {
            console.log(`❌ ${name} returned status code ${response.status}.`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name} failed: ${error.message}`);
        return false;
    }
}

async function run() {
    const sources = [
        ["Reddit", "https://www.reddit.com/r/ArtificialIntelligence/top.json?t=day"],
        ["Ben's Bites", "https://www.bensbites.com/archive"],
        ["AI Rundown", "https://www.therundown.ai/archive"]
    ];

    let allPassed = true;
    for (const [name, url] of sources) {
        const result = await testConnection(name, url);
        if (!result) allPassed = false;
    }

    if (allPassed) {
        console.log("\nAll links verified. Ready for architecture phase.");
        process.exit(0);
    } else {
        console.log("\nSome links failed. Check findings.md for details.");
        process.exit(1);
    }
}

run();

