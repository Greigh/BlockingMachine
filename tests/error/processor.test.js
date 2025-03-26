import { jest } from '@jest/globals';
import { FilterProcessor } from '../../src/rules/processors.js';
import { logMessage } from '../../src/utils/core/logger.js';

// Mock logger
jest.mock('../../src/utils/core/logger.js', () => ({
    logMessage: jest.fn(),
    LogLevel: { INFO: 'INFO', ERROR: 'ERROR', DEBUG: 'DEBUG' }
}));

describe('Processor Error Handling', () => {
    let processor;

    beforeEach(() => {
        jest.clearAllMocks();
        processor = new FilterProcessor(true, false);
    });

    test('handles invalid rule formats', async () => {
        const invalidRules = [
            '|||invalid.com',
            'example.com####invalid',
            '$$$domain=invalid',
            null,
            undefined,
            '',
            '   ',
            '#@#invalid',
            '0.0.0.0',
            '||'
        ];

        for (const rule of invalidRules) {
            await processor.processLine(rule);
            
            // Verify no invalid rules were added
            expect(processor.sets.hostsSet.size).toBe(0);
            expect(processor.sets.adGuardSet.size).toBe(0);
            expect(processor.sets.browserRulesSet.size).toBe(0);
            
            // Verify error was logged
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('Invalid rule format'),
                'ERROR'
            );
        }
    });

    test('handles malformed rules gracefully', async () => {
        const malformedRules = [
            // Malformed hosts rules
            '0.0.0.0',
            '256.256.256.256 domain.com',
            
            // Malformed AdGuard rules
            '||domain.com', // missing modifier
            '||*.com^$invalid',
            
            // Malformed browser rules
            'domain.com##',
            '##..invalid',
            '#@#[invalid'
        ];

        for (const rule of malformedRules) {
            await processor.processLine(rule);
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('Malformed rule'),
                'ERROR'
            );
        }
    });

    test('recovers from processing errors', async () => {
        const mixedRules = [
            'invalid####rule',
            '||valid.com^$dnsrewrite=null',
            'malformed##selector',
            '0.0.0.0 valid.net'
        ];

        for (const rule of mixedRules) {
            await processor.processLine(rule);
        }

        // Valid rules should be processed despite errors
        expect(processor.sets.adGuardSet.size).toBe(1);
        expect(processor.sets.hostsSet.size).toBe(1);
        expect(processor.sets.browserRulesSet.size).toBe(0);
    });
});