import { jest } from '@jest/globals';
import fs from 'fs/promises';
import { StatsCounter, UpdateCounter } from '../../src/utils/stats/counter.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../src/utils/core/logger.js');

describe('StatsCounter', () => {
    let counter;

    beforeEach(() => {
        jest.clearAllMocks();
        counter = new StatsCounter();
    });

    test('initializes with zero counts', () => {
        expect(counter.getTotalRules()).toBe(0);
        expect(counter.getFilteredRules()).toBe(0);
    });

    test('increments rule counts correctly', () => {
        counter.incrementTotal(5);
        counter.incrementFiltered(2);

        expect(counter.getTotalRules()).toBe(5);
        expect(counter.getFilteredRules()).toBe(2);
    });

    test('calculates percentages correctly', () => {
        counter.incrementTotal(100);
        counter.incrementFiltered(25);

        expect(counter.getFilteredPercentage()).toBe(25);
    });

    test('handles zero division', () => {
        expect(counter.getFilteredPercentage()).toBe(0);
    });
});

describe('UpdateCounter', () => {
    let counter;

    beforeEach(() => {
        counter = new UpdateCounter();
    });

    test('handles invalid URLs', () => {
        counter.recordSuccess(null);
        counter.recordSuccess(undefined);
        counter.recordSuccess('not-a-url');
        
        const stats = counter.getStats();
        expect(stats.invalidInputs).toBe(3);
        expect(stats.total).toBe(0); // Invalid URLs shouldn't count toward total
    });

    test('tracks error types', () => {
        counter.recordFailure('https://example.com', 'Network Error');
        counter.recordFailure('https://example.org', 'Network Error');
        counter.recordFailure('https://example.net', 'Parse Error');
        
        const stats = counter.getStats();
        expect(stats.errorBreakdown['Network Error']).toBe(2);
        expect(stats.errorBreakdown['Parse Error']).toBe(1);
    });

    // ...existing tests...
});