import {BrowserWindow, app, Menu} from 'electron';
import {join} from 'path';
import {isMacOS, fadeInWindow} from '/@/MainUtil';

let paymentWindow: BrowserWindow | null = null;

export async function createPaymentWindow() {
  if (paymentWindow && !paymentWindow.isDestroyed()) {
    if (paymentWindow.isMinimized()) paymentWindow.restore();
    paymentWindow.focus();
    return;
  }

  console.log('Creating Payment Window...');

  paymentWindow = new BrowserWindow({
    width: 480,
    height: 850,
    title: 'Thông tin thanh toán',
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
    show: false,
    resizable: true, // Allow resizing
    minimizable: true,
    maximizable: false,
  });

  /**
   * URL for payment window.
   */
  const pageUrl = import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
    ? import.meta.env.VITE_DEV_SERVER_URL + '#/payment'
    : new URL('../renderer/dist/index.html#/payment', 'file://' + __dirname).toString();

  console.log('Loading URL:', pageUrl);
  
  const loadWithRetry = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        if (paymentWindow && !paymentWindow.isDestroyed()) {
          await paymentWindow.loadURL(pageUrl);
        }
        return;
      } catch (e) {
        console.warn(`Failed to load URL (attempt ${i + 1}/${retries}):`, e);
        if (i === retries - 1) {
          console.error('Max retries reached. Failed to load Payment Window.');
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };

  loadWithRetry();

  paymentWindow.on('ready-to-show', () => {
    console.log('Payment Window ready to show');
    fadeInWindow(paymentWindow);
  });

  // Add context menu
  paymentWindow.webContents.on('context-menu', (_, props) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Inspect Element',
        click: () => {
          paymentWindow?.webContents.inspectElement(props.x, props.y);
        },
      },
      {type: 'separator'},
      {
        label: 'Toggle Developer Tools',
        accelerator: isMacOS ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click: () => {
          paymentWindow?.webContents.toggleDevTools();
        },
      },
    ]);
    menu.popup();
  });

  paymentWindow.on('closed', () => {
    paymentWindow = null;
  });
}

export function getPaymentWindow() {
  return paymentWindow;
}
