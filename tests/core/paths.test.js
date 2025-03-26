import { jest } from '@jest/globals';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { logMessage } from '../../src/utils/core/logger.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../src/utils/core/logger.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../..');

describe('Paths Module', () => {
    const mockRoot = process.cwd();
    const mockFiltersDir = resolve(mockRoot, 'public/filters');
    let paths;

    beforeEach(async () => {
        jest.resetAllMocks();
        fs.access.mockResolvedValue(undefined);
        
        // Import paths fresh for each test
        jest.isolateModules(async () => {
            paths = await import('../../src/utils/core/paths.js');
        });
    });

    describe('Directory Management', () => {
        test('ensures filters directory exists', async () => {
            fs.access.mockRejectedValueOnce(new Error('ENOENT'));
            
            expect(paths.filtersDir).toBe(mockFiltersDir);
            expect(fs.mkdir).toHaveBeenCalledWith(
                expect.stringContaining('public/filters'),
                { recursive: true }
            );
        });

        test('handles existing directory', async () => {
            expect(fs.mkdir).not.toHaveBeenCalled();
            expect(paths.filtersDir).toBe(mockFiltersDir);
        });
    });

    describe('File Management', () => {
        test('validates and creates missing files', async () => {
            const testPath = resolve(mockFiltersDir, 'test.txt');
            fs.access.mockRejectedValueOnce(new Error('ENOENT'));
            
            await paths.validateAndEnsureFile(testPath, 'test content');
            
            expect(fs.writeFile).toHaveBeenCalledWith(
                testPath,
                'test content',
                { mode: 0o644 }
            );
        });

        test('skips existing files', async () => {
            const testPath = resolve(mockFiltersDir, 'existing.txt');
            await paths.validateAndEnsureFile(testPath);
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        test('handles permission errors', async () => {
            const testPath = resolve(mockFiltersDir, 'noaccess.txt');
            fs.access.mockRejectedValueOnce(new Error('EACCES'));
            
            await expect(paths.validateAndEnsureFile(testPath))
                .rejects
                .toThrow(/Permission error/);
        });
    });

    describe('Path Exports', () => {
        test.each([
            ['thirdPartyFilters', 'thirdPartyFilters.txt'],
            ['adguardDnsrewrite', 'adguard_dnsrewrite.txt'],
            ['browserRules', 'browserRules.txt'],
            ['adguard', 'adguard.txt'],
            ['hosts', 'hosts.txt'],
            ['stats', 'stats.json']
        ])('exports %s path correctly', (key, filename) => {
            expect(paths[key]).toBeValidPath();
            expect(paths[key]).toContain(filename);
        });
    });

    test('handles path resolution correctly', () => {
        expect(paths.filtersDir).toBeTruthy();
        expect(paths.filtersDir).toBeValidPath();
    });
});