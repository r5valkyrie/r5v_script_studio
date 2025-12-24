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
}

export interface ProjectData {
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  nodes: any[]; // ScriptNode[]
  connections: any[]; // NodeConnection[]
}

export interface SerializedProject {
  version: string; // Project format version
  data: ProjectData;
}
