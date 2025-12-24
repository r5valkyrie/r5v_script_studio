/**
 * File system utilities for saving/loading projects via Electron IPC
 * These functions communicate with the main process to access the file system
 */

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

/**
 * Shows save dialog and writes content to file
 */
export async function saveFile(content: string, options: SaveFileOptions = {}): Promise<string | null> {
  try {
    // Check if electron API is available
    if (!window.electron) {
      console.error('Electron API not available');
      // Fallback to browser download
      downloadAsFile(content, options.defaultPath || 'project.r5vproj');
      return null;
    }

    const result = await window.electron.showSaveDialog({
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

    await window.electron.writeFile(result.filePath, content);
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
    // Check if electron API is available
    if (!window.electron) {
      console.error('Electron API not available');
      return await openFileInBrowser();
    }

    const result = await window.electron.showOpenDialog({
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
    const content = await window.electron.readFile(filePath);
    
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
