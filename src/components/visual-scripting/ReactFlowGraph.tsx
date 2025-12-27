import { useCallback, useMemo, useState, useEffect, useRef, memo } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
  Handle,
  Position,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  BaseEdge,
  applyNodeChanges,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnConnect,
  NodeProps,
  EdgeProps,
  OnConnectEnd,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Trash2 } from 'lucide-react';
import type { ScriptNode, NodeConnection, NodeDataType, NodePort } from '../../types/visual-scripting';
import { getNodeDefinition } from '../../data/node-definitions';
import QuickNodeMenu from './QuickNodeMenu';

// Custom styles for React Flow controls and minimap
const reactFlowStyles = `
  .react-flow__controls {
    background: rgba(15, 20, 25, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
  
  .react-flow__controls-button {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    width: 28px;
    height: 28px;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .react-flow__controls-button:last-child {
    border-bottom: none;
  }
  
  .react-flow__controls-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .react-flow__controls-button svg {
    fill: rgba(255, 255, 255, 0.7);
    width: 14px;
    height: 14px;
  }
  
  .react-flow__controls-button:hover svg {
    fill: rgba(255, 255, 255, 0.95);
  }
  
  .react-flow__minimap {
    background: rgba(15, 20, 25, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
  
  .react-flow__minimap-mask {
    fill: rgba(0, 0, 0, 0.7);
  }
  
  .react-flow__minimap-node {
    fill-opacity: 0.8;
    stroke-width: 1;
    rx: 2;
    ry: 2;
  }
`;

// Inject styles once
if (typeof document !== 'undefined') {
  const styleId = 'react-flow-custom-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = reactFlowStyles;
    document.head.appendChild(styleSheet);
  }
}

// ============================================================================
// Types
// ============================================================================

interface ReactFlowGraphProps {
  nodes: ScriptNode[];
  connections: NodeConnection[];
  selectedNodeIds: string[];
  onSelectNodes: (nodeIds: string[]) => void;
  onUpdateNode: (nodeId: string, updates: Partial<ScriptNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onConnect: (connection: NodeConnection) => void;
  onBreakInput: (nodeId: string, portId: string) => void;
  onDeleteConnection?: (connectionId: string) => void;
  onAddNode: (node: ScriptNode) => void;
  onViewChange?: (view: { x: number; y: number; scale: number }) => void;
  onRequestHistorySnapshot?: () => void;
  onSaveAsTemplate?: (nodeIds: string[]) => void;
  // Appearance settings
  showGridLines?: boolean;
  gridSize?: number;
  nodeOpacity?: number;
  connectionStyle?: 'bezier' | 'straight' | 'step' | 'smooth-step' | 'metro' | 'quadratic';
  connectionsBehindNodes?: boolean;
  accentColor?: string;
  theme?: 'light' | 'dark';
  gridStyle?: 'dots' | 'lines' | 'crosshatch' | 'hexagons' | 'isometric' | 'blueprint' | 'diamonds' | 'triangles' | 'graph' | 'waves';
  coloredGrid?: boolean;
  // Editor settings
  snapToGrid?: boolean;
  autoConnect?: boolean;
  highlightConnections?: boolean;
  animateConnections?: boolean;
  isDev?: boolean;
}

interface ScriptNodeData extends Record<string, unknown> {
  scriptNode: ScriptNode;
  isSelected: boolean;
  onUpdate: (updates: Partial<ScriptNode>) => void;
  onDelete: () => void;
  accentColor: string;
  nodeOpacity: number;
}

interface ScriptEdgeData extends Record<string, unknown> {
  portType: 'exec' | 'data';
  dataType?: NodeDataType;
  connectionId: string;
  connectionStyle?: 'bezier' | 'straight' | 'step' | 'smooth-step' | 'metro' | 'quadratic';
}

// ============================================================================
// Utility Functions
// ============================================================================

const getLineColor = (portType: 'exec' | 'data', dataType?: NodeDataType): string => {
  if (portType === 'exec') return '#ffffff';

  const colorMap: Record<string, string> = {
    int: '#3b82f6',
    float: '#22c55e',
    number: '#22c55e',
    string: '#ec4899',
    vector: '#facc15',
    rotation: '#f97316',
    boolean: '#ef4444',
    entity: '#2dd4bf',
    player: '#22d3ee',
    weapon: '#fbbf24',
    array: '#a855f7',
    table: '#6366f1',
    asset: '#84cc16',
    function: '#94a3b8',
    any: '#ffffff',
  };

  return colorMap[dataType || 'any'] || '#ffffff';
};

const getPortColor = (portType: 'exec' | 'data', dataType?: NodeDataType): string => {
  if (portType === 'exec') return '#ffffff';
  return getLineColor(portType, dataType);
};

const getNodeColor = (type: string): string => {
  const definition = getNodeDefinition(type);
  return definition?.color || '#6B7280';
};

// Convert ScriptNode to React Flow Node
const scriptNodeToFlowNode = (
  node: ScriptNode,
  isSelected: boolean,
  onUpdate: (nodeId: string, updates: Partial<ScriptNode>) => void,
  onDelete: (nodeId: string) => void,
  accentColor: string,
  nodeOpacity: number
): Node<ScriptNodeData> => {
  // Determine node type for React Flow
  let flowNodeType = 'scriptNode';
  if (node.type === 'comment') flowNodeType = 'commentNode';
  if (node.type === 'reroute') flowNodeType = 'rerouteNode';

  return {
    id: node.id,
    type: flowNodeType,
    position: node.position,
    selected: isSelected,
    data: {
      scriptNode: node,
      isSelected,
      onUpdate: (updates) => onUpdate(node.id, updates),
      onDelete: () => onDelete(node.id),
      accentColor,
      nodeOpacity,
    },
    style: node.type === 'comment' ? {
      width: node.size?.width || 300,
      height: node.size?.height || 150,
    } : undefined,
  };
};

// Convert NodeConnection to React Flow Edge
const connectionToFlowEdge = (
  conn: NodeConnection,
  nodes: ScriptNode[],
  connectionStyle?: 'bezier' | 'straight' | 'step' | 'smooth-step' | 'metro' | 'quadratic'
): Edge<ScriptEdgeData> | null => {
  const fromNode = nodes.find(n => n.id === conn.from.nodeId);
  const fromPort = fromNode?.outputs.find(p => p.id === conn.from.portId) ||
                   fromNode?.inputs.find(p => p.id === conn.from.portId);

  if (!fromPort) return null;

  return {
    id: conn.id,
    source: conn.from.nodeId,
    target: conn.to.nodeId,
    sourceHandle: conn.from.portId,
    targetHandle: conn.to.portId,
    type: 'scriptEdge',
    data: {
      portType: fromPort.type,
      dataType: fromPort.dataType,
      connectionId: conn.id,
      connectionStyle,
    },
  };
};

// ============================================================================
// Port Handle Component
// ============================================================================

interface PortHandleProps {
  port: NodePort;
  nodeId: string;
  isInput: boolean;
  index: number;
}

const PortHandle = memo(({ port, nodeId, isInput, index }: PortHandleProps) => {
  const color = getPortColor(port.type, port.dataType);
  const isExec = port.type === 'exec';

  return (
    <Handle
      type={isInput ? 'target' : 'source'}
      position={isInput ? Position.Left : Position.Right}
      id={port.id}
      className="!bg-transparent !border-0"
      style={{
        top: `${56 + index * 32}px`,
        width: '16px',
        height: '16px',
      }}
    >
      <div
        className={`w-4 h-4 border-2 transition-transform hover:scale-125 cursor-crosshair ${
          isExec ? 'rounded-sm' : 'rounded-full'
        }`}
        style={{
          backgroundColor: color,
          borderColor: color,
          clipPath: isExec ? 'polygon(0 0, 100% 50%, 0 100%)' : undefined,
        }}
      />
    </Handle>
  );
});
PortHandle.displayName = 'PortHandle';

// ============================================================================
// Custom Script Node Component
// ============================================================================

const ScriptNodeComponent = memo(({ data, selected }: NodeProps<Node<ScriptNodeData>>) => {
  const { scriptNode: node, onUpdate, onDelete, accentColor, nodeOpacity } = data;
  const nodeColor = getNodeColor(node.type);

  // Inline editor for node data
  const renderInlineEditor = () => {
    if (node.type === 'const-string') {
      const value = typeof node.data.value === 'string' ? node.data.value : '';
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdate({ data: { ...node.data, value: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        />
      );
    }

    if (node.type === 'const-int' || node.type === 'const-float') {
      const value = typeof node.data.value === 'number' ? node.data.value : 0;
      return (
        <input
          type="number"
          value={value}
          step={node.type === 'const-float' ? '0.1' : '1'}
          onChange={(e) => onUpdate({ data: { ...node.data, value: parseFloat(e.target.value) || 0 } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        />
      );
    }

    if (node.type === 'const-bool') {
      const value = !!node.data.value;
      return (
        <label className="flex items-center gap-2 text-[11px] text-gray-300">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onUpdate({ data: { ...node.data, value: e.target.checked } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded"
          />
          {value ? 'True' : 'False'}
        </label>
      );
    }

    if (node.type === 'const-vector') {
      const x = typeof node.data.x === 'number' ? node.data.x : 0;
      const y = typeof node.data.y === 'number' ? node.data.y : 0;
      const z = typeof node.data.z === 'number' ? node.data.z : 0;
      return (
        <div className="grid grid-cols-3 gap-1" style={{ width: '140px' }}>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <input
              key={axis}
              type="number"
              step="0.1"
              value={axis === 'x' ? x : axis === 'y' ? y : z}
              onChange={(e) => onUpdate({ data: { ...node.data, [axis]: parseFloat(e.target.value) || 0 } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-1 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
          ))}
        </div>
      );
    }

    // Fallback: render editable fields for nodes with data
    const dataKeys = Object.keys(node.data).filter(key => 
      !['isExec', 'comment', 'commentColor'].includes(key) &&
      node.data[key] !== undefined
    );

    if (dataKeys.length > 0) {
      return (
        <div className="flex flex-col gap-1.5">
          {dataKeys.slice(0, 3).map((key) => {
            const value = node.data[key];
            const labelText = key.replace(/([A-Z])/g, ' $1').trim();

            if (typeof value === 'boolean') {
              return (
                <label key={key} className="flex items-center gap-2 text-[9px] text-gray-500">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: e.target.checked } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-3 h-3 rounded"
                  />
                  {labelText}
                </label>
              );
            }

            if (typeof value === 'number') {
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500">{labelText}:</span>
                  <input
                    type="number"
                    value={value}
                    step="0.1"
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: parseFloat(e.target.value) || 0 } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              );
            }

            if (typeof value === 'string') {
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500">{labelText}:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: e.target.value } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="bg-[#1a1f28] rounded-xl select-none border border-white/10"
      style={{
        minWidth: 180,
        opacity: nodeOpacity / 100,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}, 0 0 0 4px #0f1419, 0 8px 24px rgba(0, 0, 0, 0.4)`
          : '0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Node Header */}
      <div
        className="px-3 py-2.5 rounded-t-xl flex items-center justify-between border-b border-black/20"
        style={{
          background: `linear-gradient(135deg, ${nodeColor} 0%, ${nodeColor}dd 100%)`,
        }}
      >
        <span className="text-xs font-semibold text-white truncate drop-shadow-sm">
          {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
        </span>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-0.5 hover:bg-white/20 rounded transition-colors"
          >
            <Trash2 size={12} className="text-white/90" />
          </button>
        )}
      </div>

      {/* Node Body */}
      <div className="p-2.5 relative">
        {/* Input Ports */}
        {node.inputs.map((input, index) => (
          <div key={input.id} className="flex items-center mb-2 relative">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              className="!w-4 !h-4 !border-2 !-left-2"
              style={{
                backgroundColor: getPortColor(input.type, input.dataType),
                borderColor: getPortColor(input.type, input.dataType),
                borderRadius: input.type === 'exec' ? '2px' : '50%',
                clipPath: input.type === 'exec' ? 'polygon(0 0, 100% 50%, 0 100%)' : undefined,
              }}
            />
            <span className="ml-4 text-xs text-gray-300">{input.label}</span>
          </div>
        ))}

        {/* Node Data Display */}
        {Object.keys(node.data).length > 0 && (
          <div className="my-2 px-2.5 py-2 bg-black/30 border border-white/5 rounded-lg text-[10px] text-gray-400">
            {renderInlineEditor()}
          </div>
        )}

        {/* Output Ports */}
        {node.outputs.map((output, index) => (
          <div key={output.id} className="flex items-center justify-end mb-2 relative">
            <span className="mr-4 text-xs text-gray-300">{output.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              className="!w-4 !h-4 !border-2 !-right-2"
              style={{
                backgroundColor: getPortColor(output.type, output.dataType),
                borderColor: getPortColor(output.type, output.dataType),
                borderRadius: output.type === 'exec' ? '2px' : '50%',
                clipPath: output.type === 'exec' ? 'polygon(0 0, 100% 50%, 0 100%)' : undefined,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
ScriptNodeComponent.displayName = 'ScriptNodeComponent';

// ============================================================================
// Comment Node Component
// ============================================================================

const CommentNodeComponent = memo(({ data, selected }: NodeProps<Node<ScriptNodeData>>) => {
  const { scriptNode: node, onUpdate, onDelete, accentColor, nodeOpacity } = data;
  const commentText = typeof node.data.comment === 'string' ? node.data.comment : 'Comment';
  const commentColor = typeof node.data.commentColor === 'string' ? node.data.commentColor : '#374151';

  return (
    <div
      className="rounded-lg select-none border-2 border-dashed"
      style={{
        width: node.size?.width || 300,
        height: node.size?.height || 150,
        backgroundColor: `${commentColor}40`,
        borderColor: `${commentColor}80`,
        opacity: nodeOpacity / 100,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}`
          : undefined,
      }}
    >
      <div className="p-3">
        <textarea
          value={commentText}
          onChange={(e) => onUpdate({ data: { ...node.data, comment: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full h-full bg-transparent text-sm text-white/80 resize-none focus:outline-none"
          placeholder="Add comment..."
        />
      </div>
    </div>
  );
});
CommentNodeComponent.displayName = 'CommentNodeComponent';

// ============================================================================
// Reroute Node Component
// ============================================================================

const RerouteNodeComponent = memo(({ data, selected }: NodeProps<Node<ScriptNodeData>>) => {
  const { scriptNode: node, accentColor, nodeOpacity } = data;
  const isExec = node.data.isExec === true;
  const dataType = node.inputs[0]?.dataType;
  const color = getPortColor(isExec ? 'exec' : 'data', dataType);

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: '#1a1f28',
        border: `2px solid ${color}`,
        opacity: nodeOpacity / 100,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}`
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id={node.inputs[0]?.id || 'input_0'}
        className="!w-3 !h-3 !border-2 !-left-1.5"
        style={{
          backgroundColor: color,
          borderColor: color,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={node.outputs[0]?.id || 'output_0'}
        className="!w-3 !h-3 !border-2 !-right-1.5"
        style={{
          backgroundColor: color,
          borderColor: color,
        }}
      />
    </div>
  );
});
RerouteNodeComponent.displayName = 'RerouteNodeComponent';

// ============================================================================
// Custom Edge Component
// ============================================================================

const ScriptEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}: EdgeProps<Edge<ScriptEdgeData>>) => {
  const strokeColor = data ? getLineColor(data.portType, data.dataType) : '#ffffff';
  const connectionStyle = data?.connectionStyle || 'bezier';

  // Generate path based on connection style
  const edgePath = useMemo(() => {
    switch (connectionStyle) {
      case 'straight':
        return getStraightPath({ sourceX, sourceY, targetX, targetY })[0];
      
      case 'step':
        return getSmoothStepPath({
          sourceX, sourceY, sourcePosition,
          targetX, targetY, targetPosition,
          borderRadius: 0,
        })[0];
      
      case 'smooth-step':
        return getSmoothStepPath({
          sourceX, sourceY, sourcePosition,
          targetX, targetY, targetPosition,
          borderRadius: 10,
        })[0];
      
      case 'metro': {
        // 45-degree diagonal style
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const absDy = Math.abs(dy);
        const absDx = Math.abs(dx);
        const yDir = dy > 0 ? 1 : -1;
        
        if (absDx < 20 || absDy < 5) {
          return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
        }
        
        const minHorizontal = 20;
        const diagonalHorizontal = Math.min(absDy, absDx - minHorizontal * 2);
        const remainingHorizontal = absDx - diagonalHorizontal;
        const startH = remainingHorizontal / 2;
        
        return `M ${sourceX} ${sourceY} ` +
          `L ${sourceX + startH} ${sourceY} ` +
          `L ${sourceX + startH + diagonalHorizontal} ${sourceY + diagonalHorizontal * yDir} ` +
          `L ${targetX} ${targetY}`;
      }
      
      case 'quadratic': {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        const offset = Math.min(Math.abs(targetX - sourceX) * 0.3, 80);
        return `M ${sourceX} ${sourceY} Q ${sourceX + offset} ${sourceY}, ${midX} ${midY} T ${targetX} ${targetY}`;
      }
      
      case 'bezier':
      default:
        return getBezierPath({
          sourceX, sourceY, sourcePosition,
          targetX, targetY, targetPosition,
        })[0];
    }
  }, [connectionStyle, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  return (
    <>
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        style={{ cursor: 'pointer' }}
      />
      {/* Visible edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 3.5 : 2.5,
          ...style,
        }}
      />
    </>
  );
});
ScriptEdge.displayName = 'ScriptEdge';

// ============================================================================
// Node Types Registry
// ============================================================================

const nodeTypes: NodeTypes = {
  scriptNode: ScriptNodeComponent,
  commentNode: CommentNodeComponent,
  rerouteNode: RerouteNodeComponent,
};

const edgeTypes: EdgeTypes = {
  scriptEdge: ScriptEdge,
};

// ============================================================================
// Quick Node Menu State
// ============================================================================

interface QuickMenuState {
  screenPosition: { x: number; y: number };
  canvasPosition: { x: number; y: number };
  sourcePort?: {
    nodeId: string;
    portId: string;
    isInput: boolean;
    portType: 'exec' | 'data';
    dataType?: NodeDataType;
  };
}

// ============================================================================
// Main React Flow Graph Component (Inner)
// ============================================================================

function ReactFlowGraphInner({
  nodes: scriptNodes,
  connections,
  selectedNodeIds,
  onSelectNodes,
  onUpdateNode,
  onDeleteNode,
  onConnect: onConnectProp,
  onBreakInput,
  onDeleteConnection,
  onAddNode,
  onViewChange,
  onRequestHistorySnapshot,
  onSaveAsTemplate,
  showGridLines = true,
  gridSize = 20,
  nodeOpacity = 100,
  connectionStyle = 'bezier',
  connectionsBehindNodes = false,
  accentColor = '#8B5CF6',
  theme = 'dark',
  gridStyle = 'dots',
  coloredGrid = false,
  snapToGrid = false,
  autoConnect = true,
  highlightConnections = true,
  animateConnections = false,
  isDev = false,
}: ReactFlowGraphProps) {
  const reactFlowInstance = useReactFlow();
  const [quickMenu, setQuickMenu] = useState<QuickMenuState | null>(null);
  
  // Track which nodes are currently being dragged
  const draggingRef = useRef<Set<string>>(new Set());

  // Convert script nodes to React Flow nodes - memoized base conversion
  const baseFlowNodes = useMemo<Node<ScriptNodeData>[]>(() => {
    return scriptNodes.map(node => 
      scriptNodeToFlowNode(
        node,
        selectedNodeIds.includes(node.id),
        onUpdateNode,
        onDeleteNode,
        accentColor,
        nodeOpacity
      )
    );
  }, [scriptNodes, selectedNodeIds, onUpdateNode, onDeleteNode, accentColor, nodeOpacity]);

  // Internal node state for smooth dragging
  const [internalNodes, setInternalNodes] = useState<Node<ScriptNodeData>[]>(baseFlowNodes);

  // Sync internal nodes with external props when not dragging
  useEffect(() => {
    // Only sync if no nodes are being dragged
    if (draggingRef.current.size === 0) {
      setInternalNodes(baseFlowNodes);
    }
  }, [baseFlowNodes]);

  // Use internal nodes for rendering
  const flowNodes = internalNodes;

  // Convert connections to React Flow edges
  const flowEdges = useMemo<Edge<ScriptEdgeData>[]>(() => {
    return connections
      .map(conn => connectionToFlowEdge(conn, scriptNodes, connectionStyle))
      .filter((edge): edge is Edge<ScriptEdgeData> => edge !== null);
  }, [connections, scriptNodes, connectionStyle]);

  // Handle node selection changes
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    const selectedIds = nodes.map(n => n.id);
    onSelectNodes(selectedIds);
  }, [onSelectNodes]);

  // Handle node position changes - apply changes for smooth dragging
  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    // Apply changes to internal state for smooth visual updates
    setInternalNodes((nodes) => applyNodeChanges(changes, nodes) as Node<ScriptNodeData>[]);

    // Track dragging state and sync to parent on drag end
    for (const change of changes) {
      if (change.type === 'position') {
        if (change.dragging) {
          // Node is being dragged - track it
          draggingRef.current.add(change.id);
        } else if (draggingRef.current.has(change.id)) {
          // Drag ended - sync position to parent
          draggingRef.current.delete(change.id);
          if (change.position) {
            onUpdateNode(change.id, { position: change.position });
            onRequestHistorySnapshot?.();
          }
        }
      }
    }
  }, [onUpdateNode, onRequestHistorySnapshot]);

  // Handle new connections
  const handleConnect: OnConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return;
    }

    const newConnection: NodeConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: {
        nodeId: connection.source,
        portId: connection.sourceHandle,
      },
      to: {
        nodeId: connection.target,
        portId: connection.targetHandle,
      },
    };

    onConnectProp(newConnection);
  }, [onConnectProp]);

  // Handle edge deletion
  const onEdgesDelete = useCallback((edges: Edge[]) => {
    edges.forEach(edge => {
      onDeleteConnection?.(edge.id);
    });
  }, [onDeleteConnection]);

  // Handle dropping connection on empty space - show quick menu
  const onConnectEnd: OnConnectEnd = useCallback((event, connectionState) => {
    if (!connectionState.fromNode || !connectionState.fromHandle) return;

    // Get mouse position
    const clientX = 'clientX' in event ? event.clientX : (event as TouchEvent).touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : (event as TouchEvent).touches[0].clientY;

    // Check if we dropped on a valid target
    const targetElement = document.elementFromPoint(clientX, clientY);
    if (targetElement?.closest('.react-flow__handle')) return;

    // Get canvas position
    const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: clientX,
      y: clientY,
    });

    // Find the source port info
    const sourceNode = scriptNodes.find(n => n.id === connectionState.fromNode?.id);
    const isOutput = connectionState.fromHandle?.type === 'source';
    const portList = isOutput ? sourceNode?.outputs : sourceNode?.inputs;
    const port = portList?.find(p => p.id === connectionState.fromHandle?.id);

    if (sourceNode && port) {
      setQuickMenu({
        screenPosition: { x: clientX, y: clientY },
        canvasPosition: position,
        sourcePort: {
          nodeId: sourceNode.id,
          portId: port.id,
          isInput: !isOutput,
          portType: port.type,
          dataType: port.dataType,
        },
      });
    }
  }, [reactFlowInstance, scriptNodes]);

  // Handle quick node menu selection
  const handleQuickNodeSelect = useCallback((newNode: ScriptNode, connectToPortIndex: number) => {
    if (!quickMenu) return;

    // Position the new node at the drop location
    newNode.position = {
      x: quickMenu.canvasPosition.x - 90,
      y: quickMenu.canvasPosition.y - 30,
    };

    // Add the new node
    onAddNode(newNode);

    // Create connection if we have a source port
    const sourcePort = quickMenu.sourcePort;
    if (sourcePort && connectToPortIndex >= 0) {
      const newNodePorts = sourcePort.isInput ? newNode.outputs : newNode.inputs;
      const targetPort = newNodePorts[connectToPortIndex];

      if (targetPort) {
        const connection: NodeConnection = {
          id: `conn_${Date.now()}`,
          from: sourcePort.isInput
            ? { nodeId: newNode.id, portId: targetPort.id }
            : { nodeId: sourcePort.nodeId, portId: sourcePort.portId },
          to: sourcePort.isInput
            ? { nodeId: sourcePort.nodeId, portId: sourcePort.portId }
            : { nodeId: newNode.id, portId: targetPort.id },
        };
        onConnectProp(connection);
      }
    }

    setQuickMenu(null);
  }, [quickMenu, onAddNode, onConnectProp]);

  // Handle pane click to add nodes via context menu
  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setQuickMenu({
      screenPosition: { x: event.clientX, y: event.clientY },
      canvasPosition: position,
    });
  }, [reactFlowInstance]);

  // Handle view changes
  const onMoveEnd = useCallback((_: unknown, viewport: { x: number; y: number; zoom: number }) => {
    onViewChange?.({
      x: viewport.x,
      y: viewport.y,
      scale: viewport.zoom,
    });
  }, [onViewChange]);

  // Determine background variant - React Flow only supports dots, lines, cross
  // Map additional styles to closest React Flow equivalent
  const backgroundVariant = (() => {
    switch (gridStyle) {
      case 'dots':
        return BackgroundVariant.Dots;
      case 'lines':
      case 'graph':
      case 'blueprint':
        return BackgroundVariant.Lines;
      case 'crosshatch':
      case 'diamonds':
      case 'triangles':
      case 'hexagons':
      case 'isometric':
      case 'waves':
        return BackgroundVariant.Cross;
      default:
        return BackgroundVariant.Dots;
    }
  })();

  return (
    <div className="w-full h-full" style={{ backgroundColor: theme === 'dark' ? '#1a1f28' : '#f5f5f5' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={handleConnect}
        onConnectEnd={onConnectEnd}
        onEdgesDelete={onEdgesDelete}
        onSelectionChange={onSelectionChange}
        onPaneContextMenu={onPaneContextMenu}
        onMoveEnd={onMoveEnd}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        defaultEdgeOptions={{
          type: 'scriptEdge',
          animated: animateConnections,
        }}
        fitView={false}
        minZoom={0.3}
        maxZoom={2.5}
        panOnDrag={[1]} // Middle mouse button
        selectionOnDrag
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
        style={{
          backgroundColor: theme === 'dark' ? '#1a1f28' : '#f5f5f5',
        }}
      >
        {showGridLines && (
          <Background
            variant={backgroundVariant}
            gap={gridSize}
            size={gridStyle === 'dots' ? 1 : undefined}
            color={coloredGrid ? accentColor : (theme === 'dark' ? '#2a2e38' : '#ddd')}
          />
        )}
        <MiniMap
          nodeStrokeWidth={1}
          nodeStrokeColor={theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
          nodeBorderRadius={4}
          nodeColor={(node) => {
            const scriptNode = scriptNodes.find(n => n.id === node.id);
            return scriptNode ? getNodeColor(scriptNode.type) : '#555';
          }}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
          pannable
          zoomable
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(15, 20, 25, 0.95)' : '#e5e5e5',
            width: 270,
            height: 220,
            bottom: 50,
            right: 12,
          }}
          position="bottom-right"
        />
      </ReactFlow>

      {/* Quick Node Menu */}
      {quickMenu && (
        <QuickNodeMenu
          position={quickMenu.screenPosition}
          sourcePort={quickMenu.sourcePort}
          onSelectNode={handleQuickNodeSelect}
          onClose={() => setQuickMenu(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Wrapper with ReactFlowProvider
// ============================================================================

export default function ReactFlowGraph(props: ReactFlowGraphProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowGraphInner {...props} />
    </ReactFlowProvider>
  );
}
