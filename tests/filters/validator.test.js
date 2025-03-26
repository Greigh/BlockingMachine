import { jest } from '@jest/globals';
import {
  isValidDnsRule,
  isValidHostsRule,
  isValidBrowserRule,
} from '../../src/utils/filters/validator.js';

describe('Filter Validator', () => {
  describe('DNS Rules', () => {
    test('validates correct DNS rules', () => {
      const validRules = [
        '||ads.example.com^',
        '||tracker.com$third-party',
        '||analytics.net^$important',
      ];

      validRules.forEach((rule) => {
        expect(isValidDnsRule(rule)).toBe(true);
      });
    });

    test('rejects invalid DNS rules', () => {
      const invalidRules = [
        'ads.example.com',
        '|ads.com',
        '||invalid@domain.com^',
        '',
        null,
        undefined,
      ];

      invalidRules.forEach((rule) => {
        expect(isValidDnsRule(rule)).toBe(false);
      });
    });
  });

  describe('Hosts Rules', () => {
    test('validates correct hosts rules', () => {
      const validRules = [
        '0.0.0.0 ads.example.com',
        '127.0.0.1 tracker.net',
        '0.0.0.0 analytics.com',
      ];

      validRules.forEach((rule) => {
        expect(isValidHostsRule(rule)).toBe(true);
      });
    });

    test('rejects invalid hosts rules', () => {
      const invalidRules = [
        'ads.example.com',
        '1.2.3.4 domain.com',
        '0.0.0.0',
        '0.0.0.0 invalid@domain.com',
        '',
        null,
      ];

      invalidRules.forEach((rule) => {
        expect(isValidHostsRule(rule)).toBe(false);
      });
    });
  });

  describe('Browser Rules', () => {
    test('validates correct browser rules', () => {
      const validRules = [
        '##.ad-container',
        'example.com##.sponsored',
        'site.com#@#.social-share',
        'domain.com#?#div:has(> .ad)',
      ];

      validRules.forEach((rule) => {
        expect(isValidBrowserRule(rule)).toBe(true);
      });
    });

    test('rejects invalid browser rules', () => {
      const invalidRules = [
        '.ad-container',
        'invalid@domain##.ads',
        '##',
        '',
        null,
      ];

      invalidRules.forEach((rule) => {
        expect(isValidBrowserRule(rule)).toBe(false);
      });
    });
  });
});
