import { Options } from 'electron-store';
import type { FilterSource, Theme } from './global';

export interface StoreSchema {
  filterSources: FilterSource[];
  customRules: string;
  theme: Theme;
  savePath: string;
  exportFormat: string;
  lastProcessTime?: string;
}

declare module 'electron-store' {
  class Store<T = any> {
    constructor(options?: Options<T>);
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    // Add other methods as needed
  }
  export = Store;
}