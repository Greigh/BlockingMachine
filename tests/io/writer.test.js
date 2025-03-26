import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { writeFilterSets } from '../../src/utils/io/writer.js';

// Mock filesystem and logger
jest.mock('fs/promises');
jest.mock('../../src/utils/core/logger.js', () => ({
    logMessage: jest.fn(),
    LogLevel: { INFO: 'INFO', ERROR: 'ERROR', DEBUG: 'DEBUG' }
}));

describe('Filter Writer Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.writeFile.mockResolvedValue(undefined);
    });

    describe('Writing Filter Sets', () => {
        test('writes all filter sets correctly', async () => {
            const mockSets = {
                hostsSet: new Set(['0.0.0.0 ads.com', '0.0.0.0 tracker.net']),
                adGuard: new Set(['||ads.com^', '||tracker.net^']),
                browserRules: new Set(['site.com##.ads', '##.cookie-notice'])
            };

            const mockPaths = {
                hostsSet: '/filters/hosts.txt',
                adGuard: '/filters/adguard.txt',
                browserRules: '/filters/browser.txt'
            };

            await writeFilterSets(mockSets, mockPaths);

            expect(fs.writeFile).toHaveBeenCalledTimes(3);
            expect(fs.writeFile.mock.calls[0][1]).toContain('0.0.0.0 ads.com');
            expect(fs.writeFile.mock.calls[1][1]).toContain('||ads.com^');
            expect(fs.writeFile.mock.calls[2][1]).toContain('site.com##.ads');
        });

        test('includes metadata headers', async () => {
            const sets = {
                hostsSet: new Set(['0.0.0.0 example.com'])
            };
            const paths = {
                hostsSet: '/filters/hosts.txt'
            };

            await writeFilterSets(sets, paths);

            const writtenContent = fs.writeFile.mock.calls[0][1];
            expect(writtenContent).toMatch(/! Title: BlockingMachine/);
            expect(writtenContent).toMatch(/! Last modified:/);
            expect(writtenContent).toMatch(/! Number of rules:/);
        });

        test('handles empty sets', async () => {
            const sets = {
                hostsSet: new Set(),
                adGuard: new Set(),
                browserRules: new Set()
            };
            const paths = {
                hostsSet: '/filters/hosts.txt',
                adGuard: '/filters/adguard.txt',
                browserRules: '/filters/browser.txt'
            };

            await writeFilterSets(sets, paths);

            expect(fs.writeFile).toHaveBeenCalledTimes(3);
            for (const call of fs.writeFile.mock.calls) {
                expect(call[1]).toMatch(/! Number of rules: 0/);
            }
        });

        test('handles missing paths', async () => {
            const sets = {
                hostsSet: new Set(['0.0.0.0 example.com'])
            };
            const paths = {};

            await expect(writeFilterSets(sets, paths))
                .rejects
                .toThrow('No path defined for set type: hostsSet');
        });

        test('handles write errors', async () => {
            const sets = {
                hostsSet: new Set(['0.0.0.0 example.com'])
            };
            const paths = {
                hostsSet: '/filters/hosts.txt'
            };

            fs.writeFile.mockRejectedValue(new Error('Write failed'));

            await expect(writeFilterSets(sets, paths))
                .rejects
                .toThrow('Write failed');
        });

        test('preserves rule order', async () => {
            const orderedRules = [
                '0.0.0.0 first.com',
                '0.0.0.0 second.com',
                '0.0.0.0 third.com'
            ];

            const sets = {
                hostsSet: new Set(orderedRules)
            };
            const paths = {
                hostsSet: '/filters/hosts.txt'
            };

            await writeFilterSets(sets, paths);

            const content = fs.writeFile.mock.calls[0][1];
            const extractedRules = content
                .split('\n')
                .filter(line => line.startsWith('0.0.0.0'));

            expect(extractedRules).toEqual(orderedRules);
        });
    });
});