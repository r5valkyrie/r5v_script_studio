import { useCallback, useMemo, useState, useEffect, useRef, memo } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
  SelectionMode,
  Handle,
  Position,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  BaseEdge,
  applyNodeChanges,
  NodeResizer,
  Panel,
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
  connectionAnimation?: 'none' | 'flow' | 'pulse' | 'dash' | 'glow';
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
  connectionAnimation?: 'none' | 'flow' | 'pulse' | 'dash' | 'glow';
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
    zIndex: node.type === 'comment' ? -1000 : undefined, // Comments render behind everything
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
  connectionStyle?: 'bezier' | 'straight' | 'step' | 'smooth-step' | 'metro' | 'quadratic',
  connectionAnimation?: 'none' | 'flow' | 'pulse' | 'dash' | 'glow'
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
      connectionAnimation,
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

  // Get icon for node type
  const getNodeIcon = () => {
    if (node.type.startsWith('event-')) return '⚡';
    if (node.type.startsWith('flow-')) return '◇';
    if (node.type.startsWith('action-')) return '▶';
    if (node.type.startsWith('mod-')) return '⚙';
    if (node.type.startsWith('const-')) return '●';
    if (node.type.startsWith('math-')) return '∑';
    if (node.type.startsWith('logic-')) return '⋈';
    return '◆';
  };

  // Get data type label for display
  const getTypeLabel = (dataType?: string) => {
    if (!dataType) return '';
    const typeMap: Record<string, string> = {
      'number': 'Num',
      'string': 'Str',
      'boolean': 'Bool',
      'vector': 'Vec3',
      'entity': 'Ent',
      'weapon': 'Wpn',
      'player': 'Plyr',
      'any': 'Any',
    };
    return typeMap[dataType] || dataType.substring(0, 4);
  };

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
          className="w-full px-2.5 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50"
          placeholder="Enter text..."
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
          className="w-full px-2.5 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50"
        />
      );
    }

    if (node.type === 'const-bool') {
      const value = !!node.data.value;
      return (
        <label className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0d1117] rounded-md border border-white/10 cursor-pointer hover:bg-[#161b22]">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onUpdate({ data: { ...node.data, value: e.target.checked } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded accent-purple-500"
          />
          <span className="text-[11px] text-gray-300">{value ? 'True' : 'False'}</span>
        </label>
      );
    }

    if (node.type === 'const-vector') {
      const x = typeof node.data.x === 'number' ? node.data.x : 0;
      const y = typeof node.data.y === 'number' ? node.data.y : 0;
      const z = typeof node.data.z === 'number' ? node.data.z : 0;
      return (
        <div className="flex gap-1.5">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="flex-1 flex flex-col gap-0.5">
              <span className="text-[9px] text-gray-500 uppercase font-medium">{axis}</span>
              <input
                type="number"
                step="0.1"
                value={axis === 'x' ? x : axis === 'y' ? y : z}
                onChange={(e) => onUpdate({ data: { ...node.data, [axis]: parseFloat(e.target.value) || 0 } })}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full px-1.5 py-1 bg-[#0d1117] rounded text-[10px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
          ))}
        </div>
      );
    }

    // Call Function node - special handling for dynamic arguments
    if (node.type === 'call-function') {
      const returnType = typeof node.data.returnType === 'string' ? node.data.returnType : 'entity';
      const returnTypes = ['entity', 'int', 'float', 'bool', 'string', 'vector', 'array', 'var'];
      const argCount = typeof node.data.argCount === 'number' ? node.data.argCount : 1;
      const threaded = typeof node.data.threaded === 'boolean' ? node.data.threaded : false;
      
      const addArg = () => {
        const newCount = argCount + 1;
        const newInputs = [...node.inputs, {
          id: `input_${newCount + 1}`,
          label: `Arg ${newCount}`,
          type: 'data' as const,
          dataType: 'any' as NodeDataType,
          isInput: true,
        }];
        onUpdate({
          data: { ...node.data, argCount: newCount },
          inputs: newInputs,
        });
      };

      const removeArg = () => {
        if (argCount <= 0) return;
        const newCount = argCount - 1;
        // Keep exec input (0) and function input (1), remove last arg
        const newInputs = node.inputs.slice(0, 2 + newCount);
        onUpdate({
          data: { ...node.data, argCount: newCount },
          inputs: newInputs,
        });
      };
      
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-gray-500 uppercase font-medium tracking-wide">Return Type</span>
            <select
              value={returnType}
              onChange={(e) => onUpdate({ data: { ...node.data, returnType: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            >
              {returnTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-gray-500 uppercase font-medium tracking-wide">Arg Count</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={argCount}
                min={0}
                onChange={(e) => {
                  const newCount = Math.max(0, parseInt(e.target.value) || 0);
                  // Adjust inputs based on new count
                  const baseInputs = node.inputs.slice(0, 2); // Keep exec and function inputs
                  const argInputs: NodePort[] = [];
                  for (let i = 0; i < newCount; i++) {
                    argInputs.push({
                      id: `input_${i + 2}`,
                      label: `Arg ${i + 1}`,
                      type: 'data',
                      dataType: 'any',
                      isInput: true,
                    });
                  }
                  onUpdate({
                    data: { ...node.data, argCount: newCount },
                    inputs: [...baseInputs, ...argInputs],
                  });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeArg(); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={argCount <= 0}
                className="w-6 h-6 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-sm font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addArg(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-6 h-6 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-sm font-bold"
              >
                +
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0d1117] rounded-md border border-white/10 cursor-pointer hover:bg-[#161b22]">
            <input
              type="checkbox"
              checked={threaded}
              onChange={(e) => onUpdate({ data: { ...node.data, threaded: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-3.5 h-3.5 rounded accent-purple-500"
            />
            <span className="text-[10px] text-gray-400">threaded</span>
          </label>
        </div>
      );
    }

    // Custom Function node - special handling for dynamic parameters
    if (node.type === 'custom-function') {
      const functionName = typeof node.data.functionName === 'string' ? node.data.functionName : 'MyFunction';
      const returnType = typeof node.data.returnType === 'string' ? node.data.returnType : 'void';
      const returnTypes = ['void', 'entity', 'int', 'float', 'bool', 'string', 'vector', 'array', 'var'];
      const paramCount = typeof node.data.paramCount === 'number' ? node.data.paramCount : 0;
      const paramNames: string[] = Array.isArray(node.data.paramNames) ? node.data.paramNames : [];
      const paramTypes: string[] = Array.isArray(node.data.paramTypes) ? node.data.paramTypes : [];
      const isGlobal = typeof node.data.isGlobal === 'boolean' ? node.data.isGlobal : false;
      const dataTypes = ['var', 'entity', 'int', 'float', 'bool', 'string', 'vector', 'array', 'player', 'weapon'];
      
      const updateParamType = (index: number, newType: string) => {
        const newTypes = [...paramTypes];
        newTypes[index] = newType;
        // Also update the output port dataType
        const newOutputs = node.outputs.map((output, i) => {
          if (i === index + 1) { // +1 because first output is Exec
            return { ...output, dataType: newType as NodeDataType };
          }
          return output;
        });
        onUpdate({
          data: { ...node.data, paramTypes: newTypes },
          outputs: newOutputs,
        });
      };
      
      const updateParamName = (index: number, newName: string) => {
        const newNames = [...paramNames];
        newNames[index] = newName;
        // Also update the output port label
        const newOutputs = node.outputs.map((output, i) => {
          if (i === index + 1) { // +1 because first output is Exec
            return { ...output, label: newName };
          }
          return output;
        });
        onUpdate({
          data: { ...node.data, paramNames: newNames },
          outputs: newOutputs,
        });
      };
      
      const addParam = () => {
        const newCount = paramCount + 1;
        const newNames = [...paramNames, `param${newCount}`];
        const newTypes = [...paramTypes, 'var'];
        const newOutputs = [...node.outputs, {
          id: `output_${newCount}`,
          label: `param${newCount}`,
          type: 'data' as const,
          dataType: 'var' as NodeDataType,
          isInput: false,
        }];
        onUpdate({
          data: { ...node.data, paramCount: newCount, paramNames: newNames, paramTypes: newTypes },
          outputs: newOutputs,
        });
      };

      const removeParam = () => {
        if (paramCount <= 0) return;
        const newCount = paramCount - 1;
        const newNames = paramNames.slice(0, newCount);
        const newTypes = paramTypes.slice(0, newCount);
        // Keep exec output (0), remove last param
        const newOutputs = node.outputs.slice(0, 1 + newCount);
        onUpdate({
          data: { ...node.data, paramCount: newCount, paramNames: newNames, paramTypes: newTypes },
          outputs: newOutputs,
        });
      };
      
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-gray-500 uppercase font-medium tracking-wide">Function Name</span>
            <input
              type="text"
              value={functionName}
              onChange={(e) => onUpdate({ data: { ...node.data, functionName: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-gray-500 uppercase font-medium tracking-wide">Return Type</span>
            <select
              value={returnType}
              onChange={(e) => onUpdate({ data: { ...node.data, returnType: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            >
              {returnTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 uppercase font-medium tracking-wide">Parameters</span>
              <div className="flex-1" />
              <button
                onClick={(e) => { e.stopPropagation(); removeParam(); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={paramCount <= 0}
                className="w-6 h-6 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-sm font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addParam(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-6 h-6 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-sm font-bold"
              >
                +
              </button>
            </div>
            {/* Parameter list with name and type editors */}
            {paramCount > 0 && (
              <div className="flex flex-col gap-1 mt-1 max-h-32 overflow-y-auto">
                {Array.from({ length: paramCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={paramNames[i] || `param${i + 1}`}
                      onChange={(e) => updateParamName(i, e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-1 px-1.5 py-1 bg-[#0d1117] rounded text-[10px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50 min-w-0"
                      placeholder={`param${i + 1}`}
                    />
                    <select
                      value={paramTypes[i] || 'var'}
                      onChange={(e) => updateParamType(i, e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-16 px-1 py-1 bg-[#0d1117] rounded text-[10px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    >
                      {dataTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0d1117] rounded-md border border-white/10 cursor-pointer hover:bg-[#161b22]">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => onUpdate({ data: { ...node.data, isGlobal: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-3.5 h-3.5 rounded accent-purple-500"
            />
            <span className="text-[10px] text-gray-400">Global (accessible from other scripts)</span>
          </label>
        </div>
      );
    }

    // Fallback: render editable fields for nodes with data
    // Only show fields that don't have a corresponding input port
    const inputLabels = new Set(node.inputs.map(input => input.label.toLowerCase().replace(/\s+/g, '')));
    const inputIds = new Set(node.inputs.map(input => input.id.toLowerCase()));
    
    const dataKeys = Object.keys(node.data).filter(key => {
      // Skip internal keys
      if (['isExec', 'comment', 'commentColor'].includes(key)) return false;
      if (node.data[key] === undefined) return false;
      
      // Skip if there's an input port for this data
      const keyLower = key.toLowerCase();
      if (inputLabels.has(keyLower)) return false;
      if (inputIds.has(keyLower)) return false;
      if (inputIds.has(`input_${keyLower}`)) return false;
      
      return true;
    });

    if (dataKeys.length > 0) {
      return (
        <div className="flex flex-col gap-2">
          {dataKeys.slice(0, 3).map((key) => {
            const value = node.data[key];
            const labelText = key.replace(/([A-Z])/g, ' $1').trim();

            if (typeof value === 'boolean') {
              return (
                <label key={key} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0d1117] rounded-md border border-white/10 cursor-pointer hover:bg-[#161b22]">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: e.target.checked } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded accent-purple-500"
                  />
                  <span className="text-[10px] text-gray-400">{labelText}</span>
                </label>
              );
            }

            if (typeof value === 'number') {
              return (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase font-medium tracking-wide">{labelText}</span>
                  <input
                    type="number"
                    value={value}
                    step="0.1"
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: parseFloat(e.target.value) || 0 } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2.5 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              );
            }

            if (typeof value === 'string') {
              return (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[9px] text-gray-500 uppercase font-medium tracking-wide">{labelText}</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: e.target.value } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2.5 py-1.5 bg-[#0d1117] rounded-md text-[11px] text-gray-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
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

  // Check which data fields should show editors (those without input ports)
  const getEditableDataKeys = () => {
    const inputLabels = new Set(node.inputs.map(input => input.label.toLowerCase().replace(/\s+/g, '')));
    const inputIds = new Set(node.inputs.map(input => input.id.toLowerCase()));
    
    return Object.keys(node.data).filter(key => {
      if (['isExec', 'comment', 'commentColor'].includes(key)) return false;
      if (node.data[key] === undefined) return false;
      const keyLower = key.toLowerCase();
      if (inputLabels.has(keyLower)) return false;
      if (inputIds.has(keyLower)) return false;
      if (inputIds.has(`input_${keyLower}`)) return false;
      return true;
    });
  };

  const hasInputs = node.inputs.length > 0;
  const hasOutputs = node.outputs.length > 0;
  const editableDataKeys = getEditableDataKeys();
  const hasEditableData = editableDataKeys.length > 0 || 
    node.type.startsWith('const-'); // const nodes always show their editors

  return (
    <div
      className="rounded-lg select-none overflow-hidden"
      style={{
        minWidth: 200,
        opacity: nodeOpacity / 100,
        backgroundColor: '#1e2328',
        border: selected ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
        boxShadow: selected
          ? `0 0 20px ${accentColor}40, 0 8px 24px rgba(0, 0, 0, 0.4)`
          : '0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Node Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{
          background: `linear-gradient(135deg, ${nodeColor}e0 0%, ${nodeColor}90 100%)`,
          borderBottom: '1px solid rgba(0,0,0,0.3)',
        }}
      >
        <span className="text-sm opacity-80">{getNodeIcon()}</span>
        <span className="text-[11px] font-semibold text-white uppercase tracking-wide flex-1 truncate">
          {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
        </span>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Trash2 size={11} className="text-white/80" />
          </button>
        )}
      </div>

      {/* INPUTS Section */}
      {hasInputs && (
        <div className="px-3 pt-2 pb-1">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Inputs</div>
          {node.inputs.map((input) => {
            const portColor = getPortColor(input.type, input.dataType);
            return (
              <div key={input.id} className="flex items-center py-1 relative">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={input.id}
                  className="!border-2 !-left-[9px]"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: portColor,
                    borderColor: '#1e2328',
                    borderRadius: input.type === 'exec' ? '2px' : '50%',
                    clipPath: input.type === 'exec' ? 'polygon(0 0, 100% 50%, 0 100%)' : undefined,
                  }}
                />
                <span className="ml-2 text-[11px] text-gray-300">{input.label}</span>
                {input.dataType && (
                  <span className="ml-auto text-[9px] text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">
                    {getTypeLabel(input.dataType)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Node Data Section - only show for fields without input ports */}
      {hasEditableData && (
        <div className="px-3 py-2 border-t border-white/5">
          {renderInlineEditor()}
        </div>
      )}

      {/* OUTPUTS Section */}
      {hasOutputs && (
        <div className="px-3 pt-1 pb-2 border-t border-white/5">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 text-right">Outputs</div>
          {node.outputs.map((output) => {
            const portColor = getPortColor(output.type, output.dataType);
            return (
              <div key={output.id} className="flex items-center justify-end py-1 relative">
                {output.dataType && (
                  <span className="mr-auto text-[9px] text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">
                    {getTypeLabel(output.dataType)}
                  </span>
                )}
                <span className="mr-2 text-[11px] text-gray-300">{output.label}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.id}
                  className="!border-2 !-right-[9px]"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: portColor,
                    borderColor: '#1e2328',
                    borderRadius: output.type === 'exec' ? '2px' : '50%',
                    clipPath: output.type === 'exec' ? 'polygon(0 0, 100% 50%, 0 100%)' : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
ScriptNodeComponent.displayName = 'ScriptNodeComponent';

// ============================================================================
// Comment Node Component
// ============================================================================

const COMMENT_COLORS = ['#6C7A89', '#E74C3C', '#E67E22', '#F1C40F', '#27AE60', '#3498DB', '#9B59B6', '#1ABC9C'];

const CommentNodeComponent = memo(({ data, selected }: NodeProps<Node<ScriptNodeData>>) => {
  const { scriptNode: node, onUpdate, onDelete, accentColor, nodeOpacity } = data;
  const commentText = typeof node.data.comment === 'string' ? node.data.comment : 'Comment';
  const commentColor = typeof node.data.commentColor === 'string' ? node.data.commentColor : '#374151';

  return (
    <>
      {/* NodeResizer - no callbacks, React Flow handles via onNodesChange dimensions */}
      <NodeResizer
        minWidth={150}
        minHeight={80}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!w-3 !h-3 !bg-white/60 !border-white/80 !rounded-sm"
      />
      
      {/* Group node container - uses 100% to fill the React Flow node dimensions */}
      <div
        className="w-full h-full rounded-lg select-none border-2 border-dashed overflow-hidden"
        style={{
          backgroundColor: `${commentColor}40`,
          borderColor: `${commentColor}80`,
          opacity: nodeOpacity / 100,
          boxShadow: selected
            ? `0 0 0 2px ${accentColor}`
            : undefined,
        }}
      >
        {/* Header bar with title input */}
        <div 
          className="flex items-center gap-2 px-3 py-2"
          style={{ backgroundColor: `${commentColor}60` }}
        >
          <input
            type="text"
            value={commentText}
            onChange={(e) => onUpdate({ data: { ...node.data, comment: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-transparent text-white text-sm font-semibold outline-none flex-1 min-w-0 nodrag"
            placeholder="Comment"
          />
          {selected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-0.5 hover:bg-black/20 rounded transition-colors nodrag"
            >
              <Trash2 size={12} className="text-white" />
            </button>
          )}
        </div>

        {/* Color picker - only shown when selected */}
        {selected && (
          <div className="absolute top-10 left-2 flex gap-1 z-10">
            {COMMENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ data: { ...node.data, commentColor: color } });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 nodrag ${color === commentColor ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    </>
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
  const [isHovered, setIsHovered] = useState(false);
  const strokeColor = data ? getLineColor(data.portType, data.dataType) : '#ffffff';
  const connectionStyle = data?.connectionStyle || 'bezier';
  const connectionAnimation = data?.connectionAnimation || 'none';

  // Generate unique gradient ID for glow effect
  const gradientId = `glow-gradient-${id}`;
  const animationId = `flow-animation-${id}`;

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

  // Animation-specific styles
  const getAnimationStyles = (): React.CSSProperties => {
    switch (connectionAnimation) {
      case 'flow':
        // Flow uses animated circles on path, not dash styling
        return {};
      case 'pulse':
        return {
          animation: 'pulseAnimation 1.5s ease-in-out infinite',
        };
      case 'dash':
        return {
          strokeDasharray: '8 4',
          animation: 'dashAnimation 0.5s linear infinite',
        };
      case 'glow':
        return {
          filter: `drop-shadow(0 0 3px ${strokeColor}) drop-shadow(0 0 6px ${strokeColor})`,
          animation: 'glowAnimation 2s ease-in-out infinite',
        };
      case 'none':
      default:
        return {};
    }
  };

  // Calculate path length for flow animation
  const pathLength = useMemo(() => {
    if (connectionAnimation !== 'flow') return 0;
    // Estimate path length
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    return Math.sqrt(dx * dx + dy * dy) * 1.5; // Rough estimate for curves
  }, [connectionAnimation, sourceX, sourceY, targetX, targetY]);

  return (
    <>
      {/* CSS for animations */}
      <style>
        {`
          @keyframes pulseAnimation {
            0%, 100% { opacity: 0.5; stroke-width: 2; }
            50% { opacity: 1; stroke-width: 3.5; }
          }
          @keyframes dashAnimation {
            from { stroke-dashoffset: 12; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes glowAnimation {
            0%, 100% { filter: drop-shadow(0 0 2px ${strokeColor}) drop-shadow(0 0 4px ${strokeColor}40); }
            50% { filter: drop-shadow(0 0 4px ${strokeColor}) drop-shadow(0 0 8px ${strokeColor}); }
          }
          @keyframes flowDotAnimation {
            0% { offset-distance: 0%; }
            100% { offset-distance: 100%; }
          }
        `}
      </style>
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        className="edge-drag-handle"
        data-edge-id={id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {/* Hover highlight effect */}
      {isHovered && !selected && (
        <path
          d={edgePath}
          stroke={strokeColor}
          strokeWidth={8}
          fill="none"
          style={{ opacity: 0.15, pointerEvents: 'none' }}
        />
      )}
      {/* Visible edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 3.5 : isHovered ? 3 : 2.5,
          filter: isHovered && !selected ? `drop-shadow(0 0 4px ${strokeColor}60)` : undefined,
          ...getAnimationStyles(),
          ...style,
        }}
      />
      {/* Flow animation - animated dots moving along the path */}
      {connectionAnimation === 'flow' && (
        <>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              r="3"
              fill={strokeColor}
              style={{
                offsetPath: `path("${edgePath}")`,
                animation: `flowDotAnimation 1.5s linear infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </>
      )}
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

interface ContextMenuState {
  x: number;
  y: number;
  type: 'canvas' | 'node' | 'nodes' | 'connection';
  nodeId?: string;
  nodeIds?: string[];
  connectionId?: string;
  canvasPos?: { x: number; y: number };
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
  connectionAnimation = 'none',
  isDev = false,
}: ReactFlowGraphProps) {
  const reactFlowInstance = useReactFlow();
  const [quickMenu, setQuickMenu] = useState<QuickMenuState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track which nodes are currently being dragged
  const draggingRef = useRef<Set<string>>(new Set());
  
  // Clipboard for copy/paste
  const clipboardRef = useRef<{ nodes: ScriptNode[]; connections: NodeConnection[] } | null>(null);
  
  // Debounce selection updates to reduce lag
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSelectionRef = useRef<string[] | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-context-menu]')) {
          setContextMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      // Delete selected nodes - Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0) {
        e.preventDefault();
        selectedNodeIds.forEach(id => onDeleteNode(id));
        onRequestHistorySnapshot?.();
        return;
      }

      // Select all - Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        onSelectNodes(scriptNodes.map(n => n.id));
        return;
      }

      // Copy - Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodeIds.length > 0) {
        e.preventDefault();
        const selectedNodes = scriptNodes.filter(n => selectedNodeIds.includes(n.id));
        const relatedConnections = connections.filter(
          c => selectedNodeIds.includes(c.from.nodeId) && selectedNodeIds.includes(c.to.nodeId)
        );
        clipboardRef.current = { nodes: selectedNodes, connections: relatedConnections };
        return;
      }

      // Cut - Ctrl/Cmd + X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedNodeIds.length > 0) {
        e.preventDefault();
        const selectedNodes = scriptNodes.filter(n => selectedNodeIds.includes(n.id));
        const relatedConnections = connections.filter(
          c => selectedNodeIds.includes(c.from.nodeId) && selectedNodeIds.includes(c.to.nodeId)
        );
        clipboardRef.current = { nodes: selectedNodes, connections: relatedConnections };
        // Delete the selected nodes
        selectedNodeIds.forEach(id => onDeleteNode(id));
        onRequestHistorySnapshot?.();
        return;
      }

      // Paste - Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        e.preventDefault();
        const clipboard = clipboardRef.current;
        const idMap = new Map<string, string>();
        const newNodes: ScriptNode[] = [];
        const offset = 50;

        // Create new nodes with new IDs and offset positions
        clipboard.nodes.forEach(node => {
          const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          idMap.set(node.id, newId);
          
          const newNode: ScriptNode = {
            ...node,
            id: newId,
            position: { x: node.position.x + offset, y: node.position.y + offset },
            inputs: node.inputs.map(input => ({ ...input })),
            outputs: node.outputs.map(output => ({ ...output })),
            data: { ...node.data },
          };
          newNodes.push(newNode);
          onAddNode(newNode);
        });

        // Recreate connections between pasted nodes
        clipboard.connections.forEach(conn => {
          const newFromId = idMap.get(conn.from.nodeId);
          const newToId = idMap.get(conn.to.nodeId);
          if (newFromId && newToId) {
            const newConnection: NodeConnection = {
              id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              from: { nodeId: newFromId, portId: conn.from.portId },
              to: { nodeId: newToId, portId: conn.to.portId },
            };
            onConnectProp(newConnection);
          }
        });

        // Select the newly pasted nodes
        onSelectNodes(newNodes.map(n => n.id));
        onRequestHistorySnapshot?.();
        return;
      }

      // Duplicate - Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedNodeIds.length > 0) {
        e.preventDefault();
        const selectedNodes = scriptNodes.filter(n => selectedNodeIds.includes(n.id));
        const relatedConnections = connections.filter(
          c => selectedNodeIds.includes(c.from.nodeId) && selectedNodeIds.includes(c.to.nodeId)
        );
        const idMap = new Map<string, string>();
        const newNodes: ScriptNode[] = [];
        const offset = 50;

        // Create duplicated nodes
        selectedNodes.forEach(node => {
          const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          idMap.set(node.id, newId);
          
          const newNode: ScriptNode = {
            ...node,
            id: newId,
            position: { x: node.position.x + offset, y: node.position.y + offset },
            inputs: node.inputs.map(input => ({ ...input })),
            outputs: node.outputs.map(output => ({ ...output })),
            data: { ...node.data },
          };
          newNodes.push(newNode);
          onAddNode(newNode);
        });

        // Recreate connections between duplicated nodes
        relatedConnections.forEach(conn => {
          const newFromId = idMap.get(conn.from.nodeId);
          const newToId = idMap.get(conn.to.nodeId);
          if (newFromId && newToId) {
            const newConnection: NodeConnection = {
              id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              from: { nodeId: newFromId, portId: conn.from.portId },
              to: { nodeId: newToId, portId: conn.to.portId },
            };
            onConnectProp(newConnection);
          }
        });

        // Select the duplicated nodes
        onSelectNodes(newNodes.map(n => n.id));
        onRequestHistorySnapshot?.();
        return;
      }

      // Focus on selected - F key
      if (e.key === 'f' && selectedNodeIds.length > 0) {
        e.preventDefault();
        const selectedNodes = scriptNodes.filter(n => selectedNodeIds.includes(n.id));
        if (selectedNodes.length > 0) {
          const bounds = selectedNodes.reduce(
            (acc, node) => ({
              minX: Math.min(acc.minX, node.position.x),
              minY: Math.min(acc.minY, node.position.y),
              maxX: Math.max(acc.maxX, node.position.x + 200),
              maxY: Math.max(acc.maxY, node.position.y + 100),
            }),
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
          );
          reactFlowInstance.fitBounds(
            { x: bounds.minX - 50, y: bounds.minY - 50, width: bounds.maxX - bounds.minX + 100, height: bounds.maxY - bounds.minY + 100 },
            { duration: 300 }
          );
        }
        return;
      }

      // Fit all nodes in view - Home key
      if (e.key === 'Home') {
        e.preventDefault();
        reactFlowInstance.fitView({ duration: 300, padding: 0.2 });
        return;
      }

      // Escape - deselect all
      if (e.key === 'Escape') {
        e.preventDefault();
        onSelectNodes([]);
        setQuickMenu(null);
        return;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, scriptNodes, connections, onDeleteNode, onSelectNodes, onAddNode, onConnectProp, onRequestHistorySnapshot, reactFlowInstance]);

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
      .map(conn => connectionToFlowEdge(conn, scriptNodes, connectionStyle, connectionAnimation))
      .filter((edge): edge is Edge<ScriptEdgeData> => edge !== null);
  }, [connections, scriptNodes, connectionStyle, connectionAnimation]);

  // Handle node selection changes - debounced to reduce lag during drag selection
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    const selectedIds = nodes.map(n => n.id);
    pendingSelectionRef.current = selectedIds;
    
    // Clear existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
    
    // Debounce the selection update
    selectionTimeoutRef.current = setTimeout(() => {
      if (pendingSelectionRef.current) {
        onSelectNodes(pendingSelectionRef.current);
        pendingSelectionRef.current = null;
      }
    }, 16); // ~1 frame at 60fps
  }, [onSelectNodes]);

  // Handle selection context menu (right-click on selection box or selected nodes)
  const onSelectionContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (selectedNodeIds.length > 0) {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'nodes',
        nodeIds: selectedNodeIds,
      });
    }
  }, [selectedNodeIds]);

  // Cleanup selection timeout
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  // Handle node position and dimension changes - apply changes for smooth dragging/resizing
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
      // Handle resize dimension changes (from NodeResizer)
      if (change.type === 'dimensions' && change.resizing === false && change.dimensions) {
        // Resize ended - sync dimensions to parent
        onUpdateNode(change.id, { 
          size: { width: change.dimensions.width, height: change.dimensions.height } 
        });
        onRequestHistorySnapshot?.();
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

  // Handle pane context menu (right-click on empty canvas)
  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'canvas',
      canvasPos: position,
    });
  }, [reactFlowInstance]);

  // Handle node context menu (right-click on node)
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    
    // If multiple nodes are selected and this node is one of them, show multi-node menu
    if (selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id)) {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'nodes',
        nodeIds: selectedNodeIds,
      });
    } else {
      // Single node - select it if not already selected
      if (!selectedNodeIds.includes(node.id)) {
        onSelectNodes([node.id]);
      }
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'node',
        nodeId: node.id,
      });
    }
  }, [selectedNodeIds, onSelectNodes]);

  // Handle edge context menu (right-click on connection)
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'connection',
      connectionId: edge.id,
    });
  }, []);

  // Handle double-click on edge to create reroute node
  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Get canvas position for the reroute node
    const canvasPos = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    // Find the original connection
    const connection = connections.find(c => c.id === edge.id);
    if (!connection) return;
    
    // Find the source port to get type info
    const fromNode = scriptNodes.find(n => n.id === connection.from.nodeId);
    const fromPort = fromNode?.outputs.find(p => p.id === connection.from.portId) ||
                     fromNode?.inputs.find(p => p.id === connection.from.portId);
    
    const isExec = fromPort?.type === 'exec';
    const dataType = fromPort?.dataType;
    
    // Create the reroute node
    const rerouteNode: ScriptNode = {
      id: `reroute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'reroute',
      category: 'flow',
      label: 'Reroute',
      position: {
        x: canvasPos.x - 18,
        y: canvasPos.y - 18,
      },
      data: {
        isExec,
      },
      inputs: [{
        id: 'input_0',
        label: 'In',
        type: isExec ? 'exec' : 'data',
        dataType: dataType,
        isInput: true,
      }],
      outputs: [{
        id: 'output_0',
        label: 'Out',
        type: isExec ? 'exec' : 'data',
        dataType: dataType,
        isInput: false,
      }],
    };
    
    // Delete the original connection
    onDeleteConnection?.(edge.id);
    
    // Add the reroute node
    onAddNode(rerouteNode);
    
    // Create connection from source to reroute
    const conn1: NodeConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: connection.from,
      to: { nodeId: rerouteNode.id, portId: 'input_0' },
    };
    onConnectProp(conn1);
    
    // Create connection from reroute to target
    const conn2: NodeConnection = {
      id: `conn_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
      from: { nodeId: rerouteNode.id, portId: 'output_0' },
      to: connection.to,
    };
    onConnectProp(conn2);
    
    onSelectNodes([rerouteNode.id]);
    onRequestHistorySnapshot?.();
  }, [reactFlowInstance, connections, scriptNodes, onDeleteConnection, onAddNode, onConnectProp, onSelectNodes, onRequestHistorySnapshot]);

  // Context menu action handlers
  const handleCopyNodes = useCallback((nodeIds: string[]) => {
    const selectedNodes = scriptNodes.filter(n => nodeIds.includes(n.id));
    const relatedConnections = connections.filter(
      c => nodeIds.includes(c.from.nodeId) && nodeIds.includes(c.to.nodeId)
    );
    clipboardRef.current = { nodes: selectedNodes, connections: relatedConnections };
    setContextMenu(null);
  }, [scriptNodes, connections]);

  const handleDeleteNodes = useCallback((nodeIds: string[]) => {
    nodeIds.forEach(id => onDeleteNode(id));
    onRequestHistorySnapshot?.();
    setContextMenu(null);
  }, [onDeleteNode, onRequestHistorySnapshot]);

  const handlePasteNodes = useCallback((canvasPos?: { x: number; y: number }) => {
    if (!clipboardRef.current) return;
    
    const clipboard = clipboardRef.current;
    const idMap = new Map<string, string>();
    const newNodes: ScriptNode[] = [];
    const basePos = canvasPos || { x: 100, y: 100 };

    // Find the min position of copied nodes to calculate offset
    const minX = Math.min(...clipboard.nodes.map(n => n.position.x));
    const minY = Math.min(...clipboard.nodes.map(n => n.position.y));

    clipboard.nodes.forEach(node => {
      const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
      
      const newNode: ScriptNode = {
        ...node,
        id: newId,
        position: { 
          x: basePos.x + (node.position.x - minX), 
          y: basePos.y + (node.position.y - minY) 
        },
        inputs: node.inputs.map(input => ({ ...input })),
        outputs: node.outputs.map(output => ({ ...output })),
        data: { ...node.data },
      };
      newNodes.push(newNode);
      onAddNode(newNode);
    });

    // Recreate connections between pasted nodes
    clipboard.connections.forEach(conn => {
      const newFromId = idMap.get(conn.from.nodeId);
      const newToId = idMap.get(conn.to.nodeId);
      if (newFromId && newToId) {
        const newConnection: NodeConnection = {
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from: { nodeId: newFromId, portId: conn.from.portId },
          to: { nodeId: newToId, portId: conn.to.portId },
        };
        onConnectProp(newConnection);
      }
    });

    onSelectNodes(newNodes.map(n => n.id));
    onRequestHistorySnapshot?.();
    setContextMenu(null);
  }, [onAddNode, onConnectProp, onSelectNodes, onRequestHistorySnapshot]);

  const handleBreakConnection = useCallback((connectionId: string) => {
    onDeleteConnection?.(connectionId);
    setContextMenu(null);
  }, [onDeleteConnection]);

  const handleOpenQuickMenu = useCallback((canvasPos: { x: number; y: number }, screenPos: { x: number; y: number }) => {
    setContextMenu(null);
    setQuickMenu({
      screenPosition: screenPos,
      canvasPosition: canvasPos,
    });
  }, []);

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
    <div 
      ref={containerRef}
      tabIndex={0}
      className="w-full h-full outline-none" 
      style={{ backgroundColor: theme === 'dark' ? '#1a1f28' : '#f5f5f5' }}
    >
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
        onSelectionContextMenu={onSelectionContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onMoveEnd={onMoveEnd}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        defaultEdgeOptions={{
          type: 'scriptEdge',
        }}
        fitView={false}
        minZoom={0.3}
        maxZoom={2.5}
        panOnDrag={[1]} // Middle mouse button only
        selectionOnDrag
        selectionKeyCode={null} // Allow selection without holding a key
        multiSelectionKeyCode="Shift" // Hold Shift to add to selection
        selectNodesOnDrag={false}
        selectionMode={SelectionMode.Partial} // Select nodes that are partially in the box
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          data-context-menu="true"
          className="fixed z-[1100] bg-[#1a1f28] border border-white/20 rounded-lg shadow-xl text-sm text-white min-w-[160px] py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {/* Canvas context menu */}
          {contextMenu.type === 'canvas' && (
            <>
              <button
                className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                onClick={() => contextMenu.canvasPos && handleOpenQuickMenu(contextMenu.canvasPos, { x: contextMenu.x, y: contextMenu.y })}
              >
                <span className="text-purple-400">+</span> Add Node
              </button>
              {clipboardRef.current && clipboardRef.current.nodes.length > 0 && (
                <button
                  className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                  onClick={() => handlePasteNodes(contextMenu.canvasPos)}
                >
                  Paste ({clipboardRef.current.nodes.length} node{clipboardRef.current.nodes.length > 1 ? 's' : ''})
                </button>
              )}
            </>
          )}

          {/* Single node context menu */}
          {contextMenu.type === 'node' && contextMenu.nodeId && (
            <>
              <button
                className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                onClick={() => handleCopyNodes([contextMenu.nodeId!])}
              >
                Copy
              </button>
              <button
                className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                onClick={() => {
                  handleCopyNodes([contextMenu.nodeId!]);
                  handleDeleteNodes([contextMenu.nodeId!]);
                }}
              >
                Cut
              </button>
              <button
                className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                onClick={() => {
                  // Duplicate node
                  const node = scriptNodes.find(n => n.id === contextMenu.nodeId);
                  if (node) {
                    const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const newNode: ScriptNode = {
                      ...node,
                      id: newId,
                      position: { x: node.position.x + 50, y: node.position.y + 50 },
                      inputs: node.inputs.map(input => ({ ...input })),
                      outputs: node.outputs.map(output => ({ ...output })),
                      data: { ...node.data },
                    };
                    onAddNode(newNode);
                    onSelectNodes([newId]);
                    onRequestHistorySnapshot?.();
                  }
                  setContextMenu(null);
                }}
              >
                Duplicate
              </button>
              <div className="border-t border-white/10 my-1" />
              <button
                className="px-3 py-2 hover:bg-red-500/20 w-full text-left flex items-center gap-2 text-red-400"
                onClick={() => handleDeleteNodes([contextMenu.nodeId!])}
              >
                Delete
              </button>
            </>
          )}

          {/* Multiple nodes context menu */}
          {contextMenu.type === 'nodes' && contextMenu.nodeIds && (
            <>
              <button
                className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                onClick={() => handleCopyNodes(contextMenu.nodeIds!)}
              >
                Copy {contextMenu.nodeIds.length} Nodes
              </button>
              <button
                className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                onClick={() => {
                  handleCopyNodes(contextMenu.nodeIds!);
                  handleDeleteNodes(contextMenu.nodeIds!);
                }}
              >
                Cut {contextMenu.nodeIds.length} Nodes
              </button>
              <div className="border-t border-white/10 my-1" />
              {onSaveAsTemplate && (
                <button
                  className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                  onClick={() => {
                    onSaveAsTemplate(contextMenu.nodeIds!);
                    setContextMenu(null);
                  }}
                >
                  Save as Template
                </button>
              )}
              <div className="border-t border-white/10 my-1" />
              <button
                className="px-3 py-2 hover:bg-red-500/20 w-full text-left flex items-center gap-2 text-red-400"
                onClick={() => handleDeleteNodes(contextMenu.nodeIds!)}
              >
                Delete {contextMenu.nodeIds.length} Nodes
              </button>
            </>
          )}

          {/* Connection context menu */}
          {contextMenu.type === 'connection' && contextMenu.connectionId && (
            <button
              className="px-3 py-2 hover:bg-red-500/20 w-full text-left flex items-center gap-2 text-red-400"
              onClick={() => handleBreakConnection(contextMenu.connectionId!)}
            >
              Break Connection
            </button>
          )}
        </div>
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
