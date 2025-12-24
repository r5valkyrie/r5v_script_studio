import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import type { ProjectData, ProjectMetadata, SerializedProject } from '../types/project';

const CURRENT_PROJECT_VERSION = '1.0.0';
const EDITOR_VERSION = '0.1.0'; // From package.json

/**
 * Creates a new project with default metadata
 */
export function createNewProject(name: string = 'Untitled Project'): ProjectData {
  const now = new Date().toISOString();
  
  return {
    metadata: {
      name,
      version: '1.0.0',
      description: '',
      author: '',
      createdAt: now,
      modifiedAt: now,
      editorVersion: EDITOR_VERSION,
    },
    settings: {
      canvasPosition: { x: 0, y: 0 },
      canvasZoom: 1,
    },
    nodes: [],
    connections: [],
  };
}

/**
 * Serializes project data to JSON string
 */
export function serializeProject(
  nodes: ScriptNode[],
  connections: NodeConnection[],
  metadata: Partial<ProjectMetadata> = {},
  settings: ProjectData['settings'] = {}
): string {
  const now = new Date().toISOString();
  
  const projectData: ProjectData = {
    metadata: {
      name: metadata.name || 'Untitled Project',
      version: metadata.version || '1.0.0',
      description: metadata.description || '',
      author: metadata.author || '',
      createdAt: metadata.createdAt || now,
      modifiedAt: now,
      editorVersion: EDITOR_VERSION,
    },
    settings: {
      canvasPosition: settings.canvasPosition || { x: 0, y: 0 },
      canvasZoom: settings.canvasZoom || 1,
      lastOpenedNode: settings.lastOpenedNode,
    },
    nodes,
    connections,
  };

  const serialized: SerializedProject = {
    version: CURRENT_PROJECT_VERSION,
    data: projectData,
  };

  return JSON.stringify(serialized, null, 2);
}

/**
 * Deserializes project from JSON string
 */
export function deserializeProject(jsonString: string): ProjectData {
  try {
    const parsed: SerializedProject = JSON.parse(jsonString);
    
    // Version compatibility checks
    if (!parsed.version) {
      throw new Error('Invalid project file: missing version');
    }
    
    if (!parsed.data) {
      throw new Error('Invalid project file: missing data');
    }
    
    // Future: Add migration logic here for older versions
    // if (parsed.version === '0.9.0') {
    //   parsed.data = migrateFrom_0_9_0(parsed.data);
    // }
    
    return parsed.data;
  } catch (error) {
    throw new Error(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates metadata comment header for Squirrel code
 */
export function generateCodeMetadata(metadata: ProjectMetadata, includeGraph: boolean = false): string {
  const lines = [
    '// ========================================',
    '// R5V Mod Studio - Generated Code',
    '// ========================================',
    `// Project: ${metadata.name}`,
    `// Version: ${metadata.version}`,
  ];
  
  if (metadata.author) {
    lines.push(`// Author: ${metadata.author}`);
  }
  
  if (metadata.description) {
    lines.push(`// Description: ${metadata.description}`);
  }
  
  lines.push(
    `// Generated: ${new Date().toISOString()}`,
    `// Editor Version: ${metadata.editorVersion}`,
    '// ========================================',
  );
  
  if (includeGraph) {
    lines.push(
      '//',
      '// WARNING: Do not manually edit the metadata below.',
      '// It is used to restore the visual script in the editor.',
      '//',
    );
  }
  
  return lines.join('\n') + '\n\n';
}

/**
 * Embeds compressed project data in code as base64 comment
 */
export function embedProjectInCode(code: string, projectData: ProjectData): string {
  const projectJson = JSON.stringify({
    version: CURRENT_PROJECT_VERSION,
    data: projectData,
  });
  
  // Simple base64 encoding (in production, consider compression)
  const encoded = btoa(projectJson);
  
  // Split into multiple lines for readability
  const chunks: string[] = [];
  const chunkSize = 80;
  for (let i = 0; i < encoded.length; i += chunkSize) {
    chunks.push(encoded.slice(i, i + chunkSize));
  }
  
  const metadataLines = [
    '// @r5v-project-data-begin',
    ...chunks.map(chunk => `// ${chunk}`),
    '// @r5v-project-data-end',
    '',
  ].join('\n');
  
  return code + '\n\n' + metadataLines;
}

/**
 * Extracts embedded project data from generated code
 */
export function extractProjectFromCode(code: string): ProjectData | null {
  const beginMarker = '// @r5v-project-data-begin';
  const endMarker = '// @r5v-project-data-end';
  
  const beginIdx = code.indexOf(beginMarker);
  const endIdx = code.indexOf(endMarker);
  
  if (beginIdx === -1 || endIdx === -1) {
    return null;
  }
  
  const metadataSection = code.slice(beginIdx + beginMarker.length, endIdx);
  
  // Extract base64 from comment lines
  const lines = metadataSection.split('\n');
  const base64Parts = lines
    .map(line => line.trim())
    .filter(line => line.startsWith('//'))
    .map(line => line.slice(2).trim())
    .filter(line => line.length > 0);
  
  const encoded = base64Parts.join('');
  
  try {
    const decoded = atob(encoded);
    const parsed: SerializedProject = JSON.parse(decoded);
    return parsed.data;
  } catch (error) {
    console.error('Failed to extract project from code:', error);
    return null;
  }
}

/**
 * Validates project data structure
 */
export function validateProject(data: any): data is ProjectData {
  if (!data || typeof data !== 'object') return false;
  if (!data.metadata || typeof data.metadata !== 'object') return false;
  if (!Array.isArray(data.nodes)) return false;
  if (!Array.isArray(data.connections)) return false;
  
  return true;
}
