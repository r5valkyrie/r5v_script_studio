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

/**
 * Weapon file - KeyValue format .txt files for weapon definitions
 * Located in scripts/weapons/
 */
export interface WeaponFile {
  id: string;
  name: string;           // Filename without extension (e.g., "mp_weapon_custom")
  baseWeapon?: string;    // Base weapon to inherit from (e.g., "_base_smg")
  content: string;        // Raw KeyValue content
  createdAt: string;
  modifiedAt: string;
}

/**
 * UI file type - .res for layout files, .menu for menu definitions
 */
export type UIFileType = 'res' | 'menu';

/**
 * UI file - VGUI layout files (.res) and menu files (.menu)
 * Located in resource/ui/
 */
export interface UIFile {
  id: string;
  name: string;           // Filename without extension (e.g., "hudweapons")
  fileType: UIFileType;   // Type of UI file (.res or .menu)
  content: string;        // Raw VGUI content
  createdAt: string;
  modifiedAt: string;
}

/**
 * Type of active file being edited
 */
export type ActiveFileType = 'script' | 'weapon' | 'ui';

export interface ProjectSettings {
  canvasPosition?: { x: number; y: number };
  canvasZoom?: number;
  lastOpenedNode?: string;
  activeScriptFile?: string; // ID of currently open script file
  activeWeaponFile?: string; // ID of currently open weapon file
  activeUIFile?: string; // ID of currently open UI file
  activeFileType?: ActiveFileType; // Which type of file is currently active
  folders?: string[]; // Explicit folder paths for scripts (including empty folders)
  weaponFolders?: string[]; // Explicit folder paths for weapons
  uiFolders?: string[]; // Explicit folder paths for UI files
  
  // Mod export settings
  mod?: ModSettings;
}

export interface ProjectData {
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  scriptFiles: ScriptFile[]; // Multiple script files
  weaponFiles: WeaponFile[]; // Weapon definition files
  uiFiles: UIFile[]; // VGUI UI files
  nodes?: any[]; // Legacy support - will migrate to scriptFiles
  connections?: any[]; // Legacy support
}

export interface SerializedProject {
  version: string; // Project format version
  data: ProjectData;
}
