import * as path from 'path';
import {nativeTheme} from 'electron';

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

export const isMacOS = process.platform === 'darwin';

export const isTemplateAsset = isMacOS || !nativeTheme.shouldUseDarkColors;
