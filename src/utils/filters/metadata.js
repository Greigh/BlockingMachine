/**
 * Metadata Generation Module
 * 
 * This module handles the generation of metadata headers for filter lists.
 * It creates standardized headers with proper formatting based on filter type.
 */

/**
 * Generates metadata header for filter lists
 * 
 * Creates a standardized header with:
 * - Title
 * - Description
 * - Homepage link
 * - Last modification timestamp
 * - Rule count
 * - Format specification
 * 
 * The header format adapts based on filter type:
 * - Hosts files use '#' for comments
 * - AdGuard/Browser files use '!' for comments
 * 
 * @param {string} type - The filter type ('Hosts', 'AdGuard Standard', 'AdGuard DNS', 'Browser')
 * @param {number} count - The number of rules in the filter
 * @returns {string} Formatted metadata header
 * 
 * @example
 * // Generate hosts file metadata
 * const hostsMetadata = generateMetadata('Hosts', 50000);
 * 
 * // Generate AdGuard metadata
 * const adguardMetadata = generateMetadata('AdGuard Standard', 75000);
 */
export async function generateMetadata(filePath, ruleCount) {
    const now = new Date().toISOString();
    const type = getFilterType(filePath);
    
    let content = '';
    const commentChar = type === 'Hosts' ? '#' : '!';
    
    content += `${commentChar} Title: BlockingMachine ${type} Filter List\n`;
    content += `${commentChar} Description: Domain blocking rules\n`;
    content += `${commentChar} Homepage: https://github.com/greigh/BlockingMachine\n`;
    content += `${commentChar} Last modified: ${now}\n`;
    content += `${commentChar} Number of rules: ${ruleCount}\n`;
    
    if (type === 'DNS Rewrite') {
        content += `${commentChar} Format: ||domain.tld$dnsrewrite=blockingmachine.xyz\n`;
    } else if (type === 'Hosts') {
        content += `${commentChar} Format: 0.0.0.0 domain.tld\n`;
    } else {
        content += `${commentChar} Format: ||domain.tld^\n`;
    }
    
    // Add final comment character (no newline)
    content += commentChar;
    
    return content;
}

function getFilterType(filePath) {
    if (filePath.includes('dnsrewrite')) return 'DNS Rewrite';
    if (filePath.includes('hosts')) return 'Hosts';
    if (filePath.includes('browser')) return 'Browser';
    return 'AdGuard';
}