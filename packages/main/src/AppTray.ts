import {app, Menu, nativeImage, nativeTheme, Tray} from 'electron';
import * as path from 'path';
import {getAssetName, getMainAssetsPath, isTemplateAsset} from './MainUtil';
import {getAppVersion, getTimeZone} from '../../common/src/MiscUtil';
import {getCanChi, LunarDate, toLunarDate} from '../../common/src/LunarUtil';
import {REFRESH_RATE_IN_S} from '../../common/src/Constant';
import {getCalendarWindow, toggleCalendarWindow} from '/@/CalendarWindow';

let appTray: Tray;

function getLunarDateIcon(lunarDay: number) {
  const iconFolder = isTemplateAsset ? 'template' : 'dark';
  const iconPath = `calendar/${iconFolder}/${getAssetName(lunarDay, isTemplateAsset)}.png`;
  const icon = nativeImage.createFromPath(path.join(getMainAssetsPath(), iconPath));
  const resizedIcon = icon.resize({height: 18});
  resizedIcon.setTemplateImage(isTemplateAsset);

  return resizedIcon;
}

function getLunarDateExpression(lunar: LunarDate, compact?: boolean) {
  const {lunarDay, lunarMonth, lunarYear, isLeapMonth, isLeapYear} = lunar;
  const canChi = getCanChi(lunarYear);
  const day = lunarDay.toString().padStart(2, '0');
  const month = lunarMonth.toString().padStart(2, '0');

  return compact ?
    `${day}/${month}${isLeapMonth ? '*' : ''}/${lunarYear} ${canChi} ${isLeapYear ? 'nhuận' : ''}`
    :
    `${day} tháng ${month}${isLeapMonth ? '*' : ''} năm ${lunarYear} ${canChi} ${isLeapYear ? 'nhuận' : ''}`
    ;
}

function refreshTray(tray: Tray) {
  const currentLunar = toLunarDate(new Date(), getTimeZone());
  const icon = getLunarDateIcon(currentLunar.lunarDay);
  tray.setImage(icon);
  tray.setToolTip(getLunarDateExpression(currentLunar));
}

export function showAppTray() {
  app.whenReady().then(() => {
    const currentLunar = toLunarDate(new Date(), getTimeZone());
    const icon = getLunarDateIcon(currentLunar.lunarDay);
    appTray = new Tray(icon);

    const version = getAppVersion();
    const introductionMenu = Menu.buildFromTemplate([
      {label: 'Simple Lunar Calendar', type: 'normal'},
      {label: `v${version}`, type: 'normal'},
      {
        label: 'by Nguyen Tan Vinh', type: 'normal', click: () => {
          const window = getCalendarWindow();
          if (window && window.isVisible()) {
            window.webContents.openDevTools({mode: 'detach'});
          }
        },
      },
    ]);
    const contextMenu = Menu.buildFromTemplate([
      {label: getLunarDateExpression(currentLunar, true), type: 'normal'},
      {label: 'Giới thiệu', type: 'submenu', submenu: introductionMenu},
      {label: 'Thoát', type: 'normal', click: () => app.exit()},
    ]);

    nativeTheme.on('updated', () => refreshTray(appTray));
    appTray.setToolTip(getLunarDateExpression(currentLunar));

    // set events
    appTray.on('click', (_event, bounds) => {
      toggleCalendarWindow(bounds).then();
    });

    appTray.on('right-click', () => {
      appTray.popUpContextMenu(contextMenu);
    });

    // refresh to update tray icon
    setInterval(() => refreshTray(appTray), REFRESH_RATE_IN_S * 1000);
  });
}
