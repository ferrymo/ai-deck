import { contextBridge, ipcRenderer } from 'electron';
import type { DeckAPI } from '../shared/contracts';

const api: DeckAPI = {
  snapshot: () => ipcRenderer.invoke('deck:snapshot'),
  scan: () => ipcRenderer.invoke('deck:scan'),
  checkUpdates: () => ipcRenderer.invoke('deck:check'),
  manage: (id, managed) => ipcRenderer.invoke('deck:manage', id, managed),
  setPolicy: (id, policy) => ipcRenderer.invoke('deck:policy', id, policy),
  saveSettings: (settings) => ipcRenderer.invoke('deck:settings', settings),
  backupSkill: (id) => ipcRenderer.invoke('deck:backup', id),
  restoreSkill: (id) => ipcRenderer.invoke('deck:restore', id),
  openDirectory: (id) => ipcRenderer.invoke('deck:directory', id),
  openWebsite: (id) => ipcRenderer.invoke('deck:website', id),
  windowAction: (action) => ipcRenderer.invoke('deck:window', action),
  selfUpdate: () => ipcRenderer.invoke('deck:self-state'),
  checkSelfUpdate: () => ipcRenderer.invoke('deck:self-check'),
  installSelfUpdate: () => ipcRenderer.invoke('deck:self-install'),
  onChanged: (listener) => {
    const callback = () => listener();
    ipcRenderer.on('deck:changed', callback);
    return () => ipcRenderer.removeListener('deck:changed', callback);
  },
};
contextBridge.exposeInMainWorld('deck', api);
