import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PanelLeft, PanelRight, GitBranch, Code, Save, FolderOpen, FileDown, FileText, FilePlus, ChevronDown, Folder } from 'lucide-react';
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

type EditorTab = 'visual' | 'code' | 'split';

export default function VisualScriptEditor() {
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<EditorTab>('visual');
  const [splitRatio, setSplitRatio] = useState(0.55);
  const splitDraggingRef = useRef(false);

  // Panel widths
  const [projectPanelWidth, setProjectPanelWidth] = useState(256); // 64 * 4 = 16rem
  const [paletteWidth, setPaletteWidth] = useState(256);
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const projectDraggingRef = useRef(false);
  const paletteDraggingRef = useRef(false);
  const inspectorDraggingRef = useRef(false);

  const [isPaletteOpen, setPaletteOpen] = useState(true);
  const [isInspectorOpen, setInspectorOpen] = useState(true);
  const [isProjectPanelOpen, setProjectPanelOpen] = useState(true);
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  // Project management with multiple script files
  const {
    projectData,
    currentFilePath,
    hasUnsavedChanges,
    scriptFiles,
    activeScriptFile,
    recentProjects,
    folders,
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
    createFolder,
    deleteFolder,
    renameFolder,
  } = useProjectFiles();

  // Track if we're loading to prevent marking as modified on initial load
  const isLoadingRef = useRef(false);
  const prevNodesRef = useRef<ScriptNode[]>([]);
  const prevConnectionsRef = useRef<NodeConnection[]>([]);

  // Sync nodes/connections with active script file
  useEffect(() => {
    if (activeScriptFile) {
      isLoadingRef.current = true;
      setNodes(activeScriptFile.nodes as ScriptNode[]);
      setConnections(activeScriptFile.connections as NodeConnection[]);
      setSelectedNodeIds([]);
      prevNodesRef.current = activeScriptFile.nodes as ScriptNode[];
      prevConnectionsRef.current = activeScriptFile.connections as NodeConnection[];
      // Allow the next render cycle to complete before clearing the flag
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 0);
    }
  }, [activeScriptFile?.id]);

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
    setNodes(currentNodes => {
      if (newNode.type !== 'custom-function') {
        return [...currentNodes, newNode];
      }

      const functionName = newNode.data.functionName || 'MyFunction';
      const callDefinition = getNodeDefinition('call-function');
      if (!callDefinition) {
        return [...currentNodes, newNode];
      }

      const callNode: ScriptNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: callDefinition.type,
        category: callDefinition.category,
        label: callDefinition.label,
        position: { x: newNode.position.x + 220, y: newNode.position.y },
        data: { ...callDefinition.defaultData, function: functionName },
        inputs: callDefinition.inputs.map((input, idx) => ({
          ...input,
          id: `input_${idx}`,
        })),
        outputs: callDefinition.outputs.map((output, idx) => ({
          ...output,
          id: `output_${idx}`,
        })),
      };

      return [...currentNodes, newNode, callNode];
    });
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
      // Split view divider
      if (splitDraggingRef.current) {
        const divider = document.getElementById('split-divider');
        if (!divider) return;
        const container = divider.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const clamped = Math.min(0.8, Math.max(0.2, ratio));
        setSplitRatio(clamped);
      }

      // Project panel resize
      if (projectDraggingRef.current) {
        const newWidth = Math.min(500, Math.max(240, e.clientX));
        setProjectPanelWidth(newWidth);
      }

      // Palette resize
      if (paletteDraggingRef.current) {
        const leftOffset = isProjectPanelOpen ? projectPanelWidth : 0;
        const newWidth = Math.min(400, Math.max(200, e.clientX - leftOffset));
        setPaletteWidth(newWidth);
      }

      // Inspector resize
      if (inspectorDraggingRef.current) {
        const newWidth = Math.min(500, Math.max(250, window.innerWidth - e.clientX));
        setInspectorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      splitDraggingRef.current = false;
      projectDraggingRef.current = false;
      paletteDraggingRef.current = false;
      inspectorDraggingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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

          {/* Tabs */}
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'visual'
                ? 'text-white border-purple-500 bg-white/5'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <GitBranch size={16} />
            Visual Editor
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'code'
                ? 'text-white border-purple-500 bg-white/5'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Code size={16} />
            Generated Code
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'split'
                ? 'text-white border-purple-500 bg-white/5'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Code size={16} />
            Split View
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
        {activeTab === 'visual' ? (
          <>
            {/* Project Panel */}
            {isProjectPanelOpen && (
              <div className="flex h-full" style={{ width: projectPanelWidth }}>
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
                  onClose={() => setProjectPanelOpen(false)}
                />
                {/* Resize Handle */}
                <div
                  className="w-1 h-full bg-white/5 hover:bg-purple-500/40 cursor-col-resize transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    projectDraggingRef.current = true;
                  }}
                />
              </div>
            )}

            {/* Project Panel Toggle Button */}
            {!isProjectPanelOpen && (
              <button
                onClick={() => setProjectPanelOpen(true)}
                className="absolute z-50 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] border-r-2 border-purple-500/50 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-xl"
                style={{ 
                  top: '85px',
                  left: isPaletteOpen ? `${paletteWidth}px` : '0px'
                }}
                title="Show Project Panel (Ctrl+B)"
              >
                <Folder size={18} className="text-purple-400 group-hover:text-purple-300" />
                <div className="text-[9px] text-gray-400 group-hover:text-purple-300 font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>PROJECT</div>
              </button>
            )}

            {/* Palette Toggle Button */}
            {!isPaletteOpen && (
              <button
                onClick={() => setPaletteOpen(true)}
                className="absolute z-50 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] border-r-2 border-purple-500/50 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-xl"
                style={{ 
                  top: isProjectPanelOpen ? '85px' : '184px',
                  left: isProjectPanelOpen ? `${projectPanelWidth}px` : '0px'
                }}
                title="Show Node Palette"
              >
                <PanelRight size={18} className="text-purple-400 group-hover:text-purple-300" />
                <div className="text-[9px] text-gray-400 group-hover:text-purple-300 font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>PALETTE</div>
              </button>
            )}

            {/* Node Palette */}
            {isPaletteOpen && (
              <div className="flex h-full" style={{ width: paletteWidth, marginLeft: !isProjectPanelOpen ? '0px' : '0px' }}>
                <NodePalette
                  onAddNode={handleAddNode}
                  onClose={() => setPaletteOpen(false)}
                />
                {/* Resize Handle */}
                <div
                  className="w-1 h-full bg-white/5 hover:bg-purple-500/40 cursor-col-resize transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    paletteDraggingRef.current = true;
                  }}
                />
              </div>
            )}

            {/* Main Canvas */}
            <div className="flex-1 h-full">
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
              />
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
                  className="w-1 h-full bg-white/5 hover:bg-purple-500/40 cursor-col-resize transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    inspectorDraggingRef.current = true;
                  }}
                />
                <NodeInspector
                  key={selectedNode.id}
                  node={selectedNode}
                  onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
                  onClose={() => setInspectorOpen(false)}
                />
              </div>
            )}
          </>
        ) : activeTab === 'code' ? (
          /* Code View */
          <div className="flex-1 h-full">
            <CodeView code={generatedCode} />
          </div>
        ) : (
          <div className="flex-1 h-full flex">
            <div
              className="h-full flex overflow-hidden border-r border-white/10"
              style={{ width: `${splitRatio * 100}%` }}
            >
              {/* Project Panel */}
              {isProjectPanelOpen && (
                <div className="flex h-full" style={{ width: projectPanelWidth }}>
                  <ProjectPanel
                    scriptFiles={scriptFiles}
                    activeFileId={activeScriptFile?.id || null}
                    projectName={projectData?.metadata.name || 'Untitled Project'}
                    onSelectFile={setActiveScriptFile}
                    onCreateFile={createNewScriptFile}
                    onDeleteFile={deleteScriptFile}
                    onRenameFile={renameScriptFile}
                    onClose={() => setProjectPanelOpen(false)}
                  />
                  <div
                    className="w-1 h-full bg-white/5 hover:bg-purple-500/40 cursor-col-resize transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      projectDraggingRef.current = true;
                    }}
                  />
                </div>
              )}

              {!isProjectPanelOpen && (
                <button
                  onClick={() => setProjectPanelOpen(true)}
                  className="absolute z-50 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] border-r-2 border-purple-500/50 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-xl"
                  style={{ 
                    top: '60px',
                    left: isPaletteOpen ? `${paletteWidth}px` : '0px'
                  }}
                  title="Show Project Panel (Ctrl+B)"
                >
                  <Folder size={18} className="text-purple-400 group-hover:text-purple-300" />
                  <div className="text-[9px] text-gray-400 group-hover:text-purple-300 font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>PROJECT</div>
                </button>
              )}

              {!isPaletteOpen && (
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="absolute z-50 px-2 py-4 bg-[#2a3341] hover:bg-[#363f4f] border-r-2 border-purple-500/50 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-xl"
                  style={{ 
                    top: isProjectPanelOpen ? '60px' : '145px',
                    left: isProjectPanelOpen ? `${projectPanelWidth}px` : '0px'
                  }}
                  title="Show Node Palette"
                >
                  <PanelRight size={18} className="text-purple-400 group-hover:text-purple-300" />
                  <div className="text-[9px] text-gray-400 group-hover:text-purple-300 font-semibold tracking-wider" style={{ writingMode: 'vertical-rl' }}>PALETTE</div>
                </button>
              )}

              {isPaletteOpen && (
                <div className="flex h-full" style={{ width: paletteWidth }}>
                  <NodePalette
                    onAddNode={handleAddNode}
                    onClose={() => setPaletteOpen(false)}
                  />
                  <div
                    className="w-1 h-full bg-white/5 hover:bg-purple-500/40 cursor-col-resize transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      paletteDraggingRef.current = true;
                    }}
                  />
                </div>
              )}

              <div className="flex-1 h-full">
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
                />
              </div>

              {selectedNode && !isInspectorOpen && (
                <button
                    onClick={() => setInspectorOpen(true)}
                    className="absolute top-16 right-4 z-50 p-2 bg-[#151a21]/80 hover:bg-[#151a21] border border-white/10 rounded-lg transition-colors"
                    title="Show Inspector"
                >
                    <PanelLeft size={16} />
                </button>
              )}

              {isInspectorOpen && selectedNode && (
                <div className="flex h-full" style={{ width: inspectorWidth }}>
                  <div
                    className="w-1 h-full bg-white/5 hover:bg-purple-500/40 cursor-col-resize transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      inspectorDraggingRef.current = true;
                    }}
                  />
                  <NodeInspector
                    key={selectedNode.id}
                    node={selectedNode}
                    onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
                    onClose={() => setInspectorOpen(false)}
                  />
                </div>
              )}
            </div>
            <div
              id="split-divider"
              className="w-1 h-full bg-white/10 hover:bg-purple-500/40 cursor-col-resize"
              onMouseDown={(e) => {
                e.preventDefault();
                splitDraggingRef.current = true;
              }}
            />
            <div className="h-full" style={{ width: `${(1 - splitRatio) * 100}%` }}>
              <CodeView code={generatedCode} />
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
