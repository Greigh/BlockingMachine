const { contextBridge, ipcRenderer } = require('electron');
import type { IpcRendererEvent } from 'electron';

// Define the API type
interface ElectronAPI {
  getFilterSources: () => Promise<any[]>;
  setFilterSources: (sources: any[]) => Promise<void>;
  getSources: () => Promise<any[]>;
  setSources: (sources: any[]) => Promise<void>;
  saveSources: (sources: any[]) => Promise<{ success: boolean; error?: string }>;
  getCustomRules: () => Promise<string>;
  setCustomRules: (rules: string) => Promise<void>;
  getSavePath: () => Promise<string>;
  setSavePath: (path: string) => Promise<void>;
  selectSavePath: () => Promise<string>;
  getExportFormat: () => Promise<string>;
  setExportFormat: (format: string) => Promise<{ success: boolean; error?: string }>;
  getTheme: () => Promise<string>;
  setTheme: (theme: string) => Promise<void>;
  onUpdateAvailable: (callback: (event: IpcRendererEvent, info: any) => void) => void;
  onUpdateDownloaded: (callback: (event: IpcRendererEvent, info: any) => void) => void;
  onUpdateError: (callback: (event: IpcRendererEvent, error: Error) => void) => void;
  onUpdateStatus: (callback: (event: IpcRendererEvent, info: any) => void) => void;
  onProcessProgress: (callback: (progress: any) => void) => void;
  removeProcessProgressListener: () => void;
  onUpdateProgress: (callback: (progress: any) => void) => void;
  getLastProcessTime: () => Promise<string>;
  notifyResize: (width: number, height: number) => void;
  runImportProcess: () => Promise<void>;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  receive: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  showItemInFolder: (path: string) => void;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  getFilterSources: () => ipcRenderer.invoke('get-filter-sources'),
  setFilterSources: (sources) => ipcRenderer.invoke('set-filter-sources', sources),
  getSources: () => ipcRenderer.invoke('get-sources'),
  setSources: (sources) => ipcRenderer.invoke('save-sources', sources),
  saveSources: (sources) => ipcRenderer.invoke('save-sources', sources),
  getCustomRules: () => ipcRenderer.invoke('get-custom-rules'),
  setCustomRules: (rules) => ipcRenderer.invoke('save-custom-rules', rules),
  getSavePath: () => ipcRenderer.invoke('get-save-path'),
  setSavePath: (path) => ipcRenderer.invoke('set-save-path', path),
  selectSavePath: () => ipcRenderer.invoke('select-save-path') as Promise<string>,
  getExportFormat: () => ipcRenderer.invoke('get-export-format'),
  setExportFormat: (format) => ipcRenderer.invoke('set-export-format', format),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  onUpdateError: (callback) => ipcRenderer.on('update-error', callback),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
  onProcessProgress: (callback: (progress: any) => void) =>
    ipcRenderer.on('process-progress', (_event: IpcRendererEvent, progress: any) => callback(progress)),
  removeProcessProgressListener: () => ipcRenderer.removeAllListeners('process-progress'),
  onUpdateProgress: (callback: (progress: any) => void) =>
    ipcRenderer.on('update-progress', (_event: IpcRendererEvent, progress: any) => callback(progress)),
  getLastProcessTime: () => ipcRenderer.invoke('get-last-process-time'),
  notifyResize: (width: number, height: number) => ipcRenderer.send('notify-resize', width, height),
  runImportProcess: () => ipcRenderer.invoke('run-import-process'),
  on: (channel: string, listener: (...args: any[]) => void) => ipcRenderer.on(channel, listener),
  receive: (channel: string, callback: (...args: any[]) => void) => ipcRenderer.on(channel, callback),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  showItemInFolder: (path: string) => ipcRenderer.send('show-item-in-folder', path),
} as ElectronAPI);