import { jest } from '@jest/globals';
import { generateMetadata } from '../../src/utils/filters/metadata.js';

describe('Metadata Generator', () => {
    const originalDate = global.Date;
    
    beforeAll(() => {
        // Mock Date to return consistent timestamp
        const mockDate = new Date('2025-02-27T00:00:00Z');
        global.Date = jest.fn(() => mockDate);
        global.Date.now = jest.fn(() => mockDate.getTime());
    });

    afterAll(() => {
        global.Date = originalDate;
    });

    describe('Header Generation', () => {
        test.each([
            ['hosts', 'Hosts Format'],
            ['adguard', 'AdGuard Format'],
            ['browser', 'Browser Format'],
            ['dnsrewrite', 'DNS Rewrite Rules']
        ])('generates correct title for %s format', (type, expectedTitle) => {
            const metadata = generateMetadata(type, 100);
            expect(metadata).toContain(`! Title: BlockingMachine - ${expectedTitle}`);
        });

        test('includes all required headers', () => {
            const metadata = generateMetadata('hosts', 42);
            expect(metadata).toMatch(/! Title: BlockingMachine/);
            expect(metadata).toMatch(/! Description: Comprehensive filter list/);
            expect(metadata).toMatch(/! Homepage: https:\/\/github\.com/);
            expect(metadata).toMatch(/! License: MIT/);
            expect(metadata).toMatch(/! Last modified: 2025-02-27/);
            expect(metadata).toMatch(/! Number of rules: 42/);
        });

        test('handles zero rules', () => {
            const metadata = generateMetadata('hosts', 0);
            expect(metadata).toMatch(/! Number of rules: 0/);
        });
    });

    describe('Format-Specific Headers', () => {
        test('includes hosts format headers', () => {
            const metadata = generateMetadata('hosts', 10);
            expect(metadata).toContain('! Format: hosts');
            expect(metadata).toContain('! Expires: 1 day');
        });

        test('includes AdGuard specific headers', () => {
            const metadata = generateMetadata('adguard', 10);
            expect(metadata).toContain('! Format: AdGuard');
            expect(metadata).toMatch(/! Version: \d+\.\d+/);
        });

        test('includes browser format headers', () => {
            const metadata = generateMetadata('browser', 10);
            expect(metadata).toContain('! Format: uBlock Origin');
            expect(metadata).toContain('! Expires: 1 day');
        });
    });

    describe('Error Handling', () => {
        test('handles invalid format type', () => {
            const metadata = generateMetadata('invalid', 10);
            expect(metadata).toContain('! Title: BlockingMachine');
            expect(metadata).toContain('! Format: Unknown');
        });

        test('handles invalid rule count', () => {
            const invalidCounts = [null, undefined, 'string', -1, NaN];
            
            invalidCounts.forEach(count => {
                const metadata = generateMetadata('hosts', count);
                expect(metadata).toMatch(/! Number of rules: 0/);
            });
        });
    });

    describe('Content Formatting', () => {
        test('maintains correct line endings', () => {
            const metadata = generateMetadata('hosts', 10);
            expect(metadata.split('\n').every(line => !line.includes('\r'))).toBe(true);
        });

        test('ends with blank line', () => {
            const metadata = generateMetadata('hosts', 10);
            expect(metadata.endsWith('\n\n')).toBe(true);
        });

        test('all lines start with comment marker', () => {
            const metadata = generateMetadata('hosts', 10);
            const lines = metadata.trim().split('\n');
            expect(lines.every(line => line.startsWith('!'))).toBe(true);
        });
    });
});