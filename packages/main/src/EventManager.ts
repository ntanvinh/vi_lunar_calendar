import {app, ipcMain, dialog, BrowserWindow} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {type CalendarEvent, DEFAULT_EVENTS} from '../../common/src/EventData';
import {v4 as uuidv4} from 'uuid';
import {NotificationManager} from './NotificationManager';
import {buildYearlySolarTermEvents, SOLAR_TERM_EVENT_DEFINITIONS} from '../../common/src/SolarTermEventCalculator';

const EVENTS_FILE_NAME = 'events.json';
const DYNAMIC_EVENT_IDS = new Set(SOLAR_TERM_EVENT_DEFINITIONS.map(definition => definition.id));
type CsvImportMode = 'merge' | 'replace';

function getEventsPath() {
  return path.join(app.getPath('userData'), EVENTS_FILE_NAME);
}

function isSameAsDefaultEvent(event: Pick<CalendarEvent, 'title' | 'type' | 'day' | 'month'>) {
  return DEFAULT_EVENTS.some(defaultEvent =>
    defaultEvent.title === event.title
    && defaultEvent.type === event.type
    && defaultEvent.day === event.day
    && defaultEvent.month === event.month,
  );
}

function normalizeEventSource(event: CalendarEvent): CalendarEvent {
  if (event.source === 'dynamic-yearly' || DYNAMIC_EVENT_IDS.has(event.id)) {
    return {
      ...event,
      source: 'dynamic-yearly',
      isReadOnly: true,
    };
  }

  if (event.source === 'default') {
    return {
      ...event,
      source: 'default',
      isReadOnly: false,
    };
  }

  if (event.source === 'user') {
    return {
      ...event,
      source: 'user',
      isReadOnly: false,
    };
  }

  if (isSameAsDefaultEvent(event)) {
    return {
      ...event,
      source: 'default',
      isReadOnly: false,
    };
  }

  return {
    ...event,
    source: 'user',
    isReadOnly: false,
  };
}

function normalizeEvents(events: CalendarEvent[]) {
  return events.map(normalizeEventSource);
}

function createDefaultEvents(): CalendarEvent[] {
  return DEFAULT_EVENTS.map(event => ({
    ...event,
    id: uuidv4(),
    source: 'default',
    isReadOnly: false,
  }));
}

function mergeDynamicYearlyEvents(events: CalendarEvent[], year: number): CalendarEvent[] {
  const normalizedEvents = normalizeEvents(events);
  const dynamicMap = new Map(
    normalizedEvents
      .filter(event => event.source === 'dynamic-yearly' || DYNAMIC_EVENT_IDS.has(event.id))
      .map(event => [event.id, event]),
  );

  const nonDynamicEvents = normalizedEvents.filter(event => !dynamicMap.has(event.id));
  const dynamicEvents = buildYearlySolarTermEvents(year).map(dynamicEvent => {
    const existing = dynamicMap.get(dynamicEvent.id);
    return {
      ...dynamicEvent,
      notification: existing?.notification,
    };
  });

  return [...nonDynamicEvents, ...dynamicEvents];
}

function areEventsEqual(left: CalendarEvent[], right: CalendarEvent[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function readStoredEvents(): CalendarEvent[] {
  try {
    const eventsPath = getEventsPath();
    if (fs.existsSync(eventsPath)) {
      const data = fs.readFileSync(eventsPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed as CalendarEvent[];
      }
    }
  } catch (error) {
    console.error('Failed to load events:', error);
  }

  const defaultEvents = createDefaultEvents();
  saveEvents(defaultEvents);
  return defaultEvents;
}

function saveEvents(events: CalendarEvent[]) {
  try {
    const eventsPath = getEventsPath();
    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save events:', error);
  }
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function ensureEventsForCurrentYear(events: CalendarEvent[]) {
  return mergeDynamicYearlyEvents(events, getCurrentYear());
}

function broadcastEventsUpdated(events: CalendarEvent[]) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send('events-updated', events);
    }
  });
}

export function loadEvents(): CalendarEvent[] {
  const storedEvents = readStoredEvents();
  const syncedEvents = ensureEventsForCurrentYear(storedEvents);
  if (!areEventsEqual(storedEvents, syncedEvents)) {
    saveEvents(syncedEvents);
  }
  return syncedEvents;
}

export function refreshDynamicEventsForCurrentYear() {
  const events = loadEvents();
  broadcastEventsUpdated(events);
  return events;
}

const CSV_HEADER = 'title,type,day,month,isImportant\n';

function eventsToCSV(events: CalendarEvent[]): string {
  const rows = events.map(event => {
    const title = event.title.includes(',') ? `"${event.title}"` : event.title;
    return `${title},${event.type},${event.day},${event.month},${event.isImportant}`;
  });
  return CSV_HEADER + rows.join('\n');
}

function parseCSV(csvContent: string): Omit<CalendarEvent, 'id'>[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const startIndex = lines[0].startsWith('title,type') ? 1 : 0;
  const events: Omit<CalendarEvent, 'id'>[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    parts.push(current);
    if (parts.length >= 5) {
      const [title, type, day, month, isImportant] = parts;
      events.push({
        title: title.trim(),
        type: type.trim() === 'lunar' ? 'lunar' : 'solar',
        day: parseInt(day.trim(), 10),
        month: parseInt(month.trim(), 10),
        isImportant: isImportant.trim().toLowerCase() === 'true',
        source: 'user',
      });
    }
  }

  return events;
}

function getEventDeduplicateKey(event: Pick<CalendarEvent, 'title' | 'type' | 'day' | 'month'>) {
  return `${event.title.trim().toLocaleLowerCase()}|${event.type}|${event.day}|${event.month}`;
}

function sanitizeReadOnlyEventUpdate(existingEvent: CalendarEvent, incomingEvent: Omit<CalendarEvent, 'id'> & { id?: string }) {
  return {
    ...existingEvent,
    notification: incomingEvent.notification,
  };
}

function sanitizeSaveAllEvents(updatedEvents: CalendarEvent[], existingEvents: CalendarEvent[]) {
  const existingEventMap = new Map(existingEvents.map(event => [event.id, event]));
  return updatedEvents.map(updatedEvent => {
    const existingEvent = existingEventMap.get(updatedEvent.id);
    if (!existingEvent) {
      return normalizeEventSource(updatedEvent);
    }
    if (existingEvent.isReadOnly) {
      return {
        ...existingEvent,
        notification: updatedEvent.notification,
      };
    }
    return normalizeEventSource({
      ...updatedEvent,
      source: updatedEvent.source ?? existingEvent.source,
    });
  });
}

export const EventManager = {
  init: () => {
    ipcMain.handle('get-events', () => {
      return loadEvents();
    });

    ipcMain.handle('save-event', (_, event: Omit<CalendarEvent, 'id'> & { id?: string }) => {
      const events = loadEvents();
      if (event.id) {
        const index = events.findIndex(currentEvent => currentEvent.id === event.id);
        if (index !== -1) {
          const existingEvent = events[index];
          if (existingEvent.isReadOnly) {
            events[index] = sanitizeReadOnlyEventUpdate(existingEvent, event);
          } else {
            events[index] = normalizeEventSource(event as CalendarEvent);
          }
        }
      } else {
        events.push(normalizeEventSource({
          ...event,
          id: uuidv4(),
          source: 'user',
          isReadOnly: false,
        } as CalendarEvent));
      }

      const syncedEvents = ensureEventsForCurrentYear(events);
      saveEvents(syncedEvents);
      broadcastEventsUpdated(syncedEvents);
      return syncedEvents;
    });

    ipcMain.handle('save-all-events', (_, updatedEvents: CalendarEvent[]) => {
      const existingEvents = loadEvents();
      const sanitizedEvents = sanitizeSaveAllEvents(updatedEvents, existingEvents);
      const syncedEvents = ensureEventsForCurrentYear(sanitizedEvents);
      saveEvents(syncedEvents);
      broadcastEventsUpdated(syncedEvents);
      return syncedEvents;
    });

    ipcMain.handle('delete-event', (_, id: string) => {
      const events = loadEvents();
      const target = events.find(event => event.id === id);
      if (target?.isReadOnly) {
        return events;
      }
      const updatedEvents = events.filter(event => event.id !== id);
      const syncedEvents = ensureEventsForCurrentYear(updatedEvents);
      saveEvents(syncedEvents);
      broadcastEventsUpdated(syncedEvents);
      return syncedEvents;
    });

    ipcMain.handle('reset-default-events', () => {
      const syncedEvents = ensureEventsForCurrentYear(createDefaultEvents());
      saveEvents(syncedEvents);
      broadcastEventsUpdated(syncedEvents);
      return syncedEvents;
    });

    ipcMain.handle('export-events-csv', async () => {
      const events = loadEvents();
      const csv = eventsToCSV(events);
      const {canceled, filePath} = await dialog.showSaveDialog({
        title: 'Export Events to CSV',
        defaultPath: 'events.csv',
        filters: [{name: 'CSV Files', extensions: ['csv']}],
      });

      if (!canceled && filePath) {
        fs.writeFileSync(filePath, csv, 'utf-8');
        return true;
      }
      return false;
    });

    ipcMain.handle('import-events-csv', async (_event, mode: CsvImportMode = 'merge') => {
      const {canceled, filePaths} = await dialog.showOpenDialog({
        title: 'Import Events from CSV',
        properties: ['openFile'],
        filters: [{name: 'CSV Files', extensions: ['csv']}],
      });

      if (!canceled && filePaths.length > 0) {
        try {
          const csvContent = fs.readFileSync(filePaths[0], 'utf-8');
          const existingEvents = mode === 'replace' ? [] : loadEvents();
          const deduplicateKeys = new Set(existingEvents.map(event => getEventDeduplicateKey(event)));
          const importedEvents = parseCSV(csvContent)
            .filter(event => {
              const key = getEventDeduplicateKey(event as Pick<CalendarEvent, 'title' | 'type' | 'day' | 'month'>);
              if (deduplicateKeys.has(key)) {
                return false;
              }
              deduplicateKeys.add(key);
              return true;
            })
            .map(event => ({
            ...event,
            id: uuidv4(),
          })) as CalendarEvent[];
          const mergedEvents = [...existingEvents, ...importedEvents];
          const syncedEvents = ensureEventsForCurrentYear(mergedEvents);
          saveEvents(syncedEvents);
          broadcastEventsUpdated(syncedEvents);
          return syncedEvents;
        } catch (error) {
          console.error('Import failed:', error);
          throw error;
        }
      }
      return null;
    });

    ipcMain.handle('show-choice-dialog', async (_, {
      title,
      message,
      detail,
      choices,
      cancelLabel = 'Cancel',
    }: {
      title: string;
      message: string;
      detail?: string;
      choices: string[];
      cancelLabel?: string;
    }) => {
      if (!Array.isArray(choices) || choices.length === 0) {
        return null;
      }

      const {response} = await dialog.showMessageBox({
        type: 'question',
        title,
        message,
        detail,
        buttons: [...choices, cancelLabel],
        defaultId: 0,
        cancelId: choices.length,
        noLink: true,
      });

      return response >= 0 && response < choices.length ? response : null;
    });

    ipcMain.handle('show-confirm-dialog', async (_, {title, message, type = 'question', detail}: { title: string; message: string; type?: string; detail?: string }) => {
      const {response} = await dialog.showMessageBox({
        type: type,
        title: title,
        message: message,
        detail: detail,
        buttons: ['Cancel', 'OK'],
        defaultId: 1,
        cancelId: 0,
        noLink: true,
      });
      return response === 1;
    });

    ipcMain.handle('test-notification', (_, event: CalendarEvent) => {
      NotificationManager.sendTestNotification(event);
    });
  },
};
