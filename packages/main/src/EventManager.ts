import {app, ipcMain} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {CalendarEvent, DEFAULT_EVENTS} from '../../common/src/EventData';
import {v4 as uuidv4} from 'uuid';

const EVENTS_FILE_NAME = 'events.json';

function getEventsPath() {
  return path.join(app.getPath('userData'), EVENTS_FILE_NAME);
}

function loadEvents(): CalendarEvent[] {
  try {
    const eventsPath = getEventsPath();
    if (fs.existsSync(eventsPath)) {
      const data = fs.readFileSync(eventsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load events:', error);
  }
  
  // Initialize with default events if file doesn't exist
  const defaultEvents = DEFAULT_EVENTS.map(event => ({
    ...event,
    id: uuidv4(),
  }));
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

export const EventManager = {
  init: () => {
    ipcMain.handle('get-events', () => {
      return loadEvents();
    });

    ipcMain.handle('save-event', (_, event: Omit<CalendarEvent, 'id'> & { id?: string }) => {
      const events = loadEvents();
      if (event.id) {
        // Update existing
        const index = events.findIndex(e => e.id === event.id);
        if (index !== -1) {
          events[index] = event as CalendarEvent;
        }
      } else {
        // Add new
        events.push({
          ...event,
          id: uuidv4(),
        });
      }
      saveEvents(events);
      return events;
    });

    ipcMain.handle('delete-event', (_, id: string) => {
      let events = loadEvents();
      events = events.filter(e => e.id !== id);
      saveEvents(events);
      return events;
    });

    ipcMain.handle('reset-default-events', () => {
       const defaultEvents = DEFAULT_EVENTS.map(event => ({
        ...event,
        id: uuidv4(),
      }));
      saveEvents(defaultEvents);
      return defaultEvents;
    });
  },
};
