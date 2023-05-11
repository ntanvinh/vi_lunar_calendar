import {app, Menu, nativeImage, nativeTheme, Tray} from 'electron';
import * as path from 'path';
import {getAssetName, getMainAssetsPath, isTemplateAsset} from './MainUtil';
import {getTimeZone} from '../../common/src/MiscUtil';
import {getCanChi, LunarDate, toLunarDate} from '../../common/src/LunarUtil';
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

let timerId: NodeJS.Timeout | undefined;

function dynamicRefreshTray(tray: Tray) {
  if (timerId) {
    clearTimeout(timerId);
  }
  const now = new Date();
  let timeout;
  if (now.getHours() === 23 && now.getMinutes() > 29) {
    timeout = 1000; // increase refresh rate at end of day
  } else {
    // reduce refresh rate for energy saving
    timeout = 30 * 60 * 1000;
  }
  // console.log(`refresh tray, timeout ${timeout / 1000}s`);

  refreshTray(tray);

  timerId = setTimeout(() => {
    dynamicRefreshTray(tray);
  }, timeout);
}

export function showAppTray() {
  app.whenReady().then(() => {
    const currentLunar = toLunarDate(new Date(), getTimeZone());
    const icon = getLunarDateIcon(currentLunar.lunarDay);
    appTray = new Tray(icon);

    const introductionMenu = Menu.buildFromTemplate([
      {
        label: 'Vi Lunar Calendar',
        type: 'normal',
        click: () => dynamicRefreshTray(appTray),
        toolTip: 'Click để cập nhật ngày hiển thị trên thanh menu',
      },
      {label: `v${app.getVersion()}`, type: 'normal'},
      {
        label: `by Nguyen Tan Vinh`, type: 'normal', click: () => {
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
    dynamicRefreshTray(appTray);
  });
}
