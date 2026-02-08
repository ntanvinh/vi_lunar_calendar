import {ipcRenderer} from 'electron';
import type {CalendarEvent} from '../../common/src/EventData';

export const eventManager = {
  getEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke('get-events'),
  saveEvent: (event: Omit<CalendarEvent, 'id'> & { id?: string }): Promise<CalendarEvent[]> => ipcRenderer.invoke('save-event', event),
  deleteEvent: (id: string): Promise<CalendarEvent[]> => ipcRenderer.invoke('delete-event', id),
  resetDefaultEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke('reset-default-events'),
  exportEventsCSV: (): Promise<boolean> => ipcRenderer.invoke('export-events-csv'),
  importEventsCSV: (): Promise<CalendarEvent[] | null> => ipcRenderer.invoke('import-events-csv'),
  showConfirmDialog: (options: { title: string; message: string; type?: 'question' | 'warning' | 'info' | 'error'; detail?: string }): Promise<boolean> => ipcRenderer.invoke('show-confirm-dialog', options),
};
