const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TOKEN = process.env.GITHUB_TOKEN; // Get from environment
const OWNER = 'no-pixels';
const REPO = 'testapp';
const BRANCH = 'main';

if (!TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is missing.');
    process.exit(1);
}

const api = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Antigravity-Deployer'
    }
});

async function getFileContent(filePath) {
    const content = fs.readFileSync(filePath);
    return content.toString('base64');
}

async function uploadFile(relativeWeightPath) {
    const fullPath = path.join(__dirname, '..', relativeWeightPath);
    if (!fs.existsSync(fullPath)) return;

    const content = await getFileContent(fullPath);
    const message = `Automated Scraper Update: ${new Date().toISOString()}`;
    const pathInRepo = relativeWeightPath.replace(/\\/g, '/');

    try {
        let sha;
        try {
            const { data } = await api.get(`/repos/${OWNER}/${REPO}/contents/${pathInRepo}`);
            sha = data.sha;
        } catch (e) {
            // File doesn't exist
        }

        console.log(`Uploading ${pathInRepo}...`);
        await api.put(`/repos/${OWNER}/${REPO}/contents/${pathInRepo}`, {
            message,
            content,
            branch: BRANCH,
            sha
        });
        console.log(`✅ ${pathInRepo} uploaded.`);
    } catch (error) {
        console.error(`❌ Failed to upload ${pathInRepo}:`, error.response?.data || error.message);
    }
}

async function start() {
    console.log(`🚀 Starting automated update to ${OWNER}/${REPO}...`);
    // We only need to upload data.json for the scheduled update
    await uploadFile('public/data.json');
    console.log('\n✨ Automated Update Complete!');
}

start();
