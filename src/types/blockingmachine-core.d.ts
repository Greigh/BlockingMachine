declare module '@blockingmachine/core' {
  // Enums that need to be exported
  export enum RuleType {
    blocking = 'blocking',
    exception = 'exception',
    comment = 'comment',
    unknown = 'unknown'
  }
  
  export enum RuleModifier {
    IMPORTANT = 'important',
    DOMAIN = 'domain',
    THIRD_PARTY = 'third-party',
    MATCH_CASE = 'match-case',
    // Add other modifiers as needed
  }
  
  // Add missing type export for FilterFormat
  export type FilterFormat = 
    | 'adguard'
    | 'abp'
    | 'hosts'
    | 'dnsmasq'
    | 'unbound'
    | 'domains'
    | 'plain';
    
  // Extend the RuleMetadata interface properly
  export interface RuleMetadata {
    dateAdded: Date;
    source: string;
    tags: string[];
  }
  
  // Add StatsData interface for use in FilterListMetadata
  export interface StatsData {
    totalRules?: number;
    blockingRules?: number;
    exceptionRules?: number;
  }
  
  // Add missing FilterListMetadata interface
  export interface FilterListMetadata {
    title: string;
    description: string;
    homepage: string;
    version: string;
    lastUpdated: string;
    license?: string;
    generatorVersion?: string;
    stats?: StatsData;
  }
  
  // Advanced formatter functionality
  export function generateFilterList(
    rules: StoredRule[],
    metadata: FilterListMetadata,
    format: FilterFormat
  ): string;

  // Add StoredRule interface
  export interface StoredRule {
    raw: string;
    originalRule: string;
    hash: string;
    type: RuleType;
    domain?: string;
    isException?: boolean;
    metadata: RuleMetadata;
    variants?: Array<{
      rule: string;
      source: string;
      dateAdded: Date;
      modifiers: RuleModifier[];
      tags: string[];
    }>;
  }

  // Add the missing exports TypeScript is complaining about
  
  /**
   * Downloads and parses a filter list from a URL
   */
  export function downloadAndParseSource(url: string): Promise<StoredRule[]>;
  
  /**
   * Parses a filter list content into an array of StoredRule objects
   */
  export function parseFilterList(content: string, sourceUrl?: string): StoredRule[];
  
  /**
   * Rule Deduplicator class for handling rule deduplication
   */
  export class RuleDeduplicator {
    constructor();
    
    /**
     * Strip a rule to its essential components
     */
    stripRule(rule: string | null | undefined): string;
  }
  
  /**
   * Rule Store class for managing filter rules
   */
  export class RuleStore {
    /**
     * Get all rules in the store
     */
    getRules(): StoredRule[];
    
    /**
     * Add rules to the store
     */
    addRules(rules: StoredRule[]): void;
    
    /**
     * Get rule count
     */
    getRuleCount(): number;
    
    /**
     * Clear all rules
     */
    clear(): void;
    
    // Add other methods used in your app
  }
}