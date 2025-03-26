import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import axios from 'axios';
import { updateAllLists } from '../../src/rules/filterUpdate.js';
import { logMessage } from '../../src/utils/core/logger.js';

// Mock dependencies
jest.mock('axios');
jest.mock('fs/promises');
jest.mock('../../src/utils/core/logger.js', () => ({
    logMessage: jest.fn(),
    LogLevel: { INFO: 'INFO', ERROR: 'ERROR', DEBUG: 'DEBUG' }
}));

describe('Filter Update Module', () => {
    const mockFilterUrls = [
        'https://example.com/filter1.txt',
        'https://example.com/filter2.txt'
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock successful file operations
        fs.readFile.mockResolvedValue(mockFilterUrls.join('\n'));
        fs.writeFile.mockResolvedValue(undefined);
        // Mock successful HTTP responses
        axios.get.mockImplementation((url) => Promise.resolve({
            data: '||ads.example.com^\n0.0.0.0 tracker.net'
        }));
    });

    describe('Update Process', () => {
        test('updates all filter lists successfully', async () => {
            const result = await updateAllLists(false, false);
            
            expect(axios.get).toHaveBeenCalledTimes(mockFilterUrls.length);
            expect(result.total).toBeGreaterThan(0);
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('Successfully updated'),
                'INFO'
            );
        });

        test('handles debug mode correctly', async () => {
            await updateAllLists(true, false);
            
            expect(logMessage).toHaveBeenCalledWith(
                expect.any(String),
                'DEBUG'
            );
        });

        test('handles verbose mode correctly', async () => {
            await updateAllLists(false, true);
            
            expect(logMessage).toHaveBeenCalledWith(
                expect.any(String),
                'INFO',
                expect.any(String),
                true
            );
        });
    });

    describe('Error Handling', () => {
        test('handles filter URL file read errors', async () => {
            fs.readFile.mockRejectedValue(new Error('File not found'));
            
            await expect(updateAllLists(false, false))
                .rejects
                .toThrow('File not found');
        });

        test('handles HTTP request failures', async () => {
            axios.get.mockRejectedValueOnce(new Error('Network error'));
            
            const result = await updateAllLists(false, false);
            expect(result.failed).toBeGreaterThan(0);
            expect(logMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to fetch'),
                'ERROR'
            );
        });

        test('continues processing on partial failures', async () => {
            axios.get
                .mockResolvedValueOnce({ data: '||ads.com^' })
                .mockRejectedValueOnce(new Error('Failed'))
                .mockResolvedValueOnce({ data: '0.0.0.0 tracker.net' });

            const result = await updateAllLists(false, false);
            expect(result.success).toBeGreaterThan(0);
            expect(result.failed).toBeGreaterThan(0);
        });
    });

    describe('File Operations', () => {
        test('writes updated filter sets', async () => {
            await updateAllLists(false, false);
            
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.any(Object)
            );
        });

        test('handles write permission errors', async () => {
            fs.writeFile.mockRejectedValue(new Error('Permission denied'));
            
            await expect(updateAllLists(false, false))
                .rejects
                .toThrow('Permission denied');
        });
    });

    describe('Statistics', () => {
        test('reports accurate statistics', async () => {
            const result = await updateAllLists(false, false);
            
            expect(result).toEqual(expect.objectContaining({
                total: expect.any(Number),
                success: expect.any(Number),
                failed: expect.any(Number),
                duration: expect.any(Number)
            }));
        });

        test('handles empty filter lists', async () => {
            fs.readFile.mockResolvedValue('');
            
            const result = await updateAllLists(false, false);
            expect(result.total).toBe(0);
        });
    });
});