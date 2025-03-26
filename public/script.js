/**
 * BlockingMachine Frontend Script
 * 
 * Handles all client-side functionality including:
 * - Theme management (dark/light mode)
 * - Localization
 * - Content updates
 * - Dropdown interactions
 * - Demo button visibility
 * 
 * @module script
 */

'use strict';

/**
 * Initializes the application when DOM is fully loaded
 * Handles demo button visibility and theme initialization
 * 
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function () {
    const demoButton = document.getElementById('demoButton');
    const isProduction = window.location.hostname === 'greigh.github.io' ||
        window.location.hostname === '127.0.0.1';

    if (demoButton) {
        if (isProduction) {
            demoButton.style.display = 'block';
            demoButton.href = '/BlockingMachine/demo'; // Fix demo path
        } else {
            demoButton.style.display = 'none';
        }
    }

    // Use ThemeManager exclusively
    ThemeManager.init();
});

/**
 * @typedef {Object} AppConfig
 * @property {string} PAGE_TYPE - Type of page being displayed
 * @property {string} APP_NAME - Application name
 * @property {string} ACTIVE_CLASS - CSS class for active elements
 * @property {string} DEFAULT_LOCALE - Fallback locale
 * @property {Object} THEME - Theme configuration
 * @property {string} THEME.LIGHT - Light theme identifier
 * @property {string} THEME.DARK - Dark theme identifier
 */

/** @type {AppConfig} */
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

/**
 * Localization strings for all supported languages
 * Currently supports English (en) with placeholders for:
 * - %reports_url% - GitHub issues URL
 * - %host% - Blocked domain name
 * 
 * @constant {Object.<string, Object.<string, string>>}
 */
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

/**
 * Main application initialization
 * Self-executing function to avoid global scope pollution
 * 
 * Handles:
 * - URL parameter parsing
 * - Content localization
 * - Dropdown functionality
 * - Theme management
 * - Back button behavior
 */
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
        try {
            const locale = navigator.language?.toLowerCase().split('-')[0];
            const strings = LOCALES[locale] || LOCALES[CONFIG.DEFAULT_LOCALE];

            if (!strings) {
                console.error(`No localization found for ${locale}`);
                return;
            }

            document.querySelectorAll('[data-id]').forEach(element => {
                try {
                    const key = element.dataset.id;
                    if (!key || !strings[key]) {
                        console.warn(`Missing translation key: ${key}`);
                        return;
                    }

                    let text = strings[key];
                    Object.entries(pageData).forEach(([key, value]) => {
                        text = text.replace(new RegExp(`%${key}%`, 'g'), value);
                    });
                    element.innerHTML = text;
                } catch (elementError) {
                    console.error(`Error updating element ${element.dataset.id}:`, elementError);
                }
            });
        } catch (error) {
            console.error('Failed to update content:', error);
            // Show fallback content
            document.querySelector('[data-id="protectedTitle"]').textContent = 'Access Blocked';
        }
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

    // Initialize everything
    updateContent();
    setupDropdowns();

    // Back button functionality
    document.querySelector('[data-back-btn]')?.addEventListener('click', () => window.history.back());
})();

/**
 * Theme Management Module
 * @namespace
 */
const ThemeManager = {
    /**
     * Gets system color scheme preference
     * @returns {string} 'dark' or 'light'
     */
    getSystemTheme: () =>
        window.matchMedia('(prefers-color-scheme: dark)').matches ?
            CONFIG.THEME.DARK : CONFIG.THEME.LIGHT,

    /**
     * Sets and persists theme
     * @param {string} theme - Theme to apply ('dark' or 'light')
     */
    setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = `${theme}-theme`;
        localStorage.setItem('theme', theme);

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === CONFIG.THEME.DARK ? '☀️' : '🌙';
        }

        // Force repaint to fix transitions
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
    },

    /**
     * Initializes theme system
     */
    init: () => {
        const savedTheme = localStorage.getItem('theme') || ThemeManager.getSystemTheme();
        ThemeManager.setTheme(savedTheme);

        // Watch for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    ThemeManager.setTheme(e.matches ? CONFIG.THEME.DARK : CONFIG.THEME.LIGHT);
                }
            });
    }
};
