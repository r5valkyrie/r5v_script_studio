"use strict";
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', { filePath }),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content }),
  listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', { dirPath }),
  
  // Mod operations
  createMod: (modData) => ipcRenderer.invoke('create-mod', modData),
  openModFolder: (folderPath) => ipcRenderer.invoke('open-mod-folder', { folderPath }),
  
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
  }
});
