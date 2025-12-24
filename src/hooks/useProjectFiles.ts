import { useState, useCallback, useEffect } from 'react';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import type { ProjectData, ProjectMetadata, ScriptFile } from '../types/project';
import { 
  serializeProject, 
  deserializeProject, 
  validateProject,
  createNewProject,
  createScriptFile
} from '../utils/project-manager';
import { saveFile, openFile } from '../utils/file-system';

export interface UseProjectFilesReturn {
  // State
  projectData: ProjectData | null;
  currentFilePath: string | null;
  hasUnsavedChanges: boolean;
  scriptFiles: ScriptFile[];
  activeScriptFile: ScriptFile | null;
  recentProjects: Array<{ name: string; path: string; lastOpened: number }>;
  modifiedFileIds: Set<string>; // Track which files have unsaved changes
  
  // Project actions
  newProject: () => void;
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  loadProject: () => Promise<boolean>;
  loadProjectFromPath: (path: string) => Promise<boolean>;
  updateMetadata: (metadata: Partial<ProjectMetadata>) => void;
  
  // Script file actions
  createNewScriptFile: (name: string) => void;
  deleteScriptFile: (fileId: string) => void;
  renameScriptFile: (fileId: string, newName: string) => void;
  setActiveScriptFile: (fileId: string) => void;
  updateActiveScriptContent: (nodes: ScriptNode[], connections: NodeConnection[]) => void;
  markFileModified: (fileId: string) => void;
  markFileSaved: (fileId: string) => void;
  
  // Folder actions
  createFolder: (folderPath: string) => void;
  deleteFolder: (folderPath: string) => void;
  renameFolder: (oldPath: string, newPath: string) => void;
  folders: string[];
  
  // Change tracking
  markSaved: () => void;
  markModified: () => void;
}

export function useProjectFiles(): UseProjectFilesReturn {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modifiedFileIds, setModifiedFileIds] = useState<Set<string>>(new Set());
  const [recentProjects, setRecentProjects] = useState<Array<{ name: string; path: string; lastOpened: number }>>([]);

  // Load recent projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentProjects');
    if (stored) {
      try {
        setRecentProjects(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent projects:', error);
      }
    }
  }, []);

  // Save recent projects to localStorage
  const addToRecentProjects = useCallback((path: string, name: string) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.path !== path);
      const updated = [{ name, path, lastOpened: Date.now() }, ...filtered].slice(0, 10);
      localStorage.setItem('recentProjects', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const scriptFiles = projectData?.scriptFiles || [];
  const folders = projectData?.settings.folders || [];
  const activeFileId = projectData?.settings.activeScriptFile;
  const activeScriptFile = scriptFiles.find(f => f.id === activeFileId) || scriptFiles[0] || null;

  // Create new project
  const newProject = useCallback(() => {
    const project = createNewProject();
    setProjectData(project);
    setCurrentFilePath(null);
    setHasUnsavedChanges(false);
  }, []);

  // Save project
  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!projectData) return false;

    try {
      const jsonContent = serializeProject(
        projectData.scriptFiles,
        projectData.metadata,
        projectData.settings
      );
      
      let filePath = currentFilePath;
      
      if (!filePath) {
        filePath = await saveFile(jsonContent, {
          title: 'Save Project',
          defaultPath: `${projectData.metadata.name || 'Untitled'}.r5vproj`,
          filters: [
            { name: 'R5V Project', extensions: ['r5vproj'] },
            { name: 'JSON', extensions: ['json'] },
          ],
        });
        
        if (!filePath) return false;
      } else {
        if (window.electron) {
          await window.electron.writeFile(filePath, jsonContent);
        }
      }
      
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);
      setModifiedFileIds(new Set()); // Clear all modified file indicators
      addToRecentProjects(filePath, projectData.metadata.name || 'Untitled');
      
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }, [projectData, currentFilePath, addToRecentProjects]);

  // Save project as
  const saveProjectAs = useCallback(async (): Promise<boolean> => {
    if (!projectData) return false;

    try {
      const jsonContent = serializeProject(
        projectData.scriptFiles,
        projectData.metadata,
        projectData.settings
      );
      
      const filePath = await saveFile(jsonContent, {
        title: 'Save Project As',
        defaultPath: `${projectData.metadata.name || 'Untitled'}.r5vproj`,
        filters: [
          { name: 'R5V Project', extensions: ['r5vproj'] },
          { name: 'JSON', extensions: ['json'] },
        ],
      });
      
      if (!filePath) return false;
      
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);
      setModifiedFileIds(new Set()); // Clear all modified file indicators
      addToRecentProjects(filePath, projectData.metadata.name || 'Untitled');
      
      return true;
    } catch (error) {
      console.error('Failed to save project as:', error);
      return false;
    }
  }, [projectData, addToRecentProjects]);

  // Load project
  const loadProject = useCallback(async (): Promise<boolean> => {
    try {
      const result = await openFile({
        title: 'Open Project',
        filters: [
          { name: 'R5V Project', extensions: ['r5vproj'] },
          { name: 'JSON', extensions: ['json'] },
        ],
      });
      
      if (!result) return false;
      
      const loaded = deserializeProject(result.content);
      
      if (!validateProject(loaded)) {
        throw new Error('Invalid project file format');
      }
      
      setProjectData(loaded);
      setCurrentFilePath(result.filePath);
      setHasUnsavedChanges(false);
      setModifiedFileIds(new Set());
      addToRecentProjects(result.filePath, loaded.metadata.name || 'Untitled');
      
      return true;
    } catch (error) {
      console.error('Failed to load project:', error);
      alert(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [addToRecentProjects]);

  // Load project from specific path
  const loadProjectFromPath = useCallback(async (path: string): Promise<boolean> => {
    try {
      if (!window.electron) {
        alert('File system access is only available in Electron');
        return false;
      }

      const content = await window.electron.readFile(path);
      const loaded = deserializeProject(content);
      
      if (!validateProject(loaded)) {
        throw new Error('Invalid project file format');
      }
      
      setProjectData(loaded);
      setCurrentFilePath(path);
      setHasUnsavedChanges(false);
      setModifiedFileIds(new Set());
      addToRecentProjects(path, loaded.metadata.name || 'Untitled');
      
      return true;
    } catch (error) {
      console.error('Failed to load project:', error);
      alert(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [addToRecentProjects]);

  // Update metadata
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

  // Create new script file
  const createNewScriptFile = useCallback((name: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const newFile = createScriptFile(name);
      return {
        ...prev,
        scriptFiles: [...prev.scriptFiles, newFile],
        settings: {
          ...prev.settings,
          activeScriptFile: newFile.id,
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Delete script file
  const deleteScriptFile = useCallback((fileId: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const filtered = prev.scriptFiles.filter(f => f.id !== fileId);
      if (filtered.length === 0) {
        // Don't allow deleting the last file
        return prev;
      }
      const newActiveId = prev.settings.activeScriptFile === fileId 
        ? filtered[0].id 
        : prev.settings.activeScriptFile;
      return {
        ...prev,
        scriptFiles: filtered,
        settings: {
          ...prev.settings,
          activeScriptFile: newActiveId,
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Rename script file
  const renameScriptFile = useCallback((fileId: string, newName: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        scriptFiles: prev.scriptFiles.map(f => 
          f.id === fileId 
            ? { ...f, name: newName.endsWith('.nut') ? newName : `${newName}.nut`, modifiedAt: new Date().toISOString() }
            : f
        ),
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Set active script file
  const setActiveScriptFile = useCallback((fileId: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          activeScriptFile: fileId,
        },
      };
    });
  }, []);

  // Update active script content
  const updateActiveScriptContent = useCallback((nodes: ScriptNode[], connections: NodeConnection[]) => {
    setProjectData(prev => {
      if (!prev || !prev.settings.activeScriptFile) return prev;
      // Mark this specific file as modified
      setModifiedFileIds(ids => {
        const newIds = new Set(ids);
        newIds.add(prev.settings.activeScriptFile!);
        return newIds;
      });
      return {
        ...prev,
        scriptFiles: prev.scriptFiles.map(f =>
          f.id === prev.settings.activeScriptFile
            ? { ...f, nodes, connections, modifiedAt: new Date().toISOString() }
            : f
        ),
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Mark a specific file as modified
  const markFileModified = useCallback((fileId: string) => {
    setModifiedFileIds(ids => {
      const newIds = new Set(ids);
      newIds.add(fileId);
      return newIds;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Mark a specific file as saved (note: saving the project saves all files)
  const markFileSaved = useCallback((fileId: string) => {
    setModifiedFileIds(ids => {
      const newIds = new Set(ids);
      newIds.delete(fileId);
      return newIds;
    });
    // Check if there are still other modified files
    setModifiedFileIds(ids => {
      if (ids.size === 0) {
        setHasUnsavedChanges(false);
      }
      return ids;
    });
  }, []);

  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setModifiedFileIds(new Set());
  }, []);

  const markModified = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Create folder
  const createFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const currentFolders = prev.settings.folders || [];
      if (currentFolders.includes(folderPath)) return prev; // Already exists
      return {
        ...prev,
        settings: {
          ...prev.settings,
          folders: [...currentFolders, folderPath],
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Delete folder
  const deleteFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      // Also delete all files in this folder
      const filtered = prev.scriptFiles.filter(f => !f.name.startsWith(`${folderPath}/`));
      return {
        ...prev,
        scriptFiles: filtered,
        settings: {
          ...prev.settings,
          folders: (prev.settings.folders || []).filter(f => f !== folderPath && !f.startsWith(`${folderPath}/`)),
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Rename folder
  const renameFolder = useCallback((oldPath: string, newPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      // Update folder in folders array
      const updatedFolders = (prev.settings.folders || []).map(f => 
        f === oldPath ? newPath : f.startsWith(`${oldPath}/`) ? f.replace(oldPath, newPath) : f
      );
      // Update all files in this folder
      const updatedFiles = prev.scriptFiles.map(f => {
        if (f.name.startsWith(`${oldPath}/`)) {
          return { ...f, name: f.name.replace(`${oldPath}/`, `${newPath}/`), modifiedAt: new Date().toISOString() };
        }
        return f;
      });
      return {
        ...prev,
        scriptFiles: updatedFiles,
        settings: {
          ...prev.settings,
          folders: updatedFolders,
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Initialize with new project
  useEffect(() => {
    if (!projectData) {
      // Don't auto-create project - show welcome screen instead
      // newProject();
    }
  }, [projectData, newProject]);

  return {
    projectData,
    currentFilePath,
    hasUnsavedChanges,
    scriptFiles,
    activeScriptFile,
    recentProjects,
    folders,
    modifiedFileIds,
    newProject,
    saveProject,
    saveProjectAs,
    loadProject,
    loadProjectFromPath,
    updateMetadata,
    createNewScriptFile,
    deleteScriptFile,
    renameScriptFile,
    setActiveScriptFile,
    updateActiveScriptContent,
    markFileModified,
    markFileSaved,
    createFolder,
    deleteFolder,
    renameFolder,
    markSaved,
    markModified,
  };
}
