"use strict";
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', { filePath }),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content }),
  listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', { dirPath }),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', { dirPath }),
  deleteDirectory: (dirPath) => ipcRenderer.invoke('delete-directory', { dirPath }),
  
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
  },
  // Dialog APIs for save/load
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', { filePath }).then(r => r.content),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content }),
  // Compressed project file operations
  readProjectFile: (filePath) => ipcRenderer.invoke('read-project-file', { filePath }),
  writeProjectFile: (filePath, content) => ipcRenderer.invoke('write-project-file', { filePath, content }),
});
