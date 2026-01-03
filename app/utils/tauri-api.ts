/**
 * Tauri API utilities for file system operations
 * Provides a unified interface that works with Tauri's invoke system
 */

import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';

// Check if running in Tauri
export const isTauri = (): boolean => {
  // In Tauri v2, check for __TAURI_INTERNALS__ or __TAURI__
  const hasTauri = typeof window !== 'undefined' && 
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
  console.log('[isTauri] Check result:', hasTauri, {
    hasWindow: typeof window !== 'undefined',
    hasTauriGlobal: typeof window !== 'undefined' && '__TAURI__' in window,
    hasTauriInternals: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
  });
  return hasTauri;
};

// Types matching the Rust backend
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

export interface DirectoryItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface ModData {
  name: string;
  description: string;
  author: string;
  version: string;
  modId: string;
  path: string;
}

export interface ReadFileResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface WriteFileResult {
  success: boolean;
  error?: string;
}

export interface ProjectFileReadResult {
  success: boolean;
  content?: string;
  compressed?: boolean;
  error?: string;
}

export interface ProjectFileWriteResult {
  success: boolean;
  original_size?: number;
  compressed_size?: number;
  error?: string;
}

export interface ListDirectoryResult {
  success: boolean;
  items?: DirectoryItem[];
  error?: string;
}

export interface OpenModFolderResult {
  success: boolean;
  tree?: FileItem[];
  root_path?: string;
  error?: string;
}

export interface CreateModResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface OpenDialogOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

export interface DialogResult {
  canceled: boolean;
  filePath?: string;
  filePaths?: string[];
}

// Window controls
export const windowControls = {
  minimize: async (): Promise<void> => {
    if (isTauri()) {
      await getCurrentWindow().minimize();
    }
  },
  maximize: async (): Promise<void> => {
    if (isTauri()) {
      const win = getCurrentWindow();
      if (await win.isMaximized()) {
        await win.unmaximize();
      } else {
        await win.maximize();
      }
    }
  },
  close: async (): Promise<void> => {
    if (isTauri()) {
      await getCurrentWindow().close();
    }
  },
};

// File operations via Tauri commands
export const tauriAPI = {
  // Read a file
  readFile: async (filePath: string): Promise<ReadFileResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<ReadFileResult>('read_file', { filePath });
  },

  // Write a file
  writeFile: async (filePath: string, content: string): Promise<WriteFileResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<WriteFileResult>('write_file', { filePath, content });
  },

  // Read compressed project file
  readProjectFile: async (filePath: string): Promise<ProjectFileReadResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<ProjectFileReadResult>('read_project_file', { filePath });
  },

  // Write compressed project file
  writeProjectFile: async (filePath: string, content: string): Promise<ProjectFileWriteResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<ProjectFileWriteResult>('write_project_file', { filePath, content });
  },

  // List directory contents
  listDirectory: async (dirPath: string): Promise<ListDirectoryResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<ListDirectoryResult>('list_directory', { dirPath });
  },

  // Create directory
  createDirectory: async (dirPath: string): Promise<WriteFileResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<WriteFileResult>('create_directory', { dirPath });
  },

  // Delete directory
  deleteDirectory: async (dirPath: string): Promise<WriteFileResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<WriteFileResult>('delete_directory', { dirPath });
  },

  // Open mod folder and get file tree
  openModFolder: async (folderPath: string): Promise<OpenModFolderResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<OpenModFolderResult>('open_mod_folder', { folderPath });
  },

  // Create a new mod
  createMod: async (modData: ModData): Promise<CreateModResult> => {
    if (!isTauri()) {
      return { success: false, error: 'Tauri API not available' };
    }
    return await invoke<CreateModResult>('create_mod', { modData });
  },

  // Show save dialog
  showSaveDialog: async (options: SaveDialogOptions): Promise<DialogResult> => {
    if (!isTauri()) {
      return { canceled: true };
    }
    
    const filePath = await save({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
    
    return {
      canceled: filePath === null,
      filePath: filePath ?? undefined,
    };
  },

  // Show open dialog
  showOpenDialog: async (options: OpenDialogOptions): Promise<DialogResult> => {
    console.log('[tauri-api] showOpenDialog called with:', options);
    
    if (!isTauri()) {
      console.log('[tauri-api] Not running in Tauri environment');
      return { canceled: true };
    }
    
    try {
      const isDirectory = options.properties?.includes('openDirectory');
      const multiple = options.properties?.includes('multiSelections');
      
      console.log('[tauri-api] Calling open() with:', { 
        title: options.title, 
        filters: options.filters, 
        directory: isDirectory, 
        multiple 
      });
      
      const result = await open({
        title: options.title,
        filters: options.filters,
        directory: isDirectory,
        multiple: multiple,
      });
      
      console.log('[tauri-api] open() result:', result);
      
      if (result === null) {
        console.log('[tauri-api] User cancelled dialog');
        return { canceled: true };
      }
      
      const filePaths = Array.isArray(result) ? result : [result];
      
      console.log('[tauri-api] Returning file paths:', filePaths);
      
      return {
        canceled: false,
        filePaths,
        filePath: filePaths[0],
      };
    } catch (error) {
      console.error('[tauri-api] Error in showOpenDialog:', error);
      throw error;
    }
  },

  // Select directory (convenience method)
  selectDirectory: async (): Promise<string | null> => {
    if (!isTauri()) {
      return null;
    }
    
    const result = await open({
      title: 'Select Mod Directory',
      directory: true,
      multiple: false,
    });
    
    return result as string | null;
  },
};

// Re-export for backwards compatibility - matches window.electron interface
export const electron = {
  showSaveDialog: tauriAPI.showSaveDialog,
  showOpenDialog: tauriAPI.showOpenDialog,
  readFile: async (filePath: string): Promise<string> => {
    const result = await tauriAPI.readFile(filePath);
    if (!result.success) throw new Error(result.error);
    return result.content!;
  },
  writeFile: tauriAPI.writeFile,
  readProjectFile: tauriAPI.readProjectFile,
  writeProjectFile: tauriAPI.writeProjectFile,
};

// Re-export for backwards compatibility - matches window.electronAPI interface  
export const electronAPI = {
  selectDirectory: tauriAPI.selectDirectory,
  readFile: tauriAPI.readFile,
  writeFile: tauriAPI.writeFile,
  listDirectory: tauriAPI.listDirectory,
  createDirectory: tauriAPI.createDirectory,
  deleteDirectory: tauriAPI.deleteDirectory,
  createMod: tauriAPI.createMod,
  openModFolder: tauriAPI.openModFolder,
  minimize: windowControls.minimize,
  maximize: windowControls.maximize,
  close: windowControls.close,
};

// Default export
export default tauriAPI;
