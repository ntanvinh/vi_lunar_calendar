import {app, BrowserWindow, screen} from 'electron';
import * as path from 'path';
import {join} from 'path';
import * as url from 'url';
import {CALENDAR_HEIGHT, CALENDAR_WIDTH} from '../../common/src/Constant';
import {log} from 'electron-log';
import {isMacOS, fadeInWindow} from '/@/MainUtil';

let calendarWindow: BrowserWindow | null = null;

function calcWindowPosition(bounds: Electron.Rectangle) {
  return {
    x: bounds.x - CALENDAR_WIDTH + bounds.width,
    y: bounds.y <= CALENDAR_HEIGHT ? bounds.y : bounds.y - CALENDAR_HEIGHT,
  };
}

async function createWindow(bounds: Electron.Rectangle, showWhenReady = true) {
  console.log(bounds);
  const {x, y} = calcWindowPosition(bounds);
  calendarWindow = new BrowserWindow({
    width: CALENDAR_WIDTH,
    height: CALENDAR_HEIGHT,
    x,
    y,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    movable: false,
    show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
    transparent: isMacOS,
    vibrancy: isMacOS ? 'popover' : undefined, // macOS theme consistency
    visualEffectState: 'active',
    backgroundColor: isMacOS ? '#00000000' : '#ffffff', // Transparent on Mac, White on others
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
  calendarWindow.on('ready-to-show', () => {
    if (showWhenReady) {
      fadeInWindow(calendarWindow);
    }
    calendarWindow?.setSkipTaskbar(true);

    // if (import.meta.env.DEV) {
    //   calendarWindow?.webContents.openDevTools({mode: 'detach'});
    // }
  });

  // Hide window when clicking outside (blur)
  calendarWindow.on('blur', () => {
    if (!calendarWindow?.webContents.isDevToolsOpened()) {
      calendarWindow?.hide();
    }
  });

  calendarWindow.on('closed', () => {
    calendarWindow = null;
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test.
   */
  const filePath = path.join(__dirname, '../../renderer/dist/index.html');
  const fileUrl = url.pathToFileURL(filePath).toString();

  const pageUrl =
    import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : fileUrl;

  log('meta.env', import.meta.env);
  log('CalendarWindow url', pageUrl);
  await calendarWindow.loadURL(pageUrl);

  return calendarWindow;
}

/**
 * Preload the calendar window to improve performance
 */
export async function preloadCalendarWindow() {
  if (!calendarWindow || calendarWindow.isDestroyed()) {
    // Create with dummy bounds, will be repositioned on toggle
    const primaryDisplay = screen.getPrimaryDisplay();
    const dummyBounds = {
      x: primaryDisplay.bounds.x + primaryDisplay.bounds.width - 200,
      y: 0,
      width: 0,
      height: 0,
    } as Electron.Rectangle;
    await createWindow(dummyBounds, false);
  }
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function toggleCalendarWindow(bounds: Electron.Rectangle) {
  if (!calendarWindow || calendarWindow.isDestroyed()) {
    await createWindow(bounds, true);
  } else {
    if (calendarWindow.isVisible()) {
      calendarWindow.hide();
    } else {
      const {x, y} = calcWindowPosition(bounds);
      calendarWindow.setPosition(x, y);
      fadeInWindow(calendarWindow);
    }
  }
  return calendarWindow;
}

export async function showCalendarWindow(bounds: Electron.Rectangle) {
  if (!calendarWindow || calendarWindow.isDestroyed()) {
    await createWindow(bounds, true);
  } else {
    const {x, y} = calcWindowPosition(bounds);
    calendarWindow.setPosition(x, y);
    fadeInWindow(calendarWindow);
  }
  return calendarWindow;
}

export function getCalendarWindow() {
  return calendarWindow;
}
