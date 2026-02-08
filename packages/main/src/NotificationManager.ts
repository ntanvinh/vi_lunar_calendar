import {app, Notification} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type {CalendarEvent} from '../../common/src/EventData';
import {toLunarDate, toSolarDate} from '../../common/src/LunarUtil';
import {getTimeZone} from '../../common/src/MiscUtil';
import {loadEvents} from './EventManager';

const NOTIFICATION_HISTORY_FILE = 'notification_history.json';

interface NotificationHistory {
  [eventId: string]: string; // date string YYYY-MM-DD
}

export class NotificationManager {
  private static history: NotificationHistory = {};
  private static checkInterval: NodeJS.Timeout | null = null;
  private static activeNotifications: Set<Notification> = new Set();

  static init() {
    this.loadHistory();
    
    // Check immediately on startup (after a short delay to ensure app is fully ready)
    setTimeout(() => {
      this.checkNotifications();
    }, 5000);

    // Check every hour
    this.checkInterval = setInterval(() => {
      this.checkNotifications();
    }, 60 * 60 * 1000);
  }

  public static sendTestNotification(event: CalendarEvent) {
    const today = new Date();
    const timeZone = getTimeZone();
    const daysRemaining = this.getDaysRemaining(event, today, timeZone);
    
    if (daysRemaining !== null) {
      this.sendNotification(event, daysRemaining);
    }
  }

  private static getHistoryPath() {
    return path.join(app.getPath('userData'), NOTIFICATION_HISTORY_FILE);
  }

  private static loadHistory() {
    try {
      const historyPath = this.getHistoryPath();
      if (fs.existsSync(historyPath)) {
        this.history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      }
    } catch (e) {
      console.error('Failed to load notification history', e);
    }
  }

  private static saveHistory() {
    try {
      const historyPath = this.getHistoryPath();
      fs.writeFileSync(historyPath, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save notification history', e);
    }
  }

  private static async checkNotifications() {
    try {
      const events = loadEvents();
      
      const today = new Date();
      // Use local date for history key to ensure it matches the user's local day
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      const timeZone = getTimeZone();

      for (const event of events) {
        if (!event.notification?.enabled) continue;

        // Check if already notified today
        if (this.history[event.id] === todayStr) continue;

        const daysRemaining = this.getDaysRemaining(event, today, timeZone);
        
        if (daysRemaining === null) continue;

        const {notifyBefore, continuous} = event.notification;

        let shouldNotify = false;
        if (continuous) {
          if (daysRemaining >= 0 && daysRemaining <= notifyBefore) {
            shouldNotify = true;
          }
        } else {
          if (daysRemaining === notifyBefore) {
            shouldNotify = true;
          }
        }

        if (shouldNotify) {
          this.sendNotification(event, daysRemaining);
          this.history[event.id] = todayStr;
        }
      }
      
      this.saveHistory();
    } catch (e) {
      console.error('Error checking notifications:', e);
    }
  }

  private static getDaysRemaining(event: CalendarEvent, today: Date, timeZone: number): number | null {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let targetDate: Date;

    if (event.type === 'solar') {
      targetDate = new Date(todayStart.getFullYear(), event.month - 1, event.day);
      if (targetDate < todayStart) {
        targetDate = new Date(todayStart.getFullYear() + 1, event.month - 1, event.day);
      }
    } else {
      // Lunar
      const currentLunar = toLunarDate(todayStart, timeZone);
      // Construct target lunar date for current lunar year
      let targetSolar = toSolarDate({
        lunarDay: event.day,
        lunarMonth: event.month,
        lunarYear: currentLunar.lunarYear,
        isLeapMonth: false // Assuming non-leap for event definition
      }, timeZone);

      // If date passed, try next lunar year
      if (targetSolar < todayStart) {
         targetSolar = toSolarDate({
          lunarDay: event.day,
          lunarMonth: event.month,
          lunarYear: currentLunar.lunarYear + 1,
          isLeapMonth: false
        }, timeZone);
      }
      targetDate = targetSolar;
    }

    const diffTime = targetDate.getTime() - todayStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  private static sendNotification(event: CalendarEvent, daysRemaining: number) {
    if (!Notification.isSupported()) {
      console.warn('[NotificationManager] Notifications not supported');
      return;
    }

    let body = '';
    if (daysRemaining === 0) {
      body = `Sự kiện "${event.title}" diễn ra hôm nay!`;
    } else {
      body = `Sự kiện "${event.title}" sẽ diễn ra trong ${daysRemaining} ngày nữa.`;
    }

    const notification = new Notification({
      title: 'Nhắc nhở sự kiện',
      body: body,
      silent: false,
    });
    
    this.activeNotifications.add(notification);

    notification.show();
    
    notification.on('click', () => {
      // Focus the app window if possible
      // We might need reference to the main window
      this.activeNotifications.delete(notification);
    });
    
    notification.on('close', () => {
      this.activeNotifications.delete(notification);
    });
    
    notification.on('failed', (error) => {
      console.error('[NotificationManager] Notification failed:', error);
      this.activeNotifications.delete(notification);
    });
  }
}
