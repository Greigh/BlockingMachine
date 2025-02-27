// Constants for rule patterns
const COMMENT_PATTERNS = ['#', '!', '//'];
const HOSTS_PATTERNS = ['0.0.0.0', '127.0.0.1'];
const ELEMENT_HIDING_PATTERNS = ['##', '#@#', '#?#', '#$#', '#%#', '#@$#'];
const COSMETIC_PATTERNS = [
    ':style(', ':has(', ':has-text(', ':xpath(',
    ':matches-css', ':nth-ancestor(', ':upward('
];
const BROWSER_MODIFIERS = {
    resource: [
        '$script',
        '$stylesheet',
        '$image',
        '$media',
        '$object',
        '$font',
        '$xmlhttprequest',
        '$websocket'
    ],
    targeting: [
        '$popup',
        '$third-party',
        '$important',
        '$redirect=',
        '$domain=',
        '$elemhide',
        '$generichide'
    ]
};

/**
 * Checks if a line is a comment or empty
 * @param {string} line - The line to check
 * @returns {boolean}
 */
const isCommentOrEmpty = (line) => {
    return !line || COMMENT_PATTERNS.some(pattern => line.startsWith(pattern));
};

/**
 * Checks if a line is in hosts format
 * @param {string} line - The line to check
 * @returns {boolean}
 */
const isHostsFormat = (line) => {
    return HOSTS_PATTERNS.some(pattern => line.startsWith(pattern));
};

/**
 * Normalizes a network filter rule
 * @param {string} line - The rule to normalize
 * @returns {string}
 */
const normalizeNetworkRule = (line) => {
    let rule = line;

    // Add || prefix if missing
    if (!rule.startsWith('||') && !rule.startsWith('@@')) {
        rule = `||${rule}`;
    }

    // Add ^ before $ modifiers if missing
    if (!rule.includes('^$') && rule.includes('$')) {
        rule = rule.replace('$', '^$');
    }

    return rule;
};

/**
 * Converts a line from a hosts file to an AdGuard rule.
 * 
 * @param {string} line - The line from the hosts file to convert.
 * @param {boolean} [includeDnsRewrite=true] - Whether to include the DNS rewrite directive in the rule.
 * @returns {string|null} - The converted AdGuard rule, or null if the line should be ignored.
 */
export async function convertToAdGuardRule(line, includeDnsRewrite = true) {
    if (isCommentOrEmpty(line)) return null;

    if (isHostsFormat(line)) {
        const parts = line.split(/\s+/);
        if (parts.length > 1) {
            const rule = includeDnsRewrite
                ? `||${parts[1]}^$dnsrewrite=blockingmachine.xyz`
                : `||${parts[1]}^`;
            return rule;
        }
    }

    if (line.startsWith('||')) {
        // Don't modify existing AdGuard rules unless they need DNS rewrite
        if (!includeDnsRewrite || line.includes('$dnsrewrite')) {
            return line;
        }

        // Only add DNS rewrite to domain-only rules
        const basePath = line.split('$')[0].replace(/\^+$/, '');
        if (!basePath.includes('/')) {
            const rule = `${basePath}^$dnsrewrite=blockingmachine.xyz`;
            return rule;
        }
        return line;
    } else if (line.startsWith('@@||')) {
        return line;
    }

    return null;
}

/**
 * Converts a line from a hosts file or AdGuard rule to a browser rule.
 * 
 * @param {string} line - The line to convert.
 * @returns {string|null} - The converted browser rule, or null if the line should be ignored.
 */
export async function convertToBrowserRule(line) {
    if (isCommentOrEmpty(line)) return null;

    // Debug logging
    console.log('Converting to browser rule:', line);

    // Keep existing element hiding and cosmetic rules as-is
    if (ELEMENT_HIDING_PATTERNS.some(p => line.includes(p)) ||
        COSMETIC_PATTERNS.some(p => line.includes(p))) {
        console.log('Keeping element hiding/cosmetic rule:', line);
        return line;
    }

    // Don't convert DNS rewrite rules to browser rules
    if (line.includes('$dnsrewrite')) {
        console.log('Skipping DNS rewrite rule:', line);
        return null;
    }

    // Handle browser-specific modifiers
    const allModifiers = [...BROWSER_MODIFIERS.resource, ...BROWSER_MODIFIERS.targeting];
    if (allModifiers.some(mod => line.includes(mod))) {
        const normalized = normalizeNetworkRule(line);
        console.log('Normalized browser rule:', { original: line, converted: normalized });
        return normalized;
    }

    return null;
}

/**
 * Converts a line from a hosts file or AdGuard rule to a hosts rule.
 * 
 * @param {string} line - The line to convert.
 * @returns {string|null} - The converted hosts rule, or null if the line should be ignored.
 */
export async function convertToHostsRule(line) {
    if (isCommentOrEmpty(line)) return null;
    if (isHostsFormat(line)) return line;

    // Convert network rules to hosts format
    if (line.startsWith('||')) {
        const domain = line.replace(/^\|\|/, '')
            .split('^')[0]
            .split('$')[0];

        if (domain && !domain.includes('*') && !domain.includes('/')) {
            return `0.0.0.0 ${domain}`;
        }
    }

    // Convert basic domain blocks
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(line)) {
        return `0.0.0.0 ${line}`;
    }

    return null;
}