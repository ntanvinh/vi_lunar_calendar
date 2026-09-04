import {app, BrowserWindow, screen} from 'electron';
import * as path from 'path';
import {join} from 'path';
import * as url from 'url';
import {CALENDAR_HEIGHT, CALENDAR_WIDTH} from '../../common/src/Constant';
import {log} from 'electron-log';
import {isMacOS, fadeInWindow} from '/@/MainUtil';

let calendarWindow: BrowserWindow | null = null;

function hasUsableBounds(bounds: Electron.Rectangle | undefined): bounds is Electron.Rectangle {
  return Boolean(
    bounds
      && Number.isFinite(bounds.x)
      && Number.isFinite(bounds.y)
      && Number.isFinite(bounds.width)
      && Number.isFinite(bounds.height)
      && bounds.width > 0
      && bounds.height > 0,
  );
}

function getFallbackBounds(): Electron.Rectangle {
  // Tray#click may provide an empty rectangle on macOS. At click time the
  // cursor is still over the tray icon, so it gives us a useful anchor point.
  const cursor = screen.getCursorScreenPoint();
  return {
    x: cursor.x,
    y: cursor.y,
    width: 1,
    height: 1,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function showAtPosition(window: BrowserWindow | null, x: number, y: number) {
  if (!window || window.isDestroyed()) return;

  window.setPosition(x, y);
  fadeInWindow(window, false);

  // macOS may finish showing a hidden window asynchronously and overwrite its
  // position. Re-apply the anchor after the native show transition completes.
  setTimeout(() => {
    if (!window.isDestroyed()) {
      window.setPosition(x, y);
    }
  }, 100);
}

function calcWindowPosition(bounds: Electron.Rectangle | undefined) {
  const safeBounds = hasUsableBounds(bounds) ? bounds : getFallbackBounds();
  const anchorPoint = {
    x: safeBounds.x + safeBounds.width / 2,
    y: safeBounds.y + safeBounds.height / 2,
  };
  const display = screen.getDisplayNearestPoint(anchorPoint);
  const workArea = display.workArea;

  const minX = workArea.x;
  const maxX = Math.max(minX, workArea.x + workArea.width - CALENDAR_WIDTH);
  const minY = workArea.y;
  const maxY = Math.max(minY, workArea.y + workArea.height - CALENDAR_HEIGHT);

  const desiredX = safeBounds.x + safeBounds.width - CALENDAR_WIDTH;
  const displayMiddleY = display.bounds.y + display.bounds.height / 2;
  const desiredY = anchorPoint.y <= displayMiddleY
    ? safeBounds.y + safeBounds.height
    : safeBounds.y - CALENDAR_HEIGHT;

  const position = {
    x: Math.round(clamp(desiredX, minX, maxX)),
    y: Math.round(clamp(desiredY, minY, maxY)),
  };

  return position;
}

async function createWindow(bounds: Electron.Rectangle | undefined, showWhenReady = true) {
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
      showAtPosition(calendarWindow, x, y);
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
      width: 1,
      height: 1,
    } as Electron.Rectangle;
    await createWindow(dummyBounds, false);
  }
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function toggleCalendarWindow(bounds: Electron.Rectangle | undefined) {
  if (!calendarWindow || calendarWindow.isDestroyed()) {
    await createWindow(bounds, true);
  } else {
    if (calendarWindow.isVisible()) {
      calendarWindow.hide();
    } else {
      const {x, y} = calcWindowPosition(bounds);
      showAtPosition(calendarWindow, x, y);
    }
  }
  return calendarWindow;
}

export async function showCalendarWindow(bounds: Electron.Rectangle | undefined) {
  if (!calendarWindow || calendarWindow.isDestroyed()) {
    await createWindow(bounds, true);
  } else {
    const {x, y} = calcWindowPosition(bounds);
    showAtPosition(calendarWindow, x, y);
  }
  return calendarWindow;
}

export async function showCalendarWindowForDateNavigation() {
  if (!calendarWindow || calendarWindow.isDestroyed()) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const fallbackBounds = {
      x: primaryDisplay.bounds.x + primaryDisplay.bounds.width - 200,
      y: 0,
      width: 1,
      height: 1,
    } as Electron.Rectangle;
    await createWindow(fallbackBounds, true);
  } else {
    fadeInWindow(calendarWindow);
  }

  return calendarWindow;
}

export function getCalendarWindow() {
  return calendarWindow;
}
