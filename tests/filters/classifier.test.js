import { jest } from '@jest/globals';
import { classifyRule, RuleType } from '../../src/utils/filters/classifier.js';

describe('Rule Classifier', () => {
    describe('Browser Rules', () => {
        test.each([
            ['element hiding', 'example.com##.ads'],
            ['global hiding', '##.cookie-banner'],
            ['exception rule', '#@#.allowed-ads'],
            ['extended CSS', '##div[class*="gdpr"]'],
            ['procedural rule', 'site.com#?#div:has(> .ad)'],
            ['CSS injection', 'example.com#$#.ad { display: none !important; }'],
            ['scriptlet injection', 'example.com#%#//scriptlet("abort-on-property-read", "ads")']
        ])('identifies %s rules correctly', (_, rule) => {
            expect(classifyRule(rule)).toBe(RuleType.BROWSER);
        });
    });

    describe('DNS Rules', () => {
        test.each([
            ['domain block', '||ads.example.com^'],
            ['DNS rewrite', '||tracker.com^$dnsrewrite=null'],
            ['hosts IPv4', '127.0.0.1 ads.com'],
            ['hosts block', '0.0.0.0 tracker.net'],
            ['wildcard domain', '||*.analytics.*^'],
            ['IP address', '||1.2.3.4^$client=127.0.0.1']
        ])('identifies %s rules correctly', (_, rule) => {
            expect(classifyRule(rule)).toBe(RuleType.DNS);
        });
    });

    describe('Browser Modifiers', () => {
        test.each([
            ['popup', '||ads.com^$popup'],
            ['script', '||tracker.com^$script'],
            ['stylesheet', '||site.com^$stylesheet'],
            ['redirect', '||ads.com^$redirect=nooptext'],
            ['removeparam', '||example.com^$removeparam=utm_source'],
            ['csp', '||site.com^$csp=script-src *'],
            ['multiple modifiers', '||ads.com^$script,stylesheet,third-party']
        ])('handles %s modifier correctly', (_, rule) => {
            expect(classifyRule(rule)).toBe(RuleType.BROWSER);
        });
    });

    describe('Edge Cases', () => {
        test.each([
            ['empty rule', '', RuleType.IGNORE],
            ['comment', '! This is a comment', RuleType.IGNORE],
            ['hosts comment', '# Blocklist', RuleType.IGNORE],
            ['whitespace only', '   ', RuleType.IGNORE],
            ['invalid syntax', '|||invalid.com', RuleType.DNS],
            ['mixed content', '||ads.com^$dnsrewrite=null,popup', RuleType.BROWSER]
        ])('handles %s correctly', (_, rule, expected) => {
            expect(classifyRule(rule)).toBe(expected);
        });
    });

    describe('Complex Rules', () => {
        test('handles combined rules', () => {
            const complexRules = [
                '||ads.com^$dnsrewrite=null|script,important',
                '||tracker.com^$removeparam=uid|dnstype=A',
                'example.com#@#.ads + div:has(> .tracking)'
            ];

            complexRules.forEach(rule => {
                expect(typeof classifyRule(rule)).toBe('string');
                expect(Object.values(RuleType)).toContain(classifyRule(rule));
            });
        });
    });
});