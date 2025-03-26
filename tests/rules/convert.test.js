import {
    convertToHostsRule,
    convertToAdGuardRule,
    convertToBrowserRule
} from '../../src/rules/convert.js';

describe('Rule Conversion', () => {
    describe('Hosts Format', () => {
        test.each([
            ['AdGuard rule', '||ads.example.com^', '0.0.0.0 ads.example.com'],
            ['existing hosts rule', '0.0.0.0 tracker.net', '0.0.0.0 tracker.net'],
            ['alternate IP', '127.0.0.1 malware.com', '0.0.0.0 malware.com'],
            ['wildcard domain', '||*.analytics.*^', null],
            ['element hiding', 'example.com##.ads', null],
            ['invalid rule', 'invalid.rule###', null],
            ['empty string', '', null]
        ])('converts %s correctly', async (_, input, expected) => {
            expect(await convertToHostsRule(input)).toBe(expected);
        });

        test('handles subdomains correctly', async () => {
            const rules = [
                '||sub.example.com^',
                '||sub1.sub2.example.com^'
            ];
            
            for (const rule of rules) {
                const result = await convertToHostsRule(rule);
                expect(result).toMatch(/^0\.0\.0\.0 .+/);
                expect(result.split(' ')[1]).toBe(rule.replace(/^\|\||\^$/g, ''));
            }
        });
    });

    describe('AdGuard Format', () => {
        test.each([
            ['hosts rule with dnsrewrite', 
             '0.0.0.0 ads.com', 
             '||ads.com^$dnsrewrite=blockingmachine.xyz',
             true],
            ['hosts rule without dnsrewrite',
             '0.0.0.0 tracker.net',
             '||tracker.net^',
             false],
            ['existing AdGuard rule',
             '||analytics.com^$important',
             '||analytics.com^$important',
             false],
            ['IP address',
             '0.0.0.0 1.2.3.4',
             '||1.2.3.4^',
             false]
        ])('converts %s correctly', async (_, input, expected, dnsRewrite) => {
            expect(await convertToAdGuardRule(input, dnsRewrite)).toBe(expected);
        });

        test('preserves existing modifiers', async () => {
            const rule = '||ads.com^$important,third-party';
            expect(await convertToAdGuardRule(rule, true))
                .toBe('||ads.com^$important,third-party,dnsrewrite=blockingmachine.xyz');
        });
    });

    describe('Browser Format', () => {
        test.each([
            ['element hiding rule', 
             'example.com##.ads', 
             'example.com##.ads'],
            ['global hiding rule',
             '##.cookie-notice',
             '##.cookie-notice'],
            ['procedural rule',
             'site.com#?#div:has(> .ad)',
             'site.com#?#div:has(> .ad)'],
            ['DNS rule',
             '||tracker.com^',
             null],
            ['hosts rule',
             '0.0.0.0 ads.com',
             null]
        ])('converts %s correctly', async (_, input, expected) => {
            expect(await convertToBrowserRule(input)).toBe(expected);
        });

        test('preserves complex selectors', async () => {
            const rules = [
                'example.com##div[class*="ad-"] > .wrapper + .content',
                'site.com#?#div:has(> .social-share):not(.important)',
                'blog.com#$#.sticky { position: static !important; }'
            ];

            for (const rule of rules) {
                expect(await convertToBrowserRule(rule)).toBe(rule);
            }
        });
    });

    describe('Error Handling', () => {
        test('handles invalid inputs gracefully', async () => {
            const invalidInputs = [
                null,
                undefined,
                {},
                [],
                123,
                true,
                '|||invalid.com'
            ];

            for (const input of invalidInputs) {
                expect(await convertToHostsRule(input)).toBeNull();
                expect(await convertToAdGuardRule(input)).toBeNull();
                expect(await convertToBrowserRule(input)).toBeNull();
            }
        });
    });
});