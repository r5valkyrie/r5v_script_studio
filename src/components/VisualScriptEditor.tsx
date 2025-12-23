import { useState, useCallback, useMemo } from 'react';
import { PanelLeft, PanelRight, GitBranch, Code } from 'lucide-react';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import NodeGraph from './visual-scripting/NodeGraph';
import NodePalette from './visual-scripting/NodePalette';
import NodeInspector from './visual-scripting/NodeInspector';
import CodeView from './visual-scripting/CodeView';
import { generateCode } from '../utils/code-generator';

type EditorTab = 'visual' | 'code';

export default function VisualScriptEditor() {
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('visual');

  const [isPaletteOpen, setPaletteOpen] = useState(true);
  const [isInspectorOpen, setInspectorOpen] = useState(true);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  const handleAddNode = useCallback((newNode: ScriptNode) => {
    setNodes(currentNodes => [...currentNodes, newNode]);
  }, []);

  const handleSelectNode = useCallback((node: ScriptNode | null) => {
    setSelectedNodeId(node?.id ?? null);
    if (node && !isInspectorOpen) {
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
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

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

  // Generate code from nodes
  const generatedCode = useMemo(() => {
    return generateCode(nodes, connections);
  }, [nodes, connections]);

  return (
    <div className="w-screen h-screen bg-[#0f1419] text-white flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-[#0a0d10] border-b border-white/10 px-2">
        <div className="flex">
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
        </div>

        {/* Node count indicator */}
        <div className="flex items-center gap-4 px-4 text-xs text-gray-500">
          <span>{nodes.length} nodes</span>
          <span>{connections.length} connections</span>
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
                selectedNode={selectedNode}
                onSelectNode={handleSelectNode}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
                onConnect={handleConnect}
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
        ) : (
          /* Code View */
          <div className="flex-1 h-full">
            <CodeView code={generatedCode} />
          </div>
        )}
      </div>
    </div>
  );
}
