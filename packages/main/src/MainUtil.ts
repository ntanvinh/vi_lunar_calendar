import * as path from 'path';
import {nativeTheme} from 'electron';
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
