import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { FilterSource, ProcessingResult, Theme, ElectronAPI } from './types/global.js';

const electronAPI: ElectronAPI = {
  getSources: () => ipcRenderer.invoke('get-sources'),
  saveSources: (sources) => ipcRenderer.invoke('save-sources', sources),
  getCustomRules: () => ipcRenderer.invoke('get-custom-rules'),
  saveCustomRules: (rules) => ipcRenderer.invoke('save-custom-rules', rules),
  runImportProcess: () => ipcRenderer.invoke('run-import-process'),
  browseSavePath: () => ipcRenderer.invoke('browse-save-path'),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  notifyResize: (width, height) => {
    ipcRenderer.send('notify-content-size', width, height);
  },
  getSavePath: () => ipcRenderer.invoke('get-save-path'),
  selectSavePath: () => ipcRenderer.invoke('select-save-path'),
  
  // Update related handlers
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_: IpcRendererEvent, status: string) => callback(status));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (_: IpcRendererEvent, percent: number) => callback(percent));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (_: IpcRendererEvent) => callback());
  },
  
  // Additional update handlers and other API methods
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (_: IpcRendererEvent, error: string) => callback(error));
  },
  
  // Processing progress handlers
  getLastProcessTime: () => ipcRenderer.invoke('get-last-process-time'),
  onProcessProgress: (callback: (data: { status: string; percent: number }) => void) => {
    const handler = (_event: IpcRendererEvent, data: { status: string; percent: number }) => callback(data);
    ipcRenderer.on('process-progress', handler);
  },
  removeProcessProgressListener: (callback?: () => void) => {
    ipcRenderer.removeAllListeners('process-progress');
    if (callback) callback();
  },
  
  // Export format handlers
  getExportFormat: () => ipcRenderer.invoke('get-export-format'),
  setExportFormat: (format) => ipcRenderer.invoke('set-export-format', format),
  
  // Other required API methods
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Various update status event handlers
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_: IpcRendererEvent) => callback());
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (_: IpcRendererEvent) => callback());
  },
  onUpdateNotSupported: (callback) => {
    ipcRenderer.on('update-not-supported', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckError: (callback) => {
    ipcRenderer.on('update-check-error', (_: IpcRendererEvent, error: string) => callback(error));
  },
  onUpdateCheckSuccess: (callback) => {
    ipcRenderer.on('update-check-success', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckNotAvailable: (callback) => {
    ipcRenderer.on('update-check-not-available', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckNotSupported: (callback) => {
    ipcRenderer.on('update-check-not-supported', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckInProgress: (callback) => {
    ipcRenderer.on('update-check-in-progress', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckCompleted: (callback) => {
    ipcRenderer.on('update-check-completed', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckCanceled: (callback) => {
    ipcRenderer.on('update-check-canceled', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckTimeout: (callback) => {
    ipcRenderer.on('update-check-timeout', (_: IpcRendererEvent) => callback());
  },
  onUpdateCheckRateLimited: (callback) => {
    ipcRenderer.on('update-check-rate-limited', (_: IpcRendererEvent) => callback());
  },
  setSavePath: (path) => ipcRenderer.invoke('set-save-path', path),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);