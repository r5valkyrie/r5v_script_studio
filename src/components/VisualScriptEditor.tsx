import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PanelLeft, PanelRight, GitBranch, Code, Save, FolderOpen, FileDown, FileText, FilePlus, ChevronDown, Folder, X } from 'lucide-react';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
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
  const fileMenuRef = useRef<HTMLDivElement>(null);

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
    createFolder,
    deleteFolder,
    renameFolder,
  } = useProjectFiles();

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

  // Sync nodes/connections with active script file and add to open tabs
  useEffect(() => {
    if (activeScriptFile) {
      isLoadingRef.current = true;
      setNodes(activeScriptFile.nodes as ScriptNode[]);
      setConnections(activeScriptFile.connections as NodeConnection[]);
      setSelectedNodeIds([]);
      prevNodesRef.current = activeScriptFile.nodes as ScriptNode[];
      prevConnectionsRef.current = activeScriptFile.connections as NodeConnection[];
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
    setNodes(currentNodes => currentNodes.filter(n => n.id !== nodeId));
    setConnections(currentConnections =>
      currentConnections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId)
    );
    setSelectedNodeIds(current => current.filter(id => id !== nodeId));
  }, []);

  const handleDeleteSelectedNodes = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    setNodes(currentNodes => currentNodes.filter(n => !nodeIds.includes(n.id)));
    setConnections(currentConnections =>
      currentConnections.filter(c => !nodeIds.includes(c.from.nodeId) && !nodeIds.includes(c.to.nodeId))
    );
    setSelectedNodeIds([]);
  }, []);

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
  }, [selectedNodeIds, handleDeleteSelectedNodes, saveProject, saveProjectAs, loadProject, newProject]);

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

  return (
    <div className="w-screen h-screen bg-[#0f1419] text-white flex flex-col">
      {/* Show welcome screen if no project is open */}
      {!projectData ? (
        <WelcomeScreen
          onNewProject={newProject}
          onOpenProject={loadProject}
          onOpenRecent={loadProjectFromPath}
          recentProjects={recentProjects}
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
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Visual Editor Title */}
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white">
            <GitBranch size={16} />
            Visual Editor
          </div>

          <div className="flex-1" />

          {/* Code Panel Toggle */}
          <button
            onClick={() => setCodePanelOpen(!isCodePanelOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              isCodePanelOpen
                ? 'text-white border-purple-500 bg-white/5'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Code size={16} />
            {isCodePanelOpen ? 'Hide Code' : 'Show Code'}
          </button>
        </div>

        {/* Node count indicator */}
        <div className="flex items-center gap-4 px-4 text-xs text-gray-500">
          <span>{nodes.length} nodes</span>
          <span>{connections.length} connections</span>
          {currentFilePath && <span className="truncate max-w-xs" title={currentFilePath}>{currentFilePath.split('/').pop()}</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
          <>
            {/* Unified Sidebar - Project + Nodes */}
            {isSidebarOpen && (
              <div className="flex h-full flex-shrink-0" style={{ width: sidebarWidth }}>
                <div className="flex-1 h-full flex flex-col bg-[#151a21] overflow-hidden">
                  {/* Project Section - Collapsible */}
                  <div className="flex-shrink-0 border-b border-white/10">
                    {/* Project Header */}
                    <button
                      onClick={() => setProjectSectionExpanded(!isProjectSectionExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0f1419] hover:bg-[#1a1f28] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-purple-500/10">
                          <Folder size={14} className="text-purple-400" />
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
                  className="w-1 h-full bg-purple-500/30 hover:bg-purple-500/60 cursor-col-resize transition-colors flex-shrink-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    sidebarDraggingRef.current = true;
                  }}
                />
              </div>
            )}

            {/* Sidebar Toggle Button */}
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute z-50 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] border-r-2 border-purple-500/50 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-xl"
                style={{ top: '85px', left: '0px' }}
                title="Show Sidebar"
              >
                <PanelRight size={18} className="text-purple-400 group-hover:text-purple-300" />
                <div className="text-[9px] text-gray-400 group-hover:text-purple-300 font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>SIDEBAR</div>
              </button>
            )}

            {/* Main Canvas */}
            <div className="flex-1 h-full flex flex-col">
              {/* File Tabs */}
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
                            ? 'bg-[#2a3341] text-white border-b-2 border-b-purple-500' 
                            : 'text-gray-400 hover:bg-[#252b35] hover:text-gray-200'
                        }`}
                        onClick={() => setActiveScriptFile(fileId)}
                      >
                        <FileText size={14} className={isActive ? 'text-purple-400' : 'text-gray-500'} />
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
              {/* Node Graph or Empty State */}
              <div className="flex-1">
                {!activeScriptFile ? (
                  <div className="h-full flex flex-col items-center justify-center bg-[#0f1419] text-center p-8">
                    <div className="p-4 rounded-full bg-purple-500/10 mb-4">
                      <FileText size={48} className="text-purple-500/50" />
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
                    onAddNode={handleAddNode}
                    onViewChange={setGraphView}
                  />
                )}
              </div>
            </div>

            {/* Inspector Toggle Button */}
            {selectedNode && !isInspectorOpen && (
              <button
                  onClick={() => setInspectorOpen(true)}
                  className="absolute right-0 z-50 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] border-l-2 border-purple-500/50 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-xl"
                  style={{ top: '60px' }}
                  title="Show Inspector"
              >
                  <PanelLeft size={18} className="text-purple-400 group-hover:text-purple-300" />
                  <div className="text-[9px] text-gray-400 group-hover:text-purple-300 font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>INSPECTOR</div>
              </button>
            )}

            {/* Node Inspector */}
            {isInspectorOpen && selectedNode && (
              <div className="flex h-full" style={{ width: inspectorWidth }}>
                {/* Resize Handle */}
                <div
                  className="w-1 h-full bg-purple-500/30 hover:bg-purple-500/60 cursor-col-resize transition-colors"
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
              <div className="flex h-full" style={{ width: codePanelWidth }}>
                {/* Resize Handle */}
                <div
                  className="w-1 h-full bg-purple-500/30 hover:bg-purple-500/60 cursor-col-resize transition-colors flex-shrink-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    codePanelDraggingRef.current = true;
                  }}
                />
                <div className="flex-1 h-full flex flex-col bg-[#1a1f26] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Code size={16} />
                      Generated Code
                    </div>
                    <button
                      onClick={() => setCodePanelOpen(false)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                      title="Close Code Panel"
                    >
                      <PanelRight size={16} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CodeView code={generatedCode} />
                  </div>
                </div>
              </div>
            )}

            {/* Code Panel Toggle Button (when closed) */}
            {!isCodePanelOpen && (
              <button
                onClick={() => setCodePanelOpen(true)}
                className="absolute z-40 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] border-l-2 border-purple-500/50 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-xl"
                style={{ 
                  top: '85px',
                  right: selectedNode && isInspectorOpen ? `${inspectorWidth}px` : '0px'
                }}
                title="Show Generated Code"
              >
                <Code size={18} className="text-purple-400 group-hover:text-purple-300" />
                <div className="text-[9px] text-gray-400 group-hover:text-purple-300 font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>CODE</div>
              </button>
            )}
          </>
      </div>
      </>
      )}
    </div>
  );
}
