declare module '@blockingmachine/core' {
  export enum RuleType {
    blocking = 'blocking',
    exception = 'exception',
    comment = 'comment',
    unknown = 'unknown',
    domain = 'domain',
    hostname = 'hostname',
    regex = 'regex',
    filter = 'filter'
  }

  export enum RuleModifier {
    IMPORTANT = 'important',
    DOMAIN = 'domain',
    THIRD_PARTY = 'third-party',
    MATCH_CASE = 'match-case'
  }

  export interface RuleMetadata {
    dateAdded?: Date;
    source?: string;
    tags?: string[];
    type?: RuleType;
  }

  export interface StoredRule {
    raw: string;
    originalRule: string;
    hash: string;
    type: RuleType;
    domain?: string;
    isException?: boolean;
    source?: string;
    metadata: RuleMetadata;
    variants?: Array<{
      rule: string;
      source: string;
      dateAdded: Date;
      modifiers: RuleModifier[];
      tags: string[];
    }>;
  }

  export interface FilterListMetadata {
    title: string;
    description: string;
    homepage: string;
    version: string;
    lastUpdated: string;
    stats: {
      totalRules: number;
      uniqueRules: number;
      blockingRules: number;
      exceptionRules: number;
      duplicatesRemoved: number;
    };
    generatorVersion: string;
    license?: string;
  }

  export type FilterFormat = 
    | 'adguard'
    | 'abp'
    | 'hosts'
    | 'dnsmasq'
    | 'unbound'
    | 'domains'
    | 'plain';

  export function downloadAndParseSource(url: string): Promise<StoredRule[]>;
  export function parseFilterList(content: string, sourceUrl?: string): StoredRule[];
  export function generateFilterList(rules: StoredRule[], metadata: FilterListMetadata, format: FilterFormat): string;

  export class RuleDeduplicator {
    constructor();
    stripRule(rule: string | null | undefined): string;
  }
}