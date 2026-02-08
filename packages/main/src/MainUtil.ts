import * as path from 'path';
import {nativeTheme, BrowserWindow} from 'electron';
import {platform} from 'process';

export function getMainAssetsPath() {
  return path.join(__dirname, '../assets');
}

export function getAssetName(normalName: string | number, isTemplateAsset: boolean) {
  if (isTemplateAsset) {
    return `${normalName}Template`;

  } else {
    return `${normalName}`;
  }
}

export const isMacOS = platform === 'darwin';

export const isTemplateAsset = isMacOS || !nativeTheme.shouldUseDarkColors;

export function fadeInWindow(window: BrowserWindow | null) {
  if (!window || window.isDestroyed()) return;
  window.setOpacity(0);
  window.show();
  
  let opacity = 0;
  const step = 0.1;
  const interval = setInterval(() => {
    if (!window || window.isDestroyed()) {
      clearInterval(interval);
      return;
    }
    opacity += step;
    if (opacity >= 1) {
      opacity = 1;
      clearInterval(interval);
    }
    window.setOpacity(opacity);
  }, 15);
}
