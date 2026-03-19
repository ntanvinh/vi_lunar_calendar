
import { CalendarEvent } from '../../common/src/EventData';

export interface EventManagerApi {
  getEvents: () => Promise<CalendarEvent[]>;
  saveEvent: (event: Omit<CalendarEvent, 'id'> & { id?: string }) => Promise<CalendarEvent[]>;
  saveAllEvents: (events: CalendarEvent[]) => Promise<CalendarEvent[]>;
  deleteEvent: (id: string) => Promise<CalendarEvent[]>;
  resetDefaultEvents: () => Promise<CalendarEvent[]>;
  exportEventsCSV: () => Promise<boolean>;
  importEventsCSV: () => Promise<CalendarEvent[] | null>;
  showConfirmDialog: (options: { title: string; message: string; type?: 'question' | 'warning' | 'info' | 'error'; detail?: string }) => Promise<boolean>;
  testNotification: (event: CalendarEvent) => Promise<void>;
  onEventsUpdated: (callback: (events: CalendarEvent[]) => void) => () => void;
}

declare global {
  interface Window {
    eventManager: EventManagerApi;
  }
}
