import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PanelLeft, PanelRight, GitBranch, Code, Save, FolderOpen, FileDown, FileText, FilePlus, ChevronDown } from 'lucide-react';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import NodeGraph from './visual-scripting/NodeGraph';
import NodePalette from './visual-scripting/NodePalette';
import NodeInspector from './visual-scripting/NodeInspector';
import CodeView from './visual-scripting/CodeView';
import { generateCode } from '../utils/code-generator';
import { getNodeDefinition } from '../data/node-definitions';
import { useProject } from '../hooks/useProject';
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

  const [isPaletteOpen, setPaletteOpen] = useState(true);
  const [isInspectorOpen, setInspectorOpen] = useState(true);
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  // Project management
  const {
    projectData,
    currentFilePath,
    hasUnsavedChanges,
    saveProject,
    saveProjectAs,
    loadProject,
    markModified,
  } = useProject();

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
    markModified();
  }, [markModified]);

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
    markModified();
  }, [markModified]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(currentNodes => currentNodes.filter(n => n.id !== nodeId));
    setConnections(currentConnections =>
      currentConnections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId)
    );
    setSelectedNodeIds(current => current.filter(id => id !== nodeId));
    markModified();
  }, [markModified]);

  const handleDeleteSelectedNodes = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    setNodes(currentNodes => currentNodes.filter(n => !nodeIds.includes(n.id)));
    setConnections(currentConnections =>
      currentConnections.filter(c => !nodeIds.includes(c.from.nodeId) && !nodeIds.includes(c.to.nodeId))
    );
    setSelectedNodeIds([]);
    markModified();
  }, [markModified]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // New project
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setNodes([]);
        setConnections([]);
        setSelectedNodeIds([]);
        return;
      }
      
      // Save shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject(nodes, connections);
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        saveProjectAs(nodes, connections);
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        loadProject().then(result => {
          if (result) {
            setNodes(result.nodes);
            setConnections(result.connections);
            setSelectedNodeIds([]);
          }
        });
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
  }, [selectedNodeIds, handleDeleteSelectedNodes, nodes, connections, saveProject, saveProjectAs, loadProject]);

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
      markModified();
      return [...currentConnections, newConnection];
    });
  }, [markModified]);

  const handleBreakInput = useCallback((nodeId: string, portId: string) => {
    setConnections(currentConnections =>
      currentConnections.filter(conn => !(conn.to.nodeId === nodeId && conn.to.portId === portId))
    );
    markModified();
  }, [markModified]);

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
      if (!splitDraggingRef.current) return;
      const divider = document.getElementById('split-divider');
      if (!divider) return;
      const container = divider.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const clamped = Math.min(0.8, Math.max(0.2, ratio));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      splitDraggingRef.current = false;
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
                    setNodes([]);
                    setConnections([]);
                    setSelectedNodeIds([]);
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
                    const result = await loadProject();
                    if (result) {
                      setNodes(result.nodes);
                      setConnections(result.connections);
                      setSelectedNodeIds([]);
                    }
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FolderOpen size={16} />
                  <span>Open Project</span>
                  <span className="ml-auto text-xs text-gray-500">Ctrl+O</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    saveProject(nodes, connections);
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
                    saveProjectAs(nodes, connections);
                    setFileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Save size={16} />
                  <span>Save As</span>
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
            {/* Palette Toggle Button */}
            {!isPaletteOpen && (
              <button
                onClick={() => setPaletteOpen(true)}
                className="absolute top-16 left-4 z-50 p-2 bg-[#151a21]/80 hover:bg-[#151a21] border border-white/10 rounded-lg transition-colors"
                title="Show Node Palette"
              >
                <PanelRight size={16} />
              </button>
            )}

            {/* Node Palette */}
            {isPaletteOpen && (
              <NodePalette
                onAddNode={handleAddNode}
                onClose={() => setPaletteOpen(false)}
              />
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
                  className="absolute top-16 right-4 z-50 p-2 bg-[#151a21]/80 hover:bg-[#151a21] border border-white/10 rounded-lg transition-colors"
                  title="Show Inspector"
              >
                  <PanelLeft size={16} />
              </button>
            )}

            {/* Node Inspector */}
            {isInspectorOpen && selectedNode && (
              <NodeInspector
                key={selectedNode.id}
                node={selectedNode}
                onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
                onClose={() => setInspectorOpen(false)}
              />
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
              {!isPaletteOpen && (
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="absolute top-16 left-4 z-50 p-2 bg-[#151a21]/80 hover:bg-[#151a21] border border-white/10 rounded-lg transition-colors"
                  title="Show Node Palette"
                >
                  <PanelRight size={16} />
                </button>
              )}

              {isPaletteOpen && (
                <NodePalette
                  onAddNode={handleAddNode}
                  onClose={() => setPaletteOpen(false)}
                />
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
                <NodeInspector
                  key={selectedNode.id}
                  node={selectedNode}
                  onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
                  onClose={() => setInspectorOpen(false)}
                />
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
    </div>
  );
}
