import {app, Menu, nativeImage, nativeTheme, Tray} from 'electron';
import * as path from 'path';
import {getMainAssetsPath} from './MainUtil';
import {getAppVersion, getTimeZone} from '../../common/src/MiscUtil';
import {getCanChi, LunarDate, toLunarDate} from '../../common/src/LunarUtil';

let appTray: Tray;

function getLunarDateIcon(lunarDay: number) {
  const isDark = nativeTheme.shouldUseDarkColors;
  const icon = nativeImage.createFromPath(path.join(getMainAssetsPath(), `calendar/${isDark ? 'dark' : 'light'}/${lunarDay}.png`));

  return icon.resize({height: 18});
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
      {label: 'by Nguyen Tan Vinh', type: 'normal'},
    ]);
    const contextMenu = Menu.buildFromTemplate([
      {label: getLunarDateExpression(currentLunar, true), type: 'normal'},
      {label: 'Giới thiệu', type: 'submenu', submenu: introductionMenu},
      {label: 'Thoát', type: 'normal', click: () => app.exit()},
    ]);

    setInterval(() => refreshTray(appTray), 1000);

    appTray.setToolTip(getLunarDateExpression(currentLunar));
    appTray.setContextMenu(contextMenu);
  });
}
