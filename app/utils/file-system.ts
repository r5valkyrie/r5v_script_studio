/**
 * File system utilities for saving/loading projects via Tauri IPC
 * These functions communicate with the Tauri backend to access the file system
 */

import { electron, isTauri } from './tauri-api';

export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface OpenFileOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

export interface SaveProjectResult {
  filePath: string | null;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: string;
}

/**
 * Shows save dialog and writes compressed project content to file
 */
export async function saveProjectFile(content: string, options: SaveFileOptions = {}): Promise<SaveProjectResult> {
  try {
    // Check if Tauri API is available
    if (!isTauri()) {
      console.error('Tauri API not available');
      // Fallback to browser download (uncompressed)
      downloadAsFile(content, options.defaultPath || 'project.r5vproj');
      return { filePath: null };
    }

    const result = await electron.showSaveDialog({
      title: options.title || 'Save Project',
      defaultPath: options.defaultPath,
      filters: options.filters || [
        { name: 'R5V Project', extensions: ['r5vproj'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { filePath: null };
    }

    const writeResult = await electron.writeProjectFile(result.filePath, content);
    
    if (!writeResult.success) {
      throw new Error(writeResult.error || 'Failed to write project file');
    }

    const ratio = writeResult.original_size && writeResult.compressed_size 
      ? ((1 - writeResult.compressed_size / writeResult.original_size) * 100).toFixed(1) + '%'
      : undefined;

    return { 
      filePath: result.filePath,
      originalSize: writeResult.original_size,
      compressedSize: writeResult.compressed_size,
      compressionRatio: ratio
    };
  } catch (error) {
    console.error('Failed to save project file:', error);
    throw error;
  }
}

/**
 * Shows open dialog and reads project file (auto-detects compressed or plain JSON)
 */
export async function openProjectFile(options: OpenFileOptions = {}): Promise<{ filePath: string; content: string; wasCompressed: boolean } | null> {
  console.log('[openProjectFile] Starting with options:', options);
  try {
    // Check if Tauri API is available
    if (!isTauri()) {
      console.error('[openProjectFile] Tauri API not available');
      const result = await openFileInBrowser();
      return result ? { ...result, wasCompressed: false } : null;
    }

    console.log('[openProjectFile] Showing open dialog...');
    const result = await electron.showOpenDialog({
      title: options.title || 'Open Project',
      filters: options.filters || [
        { name: 'R5V Project', extensions: ['r5vproj'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: options.properties || ['openFile'],
    });

    console.log('[openProjectFile] Dialog result:', result);

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      console.log('[openProjectFile] User cancelled or no files selected');
      return null;
    }

    const filePath = result.filePaths[0];
    console.log('[openProjectFile] Reading file:', filePath);
    const readResult = await electron.readProjectFile(filePath);
    
    console.log('[openProjectFile] Read result:', readResult);
    
    if (!readResult.success || !readResult.content) {
      throw new Error(readResult.error || 'Failed to read project file');
    }
    
    console.log('[openProjectFile] Success, returning file content');
    return { 
      filePath, 
      content: readResult.content,
      wasCompressed: readResult.compressed || false
    };
  } catch (error) {
    console.error('[openProjectFile] Failed to open project file:', error);
    throw error;
  }
}

/**
 * Shows save dialog and writes content to file
 */
export async function saveFile(content: string, options: SaveFileOptions = {}): Promise<string | null> {
  try {
    // Check if Tauri API is available
    if (!isTauri()) {
      console.error('Tauri API not available');
      // Fallback to browser download
      downloadAsFile(content, options.defaultPath || 'project.r5vproj');
      return null;
    }

    const result = await electron.showSaveDialog({
      title: options.title || 'Save Project',
      defaultPath: options.defaultPath,
      filters: options.filters || [
        { name: 'R5V Project', extensions: ['r5vproj'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    await electron.writeFile(result.filePath, content);
    return result.filePath;
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
}

/**
 * Shows open dialog and reads file content
 */
export async function openFile(options: OpenFileOptions = {}): Promise<{ filePath: string; content: string } | null> {
  try {
    // Check if Tauri API is available
    if (!isTauri()) {
      console.error('Tauri API not available');
      return await openFileInBrowser();
    }

    const result = await electron.showOpenDialog({
      title: options.title || 'Open Project',
      filters: options.filters || [
        { name: 'R5V Project', extensions: ['r5vproj'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Squirrel Script', extensions: ['nut', 'gnut'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: options.properties || ['openFile'],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const content = await electron.readFile(filePath);
    
    return { filePath, content };
  } catch (error) {
    console.error('Failed to open file:', error);
    throw error;
  }
}

/**
 * Saves generated Squirrel code
 */
export async function saveSquirrelCode(code: string, defaultName: string = 'script.nut'): Promise<string | null> {
  return saveFile(code, {
    title: 'Export Squirrel Script',
    defaultPath: defaultName,
    filters: [
      { name: 'Squirrel Script', extensions: ['nut', 'gnut'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
}

/**
 * Browser fallback: downloads content as file
 */
function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Browser fallback: opens file picker
 */
function openFileInBrowser(): Promise<{ filePath: string; content: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.r5vproj,.json,.nut,.gnut';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const content = await file.text();
        resolve({ filePath: file.name, content });
      } catch (error) {
        console.error('Failed to read file:', error);
        resolve(null);
      }
    };
    
    input.click();
  });
}
