import {app, Menu, nativeImage, nativeTheme, Tray} from 'electron';
import * as path from 'path';
import {getAssetName, getMainAssetsPath, isTemplateAsset} from './MainUtil';
import {getDateWithoutTime, getNextDay, getTimeZone, getToday} from '../../common/src/MiscUtil';
import {getCanChi, LunarDate, toLunarDate} from '../../common/src/LunarUtil';
import {getCalendarWindow, toggleCalendarWindow, preloadCalendarWindow, showCalendarWindow} from '/@/CalendarWindow';
import {createEventWindow, getEventWindow} from '/@/EventWindow';
import {createPaymentWindow} from '/@/PaymentWindow';
import {log} from 'electron-log';
import {execPath} from 'process';
import {ThemeManager} from './ThemeManager';

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

function getTooltipText(lunar: LunarDate) {
  const now = new Date();
  const solarDay = now.getDate().toString().padStart(2, '0');
  const solarMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const solarYear = now.getFullYear();
  const solarStr = `DL: ${solarDay}/${solarMonth}/${solarYear}`;

  const {lunarDay, lunarMonth, lunarYear, isLeapMonth, isLeapYear} = lunar;
  const canChi = getCanChi(lunarYear);
  const lDay = lunarDay.toString().padStart(2, '0');
  const lMonth = lunarMonth.toString().padStart(2, '0');
  const lunarStr = `AL: ${lDay}/${lMonth}${isLeapMonth ? '*' : ''} ${canChi}${isLeapYear ? ' (Nhuận)' : ''}`;

  return `${solarStr}\n${lunarStr}`;
}

function forceRefreshTray(tray: Tray) {
  const currentLunar = toLunarDate(new Date(), getTimeZone());
  const icon = getLunarDateIcon(currentLunar.lunarDay);
  tray.setImage(icon);
  tray.setToolTip(getTooltipText(currentLunar));
}

let timerId: NodeJS.Timeout | undefined;
let currentDay: Date = getToday();

function dynamicRefreshTray(tray: Tray) {
  if (timerId) {
    clearTimeout(timerId);
  }
  const now = new Date();
  const nextDay = getNextDay(currentDay);
  if (now.getTime() >= nextDay.getTime()
    || now.getTime() <= currentDay.getTime()
  ) {
    currentDay = getDateWithoutTime(now);
    forceRefreshTray(tray);
  }

  timerId = setTimeout(() => {
    dynamicRefreshTray(tray);
  }, 1000);
}

export function showAppTray() {
  app.whenReady().then(() => {
    preloadCalendarWindow().then();
    const currentLunar = toLunarDate(new Date(), getTimeZone());
    const icon = getLunarDateIcon(currentLunar.lunarDay);
    appTray = new Tray(icon);
    appTray.setToolTip(getTooltipText(currentLunar));

    const getContextMenu = () => {
      const currentLunar = toLunarDate(new Date(), getTimeZone());
      const introductionMenu = Menu.buildFromTemplate([
        {label: 'V Lunar Calendar', type: 'normal', enabled: false},
        {label: `v${app.getVersion()}`, type: 'normal', enabled: false},
        {
          label: `by Nguyen Tan Vinh`, type: 'normal', click: () => {
            const window = getCalendarWindow();
            if (window && window.isVisible()) {
              window.webContents.openDevTools({mode: 'detach'});
            }
          },
        },
      ]);

      const themeMenu = Menu.buildFromTemplate([
        {
          label: 'Tự động (Theo hệ thống)',
          type: 'radio',
          checked: ThemeManager.getTheme() === 'system',
          click: () => ThemeManager.setTheme('system'),
        },
        {
          label: 'Sáng',
          type: 'radio',
          checked: ThemeManager.getTheme() === 'light',
          click: () => ThemeManager.setTheme('light'),
        },
        {
          label: 'Tối',
          type: 'radio',
          checked: ThemeManager.getTheme() === 'dark',
          click: () => ThemeManager.setTheme('dark'),
        },
      ]);

      const loginSettings = app.getLoginItemSettings();
      return Menu.buildFromTemplate([
        {
          label: getTooltipText(currentLunar).replace('\n', ' - '),
          type: 'normal',
          click: () => forceRefreshTray(appTray),
          toolTip: 'Click để cập nhật ngày hiển thị trên thanh menu',
        },
        {type: 'separator'},
        {
          label: 'Giao diện',
          type: 'submenu',
          submenu: themeMenu,
        },
        {
          label: 'Quản lý ngày lễ',
          type: 'normal',
          click: () => createEventWindow(),
        },
        {
          label: 'Thông tin thanh toán',
          type: 'normal',
          click: () => createPaymentWindow(),
        },
        {
          label: 'Khởi động khi đăng nhập', type: 'checkbox', checked: loginSettings.openAtLogin, click: ({checked}) => {
            const appPath = execPath;
            log(`Set login to ${checked}: `, appPath);
            app.setLoginItemSettings({
              path: appPath,
              openAtLogin: checked,
            });
          },
        },
        {type: 'separator'},
        {label: 'Giới thiệu', type: 'submenu', submenu: introductionMenu},
        {label: 'Thoát', type: 'normal', click: () => app.exit()},
      ]);
    };

    nativeTheme.on('updated', () => forceRefreshTray(appTray));
    appTray.setToolTip(getTooltipText(currentLunar));

    // set events
    appTray.on('click', (_event, bounds) => {
      const eventWindow = getEventWindow();
      if (eventWindow && !eventWindow.isDestroyed() && eventWindow.isVisible()) {
        eventWindow.close();
        showCalendarWindow(bounds).then();
      } else {
        toggleCalendarWindow(bounds).then();
      }
    });

    appTray.on('right-click', () => {
      appTray.popUpContextMenu(getContextMenu());
    });

    // refresh to update tray icon
    dynamicRefreshTray(appTray);
  });
}
