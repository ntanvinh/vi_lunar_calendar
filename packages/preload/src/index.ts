/**
 * @module preload
 */

import {contextBridge, ipcRenderer, type IpcRendererEvent} from 'electron';
import {sha256sum} from './nodeCrypto';
import {versions} from './versions';
import {eventManager} from './eventManager';

const ipc = {
  onPaymentRequested: (callback: () => void) => {
    const subscription = (_event: IpcRendererEvent) => callback();
    ipcRenderer.on('show-payment-modal', subscription);
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('show-payment-modal', subscription);
    };
  },
  openPaymentWindow: () => ipcRenderer.invoke('open-payment-window'),
  getUpdateDialogData: () => ipcRenderer.invoke('update-dialog:get-data'),
  performUpdateDialogAction: (action: 'primary' | 'secondary') => ipcRenderer.invoke('update-dialog:perform-action', action),
  onUpdateDialogPayload: (callback: (payload: Awaited<ReturnType<typeof ipcRenderer.invoke>>) => void) => {
    const listener = (_event: IpcRendererEvent, payload: unknown) => {
      callback(payload as never);
    };
    ipcRenderer.on('update-dialog:payload', listener);
    return () => {
      ipcRenderer.removeListener('update-dialog:payload', listener);
    };
  },
  notifyUpdateDialogReady: () => ipcRenderer.send('update-dialog:ready'),
};

console.log('Preload script loaded!');

// Export for usage in other modules if needed
export {sha256sum} from './nodeCrypto';
export {versions} from './versions';
export {eventManager} from './eventManager';

// Manually expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('versions', versions);
    contextBridge.exposeInMainWorld('sha256sum', sha256sum);
    contextBridge.exposeInMainWorld('eventManager', eventManager);
    contextBridge.exposeInMainWorld('ipc', ipc);
    console.log('APIs exposed via contextBridge');
  } catch (error) {
    console.error('Failed to expose APIs:', error);
  }
} else {
  // Fallback for when contextIsolation is disabled (not recommended)
  const unsafeWindow = window as Window & typeof globalThis & {
    versions: typeof versions;
    sha256sum: typeof sha256sum;
    eventManager: typeof eventManager;
    ipc: typeof ipc;
  };
  unsafeWindow.versions = versions;
  unsafeWindow.sha256sum = sha256sum;
  unsafeWindow.eventManager = eventManager;
  unsafeWindow.ipc = ipc;
  console.log('APIs exposed via window object');
}
