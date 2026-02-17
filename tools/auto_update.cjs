const { main } = require('./master_scraper.cjs');

console.log('🤖 Starting AI News Auto-Updater...');
console.log('🔄 Will scrape every 10 minutes to find new articles.');

// Initial run
main();

// Run every 10 minutes
setInterval(main, 10 * 60 * 1000);
