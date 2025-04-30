import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';
import path from 'path';
import * as fs from 'fs/promises';
import { mkdirSync } from 'fs';
import type { Options as StoreOptions } from 'electron-store';
import type { IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import { 
  FilterFormat, 
  StoredRule, 
  generateFilterList, 
  RuleType,
  downloadAndParseSource,
  parseFilterList,
  RuleDeduplicator,
  RuleStore
} from '@blockingmachine/core';
import type { FilterSource, ProcessingResult, Theme } from './types/global.js';
import * as electronSquirrelStartup from 'electron-squirrel-startup';

import { loadStore } from './utils/store-loader';


// Declare webpack entry points
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Define the structure for electron-store data
interface StoreType {
  filterSources: FilterSource[];
  customRules: string;
  theme: Theme;
  savePath: string;
  exportFormat: string;
  lastProcessTime?: string;
}

// Initialize store with dynamic import
const initStore = async () => {
  try {
    // Get the Store class
    const Store = await loadStore();
    
    // Create store instance
    const storeInstance = new Store({
      schema: {
        filterSources: {
          type: 'array',
          default: [],
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              enabled: { type: 'boolean' },
            },
            required: ['name', 'url', 'enabled'],
          },
        },
        customRules: {
          type: 'string',
          default: '',
        },
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'system'],
          default: 'system',
        },
        savePath: {
          type: 'string',
          default: path.join(app.getPath('documents'), 'processed_rules.txt'),
        },
        exportFormat: {
          type: 'string',
          enum: ['adguard', 'abp', 'hosts', 'dnsmasq', 'unbound', 'domains', 'plain'],
          default: 'adguard',
        },
        lastProcessTime: {
          type: 'string',
          default: '',
        }
      }
    });

    // Create a typed wrapper with correct types
    const store = {
      get: <K extends keyof StoreType>(key: K): StoreType[K] => {
        return storeInstance.get(key) as StoreType[K];
      },
      set: <K extends keyof StoreType>(key: K, value: StoreType[K]): void => {
        storeInstance.set(key, value);
      }
    };

    // Auto-updater initialization function
    function initAutoUpdater(window: InstanceType<typeof BrowserWindow>): void {
      if (isDev) {
        console.log('Running in development mode. Skipping auto-updater.');
        return;
      }

      try {
        // Disable automatic downloading
        autoUpdater.autoDownload = false;
    
        // Set up autoUpdater events
        autoUpdater.on('checking-for-update', () => {
          window.webContents.send('update-status', 'Checking for updates...');
        });
    
        autoUpdater.on('update-available', () => {
          window.webContents.send('update-status', 'Update available.');
        });

        autoUpdater.on('update-not-available', () => {
          window.webContents.send('update-status', 'Application is up to date.');
        });

        interface AutoUpdaterError extends Error {
          message: string;
        }

        autoUpdater.on('error', (err: AutoUpdaterError) => {
          // Don't show config file errors to the user
          if (err.message && err.message.includes('app-update.yml')) {
            console.log('Update configuration not found. This is expected in development or first install.');
            return;
          }
          window.webContents.send('update-status', `Error in auto-updater: ${err.message}`);
        });

        interface DownloadProgress {
          percent: number;
          bytesPerSecond: number;
          total: number;
          transferred: number;
        }

        autoUpdater.on('download-progress', (progressObj: DownloadProgress) => {
          window.webContents.send('update-progress', progressObj.percent);
        });

        autoUpdater.on('update-downloaded', () => {
          window.webContents.send('update-downloaded');
        });

        // Check if config file exists before checking for updates
        const updateConfigPath = path.join(process.resourcesPath, 'app-update.yml');
        fs.access(updateConfigPath)
          .then(() => {
            console.log('Update configuration found, checking for updates...');
            autoUpdater.checkForUpdatesAndNotify().catch((err: Error) => {
              console.error('Auto-updater error:', err);
            });
          })
          .catch(() => {
            console.log('Update configuration not found. Skipping update check.');
            // Optionally inform renderer that updates are disabled
            window.webContents.send('update-status', 'Updates not configured for this build.');
          });
      } catch (error) {
        console.error('Failed to initialize auto-updater:', error);
      }
    }

    // --- Store ---

    // Fix BrowserWindow type declaration
    let mainWindow: InstanceType<typeof BrowserWindow> | null = null;

    // --- IPC Handlers ---

    // Register all IPC handlers
    function registerIPCHandlers(): void {
      try {
        console.log('[Main Process] Registering IPC handlers...');
    
        // Updater handler
        ipcMain.handle('install-update', () => {
          autoUpdater.quitAndInstall();
        });

        // Custom rules handlers
        ipcMain.handle('get-custom-rules', async (_event: IpcMainInvokeEvent) => {
          console.log('[IPC Main] Received request for custom rules.');
          const rules = store.get('customRules');
          console.log('[IPC Main] Sending custom rules from store.');
          return rules;
        });

        ipcMain.handle('save-custom-rules', async (_event: IpcMainInvokeEvent, rules: string) => {
          console.log('[IPC Main] Received request to save custom rules.');
          try {
            store.set('customRules', rules);
            console.log('[IPC Main] Custom rules saved successfully.');
            return { success: true };
          } catch (error) {
            console.error('[IPC Main] Error saving custom rules:', error);
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
          }
        });

        // Sources handlers
        ipcMain.handle('get-sources', async (_event: IpcMainInvokeEvent) => {
          console.log('[IPC Main] Received request for sources.');
          const sources: FilterSource[] = store.get('filterSources');
          console.log('[IPC Main] Sending sources from store:', sources);
          return sources;
        });

        ipcMain.handle('save-sources', async (_event: IpcMainInvokeEvent, sources: FilterSource[]) => {
          console.log('[IPC Main] Received request to save sources.');
          try {
            store.set('filterSources', sources);
            console.log('[IPC Main] Sources saved successfully.');
            return { success: true };
          } catch (error) {
            console.error('[IPC Main] Error saving sources:', error);
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
          }
        });

        // Processing handler
        ipcMain.handle('run-import-process', async (_event: IpcMainInvokeEvent) => {
          const startTime = Date.now();
          // Get a reference to the sender for progress updates
          const sender = _event.sender;
          
          try {
            // Step 1: Load necessary data
            sender.send('process-progress', { status: 'Loading sources...', percent: 5 });
            const sources = store.get('filterSources');
            const enabledSources = sources.filter((source: FilterSource) => source.enabled);

            if (enabledSources.length === 0) {
              return {
                success: false,
                error: 'No enabled sources found. Please enable at least one source.',
                processedRuleCount: 0,
                uniqueRuleCount: 0,
                timestamp: new Date().toLocaleString()
              };
            }

            // Step 2: Fetch sources
            sender.send('process-progress', { status: 'Fetching filter lists...', percent: 10 });
            
            // Initialize allRules array before using it
            let allRules: StoredRule[] = [];
            
            // Update progress after each source is processed
            let processedCount = 0;
            const totalSources = enabledSources.length;
            for (const source of enabledSources) {
              console.log(`[IPC Main] Downloading and parsing source: ${source.name} (${source.url})`);
              try {
                const rulesFromSource = await downloadAndParseSource(source.url);
                allRules = [...allRules, ...(rulesFromSource as StoredRule[])];
                console.log(`[IPC Main] Collected ${rulesFromSource.length} rules from ${source.name}.`);
              } catch (sourceError) {
                console.error(`[IPC Main] Error processing source ${source.name}:`, sourceError);
                // Log and continue
              }
              processedCount++;
              const percent = Math.floor(10 + (processedCount / totalSources) * 30); // Progress from 10% to 40%
              sender.send('process-progress', { 
                status: `Fetching source ${processedCount}/${totalSources}: ${source.name}`, 
                percent 
              });
            }
            
            // Step 3: Process rules - Total rules count before deduplication
            sender.send('process-progress', { status: 'Processing rules...', percent: 50 });
            const totalProcessedCount = allRules.length;
            console.log(`[IPC Main] Total rules before deduplication: ${totalProcessedCount}`);
            
            // Step 4: Deduplicate rules - replace the existing deduplication code
            sender.send('process-progress', { status: 'Deduplicating rules...', percent: 70 });

            // Create a new deduplicator instance
            const deduplicator = new RuleDeduplicator();

            // Create a Set to track unique stripped rules
            const uniqueRulesSet = new Set<string>();

            // Filter the rules to keep only unique ones based on stripped content
            const uniqueRules = allRules.filter(rule => {
              // Skip rules with no raw content
              if (!rule.raw) return false;
              
              // Strip the rule to its essential parts
              const strippedRule = deduplicator.stripRule(rule.raw);
              
              // Check if this rule is already in our set (isDuplicate = it's already in the set)
              const isDuplicate = uniqueRulesSet.has(strippedRule);
              
              // If it's not a duplicate, add to set and keep
              if (!isDuplicate) {
                uniqueRulesSet.add(strippedRule);
                return true;
              }
              
              // Skip duplicates
              return false;
            });

            const uniqueRuleCount = uniqueRules.length;
            console.log(`[IPC Main] Rules after deduplication: ${uniqueRuleCount} (removed ${allRules.length - uniqueRuleCount} duplicates)`);
            
            // Step 5: Add custom rules
            sender.send('process-progress', { status: 'Adding custom rules...', percent: 80 });
            const customRulesText = store.get('customRules');
            if (customRulesText.trim()) {
              const customRules = parseFilterList(customRulesText, 'custom');
              uniqueRules.push(...customRules);
              console.log(`[IPC Main] Added ${customRules.length} custom rules.`);
            }
            
            // Count exception rules
            const exceptionRuleCount = uniqueRules.filter(rule => 
              rule.isException || (rule.raw && rule.raw.startsWith('@@'))
            ).length;
            
            // Step 6: Generate filter list with metadata
            sender.send('process-progress', { status: 'Generating filter list...', percent: 90 });
            const format = store.get('exportFormat') as FilterFormat;
            const metadata = {
              title: "BlockingMachine Custom Filter List",
              description: "Custom filter list created with BlockingMachine",
              homepage: "https://github.com/greigh/blockingmachine",
              version: app.getVersion(),
              lastUpdated: new Date().toISOString(),
              expires: "1 day",
              author: "Generated by BlockingMachine",
              license: "BSD-3-Clause",
              stats: {
                totalRules: totalProcessedCount,
                uniqueRules: uniqueRuleCount,
                blockingRules: uniqueRules.filter(rule => 
                  !rule.isException && !(rule.raw && rule.raw.startsWith('@@'))
                ).length,
                exceptionRules: exceptionRuleCount
              }
            };
            
            const generatedList = generateFilterList(uniqueRules, metadata, format);
            
            // Step 7: Save to file
            sender.send('process-progress', { status: 'Saving to file...', percent: 95 });
            const savePath = store.get('savePath') || path.join(
              app.getPath('documents'), 
              'BlockingMachine', 
              'processed_rules.txt'
            );
            // Create directory if it doesn't exist
            mkdirSync(path.dirname(savePath), { recursive: true }); // Use the sync version here
            await fs.writeFile(savePath, generatedList, 'utf8');
            console.log(`[IPC Main] Filter list saved to: ${savePath}`);
            
            // Update lastProcessTime in store
            store.set('lastProcessTime', new Date().toLocaleString());
            
            // Complete
            sender.send('process-progress', { status: 'Complete!', percent: 100 });
            
            const endTime = Date.now();
            console.log(`[IPC Main] Import process took ${endTime - startTime}ms.`);
            
            // Return success result
            return {
              success: true,
              processedRuleCount: totalProcessedCount,
              uniqueRuleCount: uniqueRuleCount,
              exceptionRuleCount: exceptionRuleCount,
              timestamp: new Date().toLocaleString()
            };
            
          } catch (error) {
            console.error('[IPC Main] Error during import process:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            return {
              success: false,
              error: errorMessage,
              processedRuleCount: 0,
              uniqueRuleCount: 0,
              timestamp: new Date().toLocaleString()
            };
          }
        });

        // Add this IPC handler in your initStore function

        ipcMain.handle('get-last-process-time', async () => {
          try {
            return store.get('lastProcessTime') || null;
          } catch (error) {
            console.error('[IPC Main] Error getting last process time:', error);
            throw new Error('Failed to retrieve last process time');
          }
        });

        // Theme handlers
        ipcMain.handle('get-theme', async (): Promise<Theme> => {
          const theme = store.get('theme');
          return theme;
        });

        ipcMain.handle('set-theme', async (_event: IpcMainInvokeEvent, theme: Theme) => {
          if (['light', 'dark', 'system'].includes(theme)) {
            store.set('theme', theme);
            console.log(`[IPC Main] Theme set to: ${theme}`);
            return { success: true };
          } else {
            console.warn(`[IPC Main] Invalid theme value received: ${theme}`);
            return { success: false, error: 'Invalid theme value.' };
          }
        });

        // Save path handlers
        ipcMain.handle('get-save-path', async (): Promise<string> => {
          return store.get('savePath');
        });

        ipcMain.handle('set-save-path', async (_event: IpcMainInvokeEvent, filePath: string) => {
          if (typeof filePath === 'string' && filePath.trim().length > 0) {
            try {
              store.set('savePath', filePath);
              console.log(`[IPC Main] Save path set to: ${filePath}`);
              return { success: true, path: filePath };
            } catch (error) {
              console.error(`[IPC Main] Error setting save path:`, error);
              return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
          } else {
            return { success: false, error: 'Invalid file path provided.' };
          }
        });

        ipcMain.handle('select-save-path', async () => {
          const win = BrowserWindow.getFocusedWindow();
          if (!win) {
            return { success: false, error: 'No focused window found.' };
          }

          try {
            const currentPath = store.get('savePath');
            const result = await dialog.showSaveDialog(win, {
              title: 'Select Save Location for Processed Rules',
              defaultPath: currentPath, // Use current path as default
              filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
              ],
              properties: ['createDirectory'] // Allow creating directories
            });

            if (result.canceled || !result.filePath) {
              console.log('[IPC Main] Save path selection cancelled.');
              return { success: false, error: 'Dialog cancelled.' };
            }

            const selectedPath = result.filePath;
            // vvv Directly set the store value here vvv
            store.set('savePath', selectedPath);
            console.log(`[IPC Main] Save path set to: ${selectedPath}`);
            return { success: true, path: selectedPath };
            // ^^^ Directly set the store value here ^^^

          } catch (error) {
            console.error('[IPC Main] Error showing save dialog:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
        });

        // Export format handlers
        ipcMain.handle('get-export-format', async () => {
          return store.get('exportFormat') || 'adguard';
        });

        ipcMain.handle('set-export-format', async (_event: IpcMainInvokeEvent, format: string) => {
          const validFormats = ['adguard', 'abp', 'hosts', 'dnsmasq', 'unbound', 'domains', 'plain'];
          if (validFormats.includes(format)) {
            store.set('exportFormat', format);
            console.log(`[IPC Main] Export format set to: ${format}`);
            return { success: true };
          } else {
            console.warn(`[IPC Main] Invalid export format received: ${format}`);
            return { success: false, error: 'Invalid export format.' };
          }
        });

        console.log('[Main Process] All IPC handlers registered successfully');
      } catch (error) {
        console.error('[Main Process] Error registering IPC handlers:', error);
        // Consider app.exit(1) for critical errors if you want the app to exit
      }
    }

    // After store initialization:
    function setupDefaultFilterSources(): void {
      const sources = store.get('filterSources');
  
      if (!sources || sources.length === 0) {
        console.log('[Main Process] Setting up default filter sources...');
        store.set('filterSources', [
          {
            name: 'AdGuard DNS Filter',
            url: 'https://filters.adtidy.org/extension/chromium/filters/15.txt',
            enabled: true,
          },
          {
            name: 'uBlock Origin Filter - Base',
            url: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
            enabled: true,
          },
          {
            name: 'uBlock Origin Filter - Unbreak',
            url: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/unbreak.txt',
            enabled: true,
          },
          {
            name: 'AdGuard Base Filter',
            url: 'https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt',
            enabled: true,
          },
          {
            name: 'AdGuard Annoyances Filter',
            url: 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_14_Annoyances/filter.txt',
            enabled: true,
          },
          {
            name: 'AdGuard Social Media Filter',
            url: 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_4_Social/filter.txt',
            enabled: true,
          },
          {
            name: 'AdGuard Mobile Filter',
            url: 'https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt',
            enabled: true,
          },
          {
            name: 'AWAvenue Ads Rule',
            url: 'https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt',
            enabled: true,
          },
          {
            name: 'AdGuard DNS Popup Hosts filter',
            url: 'https://adguardteam.github.io/HostlistsRegistry/assets/filter_59.txt',
            enabled: true,
          },
          {
            name: 'GetAdmiral Domains',
            url: 'https://raw.githubusercontent.com/LanikSJ/ubo-filters/main/filters/getadmiral-domains.txt',
            enabled: true,
          },
          {
            name: 'EasyList',
            url: 'https://easylist.to/easylist/easylist.txt',
            enabled: true,
          },
          {
            name: "Fanboy's Annoyance List",
            url: 'https://secure.fanboy.co.nz/fanboy-annoyance.txt',
            enabled: true,
          },
          {
            name: "HaGeZi's Allowlist Referral",
            url: 'https://adguardteam.github.io/HostlistsRegistry/assets/filter_45.txt',
            enabled: true,
          },
          {
            name: "HaGeZi's Windows/Office Tracker Blocklist",
            url: 'https://adguardteam.github.io/HostlistsRegistry/assets/filter_63.txt',
            enabled: true,
          },
          {
            name: "MrBukLau's Base Filters",
            url: 'https://raw.githubusercontent.com/MrBukLau/filter-lists/master/filters/basefilters.txt',
            enabled: true,
          },
          {
            name: 'OISD Blocklist Small',
            url: 'https://adguardteam.github.io/HostlistsRegistry/assets/filter_5.txt',
            enabled: true,
          },
          {
            name: 'uBlock Origin Filters',
            url: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/filters.txt',
            enabled: true,
          },
          {
            name: 'Peter Lowes List',
            url: 'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=adblock&showintro=0&mimetype=plaintext',
            enabled: true,
          },
        ]);
      }
    }

    // --- Window Creation ---

    // Define icon path based on platform
    let iconPath: string;
    if (isDev) {
      // Development path
      iconPath = path.join(__dirname, '../assets', process.platform === 'win32' ? 'icon.ico' : 'Blockingmachine.icns');
    } else {
      // Production path (after packaging)
      // Icon path logic for Windows
      iconPath = process.platform === 'win32' ? 
        path.join(process.resourcesPath, 'assets', 'icon.ico') : 
        path.join(process.resourcesPath, 'assets', 'Blockingmachine.icns');

      // Auto-updater Windows configuration
      if (process.platform === 'win32' && !process.env.NODE_ENV) {
        autoUpdater.updateConfigPath = path.join(process.resourcesPath, 'app-update.yml');
      }
    }

    // Keep a global reference of the resize debounce timer
    let resizeDebounceTimer: NodeJS.Timeout | null = null;

    const createWindow = (): void => {
      // Create the browser window.
      mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: iconPath,
        title: 'Blockingmachine',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        frame: true, // Use true for Windows, false for custom frame
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
      });

      const menu = Menu.buildFromTemplate([
        {
          label: 'Blockingmachine',
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' }
          ]
        },
        {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
          ]
        }
      ]);
      Menu.setApplicationMenu(menu);

      // Initialize auto-updater
      initAutoUpdater(mainWindow);

      mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

      mainWindow.on('closed', () => {
        mainWindow = null;
      });

      ipcMain.on('notify-resize', (_event: IpcMainEvent, width: number, height: number) => {
        const win = BrowserWindow.fromWebContents(_event.sender);
        if (win && win === mainWindow) {
          if (resizeDebounceTimer) {
            clearTimeout(resizeDebounceTimer);
          }
          resizeDebounceTimer = setTimeout(() => {
            try {
              if (win.webContents.isDestroyed() || win.webContents.isDevToolsOpened()) {
                // console.log(`[IPC Main Safety Debounce] Window destroyed or DevTools open. Skipping resize.`);
                return;
              }

              // vvv Remove the +50 adjustment vvv
              const desiredHeight = Math.ceil(height);
              // ^^^ Remove the +50 adjustment ^^^
              const desiredWidth = Math.ceil(width);

              // console.log(`[IPC Main Safety Debounce] Received raw: ${width}x${height}. Target: ${desiredWidth}x${desiredHeight}`);
              const currentBounds = win.getContentBounds();
              // console.log(`[IPC Main Safety Debounce] Current bounds: ${currentBounds.width}x${currentBounds.height}`);

              // Increase threshold slightly to prevent tiny adjustments causing loops
              if (Math.abs(currentBounds.width - desiredWidth) > 2 || Math.abs(currentBounds.height - desiredHeight) > 2) {
                console.log(`[IPC Main Safety Debounce] Resizing window content from ${currentBounds.width}x${currentBounds.height} to ${desiredWidth}x${desiredHeight}`);
                win.setContentSize(desiredWidth, desiredHeight, false); // Set animate to false
              } else {
                // console.log(`[IPC Main Safety Debounce] Size similar. Skipping resize.`);
              }
            } catch (e) {
              console.error("[IPC Main Safety Debounce] Failed to resize:", e);
            } finally {
              resizeDebounceTimer = null;
            }
          }, 150); // Slightly increase debounce in main
        }
      });
    };

    // --- App Lifecycle ---
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', () => {
      // Setup store defaults if needed
      setupDefaultFilterSources();
  
      // Register IPC handlers before creating window
      registerIPCHandlers();
  
      // Create the window
      createWindow();
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      }
    });

    if (electronSquirrelStartup) {
      app.quit();
      process.exit(0);
    }
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
}
initStore().catch(console.error);
