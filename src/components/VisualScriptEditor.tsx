import { useState, useCallback, useEffect } from 'react';
import { PanelLeft, PanelRight } from 'lucide-react';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';
import NodeGraph from './visual-scripting/NodeGraph';
import NodePalette from './visual-scripting/NodePalette';
import NodeInspector from './visual-scripting/NodeInspector';

export default function VisualScriptEditor() {
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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

  // Code Generation
  const generateNodeCode = (node: ScriptNode): string => {
    // This is a simplified code generation - will be expanded
    switch (node.type) {
      case 'event':
        return `function ${node.data.functionName || 'OnEvent'}() {\n  // TODO: Implement\n}\n\n`;
      case 'variable':
        return `local ${node.data.variableName || 'var'} = ${node.data.value || '0'}\n`;
      default:
        return '';
    }
  };

  const generateCode = useCallback(() => {
    if (nodes.length === 0) return '';

    // Add metadata header for visual scripting
    let code = '// @VISUAL_SCRIPT_START\n';
    code += '// This script was created with R5V Visual Scripting\n';
    code += '// Metadata: ' + JSON.stringify({ version: '1.0', nodeCount: nodes.length, connectionCount: connections.length }) + '\n';
    code += '// @VISUAL_SCRIPT_DATA: ' + btoa(JSON.stringify({ nodes, connections })) + '\n';
    code += '// @VISUAL_SCRIPT_END\n\n';

    // Find entry point nodes
    const entryNodes = nodes.filter(n => n.type === 'event' || n.type === 'init-server' || n.type === 'init-client' || n.type === 'init-ui');

    entryNodes.forEach(entryNode => {
      code += generateNodeCode(entryNode);
    });

    return code;
  }, [nodes, connections]);

  useEffect(() => {
    const code = generateCode();
    // For now, just log the code to the console
    if (code) {
      console.log("Generated Script:\n", code);
    }
  }, [generateCode]);

  return (
    <div className="w-screen h-screen bg-[#0f1419] text-white flex">
      {/* Palette Toggle Button */}
      {!isPaletteOpen && (
        <button
          onClick={() => setPaletteOpen(true)}
          className="absolute top-4 left-4 z-50 p-2 bg-[#151a21]/80 hover:bg-[#151a21] border border-white/10 rounded-lg transition-colors"
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
            className="absolute top-4 right-4 z-50 p-2 bg-[#151a21]/80 hover:bg-[#151a21] border border-white/10 rounded-lg transition-colors"
            title="Show Inspector"
        >
            <PanelLeft size={16} />
        </button>
      )}

      {/* Node Inspector */}
      {isInspectorOpen && selectedNode && (
        <NodeInspector
          key={selectedNode.id} // Re-mount when node changes
          node={selectedNode}
          onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
          onClose={() => setInspectorOpen(false)}
        />
      )}
    </div>
  );
}
