import { app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, Menu, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join, dirname } from 'path';
import { promises as fs, mkdirSync } from 'fs';
import isDev from 'electron-is-dev';
import { downloadAndParseSource, parseFilterList, RuleDeduplicator, generateFilterList } from '@blockingmachine/core';
import type { StoreSchema } from './types/electron-store';
import type { FilterSource, Theme } from './types/global';
import type { FilterFormat, StoredRule } from '@blockingmachine/core';
import { initAutoUpdater } from './main/autoUpdater';
const Store = require('electron-store').default || require('electron-store');


// Define a minimal custom menu (no Help, no View)
const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      {
        label: 'Settings',
        accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
        click: () => {
          // Send an IPC message to open settings, or show a settings window/modal
          if (mainWindow) {
            mainWindow.webContents.send('open-settings');
          }
        }
      },
      { role: 'quit' },
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
      { role: 'selectAll' },
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' },
      { type: 'separator' },
      { role: 'front' },
      { role: 'window' },
      { type: 'separator' },
      ...(isDev ? [{
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
          }
        }
      }] : []),
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Define the store schema type
const storeConfig = {
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
      default: join(app.getPath('documents'), 'processed_rules.txt'),
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
} as const;

// Initialize store with the config
let store = new Store(storeConfig);

// Create a typed wrapper
const typedStore = {
  get: <K extends keyof StoreSchema>(key: K): StoreSchema[K] => store.get(key),
  set: <K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void => store.set(key, value)
};

function registerIPCHandlers(store: {
  get: <K extends keyof StoreSchema>(key: K) => StoreSchema[K];
  set: <K extends keyof StoreSchema>(key: K, value: StoreSchema[K]) => void;
}): void {
  try {
    console.log('[Main Process] Registering IPC handlers...');

    ipcMain.handle('install-update', () => {
      const mainWindow = BrowserWindow.getFocusedWindow();
      autoUpdater.quitAndInstall();
    });

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

    ipcMain.handle('get-sources', async (_event: IpcMainInvokeEvent) => {
      console.log('[IPC Main] Received request for sources.');
      const sources: FilterSource[] = store.get('filterSources');
      console.log('[IPC Main] Sent sources from store.');
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

    ipcMain.handle('run-import-process', async (_event: IpcMainInvokeEvent) => {
      const startTime = Date.now();
      const sender = _event.sender;
      
      try {
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

        sender.send('process-progress', { status: 'Fetching filter lists...', percent: 10 });
        
        let allRules: StoredRule[] = [];
        
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
          }
          processedCount++;
          const percent = Math.floor(10 + (processedCount / totalSources) * 30);
          sender.send('process-progress', { 
            status: `Fetching source ${processedCount}/${totalSources}: ${source.name}`, 
            percent 
          });
        }
        
        sender.send('process-progress', { status: 'Processing rules...', percent: 50 });
        const totalProcessedCount = allRules.length;
        console.log(`[IPC Main] Total rules before deduplication: ${totalProcessedCount}`);
        
        sender.send('process-progress', { status: 'Deduplicating rules...', percent: 70 });

        const deduplicator = new RuleDeduplicator();
        const uniqueRulesSet = new Set<string>();

        const uniqueRules = allRules.filter(rule => {
          if (!rule.raw) return false;
          const strippedRule = deduplicator.stripRule(rule.raw);
          const isDuplicate = uniqueRulesSet.has(strippedRule);
          if (!isDuplicate) {
            uniqueRulesSet.add(strippedRule);
            return true;
          }
          return false;
        });

        const uniqueRuleCount = uniqueRules.length;
        console.log(`[IPC Main] Rules after deduplication: ${uniqueRuleCount} (removed ${allRules.length - uniqueRuleCount} duplicates)`);
        
        sender.send('process-progress', { status: 'Adding custom rules...', percent: 80 });
        const customRulesText = store.get('customRules');
        if (customRulesText.trim()) {
          const customRules = parseFilterList(customRulesText, 'custom');
          uniqueRules.push(...customRules);
          console.log(`[IPC Main] Added ${customRules.length} custom rules.`);
        }
        
        const exceptionRuleCount = uniqueRules.filter(rule => 
          rule.isException || (rule.raw && rule.raw.startsWith('@@'))
        ).length;
        
        sender.send('process-progress', { status: 'Generating filter list...', percent: 90 });
        const format = store.get('exportFormat') as FilterFormat;
        const metadata = {
          title: "Blockingmachine Custom Filter List",
          description: "Custom filter list created with Blockingmachine",
          homepage: "https://github.com/greigh/blockingmachine",
          version: app.getVersion(),
          lastUpdated: new Date().toISOString(),
          expires: "1 day",
          author: "Generated by Blockingmachine",
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
        
        sender.send('process-progress', { status: 'Saving to file...', percent: 95 });
        const savePath = store.get('savePath') || join(
          app.getPath('documents'), 
          'Blockingmachine', 
          'processed_rules.txt'
        );
        mkdirSync(dirname(savePath), { recursive: true });
        await fs.writeFile(savePath, generatedList, 'utf8');
        console.log(`[IPC Main] Filter list saved to: ${savePath}`);
        
        store.set('lastProcessTime', new Date().toLocaleString());
        
        sender.send('process-progress', { status: 'Complete!', percent: 100 });
        
        const endTime = Date.now();
        console.log(`[IPC Main] Import process took ${endTime - startTime}ms.`);
        
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

    ipcMain.handle('get-last-process-time', async () => {
      try {
        return store.get('lastProcessTime') || null;
      } catch (error) {
        console.error('[IPC Main] Error getting last process time:', error);
        throw new Error('Failed to retrieve last process time');
      }
    });

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
      try {
        const currentPath = store.get('savePath');
        const result = await dialog.showSaveDialog({
          title: 'Select Save Location for Processed Rules',
          defaultPath: currentPath,
          filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['createDirectory']
        });

        if (result.canceled || !result.filePath) {
          console.log('[IPC Main] Save path selection cancelled.');
          return ''; // Return empty string if cancelled
        }

        const selectedPath = result.filePath;
        store.set('savePath', selectedPath);
        console.log(`[IPC Main] Save path set to: ${selectedPath}`);
        return selectedPath; // Return the selected path as a string

      } catch (error) {
        console.error('[IPC Main] Error showing save dialog:', error);
        return ''; // Return empty string on error
      }
    });

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

    ipcMain.on('notify-resize', (_event, width: number, height: number) => {
      if (isDev) {
        console.log(`Window resized to ${width}x${height}`);
      }
    });

    ipcMain.on('show-item-in-folder', (_event, path: string) => {
      shell.showItemInFolder(path);
    });

    console.log('[Main Process] All IPC handlers registered successfully');
  } catch (error) {
    console.error('[Main Process] Error registering IPC handlers:', error);
  }
}

function setupDefaultFilterSources(): void {
  const sources = typedStore.get('filterSources');

  if (!sources || sources.length === 0) {
    console.log('[Main Process] Setting up default filter sources...');
    typedStore.set('filterSources', [
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

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  console.log('Creating window...');
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 900,
    minWidth: 1000,
    minHeight: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      devTools: isDev // or false in production
    }
  });

  const htmlPath = join(__dirname, 'index.html');
  mainWindow.loadFile(htmlPath);

};

const installExtensions = async () => {
  const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
  try {
    await installExtension(REACT_DEVELOPER_TOOLS);
    console.log('React DevTools installed');
  } catch (err) {
    console.error('Error installing React DevTools:', err);
  }
};

app.whenReady().then(async () => {
  if (isDev) {
    await installExtensions();
  }
  setupDefaultFilterSources();
  registerIPCHandlers(typedStore);
  createWindow();
  
  if (mainWindow) {
    initAutoUpdater(mainWindow);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
