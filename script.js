// Helper to get element safely
const safeGet = (id) => document.getElementById(id);

const searchInput = safeGet('search-input');
const gameContainer = safeGet('game-container');
const categoryFilters = safeGet('category-filters');
const gameGrid = safeGet('game-grid');
const trendingGrid = safeGet('trending-grid'); // New
const trendingSection = safeGet('trending-section'); // New
const allGamesSection = safeGet('all-games-section'); // New
const playerOverlay = safeGet('player-overlay');
const gameFrame = safeGet('game-frame');
const playingTitle = safeGet('playing-title');
const heroBg = safeGet('hero-bg'); // Element for hero background

let allGames = [];
let currentCategory = 'All';

// Fetch and load games
async function loadGames() {
    try {
        const response = await fetch('games.json');
        allGames = await response.json();

        // Handle Logic based on current page
        const path = window.location.pathname;

        if (path.includes('categories.html')) {
            renderCategoryPage();
        } else if (!path.includes('.html') || path.includes('index.html')) {
            // Home Page Logic
            if (categoryFilters) setupCategories();
            // Setup Hero
            if (heroBg) setupHeroBackground(allGames);

            // Check URL Params for Search or Filter
            const urlParams = new URLSearchParams(window.location.search);
            const searchParam = urlParams.get('search');
            const catParam = urlParams.get('category');

            if (searchParam) {
                if (searchInput) searchInput.value = searchParam;
                performSearch(searchParam);
            } else if (catParam) {
                setTimeout(() => filterByCategory(catParam), 50);
            } else {
                renderHomePage(allGames);
            }
        }

    } catch (error) {
        console.error('Error loading games:', error);
        if (gameGrid) gameGrid.innerHTML = '<p style="color:red">Failed to load games. Please try again later.</p>';
    }
}

// Hero Background Logic
function setupHeroBackground(games) {
    if (!heroBg || games.length === 0) return;

    heroBg.innerHTML = '';
    // Create a dense grid. Repeat games if minimal.
    const displayGames = [...games, ...games, ...games, ...games].slice(0, 40); // Ensure enough tiles

    displayGames.forEach(game => {
        const img = document.createElement('img');
        img.src = game.thumbnail;
        img.className = 'hero-bg-img';
        img.alt = '';
        heroBg.appendChild(img);
    });
}

// Global Search Function
function performNavigationSearch() {
    if (!searchInput) return;
    const term = searchInput.value.trim();
    if (!term) return;

    // If on index.html, just filter
    const path = window.location.pathname;
    if (!path.includes('.html') || path.includes('index.html')) {
        performSearch(term);
        // Update URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('search', term);
        newUrl.searchParams.delete('category');
        window.history.pushState({}, '', newUrl);
    } else {
        // Redirect to index
        window.location.href = `index.html?search=${encodeURIComponent(term)}`;
    }
}

// Internal Filter Logic
function performSearch(term) {
    term = term.toLowerCase();

    // UI Updates
    if (categoryFilters) {
        document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
    }

    const filtered = allGames.filter(game =>
        game.title.toLowerCase().includes(term) ||
        game.categories.some(cat => cat.toLowerCase().includes(term))
    );

    // Switch to Unified View (Hide Trending, Show Results in Main)
    if (trendingSection) trendingSection.style.display = 'none';
    if (allGamesSection) {
        const title = allGamesSection.querySelector('.section-title');
        if (title) title.innerText = 'Search Results';
    }

    renderGames(filtered, gameGrid);

    // Scroll to grid if valid search
    if (gameGrid && term.length > 0) gameGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Internal Category Logic
function setupCategories() {
    if (!categoryFilters) return;

    const categories = new Set(['All']);
    allGames.forEach(game => {
        game.categories.forEach(cat => categories.add(cat));
    });

    categoryFilters.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = `category-chip ${cat === 'All' ? 'active' : ''}`;
        chip.innerText = cat;
        chip.onclick = () => {
            filterByCategory(cat);
            // URL Update
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('category', cat);
            newUrl.searchParams.delete('search');
            window.history.pushState({}, '', newUrl);
        };
        categoryFilters.appendChild(chip);
    });
}

function filterByCategory(category) {
    currentCategory = category;

    if (categoryFilters) {
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.classList.toggle('active', chip.innerText === category);
        });
    }

    if (searchInput) searchInput.value = '';

    // Logic: If 'All' and NO search, restore Home View (Trending + All)
    // Else, Unified View

    if (category === 'All') {
        renderHomePage(allGames);
        if (allGamesSection) {
            const title = allGamesSection.querySelector('.section-title');
            if (title) title.innerText = 'All Games';
        }
    } else {
        const filtered = allGames.filter(game => game.categories.includes(category));

        // Unified View
        if (trendingSection) trendingSection.style.display = 'none';
        if (allGamesSection) {
            const title = allGamesSection.querySelector('.section-title');
            if (title) title.innerText = `${category} Games`;
        }
        renderGames(filtered, gameGrid);
    }
}

// Helper to restore Home View
function renderHomePage(games) {
    if (trendingSection) trendingSection.style.display = 'block';

    const trending = games.filter(g => g.isTrending);
    const others = games.filter(g => !g.isTrending);

    // Sort trending? optional.

    if (trendingGrid) renderGames(trending, trendingGrid);
    if (gameGrid) renderGames(others, gameGrid);
}

// Render logic for Categories Page
function renderCategoryPage() {
    const grid = document.getElementById('category-page-grid');
    if (!grid) return;

    const categories = new Set();
    allGames.forEach(game => {
        game.categories.forEach(cat => categories.add(cat));
    });

    // Professional Category Image Mapping (Verified Remote URLs)
    const categoryImages = {
        'Action': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', // E-sports/Action
        'Arcade': 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80', // Retro
        'Adventure': 'https://imgs.search.brave.com/fYgFJ_8WCBduC9VGBtDRLnJKpjbn8aZg9HE6wUDLcTo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvYWR2/ZW50dXJlLWdhbWVz/LTE5MjAteC0xMDgw/LXdhbGxwYXBlci1v/aHlpMHNhdWk2NHg0/dzdrLmpwZw', // Forest
        'Puzzle': 'https://imgs.search.brave.com/VNSqgz6nObAPp3er3Y-9R0fZaX188zU4Wl8PFWH_byA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTM2/NzgwNjMyNy9waG90/by9hYnN0cmFjdC1j/b2xvcmZ1bC1ibG9j/a3MtYmFja2dyb3Vu/ZC1wdXp6bGUtZ2Ft/ZS0zZC1pbGx1c3Ry/YXRpb24tdG8tZGl2/ZXJzZS1zdHJhdGVn/aWVzLndlYnA_YT0x/JmI9MSZzPTYxMng2/MTImdz0wJms9MjAm/Yz1RaGY3dkxIcDRD/QnJNX20wcE8zRlhY/Z05CWWdWZjFNUFRm/R3VKTU5UcTdJPQ', // Rubiks/Puzzle
        'Shooting': 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=800&q=80', // Cyber/Tactical
        'Strategy': 'https://imgs.search.brave.com/PNFWuZ7oZZLcDTxNnaa4ZwvZpX_opDT_xYuTBJoBfD4/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTIw/MjIwNTQxOC9waG90/by9maW5kLXRoZS1z/aG9ydGVzdC1wYXRo/LWJldHdlZW4tcG9p/bnRzLWEtYW5kLWIu/d2VicD9hPTEmYj0x/JnM9NjEyeDYxMiZ3/PTAmaz0yMCZjPTNp/cXNyMVgwckI4dHUy/d3luQk44YXlBZXF6/dDhrQmI0aVZKbzNf/cmVvbms9', // Chess Piece
        'Simulation': 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80', // VR/Sim
        'Racing': 'https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=800&q=80', // Car Light Trails
        'Driving': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80', // Road
        'Cars': 'https://imgs.search.brave.com/aOBE_m7zGeGRAKAwze96mzpE5YOo8NO9cEhDU_cW09E/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvZmVhdHVy/ZWQvY29vbC1jYXIt/cGljdHVyZXMtMDQ1/Mms0YjE1N3Zna3cz/ZS5qcGc', // Neon Car
        'Runner': 'https://imgs.search.brave.com/i_dRuPVoRrPKvdwNi4305EZFvKgaD0oiqLZqokOmuYk/rs:fit:0:180:1:0/g:ce/aHR0cHM6Ly9wNy5o/aWNsaXBhcnQuY29t/L3ByZXZpZXcvMTM2/LzU5MC81NDYvY2hl/YXRzLWZvci1zdWJ3/YXktc3VyZmVycy11/bmxpbWl0ZWQta2V5/cy1jb2lucy10ZW1w/bGUtcnVuLWd1aWRl/LWZvci1zdWJ3YXkt/c3VyZi1hbmRyb2lk/LXN1YndheS1zdXJm/ZXItdGh1bWJuYWls/LmpwZw', // Running Shoes
        'Casual': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=800&q=80', // Chill
        '.io': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', // Retro Tech
        '2 player': 'https://imgs.search.brave.com/Qf4MLDA3cjxfv0a8WBEf_Zfjr87wbozI59b3xnH1ODE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvMi1w/bGF5ZXItZ2FtZXMt/MTI4MC14LTk2MC13/YWxscGFwZXItbXU3/d2I2bWphdzBnNnMz/Mi5qcGc', // Multiple Controllers
        'Fighting': 'https://images.unsplash.com/photo-1599553250810-b99b5317d7b2?auto=format&fit=crop&w=800&q=80', // Boxing/Fighting
        'Sci-Fi': 'https://images.unsplash.com/photo-1535242208474-9a2793260ca8?auto=format&fit=crop&w=800&q=80', // Space/Tech
        'Memory': 'https://imgs.search.brave.com/t8QYecUhr7iK_zrGm_4E020H3BHElP2cN-PxKd2Lies/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTE5/NDk3NTEyOS9waG90/by9wZW9wbGUtd2Fs/a2luZy1pbi1hLW1h/emUtc2hhcGVkLWFz/LWEtYnJhaW4uanBn/P3M9NjEyeDYxMiZ3/PTAmaz0yMCZjPVVp/d2dyV2VkQzdBeENL/bThOdm5Cd2RXbF9m/NDMtSUVOYmpRYTJP/bHB5OFU9', // Neon Brain Concept
        'Drawing': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', // Art
        'Platformer': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        'Default': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'
    };

    grid.innerHTML = '';
    categories.forEach(cat => {
        // Use professional mapped image or fallback to Default
        const imgUrl = categoryImages[cat] || categoryImages['Default'];

        const card = document.createElement('div');
        card.className = 'category-card-large';
        card.onclick = () => window.location.href = `index.html?category=${encodeURIComponent(cat)}`;

        card.innerHTML = `
             <img src="${imgUrl}" class="category-card-bg" alt="${cat}">
             <span class="category-card-title">${cat}</span>
        `;
        grid.appendChild(card);
    });
}

// Search Inputs Event Listeners
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performNavigationSearch();
        }
    });
}

// Render game cards to a specific grid
function renderGames(games, targetGrid = gameGrid) {
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    if (games.length === 0) {
        targetGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">No games found matching your criteria.</p>';
        return;
    }

    games.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.onclick = () => openGame(game);

        // Platform Icons
        const desktopIcon = `<svg class="platform-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
        const mobileIcon = `<svg class="platform-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;

        let platformsHtml = desktopIcon; // Always Desktop
        if (game.isMobile) {
            platformsHtml += mobileIcon;
        }

        card.innerHTML = `
            <img src="${game.thumbnail}" alt="${game.title}" class="card-thumbnail" loading="lazy">
            <div class="card-info">
                <h3 class="card-title">${game.title}</h3>
                <span class="card-category">${game.categories.join(', ')}</span>
                <div class="card-platforms">
                    ${platformsHtml}
                </div>
            </div>
        `;

        targetGrid.appendChild(card);
    });
}

// Player Logic
let pingInterval;

function startPingMonitor() {
    const pingEl = document.getElementById('ping-monitor');
    const pingValue = document.getElementById('ping-value');
    if (!pingEl || !pingValue) return;

    const checkNetwork = async () => {
        const startPing = Date.now();
        try {
            // 1. Latency Check (HEAD)
            await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
            const latency = Date.now() - startPing;

            // 2. Scaled Score Calculation (Latency * 15)
            // Example: 4ms * 15 = 60ms
            let score = latency * 15;
            if (score > 999) score = 999;

            pingValue.innerText = `~ ${score} ms`;

            // Remove old classes
            pingEl.classList.remove('excellent', 'good', 'poor');

            // Thresholds adjusted for scaled score
            if (score <= 120) {
                pingEl.classList.add('excellent');
            } else if (score <= 250) {
                pingEl.classList.add('good');
            } else {
                pingEl.classList.add('poor');
            }
        } catch (e) {
            pingValue.innerText = "Offline";
            pingEl.classList.add('poor');
        }
    };

    checkNetwork(); // Initial check
    pingInterval = setInterval(checkNetwork, 3000); // Check every 3s
}

function stopPingMonitor() {
    if (pingInterval) clearInterval(pingInterval);
}

if (playerOverlay) {
    function openGame(game) {
        playingTitle.innerText = game.title;
        gameFrame.src = game.iframeUrl;
        playerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // SEO: Dynamic Title Update
        document.title = `Play ${game.title} - Free2Play`;

        // SEO: Dynamic Schema Injection
        const scriptId = 'dynamic-game-schema';
        let script = document.getElementById(scriptId);
        if (script) script.remove();

        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": game.title,
            "applicationCategory": "Game",
            "operatingSystem": "Web",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "image": game.thumbnail,
            "description": `Play ${game.title} for free online at Free2Play.`,
            "author": {
                "@type": "Organization",
                "name": "Free2Play"
            }
        });
        document.head.appendChild(script);

        // Randomize Votes for Demo
        setupVotes();

        // Start Ping
        startPingMonitor();
    }

    function closeGame() {
        playerOverlay.classList.remove('active');
        setTimeout(() => {
            if (gameFrame) gameFrame.src = '';
        }, 300);
        document.body.style.overflow = 'auto';
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        // Stop Ping
        stopPingMonitor();
    }

    // --- Vote Logic ---
    function setupVotes() {
        // Reset buttons state on new game open
        const likeBtn = safeGet('like-btn');
        const dislikeBtn = safeGet('dislike-btn');

        if (likeBtn) likeBtn.classList.remove('liked');
        if (dislikeBtn) dislikeBtn.classList.remove('disliked');
    }

    function toggleVote(type) {
        const btn = safeGet(type + '-btn');
        const isActive = btn.classList.contains(type === 'like' ? 'liked' : 'disliked');

        // Reset both
        safeGet('like-btn').classList.remove('liked');
        safeGet('dislike-btn').classList.remove('disliked');

        if (!isActive) {
            btn.classList.add(type === 'like' ? 'liked' : 'disliked');

            if (type === 'like') {
                showToast('Thanks for your feedback! Glad you enjoyed it! 🔥');
            } else {
                showToast("We hear you. We'll strive to improve🔧");
            }
        }
    }

    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast-message';
            document.body.appendChild(toast);
        }

        toast.innerText = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --- Report System ---
    function openReportModal() {
        const modal = document.getElementById('report-modal');
        if (modal) modal.classList.add('active');
    }

    function closeReportModal() {
        const modal = document.getElementById('report-modal');
        if (modal) modal.classList.remove('active');
    }

    function submitReport(issue) {
        const gameTitle = safeGet('playing-title').innerText || 'Unknown Game';

        // Get Network Score
        const scoreEl = document.getElementById('ping-value');
        const netScore = scoreEl ? scoreEl.innerText : 'Unknown';

        // Construct Mailto Link
        const subject = encodeURIComponent(`Report: ${issue} - ${gameTitle}`);
        const body = encodeURIComponent(`I encountered an issue with the game "${gameTitle}".\n\nIssue: ${issue}\nNetwork Status: ${netScore}\n\nDetails (optional):`);

        const mailtoLink = `mailto:support@free2play.in?subject=${subject}&body=${body}`;

        // Open Email Client
        window.open(mailtoLink, '_blank');

        closeReportModal();
        showToast('Redirecting to support...');
    }

    // Attach to global scope for HTML onclick access
    window.openGame = openGame;
    window.closeGame = closeGame;
    window.toggleVote = toggleVote;
    window.openReportModal = openReportModal;
    window.openReportModal = openReportModal;
    window.closeReportModal = closeReportModal;
    window.submitReport = submitReport;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (gameContainer && gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
// Attach global
window.toggleFullscreen = toggleFullscreen;
window.performNavigationSearch = performNavigationSearch;


// Initialize
document.addEventListener('DOMContentLoaded', loadGames);

// Escape key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && playerOverlay && playerOverlay.classList.contains('active')) {
        closeGame();
    }
});
