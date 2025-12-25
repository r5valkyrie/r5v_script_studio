import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PanelLeft, PanelRight, GitBranch, Code, Save, FolderOpen, FileDown, FileText, FilePlus, ChevronDown, ChevronLeft, ChevronRight, Folder, X, Settings } from 'lucide-react';
import SettingsModal, { loadSettings, saveSettings, DEFAULT_SETTINGS } from './visual-scripting/SettingsModal';
import ProjectSettingsModal from './visual-scripting/ProjectSettingsModal';
import { NotificationContainer, ExportPathModal, useNotifications } from './visual-scripting/Notification';
import type { AppSettings } from './visual-scripting/SettingsModal';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import type { ModSettings } from '../types/project';
import NodeGraph from './visual-scripting/NodeGraph';
import NodePalette from './visual-scripting/NodePalette';
import NodeInspector from './visual-scripting/NodeInspector';
import CodeView from './visual-scripting/CodeView';
import ProjectPanel from './visual-scripting/ProjectPanel';
import WelcomeScreen from './visual-scripting/WelcomeScreen';
import { generateCode } from '../utils/code-generator';
import { getNodeDefinition } from '../data/node-definitions';
import { useProjectFiles } from '../hooks/useProjectFiles';
import { saveSquirrelCode } from '../utils/file-system';
import { generateCodeMetadata, embedProjectInCode } from '../utils/project-manager';
import { compileProject, selectOutputDirectory } from '../utils/mod-compiler';

export default function VisualScriptEditor() {
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // Panel widths
  const [sidebarWidth, setSidebarWidth] = useState(280); // Unified sidebar width
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const [codePanelWidth, setCodePanelWidth] = useState(500); // min size is 500
  const sidebarDraggingRef = useRef(false);
  const inspectorDraggingRef = useRef(false);
  const codePanelDraggingRef = useRef(false);

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProjectSectionExpanded, setProjectSectionExpanded] = useState(true);
  const [isNodesSectionExpanded, setNodesSectionExpanded] = useState(true);
  const [isInspectorOpen, setInspectorOpen] = useState(true);
  const [isCodePanelOpen, setCodePanelOpen] = useState(false);
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isProjectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [isExportPathModalOpen, setExportPathModalOpen] = useState(false);
  // Initialize with defaults to avoid hydration mismatch, then load from localStorage
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  
  // Notification system
  const { notifications, dismissNotification, success, error, warning, info } = useNotifications();
  const pendingCompileRef = useRef(false);

  // Load settings from localStorage after hydration
  useEffect(() => {
    setAppSettings(loadSettings());
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
    updateUISettings,
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

  // Load UI settings from project when it changes
  const hasLoadedUIRef = useRef<string | null>(null);
  useEffect(() => {
    // Only load UI once per project (use createdAt + filePath as unique key)
    const projectKey = projectData ? `${projectData.metadata.createdAt}-${currentFilePath}` : null;
    if (projectKey && hasLoadedUIRef.current !== projectKey && projectData?.settings.ui) {
      hasLoadedUIRef.current = projectKey;
      const ui = projectData.settings.ui;
      if (ui.isSidebarOpen !== undefined) setSidebarOpen(ui.isSidebarOpen);
      if (ui.isProjectSectionExpanded !== undefined) setProjectSectionExpanded(ui.isProjectSectionExpanded);
      if (ui.isNodesSectionExpanded !== undefined) setNodesSectionExpanded(ui.isNodesSectionExpanded);
      if (ui.isInspectorOpen !== undefined) setInspectorOpen(ui.isInspectorOpen);
      if (ui.isCodePanelOpen !== undefined) setCodePanelOpen(ui.isCodePanelOpen);
      if (ui.sidebarWidth !== undefined) setSidebarWidth(ui.sidebarWidth);
      if (ui.inspectorWidth !== undefined) setInspectorWidth(ui.inspectorWidth);
      if (ui.codePanelWidth !== undefined) setCodePanelWidth(ui.codePanelWidth);
      if (ui.openFileTabs !== undefined) setOpenFileTabs(ui.openFileTabs);
      if (ui.collapsedCategories !== undefined) setCollapsedCategories(ui.collapsedCategories);
    }
  }, [projectData, currentFilePath]);

  // Save UI settings when they change (debounced)
  const uiSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!projectData) return;
    
    // Debounce UI settings saves
    if (uiSettingsTimeoutRef.current) {
      clearTimeout(uiSettingsTimeoutRef.current);
    }
    
    uiSettingsTimeoutRef.current = setTimeout(() => {
      updateUISettings({
        isSidebarOpen,
        isProjectSectionExpanded,
        isNodesSectionExpanded,
        isInspectorOpen,
        isCodePanelOpen,
        sidebarWidth,
        inspectorWidth,
        codePanelWidth,
        openFileTabs,
        collapsedCategories,
      });
    }, 500); // Save after 500ms of no changes
    
    return () => {
      if (uiSettingsTimeoutRef.current) {
        clearTimeout(uiSettingsTimeoutRef.current);
      }
    };
  }, [
    projectData,
    isSidebarOpen,
    isProjectSectionExpanded,
    isNodesSectionExpanded,
    isInspectorOpen,
    isCodePanelOpen,
    sidebarWidth,
    inspectorWidth,
    codePanelWidth,
    openFileTabs,
    collapsedCategories,
    updateUISettings,
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
  }, [restoreSnapshot]);

  const handleRedo = useCallback(() => {
    const history = historyRef.current;
    if (!history.present || history.future.length === 0) return;
    const next = history.future.pop();
    if (!next) return;
    history.past.push(history.present);
    history.present = next;
    restoreSnapshot(next);
  }, [restoreSnapshot]);

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

  const selectedNode = selectedNodeIds.length > 0
    ? nodes.find(n => n.id === selectedNodeIds[0]) ?? null
    : null;

  const handleAddNode = useCallback((newNode: ScriptNode) => {
    setNodes(currentNodes => [...currentNodes, newNode]);
  }, []);

  const handleSelectNodes = useCallback((nodeIds: string[]) => {
    setSelectedNodeIds(nodeIds);
    if (nodeIds.length > 0 && !isInspectorOpen) {
      setInspectorOpen(true);
    }
  }, [isInspectorOpen]);

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

  const handleDeleteNode = useCallback((nodeId: string) => {
    const doDelete = () => {
      setNodes(currentNodes => currentNodes.filter(n => n.id !== nodeId));
      setConnections(currentConnections =>
        currentConnections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId)
      );
      setSelectedNodeIds(current => current.filter(id => id !== nodeId));
    };

    if (appSettings.general.confirmOnDelete) {
      if (window.confirm('Are you sure you want to delete this node?')) {
        doDelete();
      }
    } else {
      doDelete();
    }
  }, [appSettings.general.confirmOnDelete]);

  const handleDeleteSelectedNodes = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    
    const doDelete = () => {
      setNodes(currentNodes => currentNodes.filter(n => !nodeIds.includes(n.id)));
      setConnections(currentConnections =>
        currentConnections.filter(c => !nodeIds.includes(c.from.nodeId) && !nodeIds.includes(c.to.nodeId))
      );
      setSelectedNodeIds([]);
    };

    if (appSettings.general.confirmOnDelete) {
      if (window.confirm(`Are you sure you want to delete ${nodeIds.length} node${nodeIds.length > 1 ? 's' : ''}?`)) {
        doDelete();
      }
    } else {
      doDelete();
    }
  }, [appSettings.general.confirmOnDelete]);

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
    await saveSquirrelCode(finalCode, fileName);
  }, [generatedCode, projectData]);

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
        success(
          'Project Compiled Successfully!',
          `Output: ${result.outputPath}\n\nFiles created:\n• ${result.filesCreated?.join('\n• ')}`
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
      success(
        'Project Compiled Successfully!',
        `Output: ${result.outputPath}\n\nFiles created:\n• ${result.filesCreated?.join('\n• ')}`
      );
    } else {
      error('Compilation Failed', result.error);
    }
  }, [projectData, appSettings.general.exportPath, success, error, warning]);

  // Update mod settings handler
  const handleUpdateModSettings = useCallback((settings: ModSettings) => {
    if (!projectData) return;
    updateModSettings(settings);
  }, [projectData, updateModSettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // New project
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        newProject();
        return;
      }
      
      // Save shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        saveProjectAs();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        loadProject();
        return;
      }

      // Compile project
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleCompileProject();
        return;
      }

      // Undo/redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.target && (e.target as HTMLElement).closest('input, textarea')) return;
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      
      // Delete nodes
      if (selectedNodeIds.length === 0) return;
      if (e.target && (e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelectedNodes(selectedNodeIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeIds, handleDeleteSelectedNodes, handleUndo, handleRedo, saveProject, saveProjectAs, loadProject, newProject, handleCompileProject]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Unified sidebar resize
      if (sidebarDraggingRef.current) {
        const newWidth = Math.min(500, Math.max(240, e.clientX));
        setSidebarWidth(newWidth);
      }

      // Inspector resize
      if (inspectorDraggingRef.current) {
        const codeOffset = isCodePanelOpen ? codePanelWidth : 0;
        const newWidth = Math.min(500, Math.max(250, window.innerWidth - e.clientX - codeOffset));
        setInspectorWidth(newWidth);
      }

      // Code panel resize
      if (codePanelDraggingRef.current) {
        const newWidth = Math.min(1000, Math.max(500, window.innerWidth - e.clientX));
        setCodePanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      sidebarDraggingRef.current = false;
      inspectorDraggingRef.current = false;
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
      const sidebarWidth = isSidebarOpen ? 280 : 0;
      const inspectorWidth = isInspectorOpen ? 320 : 0;
      setCanvasSize({
        width: window.innerWidth - sidebarWidth - inspectorWidth,
        height: window.innerHeight - 48 // Subtract header height
      });
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isSidebarOpen, isInspectorOpen]);
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
  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }[appSettings.appearance.fontSize];

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

  return (
    <div 
      className={`w-screen h-screen flex flex-col ${fontSizeClass} ${
        effectiveTheme === 'light' 
          ? 'bg-gray-100 text-gray-900' 
          : 'bg-[#0f1419] text-white'
      }`}
      data-theme={effectiveTheme}
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
        />
      ) : (
        <>
          {/* Tab Bar */}
          <div className="flex items-center justify-between bg-[#0a0d10] border-b border-white/10 px-2">
        <div className="flex items-center gap-2">
          {/* File Menu */}
          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={() => setFileMenuOpen(!isFileMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <FileText size={16} />
              File
              {hasUnsavedChanges && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
              <ChevronDown size={14} className={`transition-transform ${isFileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isFileMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-[#1a1f26] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={() => {
                    newProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FilePlus size={16} />
                  <span>New Project</span>
                  <span className="ml-auto text-xs text-gray-500">Ctrl+N</span>
                </button>
                <button
                  onClick={async () => {
                    await loadProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FolderOpen size={16} />
                  <span>Open Project...</span>
                  <span className="ml-auto text-xs text-gray-500">Ctrl+O</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    saveProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Save size={16} />
                  <span>Save</span>
                  <span className="ml-auto text-xs text-gray-500">Ctrl+S</span>
                </button>
                <button
                  onClick={() => {
                    saveProjectAs();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Save size={16} />
                  <span>Save As...</span>
                  <span className="ml-auto text-xs text-gray-500">Ctrl+Shift+S</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    handleExportCode();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FileDown size={16} />
                  <span>Export Squirrel Code</span>
                </button>
                <button
                  onClick={() => {
                    handleCompileProject();
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Code size={16} />
                  <span>Compile Project</span>
                  <span className="ml-auto text-xs text-gray-500">Ctrl+B</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setProjectSettingsOpen(true);
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Folder size={16} />
                  <span>Project Settings</span>
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(true);
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-white/10" />

          <div className="flex-1" />
        </div>

        {/* Node count indicator */}
        <div className="flex items-center gap-4 px-4 text-xs text-gray-500">
          <span>{nodes.length} nodes</span>
          <span>{connections.length} connections</span>
          {currentFilePath && <span className="truncate max-w-xs" title={currentFilePath}>{currentFilePath.split('/').pop()}</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Tabs - spans full width */}
          {openFileTabs.length > 0 && (
            <div className="flex-shrink-0 flex items-center bg-[#1a1f26] border-b border-white/10 overflow-x-auto">
              {openFileTabs.map(fileId => {
                const file = scriptFiles.find(f => f.id === fileId);
                if (!file) return null;
                const isActive = activeScriptFile?.id === fileId;
                const isModified = modifiedFileIds.has(fileId);
                return (
                  <div
                    key={fileId}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-white/10 group ${
                      isActive 
                        ? 'bg-[#2a3341] text-white' 
                        : 'text-gray-400 hover:bg-[#252b35] hover:text-gray-200'
                    }`}
                    style={isActive ? { borderBottom: `2px solid ${accentColor}` } : undefined}
                    onClick={() => setActiveScriptFile(fileId)}
                  >
                    <FileText size={14} style={{ color: isActive ? accentColor : undefined }} className={isActive ? '' : 'text-gray-500'} />
                    <span className="text-sm whitespace-nowrap">{file.name}</span>
                    <button
                      onClick={(e) => handleCloseTab(fileId, e)}
                      className={`ml-1 p-0.5 rounded hover:bg-white/10 transition-opacity ${
                        isModified ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title={isModified ? "Unsaved changes - Close tab" : "Close tab"}
                    >
                      {isModified ? (
                        <div className="w-3 h-3 rounded-full bg-orange-400 group-hover:hidden" />
                      ) : null}
                      <X size={12} className={isModified ? 'hidden group-hover:block' : ''} />
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
                className="flex-shrink-0 h-full w-[28px] bg-gradient-to-r from-[#1a1f26] to-[#1e242c] hover:from-[#1e2430] hover:to-[#252d38] transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer shadow-2xl relative"
                style={{ borderRight: `1px solid ${accentColor}50` }}
                title="Show Sidebar"
              >
                {/* Icon at top */}
                <div className="absolute top-4 p-1.5 rounded transition-colors" style={{ backgroundColor: `${accentColor}30` }}>
                  <Folder size={12} style={{ color: accentColor }} />
                </div>
                
                {/* Vertical text in center */}
                <div 
                  className="text-[10px] text-gray-500 group-hover:text-white font-bold tracking-[0.2em] transition-colors"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  SIDEBAR
                </div>
                
                {/* Chevron hint */}
                <div className="absolute bottom-4 text-gray-600 group-hover:text-white transition-colors">
                  <ChevronRight size={14} />
                </div>
                
                {/* Side glow line on hover */}
                <div className="absolute right-0 top-0 bottom-0 w-px transition-colors" style={{ backgroundColor: `${accentColor}00` }} />
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
                    gridSize={appSettings.appearance.gridSize}
                    nodeOpacity={appSettings.appearance.nodeOpacity}
                    connectionStyle={appSettings.appearance.connectionStyle}
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

            {/* Inspector Toggle Button */}
            {selectedNode && !isInspectorOpen && (
              <button
                  onClick={() => setInspectorOpen(true)}
                  className="absolute right-0 z-50 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] transition-all flex flex-col items-center gap-2 group shadow-xl"
                  style={{ top: '60px', borderLeft: `2px solid ${accentColor}80` }}
                  title="Show Inspector"
              >
                  <PanelLeft size={18} style={{ color: accentColor }} />
                  <div className="text-[9px] text-gray-400 group-hover:text-white font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>INSPECTOR</div>
              </button>
            )}

            {/* Node Inspector */}
            {isInspectorOpen && selectedNode && (
              <div className="flex h-full flex-shrink-0" style={{ width: inspectorWidth }}>
                {/* Resize Handle */}
                <div
                  className="w-1 h-full cursor-col-resize transition-colors"
                  style={{ backgroundColor: `${accentColor}50` }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    inspectorDraggingRef.current = true;
                  }}
                />
                <NodeInspector
                  key={selectedNode.id}
                  node={selectedNode}
                  onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
                />
              </div>
            )}

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
                className="flex-shrink-0 h-full w-[28px] bg-gradient-to-l from-[#1a1f26] to-[#1e242c] hover:from-[#1e2430] hover:to-[#252d38] transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer shadow-2xl relative"
                style={{ borderLeft: `1px solid ${accentColor}4D` }}
                onMouseEnter={(e) => e.currentTarget.style.borderLeftColor = `${accentColor}99`}
                onMouseLeave={(e) => e.currentTarget.style.borderLeftColor = `${accentColor}4D`}
                onClick={() => setCodePanelOpen(true)}
                title="Show Generated Code (Ctrl+Shift+C)"
              >
                {/* Icon at top */}
                <div className="absolute top-4 p-1.5 rounded transition-colors" style={{ backgroundColor: `${accentColor}33` }}>
                  <Code size={12} style={{ color: accentColor }} />
                </div>
                
                {/* Vertical text in center */}
                <div 
                  className="text-[10px] text-gray-500 group-hover:text-gray-300 font-bold tracking-[0.2em] transition-colors"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  CODE
                </div>
                
                {/* Chevron hint */}
                <div className="absolute bottom-4 text-gray-600 transition-colors" style={{ color: undefined }}>
                  <ChevronLeft size={14} className="group-hover:text-gray-400" />
                </div>
                
                {/* Side glow line on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-px transition-colors" style={{ backgroundColor: `${accentColor}00` }} />
              </div>
            )}
          </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={isProjectSettingsOpen}
        onClose={() => setProjectSettingsOpen(false)}
        modSettings={projectData?.settings.mod}
        onSave={handleUpdateModSettings}
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
    </div>
  );
}
