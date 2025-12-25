export interface ProjectMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  createdAt: string;
  modifiedAt: string;
  editorVersion: string;
}

export interface ModSettings {
  modId: string;           // Unique mod identifier (e.g., "my_mod")
  modName: string;         // Display name
  modDescription: string;  // Mod description
  modVersion: string;      // Mod version (e.g., "1.0.0")
  modAuthor: string;       // Mod author
  localizationFiles: { path: string; enabled: boolean }[];  // Localization file paths
}

export const DEFAULT_MOD_SETTINGS: ModSettings = {
  modId: 'my_mod',
  modName: 'My Mod',
  modDescription: 'A custom mod created with R5V Mod Studio',
  modVersion: '1.0.0',
  modAuthor: 'Unknown',
  localizationFiles: [],
};

export interface ProjectSettings {
  canvasPosition?: { x: number; y: number };
  canvasZoom?: number;
  lastOpenedNode?: string;
  activeScriptFile?: string; // ID of currently open script file
  folders?: string[]; // Explicit folder paths (including empty folders)
  
  // Mod export settings
  mod?: ModSettings;
}

export interface ScriptFile {
  id: string;
  name: string;
  nodes: any[]; // ScriptNode[]
  connections: any[]; // NodeConnection[]
  createdAt: string;
  modifiedAt: string;
}

export interface ProjectData {
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  scriptFiles: ScriptFile[]; // Multiple script files
  nodes?: any[]; // Legacy support - will migrate to scriptFiles
  connections?: any[]; // Legacy support
}

export interface SerializedProject {
  version: string; // Project format version
  data: ProjectData;
}
