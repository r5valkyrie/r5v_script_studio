import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PanelLeft, PanelRight, GitBranch, Code, Save, FolderOpen, FileDown, FileText, FilePlus, ChevronDown, ChevronLeft, ChevronRight, Folder, X, Settings, Package } from 'lucide-react';
import SettingsModal, { loadSettings, saveSettings, DEFAULT_SETTINGS } from './visual-scripting/SettingsModal';
import ProjectSettingsModal from './visual-scripting/ProjectSettingsModal';
import { NotificationContainer, ExportPathModal, useNotifications, useConfirmModal } from './visual-scripting/Notification';
import type { AppSettings } from './visual-scripting/SettingsModal';
import type { ScriptNode, NodeConnection, NodeType } from '../types/visual-scripting';
import type { ModSettings } from '../types/project';
import NodeGraph from './visual-scripting/NodeGraph';
import NodePalette from './visual-scripting/NodePalette';
import NodeSpotlight from './visual-scripting/NodeSpotlight';
import NodeDocModal from './visual-scripting/NodeDocModal';
import CodeView from './visual-scripting/CodeView';
import ProjectPanel from './visual-scripting/ProjectPanel';
import WelcomeScreen from './visual-scripting/WelcomeScreen';
import { generateCode } from '../utils/code-generator';
import { getNodeDefinition, NODE_DEFINITIONS } from '../data/node-definitions';
import { useProjectFiles } from '../hooks/useProjectFiles';
import { saveSquirrelCode } from '../utils/file-system';
import { generateCodeMetadata, embedProjectInCode } from '../utils/project-manager';
import { compileProject, selectOutputDirectory } from '../utils/mod-compiler';

export default function VisualScriptEditor() {
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // Panel widths - will be loaded from appSettings
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [codePanelWidth, setCodePanelWidth] = useState(500);
  const sidebarDraggingRef = useRef(false);
  const codePanelDraggingRef = useRef(false);

  // Panel visibility - will be loaded from appSettings
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProjectSectionExpanded, setProjectSectionExpanded] = useState(true);
  const [isNodesSectionExpanded, setNodesSectionExpanded] = useState(true);
  const [isCodePanelOpen, setCodePanelOpen] = useState(false);
  const [docNodeType, setDocNodeType] = useState<NodeType | null>(null);
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isProjectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [isSpotlightOpen, setSpotlightOpen] = useState(false);
  const [isExportPathModalOpen, setExportPathModalOpen] = useState(false);
  // Initialize with defaults to avoid hydration mismatch, then load from localStorage
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  
  // Notification system
  const { notifications, dismissNotification, success, error, warning } = useNotifications();
  const { confirm, ConfirmModal } = useConfirmModal();
  const pendingCompileRef = useRef(false);

  // Load settings from localStorage after hydration (includes UI state)
  useEffect(() => {
    const settings = loadSettings();
    setAppSettings(settings);
    // Load UI state from settings
    setSidebarOpen(settings.ui.isSidebarOpen);
    setProjectSectionExpanded(settings.ui.isProjectSectionExpanded);
    setNodesSectionExpanded(settings.ui.isNodesSectionExpanded);
    setCodePanelOpen(settings.ui.isCodePanelOpen);
    setSidebarWidth(settings.ui.sidebarWidth);
    setCodePanelWidth(settings.ui.codePanelWidth);
    setCollapsedCategories(settings.ui.collapsedCategories);
    setIsHydrated(true);
  }, []);

  // Open file tabs
  const [openFileTabs, setOpenFileTabs] = useState<string[]>([]);
  
  // Collapsed categories in node palette
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [graphView, setGraphView] = useState({ x: 0, y: 0, scale: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Project management with multiple script files
  const {
    projectData,
    currentFilePath,
    hasUnsavedChanges,
    scriptFiles,
    activeScriptFile,
    recentProjects,
    folders,
    modifiedFileIds,
    saveProject,
    saveProjectAs,
    loadProject,
    loadProjectFromPath,
    newProject,
    createNewScriptFile,
    deleteScriptFile,
    renameScriptFile,
    setActiveScriptFile,
    updateActiveScriptContent,
    updateModSettings,
    createFolder,
    deleteFolder,
    renameFolder,
  } = useProjectFiles({ maxRecentProjects: appSettings.general.maxRecentProjects });

  // Auto-save functionality
  useEffect(() => {
    if (!appSettings.general.autoSave || !projectData || !currentFilePath) return;
    
    const intervalMs = appSettings.general.autoSaveInterval * 60 * 1000;
    const intervalId = setInterval(() => {
      if (hasUnsavedChanges) {
        saveProject();
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [appSettings.general.autoSave, appSettings.general.autoSaveInterval, projectData, currentFilePath, hasUnsavedChanges, saveProject]);

  // Save UI settings to localStorage when they change (debounced)
  const uiSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isHydrated) return;
    
    // Debounce UI settings saves
    if (uiSettingsTimeoutRef.current) {
      clearTimeout(uiSettingsTimeoutRef.current);
    }
    
    uiSettingsTimeoutRef.current = setTimeout(() => {
      const newSettings = {
        ...appSettings,
        ui: {
          isSidebarOpen,
          isProjectSectionExpanded,
          isNodesSectionExpanded,
          isInspectorOpen: true,
          isCodePanelOpen,
          sidebarWidth,
          inspectorWidth: 320,
          codePanelWidth,
          collapsedCategories,
        },
      };
      saveSettings(newSettings);
      setAppSettings(newSettings);
    }, 500); // Save after 500ms of no changes
    
    return () => {
      if (uiSettingsTimeoutRef.current) {
        clearTimeout(uiSettingsTimeoutRef.current);
      }
    };
  }, [
    isHydrated,
    isSidebarOpen,
    isProjectSectionExpanded,
    isNodesSectionExpanded,
    isCodePanelOpen,
    sidebarWidth,
    codePanelWidth,
    collapsedCategories,
  ]);

  // Track if we're loading to prevent marking as modified on initial load
  const isLoadingRef = useRef(false);
  const prevNodesRef = useRef<ScriptNode[]>([]);
  const prevConnectionsRef = useRef<NodeConnection[]>([]);
  const historyRef = useRef<{
    past: { nodes: ScriptNode[]; connections: NodeConnection[] }[];
    present: { nodes: ScriptNode[]; connections: NodeConnection[] } | null;
    future: { nodes: ScriptNode[]; connections: NodeConnection[] }[];
  }>({ past: [], present: null, future: [] });
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // Sync nodes/connections with active script file and add to open tabs
  useEffect(() => {
    if (activeScriptFile) {
      isLoadingRef.current = true;
      setNodes(activeScriptFile.nodes as ScriptNode[]);
      setConnections(activeScriptFile.connections as NodeConnection[]);
      setSelectedNodeIds([]);
      prevNodesRef.current = activeScriptFile.nodes as ScriptNode[];
      prevConnectionsRef.current = activeScriptFile.connections as NodeConnection[];
      historyRef.current = {
        past: [],
        present: {
          nodes: JSON.parse(JSON.stringify(activeScriptFile.nodes)) as ScriptNode[],
          connections: JSON.parse(JSON.stringify(activeScriptFile.connections)) as NodeConnection[],
        },
        future: [],
      };
      // Add to open tabs if not already there
      setOpenFileTabs(tabs => {
        if (!tabs.includes(activeScriptFile.id)) {
          return [...tabs, activeScriptFile.id];
        }
        return tabs;
      });
      // Allow the next render cycle to complete before clearing the flag
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 0);
    }
  }, [activeScriptFile?.id]);

  // Close a file tab
  const handleCloseTab = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get the current tabs state to calculate new tabs
    setOpenFileTabs(prevTabs => {
      const newTabs = prevTabs.filter(id => id !== fileId);
      
      // Schedule the active file update for after this state update
      // Use setTimeout to avoid calling state setters inside state updater
      setTimeout(() => {
        if (activeScriptFile?.id === fileId) {
          if (newTabs.length > 0) {
            // Switch to the previous tab or the first remaining tab
            const closedIndex = prevTabs.indexOf(fileId);
            const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
            setActiveScriptFile(newTabs[newActiveIndex]);
          } else {
            // No more tabs, clear the active file and graph state
            setActiveScriptFile(null);
            setNodes([]);
            setConnections([]);
            setSelectedNodeIds([]);
          }
        }
      }, 0);
      
      return newTabs;
    });
  }, [activeScriptFile?.id, setActiveScriptFile]);

  // Update active script when nodes/connections change (but not during initial load)
  useEffect(() => {
    if (activeScriptFile && !isLoadingRef.current) {
      // Only update if something actually changed
      const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(prevNodesRef.current);
      const connectionsChanged = JSON.stringify(connections) !== JSON.stringify(prevConnectionsRef.current);
      
      if (nodesChanged || connectionsChanged) {
        updateActiveScriptContent(nodes, connections);
        prevNodesRef.current = nodes;
        prevConnectionsRef.current = connections;
      }
    }
  }, [nodes, connections, activeScriptFile, updateActiveScriptContent]);

  const getSnapshot = useCallback(() => {
    return {
      nodes: JSON.parse(JSON.stringify(nodes)) as ScriptNode[],
      connections: JSON.parse(JSON.stringify(connections)) as NodeConnection[],
    };
  }, [nodes, connections]);

  useEffect(() => {
    if (!activeScriptFile || isLoadingRef.current) return;
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }

    historyDebounceRef.current = setTimeout(() => {
      const snapshot = getSnapshot();
      const present = historyRef.current.present;
      const presentSerialized = present ? JSON.stringify(present) : null;
      const snapshotSerialized = JSON.stringify(snapshot);

      if (presentSerialized === snapshotSerialized) return;

      if (present) {
        historyRef.current.past.push(present);
      }
      historyRef.current.present = snapshot;
      historyRef.current.future = [];
    }, 250);

    return () => {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current);
      }
    };
  }, [nodes, connections, activeScriptFile, getSnapshot]);

  const restoreSnapshot = useCallback((snapshot: { nodes: ScriptNode[]; connections: NodeConnection[] }) => {
    isRestoringRef.current = true;
    setNodes(snapshot.nodes);
    setConnections(snapshot.connections);
    setSelectedNodeIds(current =>
      current.filter(id => snapshot.nodes.some(node => node.id === id))
    );
  }, []);

  const handleUndo = useCallback(() => {
    const history = historyRef.current;
    if (!history.present || history.past.length === 0) return;
    const previous = history.past.pop();
    if (!previous) return;
    history.future.push(history.present);
    history.present = previous;
    restoreSnapshot(previous);
    success('Undo', undefined, 1500);
  }, [restoreSnapshot, success]);

  const handleRedo = useCallback(() => {
    const history = historyRef.current;
    if (!history.present || history.future.length === 0) return;
    const next = history.future.pop();
    if (!next) return;
    history.past.push(history.present);
    history.present = next;
    restoreSnapshot(next);
    success('Redo', undefined, 1500);
  }, [restoreSnapshot, success]);

  const forceHistorySnapshot = useCallback(() => {
    if (!activeScriptFile || isLoadingRef.current) return;
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }
    const snapshot = getSnapshot();
    const present = historyRef.current.present;
    const presentSerialized = present ? JSON.stringify(present) : null;
    const snapshotSerialized = JSON.stringify(snapshot);
    if (presentSerialized === snapshotSerialized) return;
    if (present) {
      historyRef.current.past.push(present);
    }
    historyRef.current.present = snapshot;
    historyRef.current.future = [];
  }, [activeScriptFile, getSnapshot]);

  const handleAddNode = useCallback((newNode: ScriptNode) => {
    setNodes(currentNodes => [...currentNodes, newNode]);
  }, []);

  const handleSelectNodes = useCallback((nodeIds: string[]) => {
    setSelectedNodeIds(nodeIds);
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<ScriptNode>) => {
    setNodes(currentNodes =>
      currentNodes.map(n => (n.id === nodeId ? { ...n, ...updates } : n))
    );
    
    // If outputs were updated, clean up connections to removed outputs
    if (updates.outputs) {
      const validOutputIds = new Set(updates.outputs.map(o => o.id));
      setConnections(currentConnections =>
        currentConnections.filter(c => {
          // Keep connections not from this node
          if (c.from.nodeId !== nodeId) return true;
          // Keep connections to outputs that still exist
          return validOutputIds.has(c.from.portId);
        })
      );
    }
    
    // If inputs were updated, clean up connections to removed inputs
    if (updates.inputs) {
      const validInputIds = new Set(updates.inputs.map(i => i.id));
      setConnections(currentConnections =>
        currentConnections.filter(c => {
          // Keep connections not to this node
          if (c.to.nodeId !== nodeId) return true;
          // Keep connections to inputs that still exist
          return validInputIds.has(c.to.portId);
        })
      );
    }
  }, []);

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    const doDelete = () => {
      setNodes(currentNodes => currentNodes.filter(n => n.id !== nodeId));
      setConnections(currentConnections =>
        currentConnections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId)
      );
      setSelectedNodeIds(current => current.filter(id => id !== nodeId));
    };

    if (appSettings.general.confirmOnDelete) {
      const confirmed = await confirm({
        title: 'Delete Node',
        message: 'Are you sure you want to delete this node? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
      });
      if (confirmed) {
        doDelete();
      }
    } else {
      doDelete();
    }
  }, [appSettings.general.confirmOnDelete, confirm]);

  const handleDeleteSelectedNodes = useCallback(async (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    
    const doDelete = () => {
      setNodes(currentNodes => currentNodes.filter(n => !nodeIds.includes(n.id)));
      setConnections(currentConnections =>
        currentConnections.filter(c => !nodeIds.includes(c.from.nodeId) && !nodeIds.includes(c.to.nodeId))
      );
      setSelectedNodeIds([]);
    };

    if (appSettings.general.confirmOnDelete) {
      const confirmed = await confirm({
        title: 'Delete Nodes',
        message: `Are you sure you want to delete ${nodeIds.length} node${nodeIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
      });
      if (confirmed) {
        doDelete();
      }
    } else {
      doDelete();
    }
  }, [appSettings.general.confirmOnDelete, confirm]);

  const handleConnect = useCallback((newConnection: NodeConnection) => {
    // Prevent duplicate connections
    setConnections(currentConnections => {
      const exists = currentConnections.some(
        c => c.from.nodeId === newConnection.from.nodeId &&
             c.from.portId === newConnection.from.portId &&
             c.to.nodeId === newConnection.to.nodeId &&
             c.to.portId === newConnection.to.portId
      );
      if (exists) {
        return currentConnections;
      }
      return [...currentConnections, newConnection];
    });
  }, []);

  const handleBreakInput = useCallback((nodeId: string, portId: string) => {
    setConnections(currentConnections =>
      currentConnections.filter(conn => !(conn.to.nodeId === nodeId && conn.to.portId === portId))
    );
  }, []);

  const handleDeleteConnection = useCallback((connectionId: string) => {
    setConnections(currentConnections =>
      currentConnections.filter(conn => conn.id !== connectionId)
    );
  }, []);

  // Generate code from nodes
  const generatedCode = useMemo(() => {
    return generateCode(nodes, connections);
  }, [nodes, connections]);

  // Export handler
  const handleExportCode = useCallback(async () => {
    if (!projectData) return;
    
    const codeWithMetadata = generateCodeMetadata(projectData.metadata) + generatedCode;
    const finalCode = embedProjectInCode(codeWithMetadata, projectData);
    
    const fileName = `${projectData.metadata.name.replace(/\s+/g, '_')}.nut`;
    const saved = await saveSquirrelCode(finalCode, fileName);
    if (saved) {
      success('Exported', fileName, 2000);
    }
  }, [generatedCode, projectData, success]);

  // Handle export path selection from modal
  const handleExportPathSelect = useCallback(async (selectedPath: string) => {
    // Save the selected path to app settings
    const newSettings = {
      ...appSettings,
      general: {
        ...appSettings.general,
        exportPath: selectedPath,
      },
    };
    setAppSettings(newSettings);
    saveSettings(newSettings);
    
    // If we were trying to compile, continue now
    if (pendingCompileRef.current && projectData) {
      pendingCompileRef.current = false;
      
      // Compile the project
      const result = await compileProject(projectData, {
        outputDir: selectedPath,
        includeProjectData: true,
      });

      if (result.success) {
        const modName = result.outputPath?.split('/').pop() || 'Mod';
        success(
          'Compiled Successfully!',
          `${modName} • ${result.filesCreated?.length || 0} files`
        );
      } else {
        error('Compilation Failed', result.error);
      }
    }
  }, [appSettings, projectData, success, error]);

  // Compile project handler
  const handleCompileProject = useCallback(async () => {
    if (!projectData) {
      warning('No Project', 'Please create or open a project first.');
      return;
    }

    // Use app settings export path or show modal to select one
    const outputDir = appSettings.general.exportPath;
    if (!outputDir) {
      pendingCompileRef.current = true;
      setExportPathModalOpen(true);
      return;
    }

    // Compile the project
    const result = await compileProject(projectData, {
      outputDir,
      includeProjectData: true,
    });

    if (result.success) {
      const modName = result.outputPath?.split('/').pop() || 'Mod';
      success(
        'Compiled Successfully!',
        `${modName} • ${result.filesCreated?.length || 0} files`
      );
    } else {
      error('Compilation Failed', result.error);
    }
  }, [projectData, appSettings.general.exportPath, success, error, warning]);

  // Save project with notification
  const handleSaveProject = useCallback(async () => {
    const saved = await saveProject();
    if (saved) {
      const projectName = projectData?.metadata.name || 'Project';
      success('Saved', projectName, 2000);
    }
  }, [saveProject, projectData?.metadata.name, success]);

  // Update mod settings handler
  const handleUpdateModSettings = useCallback((settings: ModSettings) => {
    if (!projectData) return;
    updateModSettings(settings);
  }, [projectData, updateModSettings]);

  // Helper to check if a keyboard event matches a keybinding string like "Ctrl+Shift+S"
  const matchesKeybind = useCallback((e: KeyboardEvent, keybind: string): boolean => {
    if (!keybind) return false;
    const parts = keybind.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needsCtrl = parts.includes('ctrl');
    const needsShift = parts.includes('shift');
    const needsAlt = parts.includes('alt');
    const needsMeta = parts.includes('meta') || parts.includes('cmd');

    const hasCtrl = e.ctrlKey || e.metaKey;
    const hasShift = e.shiftKey;
    const hasAlt = e.altKey;

    if (needsCtrl !== hasCtrl) return false;
    if (needsShift !== hasShift) return false;
    if (needsAlt !== hasAlt) return false;
    if (needsMeta && !e.metaKey) return false;

    // Handle special key names
    const eventKey = e.key.toLowerCase();
    if (key === 'delete') return eventKey === 'delete';
    if (key === 'backspace') return eventKey === 'backspace';
    if (key === 'space') return eventKey === ' ' || e.code === 'Space';
    if (key === '\\') return eventKey === '\\' || eventKey === 'backslash';
    if (key === '=') return eventKey === '=' || eventKey === '+';
    if (key === '-') return eventKey === '-' || eventKey === '_';
    if (key === '0') return eventKey === '0' || e.code === 'Digit0';
    if (key === '1') return eventKey === '1' || e.code === 'Digit1';
    if (key === 'a') return eventKey === 'a';

    return eventKey === key;
  }, []);

  // Keyboard shortcuts using settings
  useEffect(() => {
    const keybinds = appSettings.keybindings;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea (except for some shortcuts)
      const inInput = e.target && (e.target as HTMLElement).closest('input, textarea');

      // New project
      if (matchesKeybind(e, keybinds.newProject)) {
        e.preventDefault();
        newProject();
        return;
      }
      
      // Save shortcuts
      if (matchesKeybind(e, keybinds.save)) {
        e.preventDefault();
        handleSaveProject();
        return;
      }
      
      if (matchesKeybind(e, keybinds.saveAs)) {
        e.preventDefault();
        saveProjectAs();
        return;
      }
      
      if (matchesKeybind(e, keybinds.open)) {
        e.preventDefault();
        loadProject();
        return;
      }

      // Compile project
      if (matchesKeybind(e, keybinds.compile)) {
        e.preventDefault();
        handleCompileProject();
        return;
      }

      // Toggle code panel
      if (matchesKeybind(e, keybinds.toggleCodePanel)) {
        e.preventDefault();
        setCodePanelOpen(prev => !prev);
        return;
      }

      // Node spotlight
      if (matchesKeybind(e, keybinds.nodeSpotlight)) {
        e.preventDefault();
        setSpotlightOpen(true);
        return;
      }

      // Toggle sidebar
      if (matchesKeybind(e, keybinds.toggleSidebar)) {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
        return;
      }

      // Select all nodes
      if (!inInput && matchesKeybind(e, keybinds.selectAll)) {
        e.preventDefault();
        setSelectedNodeIds(nodes.map(n => n.id));
        return;
      }

      // Undo/redo - skip if in input
      if (!inInput && matchesKeybind(e, keybinds.undo)) {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      if (!inInput && matchesKeybind(e, keybinds.redo)) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
      // Delete nodes - skip if in input
      if (inInput) return;
      if (selectedNodeIds.length === 0) return;
      if (matchesKeybind(e, keybinds.delete) || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelectedNodes(selectedNodeIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeIds, nodes, handleDeleteSelectedNodes, handleUndo, handleRedo, saveProject, saveProjectAs, loadProject, newProject, handleCompileProject, appSettings.keybindings, matchesKeybind]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Unified sidebar resize
      if (sidebarDraggingRef.current) {
        const newWidth = Math.min(500, Math.max(240, e.clientX));
        setSidebarWidth(newWidth);
      }

      // Code panel resize
      if (codePanelDraggingRef.current) {
        const newWidth = Math.min(1000, Math.max(500, window.innerWidth - e.clientX));
        setCodePanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      sidebarDraggingRef.current = false;
      codePanelDraggingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCodePanelOpen, codePanelWidth]);
  // Track canvas size for node spawning
  useEffect(() => {
    const updateCanvasSize = () => {
      // Approximate main content area size
      const sidebarW = isSidebarOpen ? 280 : 0;
      const codePanelW = isCodePanelOpen ? codePanelWidth : 0;
      setCanvasSize({
        width: window.innerWidth - sidebarW - codePanelW,
        height: window.innerHeight - 48 // Subtract header height
      });
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isSidebarOpen, isCodePanelOpen, codePanelWidth]);
  // Close file menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false);
      }
    };

    if (isFileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFileMenuOpen]);

  // Compute font size class based on settings
  const fontSize = appSettings.appearance.fontSize;

  // Compute accent color variants
  const accentColor = appSettings.appearance.accentColor;
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 139, g: 92, b: 246 };
  };
  const rgb = hexToRgb(accentColor);
  const accentHover = `rgb(${Math.min(255, rgb.r + 30)}, ${Math.min(255, rgb.g + 30)}, ${Math.min(255, rgb.b + 30)})`;
  const accentDim = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
  const accentBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

  // Determine effective theme
  const effectiveTheme = appSettings.appearance.theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : appSettings.appearance.theme;

  // Set theme on document element for global styling
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // Set accent color on document root so it's available to title bar
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-color-hover', accentHover);
    document.documentElement.style.setProperty('--accent-color-dim', accentDim);
    document.documentElement.style.setProperty('--accent-color-bg', accentBg);
  }, [accentColor, accentHover, accentDim, accentBg]);

  return (
    <div 
      className={`w-screen h-screen flex flex-col ${
        effectiveTheme === 'light' 
          ? 'bg-gray-100 text-gray-900' 
          : 'bg-[#0f1419] text-white'
      }`}
      data-theme={effectiveTheme}
      data-font-size={fontSize}
      style={{
        '--accent-color': accentColor,
        '--accent-color-hover': accentHover,
        '--accent-color-dim': accentDim,
        '--accent-color-bg': accentBg,
      } as React.CSSProperties}
    >
      {/* Show welcome screen if no project is open */}
      {!projectData ? (
        <WelcomeScreen
          onNewProject={newProject}
          onOpenProject={loadProject}
          onOpenRecent={loadProjectFromPath}
          recentProjects={recentProjects}
          accentColor={accentColor}
          gridStyle={appSettings.appearance.gridStyle}
          gridSize={appSettings.appearance.gridSize}
          coloredGrid={appSettings.appearance.coloredGrid}
          theme={appSettings.appearance.theme === 'system' ? 'dark' : appSettings.appearance.theme}
        />
      ) : (
        <>
          {/* Menu Bar */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0a0d10] via-[#0d1117] to-[#0a0d10] border-b border-white/5 px-3 h-10">
        <div className="flex items-center gap-1">
          {/* File Menu */}
          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={() => setFileMenuOpen(!isFileMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all duration-200"
            >
              <FileText size={14} style={{ color: isFileMenuOpen ? accentColor : undefined }} />
              <span>File</span>
              {hasUnsavedChanges && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />}
              <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${isFileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isFileMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#1a1f28]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden">
                <button
                  onClick={() => {
                    newProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FilePlus size={15} className="text-gray-500" />
                  <span>New Project</span>
                  <span className="ml-auto text-[10px] text-gray-600 font-mono">Ctrl+N</span>
                </button>
                <button
                  onClick={async () => {
                    await loadProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FolderOpen size={15} className="text-gray-500" />
                  <span>Open Project...</span>
                  <span className="ml-auto text-[10px] text-gray-600 font-mono">Ctrl+O</span>
                </button>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5 mx-2" />
                <button
                  onClick={() => {
                    handleSaveProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Save size={15} className="text-gray-500" />
                  <span>Save</span>
                  <span className="ml-auto text-[10px] text-gray-600 font-mono">Ctrl+S</span>
                </button>
                <button
                  onClick={() => {
                    saveProjectAs();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Save size={15} className="text-gray-500" />
                  <span>Save As...</span>
                  <span className="ml-auto text-[10px] text-gray-600 font-mono">Ctrl+Shift+S</span>
                </button>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5 mx-2" />
                <button
                  onClick={() => {
                    handleExportCode();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FileDown size={15} className="text-gray-500" />
                  <span>Export Squirrel Code</span>
                </button>
                <button
                  onClick={() => {
                    handleCompileProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Code size={15} className="text-gray-500" />
                  <span>Compile Project</span>
                  <span className="ml-auto text-[10px] text-gray-600 font-mono">Ctrl+B</span>
                </button>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5 mx-2" />
                <button
                  onClick={() => {
                    setProjectSettingsOpen(true);
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Folder size={15} className="text-gray-500" />
                  <span>Project Settings</span>
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(true);
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings size={15} className="text-gray-500" />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1" />
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-3 px-4 h-7 bg-[#0a0d10]/80 border-t border-white/5">
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
              {nodes.length} nodes
            </span>
            <span className="text-gray-600">•</span>
            <span>{connections.length} connections</span>
          </div>
          
          {currentFilePath && (
            <>
              <span className="text-gray-700">|</span>
              <span className="text-[10px] text-gray-600 truncate max-w-xs font-mono" title={currentFilePath}>
                {currentFilePath.split('/').pop()}
              </span>
            </>
          )}
          
          <div className="flex-1" />
          
          {/* Compile button */}
          <button
            onClick={handleCompileProject}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-[11px] font-medium transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
            title="Compile Project (Ctrl+B)"
          >
            <Package size={12} />
            <span>Compile</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Tabs - spans full width */}
          {openFileTabs.length > 0 && (
            <div className="flex-shrink-0 flex items-center bg-gradient-to-b from-[#0f1419] to-[#151a21] border-b border-white/5 overflow-x-auto px-1 gap-1 h-9">
              {openFileTabs.map(fileId => {
                const file = scriptFiles.find(f => f.id === fileId);
                if (!file) return null;
                const isActive = activeScriptFile?.id === fileId;
                const isModified = modifiedFileIds.has(fileId);
                return (
                  <div
                    key={fileId}
                    className={`relative flex items-center gap-2 px-3 py-1.5 cursor-pointer group rounded-t-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#1a1f28] text-white shadow-lg' 
                        : 'text-gray-500 hover:bg-[#1a1f28]/50 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveScriptFile(fileId)}
                  >
                    {/* Active tab indicator line */}
                    {isActive && (
                      <div 
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                    <FileText 
                      size={13} 
                      style={{ color: isActive ? accentColor : undefined }} 
                      className={`flex-shrink-0 ${isActive ? '' : 'text-gray-600'}`} 
                    />
                    <span className="text-xs font-medium whitespace-nowrap">{file.name}</span>
                    <button
                      onClick={(e) => handleCloseTab(fileId, e)}
                      className={`ml-0.5 p-1 rounded-md hover:bg-white/10 transition-all duration-200 ${
                        isModified ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title={isModified ? "Unsaved changes - Close tab" : "Close tab"}
                    >
                      {isModified ? (
                        <div className="w-2 h-2 rounded-full bg-orange-400 group-hover:hidden" />
                      ) : null}
                      <X size={11} className={`text-gray-400 hover:text-white ${isModified ? 'hidden group-hover:block' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Content area below tabs */}
          <div className="flex-1 flex overflow-hidden">
            {/* Unified Sidebar - Project + Nodes */}
            {isSidebarOpen && (
              <div className="flex h-full flex-shrink-0" style={{ width: sidebarWidth }}>
                <div className="flex-1 h-full flex flex-col bg-[#151a21] overflow-hidden">
                  {/* Sidebar Header with minimize button */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#161b22] to-[#1c222b] border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Folder size={16} style={{ color: accentColor }} />
                      <span className="text-sm font-medium text-gray-200">Project & Nodes</span>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                      title="Close Sidebar"
                    >
                      <PanelLeft size={14} />
                    </button>
                  </div>

                  {/* Project Section - Collapsible */}
                  <div className="flex-shrink-0 border-b border-white/10">
                    {/* Project Header */}
                    <button
                      onClick={() => setProjectSectionExpanded(!isProjectSectionExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0f1419] hover:bg-[#1a1f28] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded" style={{ backgroundColor: `${accentColor}20` }}>
                          <Folder size={14} style={{ color: accentColor }} />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-semibold tracking-wider text-gray-500 uppercase">Project</span>
                          <span className="text-xs font-medium text-white truncate max-w-[140px]">{projectData?.metadata.name || 'Untitled'}</span>
                        </div>
                      </div>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProjectSectionExpanded ? '' : '-rotate-90'}`} />
                    </button>
                    
                    {/* Project Content */}
                    {isProjectSectionExpanded && (
                      <div className="max-h-[550px] overflow-y-auto">
                        <ProjectPanel
                          scriptFiles={scriptFiles}
                          activeFileId={activeScriptFile?.id || null}
                          projectName={projectData?.metadata.name || 'Untitled Project'}
                          folders={folders}
                          onSelectFile={setActiveScriptFile}
                          onCreateFile={createNewScriptFile}
                          onDeleteFile={deleteScriptFile}
                          onRenameFile={renameScriptFile}
                          onCreateFolder={createFolder}
                          onDeleteFolder={deleteFolder}
                          onRenameFolder={renameFolder}
                          isEmbedded={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Node Palette Section */}
                  <div className={`${isNodesSectionExpanded ? 'flex-1' : 'flex-shrink-0'} overflow-hidden`}>
                    <NodePalette
                      onAddNode={handleAddNode}
                      onClose={() => setSidebarOpen(false)}
                      collapsedCategories={collapsedCategories}
                      onToggleCategory={(category) => {
                        setCollapsedCategories(prev => 
                          prev.includes(category) 
                            ? prev.filter(c => c !== category)
                            : [...prev, category]
                        );
                      }}
                      isExpanded={isNodesSectionExpanded}
                      onToggleExpanded={() => setNodesSectionExpanded(!isNodesSectionExpanded)}
                      isEmbedded={true}
                      viewState={graphView}
                      canvasSize={canvasSize}
                      onShowNodeDoc={setDocNodeType}
                    />
                  </div>
                </div>
                {/* Resize Handle */}
                <div
                  className="w-1 h-full cursor-col-resize transition-colors flex-shrink-0"
                  style={{ backgroundColor: `${accentColor}50` }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    sidebarDraggingRef.current = true;
                  }}
                />
              </div>
            )}

            {/* Sidebar Toggle Button */}
            {!isSidebarOpen && (
              <div
                onClick={() => setSidebarOpen(true)}
                className="flex-shrink-0 h-full w-10 bg-gradient-to-r from-[#0f1419] via-[#151a21] to-[#1a1f28] hover:from-[#151a21] hover:via-[#1a1f28] hover:to-[#1e242c] transition-all duration-300 flex flex-col items-center py-4 group cursor-pointer relative overflow-hidden"
                style={{ borderRight: `2px solid ${accentColor}40` }}
                title="Show Sidebar"
              >
                {/* Accent glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to right, ${accentColor}10, transparent)` }}
                />
                
                {/* Icon */}
                <div 
                  className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110" 
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Folder size={14} style={{ color: accentColor }} />
                </div>
                
                {/* Vertical text */}
                <div 
                  className="flex-1 flex items-center justify-center"
                >
                  <div 
                    className="text-[9px] text-gray-500 group-hover:text-gray-300 font-semibold tracking-[0.25em] transition-colors duration-300 uppercase"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    Explorer
                  </div>
                </div>
                
                {/* Chevron indicator */}
                <div 
                  className="p-1.5 rounded-full transition-all duration-300 group-hover:translate-x-0.5"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <ChevronRight size={12} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            )}

            {/* Main Canvas */}
            <div className="flex-1 h-full flex flex-col">
              {/* Node Graph or Empty State */}
              <div className="flex-1">
                {!activeScriptFile ? (
                  <div className="h-full flex flex-col items-center justify-center bg-[#0f1419] text-center p-8">
                    <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                      <FileText size={48} style={{ color: `${accentColor}80` }} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">No File Open</h2>
                    <p className="text-gray-500 text-sm max-w-xs">
                      Select a file from the Project panel to begin editing, or create a new script file.
                    </p>
                  </div>
                ) : (
                  <NodeGraph
                    nodes={nodes}
                    connections={connections}
                    selectedNodeIds={selectedNodeIds}
                    onSelectNodes={handleSelectNodes}
                    onUpdateNode={handleUpdateNode}
                    onDeleteNode={handleDeleteNode}
                    onConnect={handleConnect}
                    onBreakInput={handleBreakInput}
                    onDeleteConnection={handleDeleteConnection}
                    onAddNode={handleAddNode}
                    onViewChange={setGraphView}
                    onRequestHistorySnapshot={forceHistorySnapshot}
                    showGridLines={appSettings.appearance.showGridLines}
                    gridStyle={appSettings.appearance.gridStyle}
                    coloredGrid={appSettings.appearance.coloredGrid}
                    gridSize={appSettings.appearance.gridSize}
                    nodeOpacity={appSettings.appearance.nodeOpacity}
                    connectionStyle={appSettings.appearance.connectionStyle}
                    connectionsBehindNodes={appSettings.editor.connectionsBehindNodes}
                    accentColor={appSettings.appearance.accentColor}
                    theme={effectiveTheme}
                    snapToGrid={appSettings.editor.snapToGrid}
                    autoConnect={appSettings.editor.autoConnect}
                    highlightConnections={appSettings.editor.highlightConnections}
                    animateConnections={appSettings.editor.animateConnections}
                  />
                )}
              </div>
            </div>

            {/* Code Panel */}
            {isCodePanelOpen && (
              <div className="flex h-full flex-shrink-0" style={{ width: codePanelWidth }}>
                {/* Resize Handle */}
                <div
                  className="w-1 h-full cursor-col-resize transition-colors flex-shrink-0"
                  style={{ backgroundColor: `${accentColor}4D` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${accentColor}99`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${accentColor}4D`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    codePanelDraggingRef.current = true;
                  }}
                />
                <div className="flex-1 h-full flex flex-col bg-[#1a1f26] overflow-hidden">
                  <CodeView code={generatedCode} onClose={() => setCodePanelOpen(false)} />
                </div>
              </div>
            )}

            {/* Code Panel Toggle Button (when closed) */}
            {!isCodePanelOpen && (
              <div 
                className="flex-shrink-0 h-full w-10 bg-gradient-to-l from-[#0f1419] via-[#151a21] to-[#1a1f28] hover:from-[#151a21] hover:via-[#1a1f28] hover:to-[#1e242c] transition-all duration-300 flex flex-col items-center py-4 group cursor-pointer relative overflow-hidden"
                style={{ borderLeft: `2px solid ${accentColor}40` }}
                onClick={() => setCodePanelOpen(true)}
                title="Show Generated Code (Ctrl+Shift+C)"
              >
                {/* Accent glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to left, ${accentColor}10, transparent)` }}
                />
                
                {/* Icon */}
                <div 
                  className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110" 
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Code size={14} style={{ color: accentColor }} />
                </div>
                
                {/* Vertical text */}
                <div 
                  className="flex-1 flex items-center justify-center"
                >
                  <div 
                    className="text-[9px] text-gray-500 group-hover:text-gray-300 font-semibold tracking-[0.25em] transition-colors duration-300 uppercase"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    Code
                  </div>
                </div>
                
                {/* Chevron indicator */}
                <div 
                  className="p-1.5 rounded-full transition-all duration-300 group-hover:-translate-x-0.5"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <ChevronLeft size={12} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Node Documentation Modal */}
      <NodeDocModal
        nodeType={docNodeType}
        onClose={() => setDocNodeType(null)}
        onAddNode={(nodeType: NodeType) => {
          const definition = NODE_DEFINITIONS.find(d => d.type === nodeType);
          if (!definition) return;
          
          // Calculate center of view
          let spawnX = 300;
          let spawnY = 200;
          if (graphView && canvasSize) {
            const screenCenterX = canvasSize.width / 2;
            const screenCenterY = canvasSize.height / 2;
            spawnX = (screenCenterX - graphView.x) / graphView.scale - 90;
            spawnY = (screenCenterY - graphView.y) / graphView.scale - 30;
          }
          
          const newNode: ScriptNode = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: definition.type,
            category: definition.category,
            label: definition.label,
            position: { x: spawnX, y: spawnY },
            data: { ...definition.defaultData },
            inputs: definition.inputs.map((input, idx) => ({
              ...input,
              id: `input_${idx}`,
            })),
            outputs: definition.outputs.map((output, idx) => ({
              ...output,
              id: `output_${idx}`,
            })),
          };
          handleAddNode(newNode);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
        onSave={() => success('Settings Saved', undefined, 2000)}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={isProjectSettingsOpen}
        onClose={() => setProjectSettingsOpen(false)}
        modSettings={projectData?.settings.mod}
        onSave={handleUpdateModSettings}
        onSaveComplete={() => success('Project Settings Saved', undefined, 2000)}
        accentColor={accentColor}
      />

      {/* Node Spotlight (Ctrl+Space) */}
      <NodeSpotlight
        isOpen={isSpotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onAddNode={handleAddNode}
        viewState={graphView}
        canvasSize={canvasSize}
        accentColor={accentColor}
      />

      {/* Export Path Modal */}
      <ExportPathModal
        isOpen={isExportPathModalOpen}
        onClose={() => {
          setExportPathModalOpen(false);
          pendingCompileRef.current = false;
        }}
        onSelect={handleExportPathSelect}
        accentColor={accentColor}
      />

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      </>
      )}

      {/* Confirm Modal - always rendered so it works on welcome screen too */}
      <ConfirmModal accentColor={accentColor} />
    </div>
  );
}
