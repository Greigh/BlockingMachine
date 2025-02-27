// API Configuration
const API_URL = 'https://api.blockingmachine.com/v1';  // Replace with your actual API endpoint

// Filter lists cache
let filterLists = null;

// Update the loadFilterLists function to properly process AdGuard rules
async function loadFilterLists() {
    try {
        const lists = ['adguard.txt'];
        const responses = await Promise.all(
            lists.map(list =>
                fetch(`../filters/${list}`).then(res => res.text())
            )
        );

        // Process AdGuard rules
        filterLists = responses
            .join('\n')
            .split('\n')
            .filter(line => {
                // Keep only lines that start with || and not @@||
                return line.startsWith('||') && !line.startsWith('@@||');
            })
            .map(line => {
                // Extract domain from AdGuard syntax
                // Remove || from start and everything after ^ (if exists)
                return line.replace('||', '')
                    .split('^')[0]
                    .toLowerCase()
                    .trim();
            })
            .filter(Boolean); // Remove empty lines

        updateStats();
    } catch (error) {
        console.error('Failed to load filter lists:', error);
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
function testUrl() {
    const urlInput = document.getElementById('test-url');
    const resultsDiv = document.getElementById('test-results');
    let url = urlInput.value.trim();

    if (!url) {
        resultsDiv.innerHTML = '<p class="error">Please enter a URL</p>';
        return;
    }

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

        if (isBlocked) {
            resultsDiv.innerHTML = `
                <div class="result result--blocked">
                    <h3>⛔️ URL is blocked</h3>
                    <p>This domain matches our filter lists</p>
                </div>`;
        } else {
            resultsDiv.innerHTML = `
                <div class="result result--allowed">
                    <h3>✅ URL is allowed</h3>
                    <p>This URL passes all filtering rules</p>
                </div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="result result--error">
                <h3>❌ Invalid URL</h3>
                <p>Please enter a valid domain (e.g., example.com or www.example.com)</p>
            </div>`;
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