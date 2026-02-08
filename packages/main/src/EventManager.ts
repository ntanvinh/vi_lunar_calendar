import {app, ipcMain, dialog} from 'electron';
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

// CSV Helpers
const CSV_HEADER = 'title,type,day,month,isImportant\n';

function eventsToCSV(events: CalendarEvent[]): string {
  const rows = events.map(e => {
    // Escape title if it contains commas
    const title = e.title.includes(',') ? `"${e.title}"` : e.title;
    return `${title},${e.type},${e.day},${e.month},${e.isImportant}`;
  });
  return CSV_HEADER + rows.join('\n');
}

function parseCSV(csvContent: string): Omit<CalendarEvent, 'id'>[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  // Skip header if present
  const startIndex = lines[0].startsWith('title,type') ? 1 : 0;
  
  const events: Omit<CalendarEvent, 'id'>[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parsing (handling quoted strings would be more complex but assuming simple usage for now)
    // For robust parsing, we might need a regex, but let's stick to simple split if titles don't have commas often,
    // or handle quotes manually.
    // Let's implement a basic split that respects quotes.
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
      const [title, type, day, month, isImportantStr] = parts;
      events.push({
        title: title.trim(),
        type: (type.trim() === 'lunar' ? 'lunar' : 'solar'),
        day: parseInt(day.trim(), 10),
        month: parseInt(month.trim(), 10),
        isImportant: isImportantStr.trim().toLowerCase() === 'true',
      });
    }
  }
  return events;
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

    ipcMain.handle('export-events-csv', async () => {
      const events = loadEvents();
      const csv = eventsToCSV(events);
      
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export Events to CSV',
        defaultPath: 'events.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (!canceled && filePath) {
        fs.writeFileSync(filePath, csv, 'utf-8');
        return true;
      }
      return false;
    });

    ipcMain.handle('import-events-csv', async () => {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import Events from CSV',
        properties: ['openFile'],
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (!canceled && filePaths.length > 0) {
        try {
          const csvContent = fs.readFileSync(filePaths[0], 'utf-8');
          const newEvents = parseCSV(csvContent);
          
          // Replace all existing events with imported ones
          const updatedEvents = newEvents.map(e => ({ ...e, id: uuidv4() }));
          
          saveEvents(updatedEvents);
          return updatedEvents;
        } catch (e) {
          console.error('Import failed:', e);
          throw e;
        }
      }
      return null; // Canceled
    });

    ipcMain.handle('show-confirm-dialog', async (_, { title, message, type = 'question', detail }: { title: string; message: string; type?: string; detail?: string }) => {
      const { response } = await dialog.showMessageBox({
        type: type as any,
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
  },
};
