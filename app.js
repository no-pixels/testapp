let allArticles = [];
let savedArticleIds = JSON.parse(localStorage.getItem('savedArticles') || '[]');

async function init() {
    await fetchNews();
    setupInteractions();

    // AUTO-REFRESH: Check for new news every 1 minute
    setInterval(fetchNews, 60000);
}

async function fetchNews() {
    try {
        console.log('Checking for new AI horizons...');
        const response = await fetch('data.json?' + new Date().getTime()); // Anti-cache
        const freshArticles = await response.json();

        // Only re-render if something actually changed
        if (JSON.stringify(freshArticles) !== JSON.stringify(allArticles)) {
            allArticles = freshArticles;
            const activeSource = document.querySelector('.filter-btn.active')?.dataset.source || 'all';
            const isSavedView = document.getElementById('saved-stat-btn').classList.contains('active-filter');

            if (isSavedView) {
                renderArticles(allArticles.filter(a => savedArticleIds.includes(a.id)));
            } else if (activeSource === 'all') {
                renderArticles(allArticles);
            } else {
                renderArticles(allArticles.filter(a => a.source === activeSource));
            }
            updateStats();
        }
    } catch (error) {
        console.error('Failed to update news feed:', error);
    }
}

function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const elapsed = now - past;

    if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + 's ago';
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + 'm ago';
    } else {
        return Math.round(elapsed / msPerHour) + 'h ago';
    }
}

function renderArticles(articles) {
    const grid = document.getElementById('news-grid');
    grid.innerHTML = '';

    if (articles.length === 0) {
        grid.innerHTML = '<div class="loader">No recent articles found in the last 24h.</div>';
        return;
    }

    articles.forEach(article => {
        const isSaved = savedArticleIds.includes(article.id);
        const timeAgo = getTimeAgo(article.published_at);
        const card = document.createElement('div');
        card.className = 'article-card';
        card.onclick = () => window.open(article.url, '_blank');

        card.innerHTML = `
            <div class="card-image-area">
                <img src="${article.image}" alt="Article" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600'">
                <div class="source-pill">${article.source}</div>
                <div class="time-badge">${timeAgo}</div>
                <div class="card-actions">
                    <button class="action-btn heart-btn ${isSaved ? 'active' : ''}" onclick="event.stopPropagation(); toggleSave('${article.id}')" title="${isSaved ? 'Unsave' : 'Save'}">
                        ${isSaved ? '❤️' : '🤍'}
                    </button>
                    ${isSaved ? `
                        <button class="action-btn trash-btn" onclick="event.stopPropagation(); removeSaved('${article.id}')" title="Remove from list">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="article-content">
                <h3>${article.title}</h3>
                <p>${article.summary || "Latest updates from the AI frontier."}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function toggleSave(id) {
    if (savedArticleIds.includes(id)) {
        savedArticleIds = savedArticleIds.filter(savedId => savedId !== id);
    } else {
        savedArticleIds.push(id);
    }
    saveAndRefresh();
}

function removeSaved(id) {
    savedArticleIds = savedArticleIds.filter(savedId => savedId !== id);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('savedArticles', JSON.stringify(savedArticleIds));
    updateStats();

    const activeSource = document.querySelector('.filter-btn.active')?.dataset.source || 'all';
    const isSavedView = document.getElementById('saved-stat-btn').classList.contains('active-filter');

    if (isSavedView) {
        renderArticles(allArticles.filter(a => savedArticleIds.includes(a.id)));
    } else if (activeSource === 'all') {
        renderArticles(allArticles);
    } else {
        renderArticles(allArticles.filter(a => a.source === activeSource));
    }
}

function updateStats() {
    document.getElementById('article-count').innerText = allArticles.length;
    document.getElementById('saved-count').innerText = savedArticleIds.length;
}

function setupInteractions() {
    document.getElementById('all-stat-btn').onclick = () => {
        clearSpecialFilters();
        setFilterActive('all');
        renderArticles(allArticles);
    };

    document.getElementById('saved-stat-btn').onclick = () => {
        clearSpecialFilters();
        document.getElementById('saved-stat-btn').classList.add('active-filter');
        setFilterActive('none');
        const savedArticles = allArticles.filter(a => savedArticleIds.includes(a.id));
        renderArticles(savedArticles);
    };

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            clearSpecialFilters();
            const source = btn.dataset.source;
            setFilterActive(source);
            if (source === 'all') {
                renderArticles(allArticles);
            } else {
                renderArticles(allArticles.filter(a => a.source === source));
            }
        };
    });
}

function clearSpecialFilters() {
    document.getElementById('saved-stat-btn').classList.remove('active-filter');
}

function setFilterActive(source) {
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.source === source) b.classList.add('active');
    });
}

window.onload = init;
