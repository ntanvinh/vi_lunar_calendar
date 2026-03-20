
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

type UpdateDialogAction = 'primary' | 'secondary';

type UpdateDialogPayload = {
  title: string;
  heading: string;
  message: string;
  currentVersion: string;
  latestVersion: string;
  releaseNotesHtml: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  iconDataUrl?: string | null;
  downloadProgressPercent?: number | null;
};

interface IpcApi {
  onPaymentRequested: (callback: () => void) => () => void;
  openPaymentWindow: () => Promise<void>;
  getUpdateDialogData: () => Promise<UpdateDialogPayload | null>;
  performUpdateDialogAction: (action: UpdateDialogAction) => Promise<void>;
  onUpdateDialogPayload: (callback: (payload: UpdateDialogPayload) => void) => () => void;
  notifyUpdateDialogReady: () => void;
}

declare global {
  interface Window {
    eventManager: EventManagerApi;
    ipc: IpcApi;
  }
}
