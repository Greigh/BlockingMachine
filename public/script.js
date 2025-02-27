'use strict';

// Add this at the top of your script.js
document.addEventListener('DOMContentLoaded', function () {
    // Handle demo button visibility
    const demoButton = document.getElementById('demoButton');
    const isProduction = window.location.hostname === 'greigh.github.io' || window.location.hostname === '127.0.0.1';

    if (demoButton) {
        if (isProduction) {
            demoButton.style.display = 'block';
            demoButton.href = '/demo';
        } else {
            // For local development
            demoButton.style.display = 'none';
        }
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Theme toggle handler
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
});

// Global configuration
const CONFIG = {
    PAGE_TYPE: 'protected_rule',
    APP_NAME: 'BlockingMachine',
    ACTIVE_CLASS: 'active',
    DEFAULT_LOCALE: 'en',
    THEME: {
        LIGHT: 'light',
        DARK: 'dark'
    }
};

// Localization strings
const LOCALES = {
    en: {
        metaTitle: CONFIG.APP_NAME,
        backBtn: 'Go back',
        safeDropdownTitle3: 'Why is this website blocked?',
        protectedDropdownDesc3: 'This website is blocked because it contains advertising or tracking code.',
        protectedDropdownDesc4: 'If you believe this website has been blocked in error, please <a href="%reports_url%">let us know</a>.',
        safeDropdownTitle4: 'How to temporarily unblock this website?',
        safeDropdownDesc4_1: 'To temporarily unblock this website, go to Server settings → User rules and create an unblocking rule',
        safeDropdownDesc4_2: 'If the issue persists, please report it <a href="%reports_url%">on our GitHub</a>.',
        protectedTitle: 'Access blocked:<br/><span>Ad or tracking domain</span>',
        protectedDesc: 'Access to <strong>%host%</strong> is blocked. This website may track your activity or display ads.'
    }
};

// Initialize app
(() => {
    const pageData = {
        // Get the blocked domain from the referrer or URL parameters
        host: new URLSearchParams(window.location.search).get('blocked') ||
            document.referrer.replace(/^https?:\/\//, '').split('/')[0] ||
            'unknown domain',
        reports_url: 'https://github.com/greigh/BlockingMachine/issues'
    };

    // Content management
    const updateContent = () => {
        const locale = navigator.language?.toLowerCase().split('-')[0];
        const strings = LOCALES[locale] || LOCALES[CONFIG.DEFAULT_LOCALE];

        document.querySelectorAll('[data-id]').forEach(element => {
            const key = element.dataset.id;
            if (!key) return;

            let text = strings[key] || key;
            Object.entries(pageData).forEach(([key, value]) => {
                text = text.replace(new RegExp(`%${key}%`, 'g'), value);
            });
            element.innerHTML = text;
        });
    };

    // Dropdown functionality
    const setupDropdowns = () => {
        document.querySelectorAll('[data-dropdown-item]').forEach(item => {
            const toggle = item.querySelector('[data-dropdown-toggle]');
            const content = item.querySelector('[data-dropdown-content]');

            if (!toggle || !content) return;

            toggle.setAttribute('aria-expanded', 'false');

            toggle.addEventListener('click', () => {
                const isExpanding = toggle.getAttribute('aria-expanded') === 'false';

                // Close all other dropdowns
                document.querySelectorAll('[data-dropdown-item]').forEach(other => {
                    if (other !== item) {
                        const otherToggle = other.querySelector('[data-dropdown-toggle]');
                        const otherContent = other.querySelector('[data-dropdown-content]');
                        if (otherToggle && otherContent) {
                            otherToggle.setAttribute('aria-expanded', 'false');
                            otherContent.classList.remove('active');
                        }
                    }
                });

                // Toggle current dropdown
                toggle.setAttribute('aria-expanded', isExpanding ? 'true' : 'false');
                content.classList.toggle('active');
            });
        });
    };

    // Theme handling
    const initTheme = () => {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const getSystemTheme = () =>
            window.matchMedia('(prefers-color-scheme: dark)').matches ? CONFIG.THEME.DARK : CONFIG.THEME.LIGHT;

        const setTheme = (theme = getSystemTheme()) => {
            document.documentElement.setAttribute('data-theme', theme);
            document.body.className = theme === CONFIG.THEME.DARK ? 'dark-theme' : '';
            if (theme) {
                localStorage.setItem('theme', theme);
            } else {
                localStorage.removeItem('theme');
            }
            themeToggle.textContent = theme === CONFIG.THEME.DARK ? '☀️' : '🌙';
        };

        // Initialize theme from storage or system preference
        setTheme(localStorage.getItem('theme'));

        // System theme change handler
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (!localStorage.getItem('theme')) setTheme();
        });
    };

    // Initialize everything
    updateContent();
    setupDropdowns();
    initTheme();

    // Back button functionality
    document.querySelector('[data-back-btn]')?.addEventListener('click', () => window.history.back());
})();

const setTheme = (theme) => {
    // Set theme on root element
    document.documentElement.setAttribute('data-theme', theme);

    // Store theme preference
    localStorage.setItem('theme', theme);

    // Update body class
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';

    // Update theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Force repaint to fix any transition issues
    document.body.style.display = 'none';
    document.body.offsetHeight; // trigger reflow
    document.body.style.display = '';
};
