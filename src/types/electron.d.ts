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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
