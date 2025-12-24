import { useState, useCallback, useEffect } from 'react';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import type { ProjectData, ProjectMetadata } from '../types/project';
import { 
  serializeProject, 
  deserializeProject, 
  validateProject,
  createNewProject 
} from '../utils/project-manager';
import { saveFile, openFile } from '../utils/file-system';

export interface UseProjectReturn {
  // State
  projectData: ProjectData | null;
  currentFilePath: string | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  newProject: () => void;
  saveProject: (nodes: ScriptNode[], connections: NodeConnection[]) => Promise<boolean>;
  saveProjectAs: (nodes: ScriptNode[], connections: NodeConnection[]) => Promise<boolean>;
  loadProject: () => Promise<{ nodes: ScriptNode[]; connections: NodeConnection[] } | null>;
  updateMetadata: (metadata: Partial<ProjectMetadata>) => void;
  markSaved: () => void;
  markModified: () => void;
}

export function useProject(): UseProjectReturn {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Create new project
  const newProject = useCallback(() => {
    const project = createNewProject();
    setProjectData(project);
    setCurrentFilePath(null);
    setHasUnsavedChanges(false);
  }, []);

  // Save project to current file or show save dialog
  const saveProject = useCallback(async (
    nodes: ScriptNode[], 
    connections: NodeConnection[]
  ): Promise<boolean> => {
    try {
      const metadata = projectData?.metadata || {};
      const settings = projectData?.settings || {};
      
      const jsonContent = serializeProject(nodes, connections, metadata, settings);
      
      let filePath = currentFilePath;
      
      // If no current file, show save dialog
      if (!filePath) {
        filePath = await saveFile(jsonContent, {
          title: 'Save Project',
          defaultPath: `${(metadata as any).name || 'Untitled'}.r5vproj`,
          filters: [
            { name: 'R5V Project', extensions: ['r5vproj'] },
            { name: 'JSON', extensions: ['json'] },
          ],
        });
        
        if (!filePath) return false; // User cancelled
      } else {
        // Save to existing file
        if (window.electron) {
          await window.electron.writeFile(filePath, jsonContent);
        }
      }
      
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);
      
      // Update project data with current state
      const updated = deserializeProject(jsonContent);
      setProjectData(updated);
      
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }, [projectData, currentFilePath]);

  // Save project as (always show dialog)
  const saveProjectAs = useCallback(async (
    nodes: ScriptNode[], 
    connections: NodeConnection[]
  ): Promise<boolean> => {
    try {
      const metadata = projectData?.metadata || {};
      const settings = projectData?.settings || {};
      
      const jsonContent = serializeProject(nodes, connections, metadata, settings);
      
      const filePath = await saveFile(jsonContent, {
        title: 'Save Project As',
        defaultPath: `${(metadata as any).name || 'Untitled'}.r5vproj`,
        filters: [
          { name: 'R5V Project', extensions: ['r5vproj'] },
          { name: 'JSON', extensions: ['json'] },
        ],
      });
      
      if (!filePath) return false;
      
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);
      
      const updated = deserializeProject(jsonContent);
      setProjectData(updated);
      
      return true;
    } catch (error) {
      console.error('Failed to save project as:', error);
      return false;
    }
  }, [projectData]);

  // Load project from file
  const loadProject = useCallback(async (): Promise<{ 
    nodes: ScriptNode[]; 
    connections: NodeConnection[] 
  } | null> => {
    try {
      const result = await openFile({
        title: 'Open Project',
        filters: [
          { name: 'R5V Project', extensions: ['r5vproj'] },
          { name: 'JSON', extensions: ['json'] },
        ],
      });
      
      if (!result) return null;
      
      const loaded = deserializeProject(result.content);
      
      if (!validateProject(loaded)) {
        throw new Error('Invalid project file format');
      }
      
      setProjectData(loaded);
      setCurrentFilePath(result.filePath);
      setHasUnsavedChanges(false);
      
      return {
        nodes: loaded.nodes as ScriptNode[],
        connections: loaded.connections as NodeConnection[],
      };
    } catch (error) {
      console.error('Failed to load project:', error);
      alert(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }, []);

  // Update project metadata
  const updateMetadata = useCallback((metadata: Partial<ProjectMetadata>) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          ...metadata,
          modifiedAt: new Date().toISOString(),
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const markModified = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Initialize with new project
  useEffect(() => {
    if (!projectData) {
      newProject();
    }
  }, [projectData, newProject]);

  return {
    projectData,
    currentFilePath,
    hasUnsavedChanges,
    newProject,
    saveProject,
    saveProjectAs,
    loadProject,
    updateMetadata,
    markSaved,
    markModified,
  };
}
