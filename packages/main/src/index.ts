import {app} from 'electron';
import './SecurityRestrictions';
import {showAppTray} from './AppTray';
import {isMacOS} from '/@/MainUtil';
import {ThemeManager} from './ThemeManager';
import {EventManager} from './EventManager';
import {NotificationManager} from './NotificationManager';

/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}

/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(async () => {
    // Force set app name for macOS notifications
    if (isMacOS) {
      app.setName('V Lunar Calendar');
    }

    // Set App ID for Windows and Linux
    if (process.platform === 'win32') {
      app.setAppUserModelId('me.ntanvinh.vi_lunar_calendar');
    }

    // On macOS, in development mode, hiding the dock might prevent notifications from showing
    // because the app is not signed. We only hide the dock in production.
    if (isMacOS && import.meta.env.PROD) {
      app.dock.hide();
    }
    
    ThemeManager.init();
    EventManager.init();
    NotificationManager.init();
    showAppTray();
  })
  .catch(e => console.error('Failed create window:', e));

/**
 * Check for new version of the application - production mode only.
 */
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => import('electron-updater'))
    .then(({autoUpdater}) => autoUpdater.checkForUpdatesAndNotify())
    .catch(e => console.error('Failed check updates:', e));
}
