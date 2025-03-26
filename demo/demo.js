// API Configuration
const API_URL = 'https://api.blockingmachine.com/v1';  // Replace with your actual API endpoint

// Filter lists cache
let filterLists = null;

// Update the loadFilterLists function to properly process AdGuard rules
async function loadFilterLists() {
    try {
        const lists = ['adguard.txt'];
        const responses = await Promise.all(
            lists.map(async list => {
                const response = await fetch(`../filters/${list}`);
                if (!response.ok) {
                    throw new Error(`Failed to load ${list}: ${response.status}`);
                }
                return response.text();
            })
        );

        // Process AdGuard rules with better error handling
        filterLists = responses
            .join('\n')
            .split('\n')
            .filter(line => {
                if (!line) return false;
                line = line.trim();
                return line.startsWith('||') && !line.startsWith('@@||');
            })
            .map(line => {
                try {
                    return line.replace('||', '')
                        .split('^')[0]
                        .toLowerCase()
                        .trim();
                } catch (error) {
                    console.warn('Failed to process rule:', line, error);
                    return null;
                }
            })
            .filter(Boolean);

        updateStats();
    } catch (error) {
        console.error('Failed to load filter lists:', error);
        document.getElementById('domains-blocked').textContent = 'Error loading filters';
        document.getElementById('last-update').textContent = 'Failed to update';
    }
}

// Update stats display
function updateStats() {
    if (!filterLists) return;

    document.getElementById('domains-blocked').textContent =
        new Intl.NumberFormat().format(filterLists.length);
    document.getElementById('last-update').textContent =
        new Date().toLocaleDateString();
}

// URL testing logic
async function testUrl() {
    const urlInput = document.getElementById('test-url');
    const resultsDiv = document.getElementById('test-results');
    const testButton = document.querySelector('.test-input-group button');
    let url = urlInput.value.trim();

    testButton.disabled = true;
    testButton.textContent = 'Testing...';
    resultsDiv.innerHTML = '<p class="loading">Checking URL...</p>';

    try {
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Extract and normalize domain
        let domain = new URL(url).hostname.toLowerCase();
        domain = domain.replace(/^www\./, '');

        // Simple exact match against processed filter list
        const isBlocked = filterLists.includes(domain);
        resultsDiv.innerHTML = `
            <div class="result ${isBlocked ? 'result--blocked' : 'result--allowed'}" role="alert">
                <h3>${isBlocked ? '⛔️ URL is blocked' : '✅ URL is allowed'}</h3>
                <p>${isBlocked ? 'This domain matches our filter lists' : 'This URL passes all filtering rules'}</p>
            </div>`;
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="result result--error" role="alert">
                <h3>❌ Invalid URL</h3>
                <p>Please enter a valid domain (e.g., example.com or www.example.com)</p>
            </div>`;
    } finally {
        testButton.disabled = false;
        testButton.textContent = 'Test URL';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFilterLists();

    // Add enter key support for URL input
    document.getElementById('test-url').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            testUrl();
        }
    });
});