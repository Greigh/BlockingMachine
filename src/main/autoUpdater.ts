import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';

export function initAutoUpdater(mainWindow: BrowserWindow) {
  log.transports.file.level = 'debug';
  autoUpdater.logger = log;

  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 60 * 60 * 1000);

  // Update events
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update-status', 'Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-status', `Update available: ${info.version}`);
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-status', 'App is up to date');
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-status', `Error: ${err.message}`);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update-progress', progress.percent);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  });
}