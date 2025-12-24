export interface ProjectMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  createdAt: string;
  modifiedAt: string;
  editorVersion: string;
}

export interface ProjectSettings {
  canvasPosition?: { x: number; y: number };
  canvasZoom?: number;
  lastOpenedNode?: string;
  activeScriptFile?: string; // ID of currently open script file
  folders?: string[]; // Explicit folder paths (including empty folders)
  
  // UI State persistence
  ui?: {
    // Panel visibility
    isSidebarOpen?: boolean;
    isProjectSectionExpanded?: boolean;
    isNodesSectionExpanded?: boolean;
    isInspectorOpen?: boolean;
    isCodePanelOpen?: boolean;
    
    // Panel widths
    sidebarWidth?: number;
    inspectorWidth?: number;
    codePanelWidth?: number;
    
    // Open file tabs
    openFileTabs?: string[];
    
    // Collapsed categories in node palette
    collapsedCategories?: string[];
  };
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
