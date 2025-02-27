export default async function handler(req, res) {
    const { url } = req.query;

    try {
        // Load filter rules
        const response = await fetch('https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/adguard-dns.txt');
        const rules = await response.text();

        // Check if URL matches any rules
        const matchedRule = rules.split('\n').find(rule => {
            if (rule && !rule.startsWith('!')) {
                const pattern = rule.replace(/\*/g, '.*').replace(/\|/g, '\\|');
                return new RegExp(pattern).test(url);
            }
            return false;
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                blocked: !!matchedRule,
                rule: matchedRule || null,
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process request' })
        };
    }
}