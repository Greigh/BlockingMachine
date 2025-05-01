import { IpcMainEvent, IpcRendererEvent } from 'electron';

// Module declarations - move all these outside namespaces
declare module 'react' {}
declare module 'react/jsx-runtime' {}
declare module 'react-dom/client' {}

// CSS modules declaration - consolidated to one place
declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Asset module declarations
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

// Existing type definitions
export interface FilterSource {
  name: string;
  url: string;
  enabled: boolean;
}

export interface ProcessingResult {
  success: boolean;
  error: string;
  processedRuleCount: number;
  uniqueRuleCount: number;
  exceptionRuleCount?: number;
  timestamp: string;
}

export type Theme = 'light' | 'dark' | 'system';

// Electron API interface
export interface ElectronAPI {
  getSources: () => Promise<FilterSource[]>;
  saveSources: (sources: FilterSource[]) => Promise<{ success: boolean; error?: string }>;
  getCustomRules: () => Promise<string>;
  saveCustomRules: (rules: string) => Promise<{ success: boolean; error?: string }>;
  runImportProcess: () => Promise<ProcessingResult>;
  getTheme: () => Promise<Theme>;
  setTheme: (theme: Theme) => Promise<void>;
  notifyResize: (width: number, height: number) => void;
  selectSavePath: () => Promise<{ success: boolean; path?: string; error?: string }>;
  getSavePath: () => Promise<string>;
  browseSavePath(): Promise<{ path: string | null; success: boolean }>;
  setSavePath(path: string): Promise<void>;
  getExportFormat: () => Promise<string>;
  setExportFormat: (format: string) => Promise<{ success: boolean; error?: string }>;
  getLastProcessTime: () => Promise<string | null>;

  onUpdateStatus: (callback: (status: string) => void) => void;
  onUpdateProgress: (callback: (percent: number) => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  installUpdate: () => Promise<void>;
  onUpdateError: (callback: (error: string) => void) => void;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onUpdateNotSupported: (callback: () => void) => void;
  onUpdateCheckError: (callback: (error: string) => void) => void;
  onUpdateCheckSuccess: (callback: () => void) => void;
  onUpdateCheckNotAvailable: (callback: () => void) => void;
  onUpdateCheckNotSupported: (callback: () => void) => void;
  onUpdateCheckInProgress: (callback: () => void) => void;
  onUpdateCheckCompleted: (callback: () => void) => void;
  onUpdateCheckCanceled: (callback: () => void) => void;
  onUpdateCheckTimeout: (callback: () => void) => void;
  onUpdateCheckRateLimited: (callback: () => void) => void;
  onProcessProgress: (callback: (data: { status: string; percent: number }) => void) => void;
  removeProcessProgressListener: (callback?: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Component Props
export interface SettingsProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

// Global declarations
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron: {
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<void>;
      getSources: () => Promise<any>;
      setSources: (sources: any) => Promise<void>;
      getCustomRules: () => Promise<string>;
      setCustomRules: (rules: string) => Promise<void>;
      getExportFormat: () => Promise<string>;
      setExportFormat: (format: string) => Promise<void>;
      getSavePath: () => Promise<string>;
      setSavePath: (path: string) => Promise<void>;
      selectSavePath: () => Promise<string>;
      onUpdateStatus: (callback: (status: any) => void) => void;
      onUpdateProgress: (callback: (progress: any) => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      notifyResize: (width: number, height: number) => void;
      runImportProcess: () => Promise<any>;
      getLastProcessTime: () => Promise<string>;
      saveSources: (sources: any) => Promise<any>;
      installUpdate: () => void;
      onProcessProgress: (callback: (progress: any) => void) => void;
      removeProcessProgressListener: () => void;
      receive: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      showItemInFolder: (path: string) => void;
      // Add any other APIs you expose
    };
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
  
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export interface StoreType {
  filterSources: FilterSource[];
  customRules: string;
  theme: Theme;
  savePath: string;
  exportFormat: string;
  lastProcessTime?: string;
}

// Empty export needed to make this file a module
export {};