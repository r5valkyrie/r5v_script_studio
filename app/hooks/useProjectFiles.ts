import { useState, useCallback, useEffect } from 'react';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import type { ProjectData, ProjectMetadata, ScriptFile, ModSettings, WeaponFile, UIFile, UIFileType, ActiveFileType, LocalizationFile, LocalizationLanguage } from '../types/project';
import { 
  serializeProject, 
  deserializeProject, 
  validateProject,
  createNewProject,
  createScriptFile,
  createWeaponFile,
  createUIFile,
  createLocalizationFile
} from '../utils/project-manager';
import { saveProjectFile, openProjectFile } from '../utils/file-system';
import { electron, isTauri } from '../utils/tauri-api';

export interface UseProjectFilesReturn {
  // State
  projectData: ProjectData | null;
  currentFilePath: string | null;
  hasUnsavedChanges: boolean;
  scriptFiles: ScriptFile[];
  activeScriptFile: ScriptFile | null;
  recentProjects: Array<{ name: string; path: string; lastOpened: number }>;
  modifiedFileIds: Set<string>; // Track which files have unsaved changes
  
  // Weapon file state
  weaponFiles: WeaponFile[];
  activeWeaponFile: WeaponFile | null;
  activeFileType: ActiveFileType;
  weaponFolders: string[];
  
  // UI file state
  uiFiles: UIFile[];
  activeUIFile: UIFile | null;
  uiFolders: string[];
  
  // Localization file state
  localizationFiles: LocalizationFile[];
  activeLocalizationFile: LocalizationFile | null;
  localizationFolders: string[];
  
  // Project actions
  newProject: () => void;
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  loadProject: () => Promise<boolean>;
  loadProjectFromPath: (path: string) => Promise<boolean>;
  updateMetadata: (metadata: Partial<ProjectMetadata>) => void;
  updateModSettings: (mod: ModSettings) => void;
  
  // Script file actions
  createNewScriptFile: (name: string) => void;
  deleteScriptFile: (fileId: string) => void;
  renameScriptFile: (fileId: string, newName: string) => void;
  setActiveScriptFile: (fileId: string | null) => void;
  updateActiveScriptContent: (nodes: ScriptNode[], connections: NodeConnection[]) => void;
  markFileModified: (fileId: string) => void;
  markFileSaved: (fileId: string) => void;
  
  // Weapon file actions
  createNewWeaponFile: (name: string, baseWeapon?: string) => void;
  deleteWeaponFile: (fileId: string) => void;
  renameWeaponFile: (fileId: string, newName: string) => void;
  setActiveWeaponFile: (fileId: string | null) => void;
  updateWeaponContent: (fileId: string, content: string) => void;
  createWeaponFolder: (folderPath: string) => void;
  deleteWeaponFolder: (folderPath: string) => void;
  renameWeaponFolder: (oldPath: string, newPath: string) => void;
  
  // UI file actions
  createNewUIFile: (name: string, fileType?: UIFileType) => void;
  deleteUIFile: (fileId: string) => void;
  renameUIFile: (fileId: string, newName: string) => void;
  setActiveUIFile: (fileId: string | null) => void;
  updateUIContent: (fileId: string, content: string) => void;
  createUIFolder: (folderPath: string) => void;
  deleteUIFolder: (folderPath: string) => void;
  renameUIFolder: (oldPath: string, newPath: string) => void;
  
  // Localization file actions
  createNewLocalizationFile: (name: string, language?: LocalizationLanguage) => void;
  deleteLocalizationFile: (fileId: string) => void;
  renameLocalizationFile: (fileId: string, newName: string) => void;
  setActiveLocalizationFile: (fileId: string | null) => void;
  updateLocalizationTokens: (fileId: string, tokens: Record<string, string>) => void;
  createLocalizationFolder: (folderPath: string) => void;
  deleteLocalizationFolder: (folderPath: string) => void;
  renameLocalizationFolder: (oldPath: string, newPath: string) => void;
  
  // Folder actions
  createFolder: (folderPath: string) => void;
  deleteFolder: (folderPath: string) => void;
  renameFolder: (oldPath: string, newPath: string) => void;
  folders: string[];
  
  // Change tracking
  markSaved: () => void;
  markModified: () => void;
}

export interface UseProjectFilesOptions {
  maxRecentProjects?: number;
}

export function useProjectFiles(options: UseProjectFilesOptions = {}): UseProjectFilesReturn {
  const { maxRecentProjects = 10 } = options;
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
      const updated = [{ name, path, lastOpened: Date.now() }, ...filtered].slice(0, maxRecentProjects);
      localStorage.setItem('recentProjects', JSON.stringify(updated));
      return updated;
    });
  }, [maxRecentProjects]);

  const scriptFiles = projectData?.scriptFiles || [];
  const folders = projectData?.settings.folders || [];
  const activeFileId = projectData?.settings.activeScriptFile;
  // Only use the explicit activeFileId, don't fall back to first file
  const activeScriptFile = activeFileId ? (scriptFiles.find(f => f.id === activeFileId) || null) : null;
  
  // Weapon file derived state
  const weaponFiles = projectData?.weaponFiles || [];
  const weaponFolders = projectData?.settings.weaponFolders || [];
  const activeWeaponFileId = projectData?.settings.activeWeaponFile;
  const activeWeaponFile = activeWeaponFileId ? (weaponFiles.find(f => f.id === activeWeaponFileId) || null) : null;
  
  // UI file derived state
  const uiFiles = projectData?.uiFiles || [];
  const uiFolders = projectData?.settings.uiFolders || [];
  const activeUIFileId = projectData?.settings.activeUIFile;
  const activeUIFile = activeUIFileId ? (uiFiles.find(f => f.id === activeUIFileId) || null) : null;
  
  // Localization file derived state
  const localizationFiles = projectData?.localizationFiles || [];
  const localizationFolders = projectData?.settings.localizationFolders || [];
  const activeLocalizationFileId = projectData?.settings.activeLocalizationFile;
  const activeLocalizationFile = activeLocalizationFileId ? (localizationFiles.find(f => f.id === activeLocalizationFileId) || null) : null;
  
  const activeFileType: ActiveFileType = projectData?.settings.activeFileType || 'script';

  // Helper to save project data (used for auto-save after structural changes)
  const saveProjectData = useCallback(async (data: ProjectData, filePath: string | null): Promise<boolean> => {
    if (!data || !filePath) return false;
    
    try {
      const jsonContent = serializeProject(
        data.scriptFiles,
        data.metadata,
        data.settings,
        data.weaponFiles,
        data.uiFiles,
        data.localizationFiles
      );
      
      if (isTauri()) {
        await electron.writeProjectFile(filePath, jsonContent);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to auto-save project:', error);
      return false;
    }
  }, []);

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
        projectData.settings,
        projectData.weaponFiles,
        projectData.uiFiles,
        projectData.localizationFiles
      );
      
      let filePath = currentFilePath;
      
      if (!filePath) {
        const result = await saveProjectFile(jsonContent, {
          title: 'Save Project',
          defaultPath: `${projectData.metadata.name || 'Untitled'}.r5vproj`,
          filters: [
            { name: 'R5V Project', extensions: ['r5vproj'] },
          ],
        });
        
        filePath = result.filePath;
        if (!filePath) return false;
      } else {
        if (isTauri()) {
          await electron.writeProjectFile(filePath, jsonContent);
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
        projectData.settings,
        projectData.weaponFiles,
        projectData.uiFiles,
        projectData.localizationFiles
      );
      
      const result = await saveProjectFile(jsonContent, {
        title: 'Save Project As',
        defaultPath: `${projectData.metadata.name || 'Untitled'}.r5vproj`,
        filters: [
          { name: 'R5V Project', extensions: ['r5vproj'] },
        ],
      });
      
      if (!result.filePath) return false;
      
      setCurrentFilePath(result.filePath);
      setHasUnsavedChanges(false);
      setModifiedFileIds(new Set()); // Clear all modified file indicators
      addToRecentProjects(result.filePath, projectData.metadata.name || 'Untitled');
      
      return true;
    } catch (error) {
      console.error('Failed to save project as:', error);
      return false;
    }
  }, [projectData, addToRecentProjects]);

  // Load project
  const loadProject = useCallback(async (): Promise<boolean> => {
    console.log('[loadProject] Starting...');
    try {
      console.log('[loadProject] Calling openProjectFile...');
      const result = await openProjectFile({
        title: 'Open Project',
        filters: [
          { name: 'R5V Project', extensions: ['r5vproj'] },
          { name: 'JSON', extensions: ['json'] },
        ],
      });
      
      console.log('[loadProject] openProjectFile result:', result);
      
      if (!result) {
        console.log('[loadProject] No result, user cancelled');
        return false;
      }
      
      console.log('[loadProject] Deserializing project...');
      const loaded = deserializeProject(result.content);
      
      if (!validateProject(loaded)) {
        throw new Error('Invalid project file format');
      }
      
      console.log('[loadProject] Setting project data...');
      setProjectData(loaded);
      setCurrentFilePath(result.filePath);
      setHasUnsavedChanges(false);
      setModifiedFileIds(new Set());
      addToRecentProjects(result.filePath, loaded.metadata.name || 'Untitled');
      
      console.log('[loadProject] Done!');
      return true;
    } catch (error) {
      console.error('[loadProject] Failed to load project:', error);
      alert(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [addToRecentProjects]);

  // Load project from specific path
  const loadProjectFromPath = useCallback(async (path: string): Promise<boolean> => {
    console.log('[loadProjectFromPath] Starting with path:', path);
    try {
      if (!isTauri()) {
        console.log('[loadProjectFromPath] Tauri not available');
        alert('File system access is only available in Tauri');
        return false;
      }

      console.log('[loadProjectFromPath] Reading project file...');
      const result = await electron.readProjectFile(path);
      console.log('[loadProjectFromPath] Read result:', result);
      
      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to read project file');
      }
      
      console.log('[loadProjectFromPath] Deserializing project...');
      const loaded = deserializeProject(result.content);
      
      if (!validateProject(loaded)) {
        throw new Error('Invalid project file format');
      }
      
      console.log('[loadProjectFromPath] Setting project data...');
      setProjectData(loaded);
      setCurrentFilePath(path);
      setHasUnsavedChanges(false);
      setModifiedFileIds(new Set());
      addToRecentProjects(path, loaded.metadata.name || 'Untitled');
      
      console.log('[loadProjectFromPath] Done!');
      return true;
    } catch (error) {
      console.error('[loadProjectFromPath] Failed to load project:', error);
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

  // Update mod settings
  const updateModSettings = useCallback((mod: ModSettings) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          mod,
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
      const newData: ProjectData = {
        ...prev,
        scriptFiles: filtered,
        settings: {
          ...prev.settings,
          activeScriptFile: newActiveId,
        },
      };
      
      // Auto-save after structural change (use setTimeout to ensure state is committed)
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Rename script file
  const renameScriptFile = useCallback((fileId: string, newName: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const newData: ProjectData = {
        ...prev,
        scriptFiles: prev.scriptFiles.map(f => 
          f.id === fileId 
            ? { ...f, name: newName.endsWith('.nut') ? newName : `${newName}.nut`, modifiedAt: new Date().toISOString() }
            : f
        ),
      };
      
      // Auto-save after structural change
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Set active script file
  const setActiveScriptFile = useCallback((fileId: string | null) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          activeScriptFile: fileId ?? undefined,
          activeFileType: 'script',
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

  // ============================================
  // Weapon File Management
  // ============================================

  // Create new weapon file
  const createNewWeaponFile = useCallback((name: string, baseWeapon?: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const newFile = createWeaponFile(name, baseWeapon);
      return {
        ...prev,
        weaponFiles: [...(prev.weaponFiles || []), newFile],
        settings: {
          ...prev.settings,
          activeWeaponFile: newFile.id,
          activeFileType: 'weapon',
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Delete weapon file
  const deleteWeaponFile = useCallback((fileId: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const filtered = (prev.weaponFiles || []).filter(f => f.id !== fileId);
      const newActiveId = prev.settings.activeWeaponFile === fileId 
        ? (filtered.length > 0 ? filtered[0].id : undefined)
        : prev.settings.activeWeaponFile;
      
      // If deleting the active weapon file, switch to script view if no weapons left
      const newActiveType = prev.settings.activeWeaponFile === fileId && filtered.length === 0
        ? 'script' as const
        : prev.settings.activeFileType;
      
      const newData: ProjectData = {
        ...prev,
        weaponFiles: filtered,
        settings: {
          ...prev.settings,
          activeWeaponFile: newActiveId,
          activeFileType: newActiveType,
        },
      };
      
      // Auto-save after structural change
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Rename weapon file
  const renameWeaponFile = useCallback((fileId: string, newName: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const cleanName = newName.endsWith('.txt') ? newName.slice(0, -4) : newName;
      const newData: ProjectData = {
        ...prev,
        weaponFiles: (prev.weaponFiles || []).map(f => 
          f.id === fileId 
            ? { ...f, name: cleanName, modifiedAt: new Date().toISOString() }
            : f
        ),
      };
      
      // Auto-save after structural change
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Set active weapon file
  const setActiveWeaponFile = useCallback((fileId: string | null) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          activeWeaponFile: fileId ?? undefined,
          activeFileType: 'weapon',
        },
      };
    });
  }, []);

  // Update weapon file content
  const updateWeaponContent = useCallback((fileId: string, content: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      setModifiedFileIds(ids => {
        const newIds = new Set(ids);
        newIds.add(fileId);
        return newIds;
      });
      return {
        ...prev,
        weaponFiles: (prev.weaponFiles || []).map(f =>
          f.id === fileId
            ? { ...f, content, modifiedAt: new Date().toISOString() }
            : f
        ),
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Create weapon folder
  const createWeaponFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const currentFolders = prev.settings.weaponFolders || [];
      if (currentFolders.includes(folderPath)) return prev;
      const newData: ProjectData = {
        ...prev,
        settings: {
          ...prev.settings,
          weaponFolders: [...currentFolders, folderPath],
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Delete weapon folder
  const deleteWeaponFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const filtered = (prev.weaponFiles || []).filter(f => !f.name.startsWith(`${folderPath}/`));
      const newData: ProjectData = {
        ...prev,
        weaponFiles: filtered,
        settings: {
          ...prev.settings,
          weaponFolders: (prev.settings.weaponFolders || []).filter(f => f !== folderPath && !f.startsWith(`${folderPath}/`)),
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Rename weapon folder
  const renameWeaponFolder = useCallback((oldPath: string, newPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const updatedFolders = (prev.settings.weaponFolders || []).map(f => 
        f === oldPath ? newPath : f.startsWith(`${oldPath}/`) ? f.replace(oldPath, newPath) : f
      );
      const updatedFiles = (prev.weaponFiles || []).map(f => {
        if (f.name.startsWith(`${oldPath}/`)) {
          return { ...f, name: f.name.replace(`${oldPath}/`, `${newPath}/`), modifiedAt: new Date().toISOString() };
        }
        return f;
      });
      const newData: ProjectData = {
        ...prev,
        weaponFiles: updatedFiles,
        settings: {
          ...prev.settings,
          weaponFolders: updatedFolders,
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Create folder
  const createFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const currentFolders = prev.settings.folders || [];
      if (currentFolders.includes(folderPath)) return prev; // Already exists
      const newData: ProjectData = {
        ...prev,
        settings: {
          ...prev.settings,
          folders: [...currentFolders, folderPath],
        },
      };
      
      // Auto-save after structural change
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Delete folder
  const deleteFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      // Also delete all files in this folder
      const filtered = prev.scriptFiles.filter(f => !f.name.startsWith(`${folderPath}/`));
      const newData: ProjectData = {
        ...prev,
        scriptFiles: filtered,
        settings: {
          ...prev.settings,
          folders: (prev.settings.folders || []).filter(f => f !== folderPath && !f.startsWith(`${folderPath}/`)),
        },
      };
      
      // Auto-save after structural change
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // ============================================
  // UI File Management
  // ============================================

  // Create new UI file
  const createNewUIFile = useCallback((name: string, fileType: UIFileType = 'res') => {
    setProjectData(prev => {
      if (!prev) return prev;
      const newFile = createUIFile(name, fileType);
      return {
        ...prev,
        uiFiles: [...(prev.uiFiles || []), newFile],
        settings: {
          ...prev.settings,
          activeUIFile: newFile.id,
          activeFileType: 'ui',
        },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Delete UI file
  const deleteUIFile = useCallback((fileId: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const filtered = (prev.uiFiles || []).filter(f => f.id !== fileId);
      const wasActive = prev.settings.activeUIFile === fileId;
      const newActiveId = wasActive && filtered.length > 0 ? filtered[0].id : undefined;
      const newData: ProjectData = {
        ...prev,
        uiFiles: filtered,
        settings: {
          ...prev.settings,
          activeUIFile: newActiveId,
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Rename UI file
  const renameUIFile = useCallback((fileId: string, newName: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const newData: ProjectData = {
        ...prev,
        uiFiles: (prev.uiFiles || []).map(f => {
          if (f.id === fileId) {
            // Remove any extension, will be added based on fileType
            const baseName = newName.replace(/\.(res|menu)$/, '');
            return { ...f, name: baseName, modifiedAt: new Date().toISOString() };
          }
          return f;
        }),
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Set active UI file
  const setActiveUIFile = useCallback((fileId: string | null) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          activeUIFile: fileId ?? undefined,
          activeFileType: 'ui',
        },
      };
    });
  }, []);

  // Update UI file content
  const updateUIContent = useCallback((fileId: string, content: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      setModifiedFileIds(ids => {
        const newIds = new Set(ids);
        newIds.add(fileId);
        return newIds;
      });
      return {
        ...prev,
        uiFiles: (prev.uiFiles || []).map(f =>
          f.id === fileId
            ? { ...f, content, modifiedAt: new Date().toISOString() }
            : f
        ),
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Create UI folder
  const createUIFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const currentFolders = prev.settings.uiFolders || [];
      if (currentFolders.includes(folderPath)) return prev;
      const newData: ProjectData = {
        ...prev,
        settings: {
          ...prev.settings,
          uiFolders: [...currentFolders, folderPath],
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Delete UI folder
  const deleteUIFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const filtered = (prev.uiFiles || []).filter(f => !f.name.startsWith(`${folderPath}/`));
      const newData: ProjectData = {
        ...prev,
        uiFiles: filtered,
        settings: {
          ...prev.settings,
          uiFolders: (prev.settings.uiFolders || []).filter(f => f !== folderPath && !f.startsWith(`${folderPath}/`)),
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Rename UI folder
  const renameUIFolder = useCallback((oldPath: string, newPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const updatedFolders = (prev.settings.uiFolders || []).map(f => 
        f === oldPath ? newPath : f.startsWith(`${oldPath}/`) ? f.replace(oldPath, newPath) : f
      );
      const updatedFiles = (prev.uiFiles || []).map(f => {
        if (f.name.startsWith(`${oldPath}/`)) {
          return { ...f, name: f.name.replace(`${oldPath}/`, `${newPath}/`), modifiedAt: new Date().toISOString() };
        }
        return f;
      });
      const newData: ProjectData = {
        ...prev,
        uiFiles: updatedFiles,
        settings: {
          ...prev.settings,
          uiFolders: updatedFolders,
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // ===== LOCALIZATION FILE ACTIONS =====
  
  // Create new localization file
  const createNewLocalizationFile = useCallback((name: string, language: LocalizationLanguage = 'english') => {
    const newFile = createLocalizationFile(name, language);
    setProjectData(prev => {
      if (!prev) return prev;
      const newData: ProjectData = {
        ...prev,
        localizationFiles: [...(prev.localizationFiles || []), newFile],
        settings: {
          ...prev.settings,
          activeLocalizationFile: newFile.id,
          activeFileType: 'localization',
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Delete localization file
  const deleteLocalizationFile = useCallback((fileId: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const filtered = (prev.localizationFiles || []).filter(f => f.id !== fileId);
      const wasActive = prev.settings.activeLocalizationFile === fileId;
      const newActiveId = wasActive ? (filtered[0]?.id || null) : prev.settings.activeLocalizationFile;
      const newData: ProjectData = {
        ...prev,
        localizationFiles: filtered,
        settings: {
          ...prev.settings,
          activeLocalizationFile: newActiveId || undefined,
          activeFileType: wasActive && filtered.length === 0 ? 'script' : prev.settings.activeFileType,
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
    
    setModifiedFileIds(prev => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  }, [currentFilePath, saveProjectData]);

  // Rename localization file
  const renameLocalizationFile = useCallback((fileId: string, newName: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const cleanName = newName.replace(/_[a-z]+\.txt$/, '').replace(/\.txt$/, '');
      const updatedFiles = (prev.localizationFiles || []).map(f =>
        f.id === fileId
          ? { ...f, name: cleanName, modifiedAt: new Date().toISOString() }
          : f
      );
      const newData: ProjectData = {
        ...prev,
        localizationFiles: updatedFiles,
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Set active localization file
  const setActiveLocalizationFile = useCallback((fileId: string | null) => {
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          activeLocalizationFile: fileId || undefined,
          activeFileType: 'localization',
        },
      };
    });
  }, []);

  // Update localization tokens
  const updateLocalizationTokens = useCallback((fileId: string, tokens: Record<string, string>) => {
    setModifiedFileIds(prev => new Set(prev).add(fileId));
    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        localizationFiles: (prev.localizationFiles || []).map(f =>
          f.id === fileId
            ? { ...f, tokens, modifiedAt: new Date().toISOString() }
            : f
        ),
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Create localization folder
  const createLocalizationFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const currentFolders = prev.settings.localizationFolders || [];
      if (currentFolders.includes(folderPath)) return prev;
      const newData: ProjectData = {
        ...prev,
        settings: {
          ...prev.settings,
          localizationFolders: [...currentFolders, folderPath],
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Delete localization folder
  const deleteLocalizationFolder = useCallback((folderPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const filtered = (prev.localizationFiles || []).filter(f => !f.name.startsWith(`${folderPath}/`));
      const newData: ProjectData = {
        ...prev,
        localizationFiles: filtered,
        settings: {
          ...prev.settings,
          localizationFolders: (prev.settings.localizationFolders || []).filter(f => f !== folderPath && !f.startsWith(`${folderPath}/`)),
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

  // Rename localization folder
  const renameLocalizationFolder = useCallback((oldPath: string, newPath: string) => {
    setProjectData(prev => {
      if (!prev) return prev;
      const updatedFolders = (prev.settings.localizationFolders || []).map(f => 
        f === oldPath ? newPath : f.startsWith(`${oldPath}/`) ? f.replace(oldPath, newPath) : f
      );
      const updatedFiles = (prev.localizationFiles || []).map(f => {
        if (f.name.startsWith(`${oldPath}/`)) {
          return { ...f, name: f.name.replace(`${oldPath}/`, `${newPath}/`), modifiedAt: new Date().toISOString() };
        }
        return f;
      });
      const newData: ProjectData = {
        ...prev,
        localizationFiles: updatedFiles,
        settings: {
          ...prev.settings,
          localizationFolders: updatedFolders,
        },
      };
      
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

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
      const newData: ProjectData = {
        ...prev,
        scriptFiles: updatedFiles,
        settings: {
          ...prev.settings,
          folders: updatedFolders,
        },
      };
      
      // Auto-save after structural change
      if (currentFilePath) {
        setTimeout(() => {
          saveProjectData(newData, currentFilePath).then(saved => {
            if (saved) {
              setHasUnsavedChanges(false);
              setModifiedFileIds(new Set());
            }
          });
        }, 0);
      } else {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  }, [currentFilePath, saveProjectData]);

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
    
    // Weapon file state
    weaponFiles,
    activeWeaponFile,
    activeFileType,
    weaponFolders,
    
    // UI file state
    uiFiles,
    activeUIFile,
    uiFolders,
    
    // Localization file state
    localizationFiles,
    activeLocalizationFile,
    localizationFolders,
    
    newProject,
    saveProject,
    saveProjectAs,
    loadProject,
    loadProjectFromPath,
    updateMetadata,
    updateModSettings,
    createNewScriptFile,
    deleteScriptFile,
    renameScriptFile,
    setActiveScriptFile,
    updateActiveScriptContent,
    markFileModified,
    markFileSaved,
    
    // Weapon file actions
    createNewWeaponFile,
    deleteWeaponFile,
    renameWeaponFile,
    setActiveWeaponFile,
    updateWeaponContent,
    createWeaponFolder,
    deleteWeaponFolder,
    renameWeaponFolder,
    
    // UI file actions
    createNewUIFile,
    deleteUIFile,
    renameUIFile,
    setActiveUIFile,
    updateUIContent,
    createUIFolder,
    deleteUIFolder,
    renameUIFolder,
    
    // Localization file actions
    createNewLocalizationFile,
    deleteLocalizationFile,
    renameLocalizationFile,
    setActiveLocalizationFile,
    updateLocalizationTokens,
    createLocalizationFolder,
    deleteLocalizationFolder,
    renameLocalizationFolder,
    
    createFolder,
    deleteFolder,
    renameFolder,
    markSaved,
    markModified,
  };
}
