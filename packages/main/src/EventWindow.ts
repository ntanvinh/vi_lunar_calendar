import {BrowserWindow, app, Menu} from 'electron';
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
    vibrancy: isMacOS ? 'popover' : undefined,
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
  
  const loadWithRetry = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        if (eventWindow && !eventWindow.isDestroyed()) {
          await eventWindow.loadURL(pageUrl);
        }
        return;
      } catch (e) {
        console.warn(`Failed to load URL (attempt ${i + 1}/${retries}):`, e);
        if (i === retries - 1) {
          console.error('Max retries reached. Failed to load Event Window.');
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };

  loadWithRetry();

  eventWindow.on('ready-to-show', () => {
    console.log('Event Window ready to show');
    eventWindow?.show();
  });

  // Open devtools in dev mode
  // if (import.meta.env.DEV) {
  //   eventWindow.webContents.openDevTools();
  // }

  // Add context menu to allow opening DevTools when needed
  eventWindow.webContents.on('context-menu', (_, props) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Inspect Element',
        click: () => {
          eventWindow?.webContents.inspectElement(props.x, props.y);
        },
      },
      {type: 'separator'},
      {
        label: 'Toggle Developer Tools',
        accelerator: isMacOS ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click: () => {
          eventWindow?.webContents.toggleDevTools();
        },
      },
    ]);
    menu.popup();
  });

  eventWindow.on('closed', () => {
    eventWindow = null;
  });
}

export function getEventWindow() {
  return eventWindow;
}
