import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import NodePalette from './visual-scripting/NodePalette';
import NodeGraph from './visual-scripting/NodeGraph';
import NodeInspector from './visual-scripting/NodeInspector';
import type { ScriptNode, NodeConnection } from '../types/visual-scripting';

interface VisualScriptingCanvasProps {
  fileContent: string;
  onChange?: (content: string) => void;
}

export default function VisualScriptingCanvas({ fileContent, onChange }: VisualScriptingCanvasProps) {
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<ScriptNode | null>(null);
  const [showPalette, setShowPalette] = useState(true);

  // Generate code from visual graph
  const generateCode = () => {
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
  };

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

  // Update code when nodes change
  useEffect(() => {
    const code = generateCode();
    if (code && onChange) {
      // Don't override if in visual mode, just prepare for saving
      // onChange(code);
    }
  }, [nodes, connections]);

  const handleAddNode = (node: ScriptNode) => {
    setNodes([...nodes, node]);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<ScriptNode>) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  };

  const handleConnect = (connection: NodeConnection) => {
    // Prevent duplicate connections
    const exists = connections.some(
      c => c.from.nodeId === connection.from.nodeId &&
           c.from.portId === connection.from.portId &&
           c.to.nodeId === connection.to.nodeId &&
           c.to.portId === connection.to.portId
    );

    if (!exists) {
      setConnections([...connections, connection]);
    }
  };

  return (
    <div className="flex h-full bg-[#0f1419]">
      {/* Node Palette */}
      {showPalette && (
        <NodePalette
          onAddNode={handleAddNode}
          onClose={() => setShowPalette(false)}
        />
      )}

      {/* Main Canvas */}
      <div className="flex-1 relative">
        {!showPalette && (
          <button
            onClick={() => setShowPalette(true)}
            className="absolute top-4 left-4 z-10 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors"
            title="Show Node Palette"
          >
            <Plus size={20} />
          </button>
        )}

        <NodeGraph
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onConnect={handleConnect}
        />
      </div>

      {/* Node Inspector */}
      {selectedNode && (
        <NodeInspector
          node={selectedNode}
          onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
