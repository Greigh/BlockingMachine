/**
 * Converts a line from a hosts file to an AdGuard rule.
 * 
 * @param {string} line - The line from the hosts file to convert.
 * @param {boolean} [includeDnsRewrite=true] - Whether to include the DNS rewrite directive in the rule.
 * @returns {string|null} - The converted AdGuard rule, or null if the line should be ignored.
 */
async function convertToAdGuardRule(line, includeDnsRewrite = true) {
    // Ignore specific localhost and broadcast addresses
    if (
        line === '127.0.0.1 localhost' ||
        line === '127.0.0.1 localhost.localdomain' ||
        line === '127.0.0.1 local' ||
        line === '255.255.255.255 broadcasthost' ||
        line === '::1 localhost' ||
        line === '::1 ip6-localhost' ||
        line === '::1 ip6-loopback' ||
        line === 'fe80::1%lo0 localhost' ||
        line === 'ff00::0 ip6-localnet' ||
        line === 'ff00::0 ip6-mcastprefix' ||
        line === 'ff02::1 ip6-allnodes' ||
        line === 'ff02::2 ip6-allrouters' ||
        line === 'ff02::3 ip6-allhosts' ||
        line === '0.0.0.0 0.0.0.0'
    ) {
        return null; // Ignore these lines
    }

    // Ignore lines starting with specific addresses
    if (
        line.startsWith('255.255.255.255') ||
        line.startsWith('::1') ||
        line.startsWith('fe80::1%lo0') ||
        line.startsWith('ff00::0') ||
        line.startsWith('ff02::1') ||
        line.startsWith('ff02::2') ||
        line.startsWith('ff02::3')
    ) {
        return null; // Ignore these lines
    }

    // Convert lines starting with 0.0.0.0 or 127.0.0.1 to AdGuard rules
    if (line.startsWith('0.0.0.0') || line.startsWith('127.0.0.1')) {
        const parts = line.split(/\s+/); // Split the line by whitespace
        if (parts.length > 1) {
            // Return the AdGuard rule with or without DNS rewrite directive
            return includeDnsRewrite ? `||${parts[1]}^$dns-rewrite=greigh.github.io/BlockingMachine` : `||${parts[1]}^`;
        }
        return line; // Return the original line if it doesn't have a second part
    }

    return line; // Return the original line if it doesn't match any of the above conditions
}

// Export the convertToAdGuardRule function
module.exports = {
    convertToAdGuardRule
};