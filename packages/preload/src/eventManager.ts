import {ipcRenderer, type IpcRendererEvent} from 'electron';
import type {CalendarEvent} from '../../common/src/EventData';

export const eventManager = {
  getEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke('get-events'),
  saveEvent: (event: Omit<CalendarEvent, 'id'> & { id?: string }): Promise<CalendarEvent[]> => ipcRenderer.invoke('save-event', event),
  saveAllEvents: (events: CalendarEvent[]): Promise<CalendarEvent[]> => ipcRenderer.invoke('save-all-events', events),
  deleteEvent: (id: string): Promise<CalendarEvent[]> => ipcRenderer.invoke('delete-event', id),
  resetDefaultEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke('reset-default-events'),
  exportEventsCSV: (): Promise<boolean> => ipcRenderer.invoke('export-events-csv'),
  importEventsCSV: (mode: 'merge' | 'replace' = 'merge'): Promise<CalendarEvent[] | null> => ipcRenderer.invoke('import-events-csv', mode),
  showChoiceDialog: (options: { title: string; message: string; detail?: string; choices: string[]; cancelLabel?: string }): Promise<number | null> => ipcRenderer.invoke('show-choice-dialog', options),
  showConfirmDialog: (options: { title: string; message: string; type?: 'question' | 'warning' | 'info' | 'error'; detail?: string }): Promise<boolean> => ipcRenderer.invoke('show-confirm-dialog', options),
  testNotification: (event: CalendarEvent): Promise<void> => ipcRenderer.invoke('test-notification', event),
  navigateCalendarToDate: (dateIso: string): Promise<boolean> => ipcRenderer.invoke('navigate-calendar-to-date', dateIso),
  onCalendarNavigateToDate: (callback: (dateIso: string) => void) => {
    const subscription = (_event: IpcRendererEvent, dateIso: string) => callback(dateIso);
    ipcRenderer.on('calendar-navigate-to-date', subscription);
    return () => {
      ipcRenderer.removeListener('calendar-navigate-to-date', subscription);
    };
  },
  onEventsUpdated: (callback: (events: CalendarEvent[]) => void) => {
    const subscription = (_event: IpcRendererEvent, events: CalendarEvent[]) => callback(events);
    ipcRenderer.on('events-updated', subscription);
    return () => {
      ipcRenderer.removeListener('events-updated', subscription);
    };
  },
};
