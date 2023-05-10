import {app, BrowserWindow} from 'electron';
import {join} from 'path';
import {URL} from 'url';
import {CALENDAR_HEIGHT, CALENDAR_WIDTH} from '../../common/src/Constant';

async function createWindow(bounds: Electron.Rectangle) {
  console.log(bounds);
  const browserWindow = new BrowserWindow({
    width: CALENDAR_WIDTH,
    height: CALENDAR_HEIGHT,
    x: bounds.x - CALENDAR_WIDTH / 2,
    y: bounds.y <= CALENDAR_HEIGHT ? 0 : bounds.y - CALENDAR_HEIGHT,
    frame: false,
    resizable: false,
    show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(app.getAppPath(), 'packages/preload/dist/index.cjs'),
    },
  });

  /**
   * If the 'show' property of the BrowserWindow's constructor is omitted from the initialization options,
   * it then defaults to 'true'. This can cause flickering as the window loads the html content,
   * and it also has show problematic behaviour with the closing of the window.
   * Use `show: false` and listen to the  `ready-to-show` event to show the window.
   *
   * @see https://github.com/electron/electron/issues/25012 for the afford mentioned issue.
   */
  browserWindow.on('ready-to-show', () => {
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools({mode: 'detach'});
    }
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test.
   */
  const pageUrl =
    import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : new URL('../renderer/dist/index.html', 'file://' + __dirname).toString();

  await browserWindow.loadURL(pageUrl);

  return browserWindow;
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function toggleCalendarWindow(bounds?: Electron.Rectangle) {
  let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

  if (!window && bounds) {
    window = await createWindow(bounds);
  }

  if (window) {
    if (window.isVisible()) {
      window.hide();

    } else {
      window.show();
      window.focus();
    }
  }
  return window;
}

export function getCalendarWindow() {
  return BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
}
