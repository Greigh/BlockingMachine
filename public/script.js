'use strict';

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
        protectedTitle: 'Access blocked: <span>Ad or tracking domain</span>',
        protectedDesc: 'Access to <strong>%host%</strong> is blocked. This website may track your activity or display ads.'
    }
};

// Initialize app
(() => {
    const pageData = {
        host: window.location.host || '',
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
            const icon = item.querySelector('.faq-item__toggle-btn-icon');

            toggle?.addEventListener('click', () => {
                const isActive = toggle.classList.toggle(CONFIG.ACTIVE_CLASS);
                content?.classList.toggle(CONFIG.ACTIVE_CLASS);
                icon?.classList.toggle(CONFIG.ACTIVE_CLASS);

                // Close other dropdowns if this one was opened
                if (isActive) {
                    document.querySelectorAll('[data-dropdown-item]').forEach(other => {
                        if (other !== item) {
                            other.querySelector('[data-dropdown-toggle]')?.classList.remove(CONFIG.ACTIVE_CLASS);
                            other.querySelector('[data-dropdown-content]')?.classList.remove(CONFIG.ACTIVE_CLASS);
                            other.querySelector('.faq-item__toggle-btn-icon')?.classList.remove(CONFIG.ACTIVE_CLASS);
                        }
                    });
                }
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
            theme ? localStorage.setItem('theme', theme) : localStorage.removeItem('theme');
            themeToggle.textContent = theme === CONFIG.THEME.DARK ? '☀️' : '🌙';
        };

        // Initialize theme from storage or system preference
        setTheme(localStorage.getItem('theme'));

        // Theme toggle handler
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setTheme(currentTheme === CONFIG.THEME.DARK ? CONFIG.THEME.LIGHT : CONFIG.THEME.DARK);
        });

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
