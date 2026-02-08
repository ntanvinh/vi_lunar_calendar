import {BrowserWindow, app} from 'electron';
import {join} from 'path';
import {isMacOS} from '/@/MainUtil';

let eventWindow: BrowserWindow | null = null;

export async function createEventWindow() {
  if (eventWindow && !eventWindow.isDestroyed()) {
    if (eventWindow.isMinimized()) eventWindow.restore();
    eventWindow.focus();
    return;
  }

  console.log('Creating Event Window...');
  eventWindow = new BrowserWindow({
    width: 900,
    height: 600,
    title: 'Quản lý ngày lễ',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: join(app.getAppPath(), 'packages/preload/dist/index.cjs'),
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: isMacOS ? 'under-window' : undefined,
    visualEffectState: 'active',
    backgroundColor: isMacOS ? '#00000000' : '#ffffff',
    show: true, // Force show for debugging
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test
   */
  const pageUrl = import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
    ? import.meta.env.VITE_DEV_SERVER_URL + '#/events'
    : new URL('../renderer/dist/index.html#/events', 'file://' + __dirname).toString();

  console.log('Loading URL:', pageUrl);
  await eventWindow.loadURL(pageUrl);

  eventWindow.on('ready-to-show', () => {
    console.log('Event Window ready to show');
    eventWindow?.show();
  });

  // Open devtools in dev mode
  if (import.meta.env.DEV) {
    eventWindow.webContents.openDevTools();
  }

  eventWindow.on('closed', () => {
    eventWindow = null;
  });
}
