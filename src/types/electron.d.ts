export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

export interface ModData {
  name: string;
  description: string;
  author: string;
  version: string;
  modId: string;
  path: string;
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

export interface ElectronAPI {
  // File operations
  selectDirectory: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  listDirectory: (dirPath: string) => Promise<{ 
    success: boolean; 
    items?: Array<{ name: string; isDirectory: boolean; path: string }>; 
    error?: string 
  }>;
  createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  deleteDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  
  // Mod operations
  createMod: (modData: ModData) => Promise<{ success: boolean; path?: string; error?: string }>;
  openModFolder: (folderPath: string) => Promise<{ 
    success: boolean; 
    tree?: FileItem[]; 
    rootPath?: string; 
    error?: string 
  }>;
  
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

export interface ProjectFileReadResult {
  success: boolean;
  content?: string;
  compressed?: boolean;
  error?: string;
}

export interface ProjectFileWriteResult {
  success: boolean;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

export interface Electron {
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  };
  showSaveDialog: (options: SaveDialogOptions) => Promise<DialogResult>;
  showOpenDialog: (options: OpenDialogOptions) => Promise<DialogResult>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<any>;
  // Compressed project file operations
  readProjectFile: (filePath: string) => Promise<ProjectFileReadResult>;
  writeProjectFile: (filePath: string, content: string) => Promise<ProjectFileWriteResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron: Electron;
  }
}
