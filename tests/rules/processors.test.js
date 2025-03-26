import { jest } from '@jest/globals';
import { FilterProcessor } from '../../src/rules/processors.js';

// Mock logger
jest.mock('../../src/utils/core/logger.js', () => ({
    logMessage: jest.fn(),
    LogLevel: { INFO: 'INFO', ERROR: 'ERROR', DEBUG: 'DEBUG' }
}));

describe('FilterProcessor', () => {
    let processor;

    beforeEach(() => {
        jest.clearAllMocks();
        processor = new FilterProcessor(true, false);
    });

    describe('Rule Processing', () => {
        test.each([
            ['DNS rules', [
                '||ads.example.com^',
                '0.0.0.0 tracker.net',
                '127.0.0.1 malware.com'
            ]],
            ['Browser rules', [
                'example.com##.ads',
                '##.cookie-notice',
                'site.com#?#div:has(> .ad)'
            ]],
            ['Mixed rules', [
                '||ads.com^$dnsrewrite=null',
                'site.com##.banner',
                '0.0.0.0 tracker.net'
            ]]
        ])('processes %s correctly', async (_, rules) => {
            for (const rule of rules) {
                await processor.processLine(rule);
            }

            expect(processor.sets.combinedSet.size).toBeGreaterThan(0);
        });

        test('handles rules with modifiers', async () => {
            const modifiedRules = [
                '||ads.com^$important,third-party',
                '||tracker.net^$dnsrewrite=null',
                'site.com^$removeparam=utm_source'
            ];

            for (const rule of modifiedRules) {
                await processor.processLine(rule);
            }

            expect(processor.sets.adGuardSet.size).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        test('handles invalid rules gracefully', async () => {
            const invalidRules = [
                '',
                '! Comment',
                '# Hosts comment',
                'invalid.###',
                '   ',
                null,
                undefined
            ];

            for (const rule of invalidRules) {
                await processor.processLine(rule);
            }

            expect(processor.sets.hostsSet.size).toBe(0);
            expect(processor.sets.browserRulesSet.size).toBe(0);
        });

        test('processes partial valid rules', async () => {
            const mixedRules = [
                '||valid.com^',
                'invalid####',
                '0.0.0.0 valid.net',
                '|||invalid.com'
            ];

            for (const rule of mixedRules) {
                await processor.processLine(rule);
            }

            expect(processor.sets.combinedSet.size).toBe(2);
        });
    });

    describe('Set Management', () => {
        test('maintains unique rules', async () => {
            const duplicateRules = [
                '||ads.com^',
                '||ads.com^',
                '0.0.0.0 ads.com',
                '0.0.0.0 ads.com'
            ];

            for (const rule of duplicateRules) {
                await processor.processLine(rule);
            }

            expect(processor.sets.hostsSet.size).toBe(1);
            expect(processor.sets.adGuardSet.size).toBe(1);
        });

        test('processes rules in debug mode', async () => {
            processor = new FilterProcessor(true, true);
            await processor.processLine('||debug.com^');
            expect(processor.sets.adGuardSet.size).toBe(1);
        });
    });
});