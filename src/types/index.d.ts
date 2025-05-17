import type { Options } from 'electron-store';

export interface ElectronStore<T extends Record<string, any>> {
  get<K extends keyof T>(key: K): T[K];
  get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  store: T;
  path: string;
  clear(): void;
  delete(key: keyof T): void;
  has(key: keyof T): boolean;
  // Add other store methods if needed
}

// Export the Store class type
export type { default as Store } from 'electron-store';

// Re-export types from core
export type { RuleType, FilterListMetadata } from '@blockingmachine/core';
export type StoredRule = CoreStoredRule;
export type FilterFormat = CoreFilterFormat;
export type ThemeType = 'light' | 'dark' | 'system';

// Add ProcessingResult interface
export interface ProcessingResult {
  success: boolean;
  error?: string;
  processedRuleCount: number;
  uniqueRuleCount: number;
  exceptionRuleCount?: number;
  timestamp: string;
}

export interface UpdateInfo {
  version: string;
  status: string;
  info: {
    version: string;
    files: string[];
    path: string;
    sha512: string;
    releaseDate: string;
  };
}

export interface ProcessProgress {
  status: string;
  percent: number;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface FilterSource {
  name: string;
  url: string;
  enabled: boolean;
}

export interface StoreSchema {
  filterSources: FilterSource[];
  customRules: string;
  theme: ThemeType;
  savePath: string;
  exportFormat: FilterFormat;
  lastProcessTime: string;
}

// Electron API interface
export interface ElectronAPI {
  getTheme: () => Promise<ThemeType>;
  setTheme: (theme: ThemeType) => Promise<void>;
  getSources: () => Promise<FilterSource[]>;
  saveSources: (sources: FilterSource[]) => Promise<{ success: boolean; error?: string }>;
  getCustomRules: () => Promise<string>;
  setCustomRules: (rules: string) => Promise<{ success: boolean; error?: string }>;
  getExportFormat: () => Promise<FilterFormat>;
  setExportFormat: (format: FilterFormat) => Promise<{ success: boolean; error?: string }>;
  getSavePath: () => Promise<string>;
  setSavePath: (path: string) => Promise<void>;
  selectSavePath: () => Promise<string>;
  runImportProcess: () => Promise<ProcessingResult>;
  getLastProcessTime: () => Promise<string>;
  notifyResize: (width: number, height: number) => void;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  showItemInFolder: (path: string) => void;
  onProcessProgress: (callback: (data: { status: string; percent: number }) => void) => void;
  removeProcessProgressListener: () => void;
  onUpdateStatus: (callback: (status: string) => void) => void;
  onUpdateProgress: (callback: (progress: number) => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Global declarations
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}