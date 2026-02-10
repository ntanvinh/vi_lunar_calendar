/**
 * @module preload
 */

import {contextBridge, ipcRenderer} from 'electron';
import {sha256sum} from './nodeCrypto';
import {versions} from './versions';
import {eventManager} from './eventManager';

const ipc = {
  onPaymentRequested: (callback: () => void) => {
    const subscription = (_event: any) => callback();
    ipcRenderer.on('show-payment-modal', subscription);
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('show-payment-modal', subscription);
    };
  },
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
  (window as any).versions = versions;
  (window as any).sha256sum = sha256sum;
  (window as any).eventManager = eventManager;
  (window as any).ipc = ipc;
  console.log('APIs exposed via window object');
}
