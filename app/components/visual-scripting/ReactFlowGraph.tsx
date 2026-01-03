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
  useStoreApi,
  useEdges,
  useStore,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnConnect,
  OnConnectStart,
  NodeProps,
  EdgeProps,
  OnConnectEnd,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Trash2, Zap, GitBranch, Repeat, Timer, FunctionSquare, Circle, 
  Calculator, Move3D, Database, User, Crosshair, Sword, Terminal,
  Play, Settings, Box, ArrowRight, Layers, Hash, Type, ToggleLeft,
  Sparkles, Target, Shield, Activity, Code, Workflow, Split
} from 'lucide-react';
import type { ScriptNode, NodeConnection, NodeDataType, NodePort } from '../../types/visual-scripting';
import { getNodeDefinition } from '../../data/node-definitions';
import QuickNodeMenu from './QuickNodeMenu';
import CustomSelect from './CustomSelect';

// Material Design styles for React Flow controls and minimap
const reactFlowStyles = `
  .react-flow__controls {
    background: #1e1e1e;
    border: none;
    border-radius: 4px;
    box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12);
    overflow: hidden;
  }
  
  .react-flow__controls-button {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    width: 36px;
    height: 36px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .react-flow__controls-button:last-child {
    border-bottom: none;
  }
  
  .react-flow__controls-button:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .react-flow__controls-button:active {
    background: rgba(255, 255, 255, 0.12);
  }
  
  .react-flow__controls-button svg {
    fill: rgba(255, 255, 255, 0.7);
    width: 18px;
    height: 18px;
  }
  
  .react-flow__controls-button:hover svg {
    fill: rgba(255, 255, 255, 0.87);
  }
  
  .react-flow__minimap {
    background: #1e1e1e !important;
    border: none;
    border-radius: 4px;
    box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12);
    overflow: hidden;
  }
  
  .react-flow__minimap-mask {
    fill: rgba(0, 0, 0, 0.6);
  }
  
  .react-flow__minimap-node {
    fill-opacity: 0.9;
    stroke-width: 0;
    rx: 2;
    ry: 2;
  }
  
  /* Material Design selection box */
  .react-flow__selection {
    background: rgba(33, 150, 243, 0.08) !important;
    border: 1px solid rgba(33, 150, 243, 0.5) !important;
    border-radius: 4px;
    will-change: transform, width, height;
    transform: translateZ(0);
  }
  
  /* Hide ALL selection rectangles - the persistent one that appears after selection */
  .react-flow__nodesselection-rect,
  .react-flow__selection-rect,
  .react-flow__selectionbox,
  .react-flow__selectionpane {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
  }
  
  /* Hide selection rect in viewport */
  .react-flow__viewport .react-flow__selection-rect,
  .react-flow__viewport .react-flow__nodesselection-rect,
  .react-flow__viewport .react-flow__selectionbox,
  .react-flow__viewport .react-flow__selectionpane {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
  }
  
  /* Hide in selection pane */
  .react-flow__selectionpane .react-flow__selection-rect,
  .react-flow__selectionpane .react-flow__nodesselection-rect {
    display: none !important;
  }
  
  /* Crisp node rendering - prevent blur on zoom */
  .react-flow__node {
    transition: none !important;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    -webkit-font-smoothing: subpixel-antialiased;
  }
  
  .react-flow__node > div {
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* Force crisp text and edges in viewport */
  .react-flow__viewport {
    transform-style: preserve-3d;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  
  /* Smooth edge transitions */
  .react-flow__edge path {
    transition: stroke 0.2s cubic-bezier(0.4, 0, 0.2, 1), stroke-width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .react-flow__edge.selected path {
    stroke-width: 3px;
  }
  
  .react-flow__edge {
    pointer-events: visibleStroke !important;
  }
  
  /* Nodes need lower z-index than edges */
  .react-flow__nodes {
    z-index: 4 !important;
    transform: translateZ(0);
  }
  
  /* Selected/dragging nodes go above edges */
  .react-flow__node.selected,
  .react-flow__node.dragging {
    z-index: 10 !important;
  }
  
  /* Handle transitions - no movement, just glow */
  .react-flow__handle {
    transition: filter 0.15s ease-out !important;
    transform: translate(-50%, -50%) !important;
  }
  
  .react-flow__handle:hover {
    filter: brightness(1.4) drop-shadow(0 0 4px rgba(255,255,255,0.5));
    transform: translate(-50%, -50%) !important;
  }
  
  /* Ensure handles stay in place */
  .react-flow__handle-left {
    transform: translate(-50%, -50%) !important;
  }
  
  .react-flow__handle-right {
    transform: translate(50%, -50%) !important;
  }
  
  .react-flow__handle-left:hover,
  .react-flow__handle-right:hover {
    transform: translate(-50%, -50%) !important;
  }
  
  .react-flow__handle-right:hover {
    transform: translate(50%, -50%) !important;
  }
  
  /* Selection rectangle while dragging */
  .react-flow__selectionpane {
    will-change: transform;
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
  accentColor?: string;
  theme?: 'light' | 'dark';
  gridStyle?: 'dots' | 'lines' | 'cross';
  coloredGrid?: boolean;
  // Editor settings
  snapToGrid?: boolean;
  connectionAnimation?: 'none' | 'flow' | 'pulse' | 'dash' | 'glow';
  isDev?: boolean;
  // Minimap settings
  minimapWidth?: number;
  minimapHeight?: number;
  onMinimapResize?: (width: number, height: number) => void;
}

interface ScriptNodeData extends Record<string, unknown> {
  scriptNode: ScriptNode;
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
  if (portType === 'exec') return '#FFFFFF';

  // Material Design color palette
  const colorMap: Record<string, string> = {
    int: '#2196F3',      // Blue 500
    float: '#4CAF50',    // Green 500
    number: '#4CAF50',   // Green 500
    string: '#E91E63',   // Pink 500
    vector: '#26C6DA',   // Cyan 400 (softer on eyes)
    rotation: '#FF9800', // Orange 500
    boolean: '#F44336',  // Red 500
    entity: '#00BCD4',   // Cyan 500
    weapon: '#FFC107',   // Amber 500
    array: '#9C27B0',    // Purple 500
    table: '#3F51B5',    // Indigo 500
    asset: '#8BC34A',    // Light Green 500
    function: '#607D8B', // Blue Grey 500
    any: '#9E9E9E',      // Grey 500
  };

  return colorMap[dataType || 'any'] || '#9E9E9E';
};

const getPortColor = (portType: 'exec' | 'data', dataType?: NodeDataType): string => {
  if (portType === 'exec') return '#ffffff';
  return getLineColor(portType, dataType);
};

const getNodeColor = (type: string): string => {
  const definition = getNodeDefinition(type);
  return definition?.color || '#6B7280';
};

// Get dynamic node color based on output type
// Colors nodes by their data output type for easy visual identification
const getDynamicNodeColor = (node: ScriptNode, accentColor: string): string => {
  const definition = getNodeDefinition(node.type);
  
  // Function nodes (call-function, custom-function) use accent color
  // since they can have multiple outputs of different types
  if (node.type === 'call-function' || node.type === 'custom-function') {
    return accentColor;
  }
  
  // Get all data outputs
  const dataOutputs = node.outputs.filter(o => o.type === 'data');
  
  // If node has exactly one data output, color by that output's type
  // This covers: constants, get-portal, GetPlayerName, IsValid, IsPlayer, etc.
  if (dataOutputs.length === 1) {
    const output = dataOutputs[0];
    if (output.dataType && output.dataType !== 'any') {
      return getLineColor('data', output.dataType);
    }
  }
  
  return definition?.color || '#6B7280';
};

// Convert ScriptNode to React Flow Node
// Note: Selection is handled by React Flow internally via the `selected` prop passed to node components
const scriptNodeToFlowNode = (
  node: ScriptNode,
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
    zIndex: node.type === 'comment' ? -1000 : undefined, // Comments render behind everything
    data: {
      scriptNode: node,
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
        className={`w-4 h-4 border-2 cursor-crosshair ${
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
  const nodeColor = getDynamicNodeColor(node, accentColor);
  const edges = useEdges();
  
  // Check if a port is connected
  const isPortConnected = useCallback((portId: string, isInput: boolean) => {
    return edges.some(edge => 
      isInput 
        ? (edge.target === node.id && edge.targetHandle === portId)
        : (edge.source === node.id && edge.sourceHandle === portId)
    );
  }, [edges, node.id]);

  // Separate exec and data ports for Unreal-style layout
  const execInputs = node.inputs.filter(p => p.type === 'exec');
  const execOutputs = node.outputs.filter(p => p.type === 'exec');
  const dataInputs = node.inputs.filter(p => p.type !== 'exec');
  const dataOutputs = node.outputs.filter(p => p.type !== 'exec');

  // Detect callback-style nodes: have "Next" + another exec output (event trigger)
  // Split exec outputs into "flow" (Next/Then) and "event" (callback triggers)
  const isCallbackNode = execOutputs.length > 1 && 
    execOutputs.some(p => p.label === 'Next' || p.label === 'Then');
  
  // Primary exec outputs are Next/Then - these go in the top flow section
  const primaryExecOutputs = isCallbackNode 
    ? execOutputs.filter(p => p.label === 'Next' || p.label === 'Then')
    : execOutputs;
  
  // Event exec outputs are the callback triggers - these go with the data outputs
  const eventExecOutputs = isCallbackNode 
    ? execOutputs.filter(p => p.label !== 'Next' && p.label !== 'Then')
    : [];

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

  // Get node category subtitle
  const getNodeSubtitle = () => {
    if (node.type === 'vector-make') return 'Constant';
    if (node.type === 'vector-break') return 'Utilities';
    if (node.type.startsWith('event-')) return 'Event';
    if (node.type.startsWith('flow-')) return 'Flow Control';
    if (node.type.startsWith('action-')) return 'Action';
    if (node.type.startsWith('mod-')) return 'Mod';
    if (node.type.startsWith('const-')) return 'Constant';
    if (node.type.startsWith('math-')) return 'Math';
    if (node.type.startsWith('logic-')) return 'Logic';
    if (node.type.startsWith('call-')) return 'Function';
    if (node.type.startsWith('custom-')) return 'Custom';
    return 'Node';
  };

  // Get data type label for display - full names
  const getTypeLabel = (dataType?: string) => {
    if (!dataType) return '';
    const typeMap: Record<string, string> = {
      'number': 'Number',
      'string': 'String',
      'boolean': 'Boolean',
      'vector': 'Vector3',
      'entity': 'Entity',
      'weapon': 'Weapon',
      'player': 'Player',
      'any': 'Any',
      'array': 'Array',
      'object': 'Object',
      'function': 'Function',
      'void': 'Void',
      'float': 'Float',
      'int': 'Integer',
      'table': 'Table',
      'asset': 'Asset',
    };
    // Return mapped name or capitalize the dataType
    return typeMap[dataType] || dataType.charAt(0).toUpperCase() + dataType.slice(1);
  };

  // Inline editor for node data - Unreal style dark input boxes
  const renderInlineEditor = () => {
    // Unreal-style dark input with subtle border
    const inputClass = "w-full px-2 py-1.5 bg-black/40 rounded text-xs text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30";

    if (node.type === 'const-string') {
      const value = typeof node.data.value === 'string' ? node.data.value : '';
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdate({ data: { ...node.data, value: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className={inputClass}
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
          className={inputClass}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      );
    }

    if (node.type === 'const-bool') {
      const value = !!node.data.value;
      return (
        <label className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.06] rounded cursor-pointer hover:bg-white/[0.09] transition-all duration-200 border border-transparent hover:border-white/10">
          <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all duration-200 ${value ? 'bg-[#2196F3] shadow-[0_0_8px_rgba(33,150,243,0.4)]' : 'bg-white/10 border border-white/20'}`}>
            {value && <span className="text-white text-[10px] font-bold">✓</span>}
          </div>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onUpdate({ data: { ...node.data, value: e.target.checked } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="sr-only"
          />
          <span className="text-xs text-gray-200 font-medium">{value ? 'True' : 'False'}</span>
        </label>
      );
    }

    // const-vector is now replaced by vector-make (inline inputs handled in port rendering)

    // Call Function node - special handling for dynamic arguments
    if (node.type === 'call-function') {
      const functionName = typeof node.data.functionName === 'string' ? node.data.functionName : 'MyFunction';
      const returnType = typeof node.data.returnType === 'string' ? node.data.returnType : 'none';
      const returnTypes = ['none', 'entity', 'int', 'float', 'bool', 'string', 'vector', 'array', 'var'];
      const argCount = typeof node.data.argCount === 'number' ? node.data.argCount : 0;
      const threaded = typeof node.data.threaded === 'boolean' ? node.data.threaded : false;
      
      const addArg = () => {
        const newCount = argCount + 1;
        const newInputs = [...node.inputs, {
          id: `input_${newCount}`,
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
        // Keep exec input (0), remove last arg
        const newInputs = node.inputs.slice(0, 1 + newCount);
        onUpdate({
          data: { ...node.data, argCount: newCount },
          inputs: newInputs,
        });
      };
      
      const updateReturnType = (newReturnType: string) => {
        // Get the exec output (always first)
        const execOutput = node.outputs.find(o => o.type === 'exec') || node.outputs[0];
        
        if (newReturnType === 'none') {
          // Remove Return output, keep only exec
          onUpdate({
            data: { ...node.data, returnType: newReturnType },
            outputs: execOutput ? [execOutput] : [],
          });
        } else {
          // Check if Return output already exists
          const existingReturn = node.outputs.find(o => o.label === 'Return' || o.id === 'output_1');
          
          if (existingReturn) {
            // Update existing Return output's dataType
            const newOutputs = node.outputs.map(output => {
              if (output.label === 'Return' || output.id === 'output_1') {
                return { ...output, dataType: newReturnType as NodeDataType };
              }
              return output;
            });
            onUpdate({
              data: { ...node.data, returnType: newReturnType },
              outputs: newOutputs,
            });
          } else {
            // Add Return output
            const newOutputs = [
              ...(execOutput ? [execOutput] : []),
              {
                id: 'output_1',
                label: 'Return',
                type: 'data' as const,
                dataType: newReturnType as NodeDataType,
                isInput: false,
              },
            ];
            onUpdate({
              data: { ...node.data, returnType: newReturnType },
              outputs: newOutputs,
            });
          }
        }
      };

      return (
        <div className="flex flex-col gap-2.5">
          {/* Function name input */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Function Name</span>
            <input
              type="text"
              value={functionName}
              onChange={(e) => onUpdate({ data: { ...node.data, functionName: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="FunctionName"
              className={inputClass}
            />
          </div>
          {/* Return type row */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium w-14">Return</span>
            <CustomSelect
              value={returnType}
              options={returnTypes}
              onChange={(val) => updateReturnType(val)}
              size="sm"
              className="flex-1"
            />
          </div>
          {/* Args row with +/- buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium w-14">Args</span>
            <div className="flex-1 flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); removeArg(); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={argCount <= 0}
                className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.06] hover:bg-[#F44336]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-gray-400 hover:text-[#F44336] text-sm font-medium border border-transparent hover:border-[#F44336]/30"
              >
                −
              </button>
              <span className="w-8 text-center text-xs text-gray-200 tabular-nums font-medium">{argCount}</span>
              <button
                onClick={(e) => { e.stopPropagation(); addArg(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.06] hover:bg-[#4CAF50]/20 transition-all duration-200 text-gray-400 hover:text-[#4CAF50] text-sm font-medium border border-transparent hover:border-[#4CAF50]/30"
              >
                +
              </button>
            </div>
          </div>
          {/* Threaded checkbox - more compact */}
          <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white/[0.04] rounded-lg px-2 py-1.5 -mx-1 transition-all duration-200">
            <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all duration-200 ${threaded ? 'bg-[#2196F3] shadow-[0_0_8px_rgba(33,150,243,0.3)]' : 'bg-white/[0.08] border border-white/20'}`}>
              {threaded && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
            <input
              type="checkbox"
              checked={threaded}
              onChange={(e) => onUpdate({ data: { ...node.data, threaded: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="sr-only"
            />
            <span className="text-[11px] text-gray-300">Threaded</span>
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
        <div className="flex flex-col gap-2.5">
          {/* Function name input */}
          <input
            type="text"
            value={functionName}
            onChange={(e) => onUpdate({ data: { ...node.data, functionName: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Function name"
            className={inputClass}
          />
          {/* Return type row */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium w-12">Return</span>
            <CustomSelect
              value={returnType}
              options={returnTypes}
              onChange={(val) => onUpdate({ data: { ...node.data, returnType: val } })}
              size="sm"
              className="flex-1"
            />
          </div>
          {/* Parameters header with +/- */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Params</span>
            <div className="flex-1" />
            <button
              onClick={(e) => { e.stopPropagation(); removeParam(); }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={paramCount <= 0}
              className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.06] hover:bg-[#F44336]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-gray-400 hover:text-[#F44336] text-xs font-medium border border-transparent hover:border-[#F44336]/30"
            >
              −
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); addParam(); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.06] hover:bg-[#4CAF50]/20 transition-all duration-200 text-gray-400 hover:text-[#4CAF50] text-xs font-medium border border-transparent hover:border-[#4CAF50]/30"
            >
              +
            </button>
          </div>
          {/* Parameter list */}
          {paramCount > 0 && (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: paramCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={paramNames[i] || `param${i + 1}`}
                    onChange={(e) => updateParamName(i, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex-1 px-2 py-1.5 bg-black/40 rounded text-[11px] text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30 min-w-0"
                    placeholder={`param${i + 1}`}
                  />
                  <CustomSelect
                    value={paramTypes[i] || 'var'}
                    options={dataTypes}
                    onChange={(val) => updateParamType(i, val)}
                    size="sm"
                    className="w-20"
                  />
                </div>
              ))}
            </div>
          )}
          {/* Global checkbox - compact */}
          <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white/[0.04] rounded-lg px-2 py-1.5 -mx-1 transition-all duration-200">
            <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all duration-200 ${isGlobal ? 'bg-[#2196F3] shadow-[0_0_8px_rgba(33,150,243,0.3)]' : 'bg-white/[0.08] border border-white/20'}`}>
              {isGlobal && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => onUpdate({ data: { ...node.data, isGlobal: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="sr-only"
            />
            <span className="text-[11px] text-gray-300">Global</span>
          </label>
        </div>
      );
    }

    // Loot Tier selector
    if (node.type === 'const-loot-tier') {
      const value = typeof node.data.tier === 'string' ? node.data.tier : 'COMMON';
      const tierOptions = ['NONE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'HEIRLOOM'];
      return (
        <CustomSelect
          value={value}
          options={tierOptions}
          onChange={(val) => onUpdate({ data: { ...node.data, tier: val } })}
          size="md"
        />
      );
    }

    // Supported Attachments multi-select
    if (node.type === 'const-supported-attachments') {
      const options = ['barrel', 'mag', 'sight', 'grip', 'hopup'];
      const selected = Array.isArray(node.data.attachments) ? node.data.attachments : [];
      const toggle = (attachment: string, checked: boolean) => {
        const next = checked
          ? Array.from(new Set([...selected, attachment]))
          : selected.filter((item) => item !== attachment);
        onUpdate({ data: { ...node.data, attachments: next } });
      };
      return (
        <div className="grid grid-cols-2 gap-2">
          {options.map((attachment) => (
            <label 
              key={attachment} 
              className="flex items-center gap-2 px-2.5 py-2 bg-white/[0.06] rounded cursor-pointer hover:bg-white/[0.09] transition-all duration-200 border border-transparent hover:border-white/10"
            >
              <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center transition-all duration-200 ${selected.includes(attachment) ? 'bg-[#2196F3] shadow-[0_0_6px_rgba(33,150,243,0.3)]' : 'bg-white/[0.08] border border-white/20'}`}>
                {selected.includes(attachment) && <span className="text-white text-[8px] font-bold">✓</span>}
              </div>
              <input
                type="checkbox"
                checked={selected.includes(attachment)}
                onChange={(e) => toggle(attachment, e.target.checked)}
                onMouseDown={(e) => e.stopPropagation()}
                className="sr-only"
              />
              <span className="text-[10px] text-gray-200 capitalize font-medium">{attachment}</span>
            </label>
          ))}
        </div>
      );
    }

    // Weapon Type selector
    if (node.type === 'const-weapon-type') {
      const value = typeof node.data.weaponType === 'string' ? node.data.weaponType : 'pistol';
      const weaponOptions = [
        { value: 'assault', label: 'Assault' },
        { value: 'smg', label: 'SMG' },
        { value: 'lmg', label: 'LMG' },
        { value: 'sniper', label: 'Sniper' },
        { value: 'shotgun', label: 'Shotgun' },
        { value: 'pistol', label: 'Pistol' },
        { value: 'marksman', label: 'Marksman' },
        { value: 'bow', label: 'Bow' }
      ];
      return (
        <CustomSelect
          value={value}
          options={weaponOptions}
          onChange={(val) => onUpdate({ data: { ...node.data, weaponType: val } })}
          size="md"
        />
      );
    }

    // Weapon Slot selector
    if (node.type === 'const-weapon-slot') {
      const value = typeof node.data.slot === 'string' ? node.data.slot : 'WEAPON_INVENTORY_SLOT_PRIMARY_0';
      const slotOptions = [
        { value: 'WEAPON_INVENTORY_SLOT_PRIMARY_0', label: 'Primary 1' },
        { value: 'WEAPON_INVENTORY_SLOT_PRIMARY_1', label: 'Primary 2' },
        { value: 'WEAPON_INVENTORY_SLOT_PRIMARY_2', label: 'Primary 3' },
        { value: 'WEAPON_INVENTORY_SLOT_ANTI_TITAN', label: 'Anti-Titan' },
        { value: 'OFFHAND_TACTICAL', label: 'Tactical' },
        { value: 'OFFHAND_ULTIMATE', label: 'Ultimate' },
        { value: 'OFFHAND_SLOT_ACTIVE_ABILITY', label: 'Active Ability' },
        { value: 'OFFHAND_MELEE', label: 'Melee' },
        { value: 'OFFHAND_ORDNANCE', label: 'Ordnance' },
        { value: 'OFFHAND_INVENTORY', label: 'Inventory' },
      ];
      return (
        <CustomSelect
          value={value}
          options={slotOptions}
          onChange={(val) => onUpdate({ data: { ...node.data, slot: val } })}
          size="md"
        />
      );
    }

    // Weapon Attachment Mods multi-select
    if (node.type === 'const-weapon-mod') {
      const modCategories = [
        {
          name: 'Optics',
          mods: [
            { value: 'optic_cq_hcog_classic', label: 'x1 HCOG' },
            { value: 'optic_cq_hcog_bruiser', label: 'x2 Bruiser' },
            { value: 'optic_cq_holosight', label: 'x1 Holo' },
            { value: 'optic_cq_threat', label: 'x1 Threat' },
            { value: 'optic_cq_holosight_variable', label: 'x1-2 Holo' },
            { value: 'optic_ranged_hcog', label: 'x3 Ranger' },
            { value: 'optic_ranged_aog_variable', label: 'x2-4 AOG' },
            { value: 'optic_sniper', label: 'x6 Sniper' },
            { value: 'optic_sniper_variable', label: 'x4-8 Sniper' },
            { value: 'optic_sniper_threat', label: 'x4-10 Threat' },
          ]
        },
        {
          name: 'Barrel',
          mods: [
            { value: 'barrel_stabilizer_l1', label: 'Barrel L1' },
            { value: 'barrel_stabilizer_l2', label: 'Barrel L2' },
            { value: 'barrel_stabilizer_l3', label: 'Barrel L3' },
            { value: 'barrel_stabilizer_l4_flash_hider', label: 'Barrel L4' },
          ]
        },
        {
          name: 'Stock',
          mods: [
            { value: 'stock_tactical_l1', label: 'Tac L1' },
            { value: 'stock_tactical_l2', label: 'Tac L2' },
            { value: 'stock_tactical_l3', label: 'Tac L3' },
            { value: 'stock_sniper_l1', label: 'Sniper L1' },
            { value: 'stock_sniper_l2', label: 'Sniper L2' },
            { value: 'stock_sniper_l3', label: 'Sniper L3' },
          ]
        },
        {
          name: 'Magazine',
          mods: [
            { value: 'bullets_mag_l1', label: 'Light L1' },
            { value: 'bullets_mag_l2', label: 'Light L2' },
            { value: 'bullets_mag_l3', label: 'Light L3' },
            { value: 'highcal_mag_l1', label: 'Heavy L1' },
            { value: 'highcal_mag_l2', label: 'Heavy L2' },
            { value: 'highcal_mag_l3', label: 'Heavy L3' },
            { value: 'energy_mag_l1', label: 'Energy L1' },
            { value: 'energy_mag_l2', label: 'Energy L2' },
            { value: 'energy_mag_l3', label: 'Energy L3' },
            { value: 'sniper_mag_l1', label: 'Sniper L1' },
            { value: 'sniper_mag_l2', label: 'Sniper L2' },
            { value: 'sniper_mag_l3', label: 'Sniper L3' },
          ]
        },
        {
          name: 'Bolt',
          mods: [
            { value: 'shotgun_bolt_l1', label: 'Bolt L1' },
            { value: 'shotgun_bolt_l2', label: 'Bolt L2' },
            { value: 'shotgun_bolt_l3', label: 'Bolt L3' },
          ]
        },
        {
          name: 'Hop-Up',
          mods: [
            { value: 'hopup_turbocharger', label: 'Turbo' },
            { value: 'hopup_selectfire', label: 'Selectfire' },
            { value: 'hopup_energy_choke', label: 'Choke' },
            { value: 'hopup_unshielded_dmg', label: 'Hammer' },
            { value: 'hopup_highcal_rounds', label: 'Anvil' },
            { value: 'hopup_double_tap', label: 'Double Tap' },
          ]
        },
      ];
      const selected = Array.isArray(node.data.mods) ? node.data.mods : [];
      const toggle = (mod: string, checked: boolean) => {
        const next = checked
          ? Array.from(new Set([...selected, mod]))
          : selected.filter((item) => item !== mod);
        onUpdate({ data: { ...node.data, mods: next } });
      };
      return (
        <div 
          className="nowheel flex flex-col gap-2 max-h-[300px] overflow-y-auto"
        >
          {modCategories.map((category) => (
            <div key={category.name} className="flex flex-col gap-1">
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">{category.name}</span>
              <div className="grid grid-cols-2 gap-1">
                {category.mods.map((mod) => (
                  <label 
                    key={mod.value} 
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-white/[0.06] rounded cursor-pointer hover:bg-white/[0.09] transition-all duration-200 border border-transparent hover:border-white/10"
                  >
                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center transition-all duration-200 ${selected.includes(mod.value) ? 'bg-[#E67E22] shadow-[0_0_6px_rgba(230,126,34,0.3)]' : 'bg-white/[0.08] border border-white/20'}`}>
                      {selected.includes(mod.value) && <span className="text-white text-[7px] font-bold">✓</span>}
                    </div>
                    <input
                      type="checkbox"
                      checked={selected.includes(mod.value)}
                      onChange={(e) => toggle(mod.value, e.target.checked)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="sr-only"
                    />
                    <span className="text-[9px] text-gray-200 font-medium truncate">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Variable Declare node - type dropdown that updates input/output port types
    if (node.type === 'variable-declare') {
      const varName = typeof node.data.name === 'string' ? node.data.name : 'myVar';
      const varType = typeof node.data.varType === 'string' ? node.data.varType : 'var';
      
      const typeOptions = [
        { value: 'var', label: 'var (untyped)' },
        { value: 'int', label: 'int' },
        { value: 'float', label: 'float' },
        { value: 'bool', label: 'bool' },
        { value: 'string', label: 'string' },
        { value: 'vector', label: 'vector' },
        { value: 'entity', label: 'entity' },
        { value: 'array', label: 'array' },
        { value: 'table', label: 'table' },
        { value: 'asset', label: 'asset' },
      ];
      
      const updateVarType = (newType: string) => {
        // Map varType to dataType
        const dataType = (newType === 'var' ? 'any' : newType) as NodeDataType;
        
        // Update the Initial Value input port's dataType
        const newInputs = node.inputs.map(input => {
          if (input.label === 'Initial Value') {
            return { ...input, dataType };
          }
          return input;
        });
        
        // Update the Variable output port's dataType
        const newOutputs = node.outputs.map(output => {
          if (output.label === 'Variable') {
            return { ...output, dataType };
          }
          return output;
        });
        
        onUpdate({
          data: { ...node.data, varType: newType },
          inputs: newInputs,
          outputs: newOutputs,
        });
      };
      
      return (
        <div className="flex flex-col gap-2.5">
          {/* Variable name input */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">Name</span>
            <input
              type="text"
              value={varName}
              onChange={(e) => onUpdate({ data: { ...node.data, name: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 bg-black/40 rounded text-[11px] text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30"
              placeholder="Variable name..."
            />
          </div>
          {/* Variable type dropdown */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">Type</span>
            <CustomSelect
              value={varType}
              options={typeOptions}
              onChange={updateVarType}
              size="md"
            />
          </div>
        </div>
      );
    }

    // Variable Get node - name and type that determines output port type
    if (node.type === 'variable-get') {
      const varName = typeof node.data.name === 'string' ? node.data.name : 'myVar';
      const varType = typeof node.data.varType === 'string' ? node.data.varType : 'var';
      
      const typeOptions = [
        { value: 'var', label: 'var (untyped)' },
        { value: 'int', label: 'int' },
        { value: 'float', label: 'float' },
        { value: 'bool', label: 'bool' },
        { value: 'string', label: 'string' },
        { value: 'vector', label: 'vector' },
        { value: 'entity', label: 'entity' },
        { value: 'array', label: 'array' },
        { value: 'table', label: 'table' },
        { value: 'asset', label: 'asset' },
      ];
      
      const updateVarType = (newType: string) => {
        // Map varType to dataType
        const dataType = (newType === 'var' ? 'any' : newType) as NodeDataType;
        
        // Update the Value output port's dataType
        const newOutputs = node.outputs.map(output => {
          if (output.label === 'Value') {
            return { ...output, dataType };
          }
          return output;
        });
        
        onUpdate({
          data: { ...node.data, varType: newType },
          outputs: newOutputs,
        });
      };
      
      return (
        <div className="flex flex-col gap-2.5">
          {/* Variable name input */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">Name</span>
            <input
              type="text"
              value={varName}
              onChange={(e) => onUpdate({ data: { ...node.data, name: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 bg-black/40 rounded text-[11px] text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30"
              placeholder="Variable name..."
            />
          </div>
          {/* Variable type dropdown */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">Type</span>
            <CustomSelect
              value={varType}
              options={typeOptions}
              onChange={updateVarType}
              size="md"
            />
          </div>
        </div>
      );
    }

    // Variable Set node - name and type that determines input port type
    if (node.type === 'variable-set') {
      const varName = typeof node.data.name === 'string' ? node.data.name : 'myVar';
      const varType = typeof node.data.varType === 'string' ? node.data.varType : 'var';
      const inlineValue = typeof node.data.value === 'string' ? node.data.value : 
                          typeof node.data.value === 'number' ? String(node.data.value) : '';
      
      const typeOptions = [
        { value: 'var', label: 'var (untyped)' },
        { value: 'int', label: 'int' },
        { value: 'float', label: 'float' },
        { value: 'bool', label: 'bool' },
        { value: 'string', label: 'string' },
        { value: 'vector', label: 'vector' },
        { value: 'entity', label: 'entity' },
        { value: 'array', label: 'array' },
        { value: 'table', label: 'table' },
        { value: 'asset', label: 'asset' },
      ];
      
      const updateVarType = (newType: string) => {
        // Map varType to dataType
        const dataType = (newType === 'var' ? 'any' : newType) as NodeDataType;
        
        // Update the Value input port's dataType
        const newInputs = node.inputs.map(input => {
          if (input.label === 'Value') {
            return { ...input, dataType };
          }
          return input;
        });
        
        onUpdate({
          data: { ...node.data, varType: newType },
          inputs: newInputs,
        });
      };
      
      return (
        <div className="flex flex-col gap-2.5">
          {/* Variable name input */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">Name</span>
            <input
              type="text"
              value={varName}
              onChange={(e) => onUpdate({ data: { ...node.data, name: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 bg-black/40 rounded text-[11px] text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30"
              placeholder="Variable name..."
            />
          </div>
          {/* Variable type dropdown */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">Type</span>
            <CustomSelect
              value={varType}
              options={typeOptions}
              onChange={updateVarType}
              size="md"
            />
          </div>
          {/* Inline value (used when Value port is not connected) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">Default Value</span>
            <input
              type={varType === 'int' || varType === 'float' ? 'number' : 'text'}
              value={inlineValue}
              step={varType === 'float' ? '0.1' : '1'}
              onChange={(e) => onUpdate({ data: { ...node.data, value: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 bg-black/40 rounded text-[11px] text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30"
              placeholder="Value when not connected..."
            />
          </div>
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
        <div className="flex flex-col gap-2.5">
          {dataKeys.slice(0, 3).map((key) => {
            const value = node.data[key];
            const labelText = key.replace(/([A-Z])/g, ' $1').trim();

            if (typeof value === 'boolean') {
              return (
                <label key={key} className="flex items-center gap-2.5 px-2.5 py-2 bg-white/[0.06] rounded cursor-pointer hover:bg-white/[0.09] transition-all duration-200 border border-transparent hover:border-white/10">
                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all duration-200 ${value ? 'bg-[#2196F3] shadow-[0_0_8px_rgba(33,150,243,0.3)]' : 'bg-white/[0.08] border border-white/20'}`}>
                    {value && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: e.target.checked } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="sr-only"
                  />
                  <span className="text-[11px] text-gray-300 capitalize">{labelText}</span>
                </label>
              );
            }

            if (typeof value === 'number') {
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">{labelText}</span>
                  <input
                    type="number"
                    value={value}
                    step="0.1"
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: parseFloat(e.target.value) || 0 } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 bg-black/40 rounded text-[11px] text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>
              );
            }

            if (typeof value === 'string') {
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">{labelText}</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdate({ data: { ...node.data, [key]: e.target.value } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 bg-black/40 rounded text-[11px] text-gray-100 border border-white/10 outline-none transition-all duration-200 hover:bg-black/50 focus:bg-black/60 focus:border-white/30"
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
      // Hide functionName for callback nodes since it auto-generates
      if (key === 'functionName' && isCallbackNode) return false;
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

  // Calculate dynamic width based on content - adjusted for Unreal-style side-by-side layout
  const calculateNodeWidth = () => {
    const MIN_WIDTH = 220;
    const MAX_WIDTH = 480;
    const CHAR_WIDTH = 8; // Approximate width per character for 13px font
    const TYPE_CHAR_WIDTH = 6.5; // Smaller font for type labels
    const SIDE_PADDING = 56; // Padding for both handle areas
    const TYPE_BADGE_PADDING = 20; // Padding inside type badge
    const CENTER_GAP = 40; // Gap between left and right ports

    // Measure node label (header)
    const cleanLabel = node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '');
    const labelWidth = cleanLabel.length * CHAR_WIDTH + SIDE_PADDING + 50; // Extra for icon

    // For side-by-side layout, we need to measure the combined width of matching rows
    const maxPortRows = Math.max(dataInputs.length, dataOutputs.length);
    let maxRowWidth = 0;

    for (let i = 0; i < maxPortRows; i++) {
      const input = dataInputs[i];
      const output = dataOutputs[i];
      
      let leftWidth = 0;
      let rightWidth = 0;
      
      if (input) {
        leftWidth = input.label.length * CHAR_WIDTH;
        if (input.dataType) leftWidth += (getTypeLabel(input.dataType).length * TYPE_CHAR_WIDTH + TYPE_BADGE_PADDING);
      }
      
      if (output) {
        rightWidth = output.label.length * CHAR_WIDTH;
        if (output.dataType) rightWidth += (getTypeLabel(output.dataType).length * TYPE_CHAR_WIDTH + TYPE_BADGE_PADDING);
      }
      
      maxRowWidth = Math.max(maxRowWidth, leftWidth + rightWidth + CENTER_GAP + SIDE_PADDING);
    }

    // Special cases for nodes with inline editors
    let editorWidth = 0;
    if (node.type === 'custom-function') {
      editorWidth = 280;
    } else if (node.type === 'call-function') {
      editorWidth = 240;
    } else if (node.type === 'vector-make') {
      editorWidth = 280;
    } else if (node.type === 'const-supported-attachments') {
      editorWidth = 260;
    }

    const maxContentWidth = Math.max(
      labelWidth,
      maxRowWidth,
      editorWidth
    );

    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(maxContentWidth)));
  };

  const nodeWidth = calculateNodeWidth();
  const hasExecPorts = execInputs.length > 0 || execOutputs.length > 0;

  // Get node icon based on category/type - proper SVG icons
  const getNodeCategoryIcon = () => {
    const type = node.type;
    const iconProps = { size: 14, strokeWidth: 2 };
    
    // Event/callback nodes
    if (type.includes('init-') || type.includes('event-') || type.includes('callback') || type.startsWith('on-')) 
      return <Zap {...iconProps} />;
    
    // Flow control
    if (type.includes('branch') || type.includes('switch')) 
      return <GitBranch {...iconProps} />;
    if (type.includes('loop') || type.includes('sequence') || type.includes('foreach')) 
      return <Repeat {...iconProps} />;
    if (type.includes('delay') || type.includes('wait')) 
      return <Timer {...iconProps} />;
    
    // Functions
    if (type.includes('function') || type.includes('call-')) 
      return <FunctionSquare {...iconProps} />;
    if (type === 'custom-function') 
      return <Code {...iconProps} />;
    
    // Constants
    if (type === 'const-int' || type === 'const-float') 
      return <Hash {...iconProps} />;
    if (type === 'const-string') 
      return <Type {...iconProps} />;
    if (type === 'const-bool') 
      return <ToggleLeft {...iconProps} />;
    if (type.includes('const-')) 
      return <Circle {...iconProps} />;
    
    // Math
    if (type.includes('math-') || type.includes('add') || type.includes('multiply') || type.includes('subtract') || type.includes('divide')) 
      return <Calculator {...iconProps} />;
    
    // Vectors
    if (type === 'vector-make') 
      return <Move3D {...iconProps} />;
    if (type === 'vector-break') 
      return <Split {...iconProps} />;
    if (type.includes('vector')) 
      return <Move3D {...iconProps} />;
    
    // Entity/Player
    if (type.includes('player') || type.includes('entity')) 
      return <User {...iconProps} />;
    if (type.includes('spawn')) 
      return <Sparkles {...iconProps} />;
    
    // Combat
    if (type.includes('damage')) 
      return <Sword {...iconProps} />;
    if (type.includes('weapon')) 
      return <Crosshair {...iconProps} />;
    if (type.includes('shield') || type.includes('armor')) 
      return <Shield {...iconProps} />;
    
    // Getters/Setters
    if (type.includes('get-') || type.includes('set-')) 
      return <Database {...iconProps} />;
    
    // Debug
    if (type.includes('print') || type.includes('debug')) 
      return <Terminal {...iconProps} />;
    
    // Arrays/Collections
    if (type.includes('array') || type.includes('collection')) 
      return <Layers {...iconProps} />;
    
    // Portal/Flow
    if (type.includes('portal')) 
      return <Workflow {...iconProps} />;
    
    // Actions
    if (type.startsWith('action-')) 
      return <Play {...iconProps} />;
    
    // Mod nodes
    if (type.startsWith('mod-')) 
      return <Settings {...iconProps} />;
    
    // Default
    return <Box {...iconProps} />;
  };

  return (
    <div
      className="select-none overflow-visible"
      style={{
        minWidth: nodeWidth,
        width: nodeWidth,
        opacity: nodeOpacity / 100,
        backgroundColor: '#252525',
        borderRadius: '4px',
        border: selected ? `2px solid ${accentColor}` : '1px solid #3a3a3a',
        boxShadow: selected
          ? `0 0 20px ${accentColor}40, 0 8px 24px rgba(0,0,0,.5)`
          : '0 4px 16px rgba(0,0,0,.4), 0 2px 4px rgba(0,0,0,.2)',
        transition: 'box-shadow 0.15s ease-out, border 0.15s ease-out',
      }}
    >
      {/* Node Header - Unreal Blueprint style with colored top bar */}
      <div
        className="relative"
        style={{
          background: `linear-gradient(180deg, ${nodeColor} 0%, ${nodeColor}cc 100%)`,
          borderRadius: selected ? '2px 2px 0 0' : '3px 3px 0 0',
          borderBottom: '1px solid rgba(0,0,0,0.4)',
        }}
      >
        {/* Top accent line - Unreal style */}
        <div 
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ 
            backgroundColor: nodeColor,
            borderRadius: '3px 3px 0 0',
            filter: 'brightness(1.3)',
          }}
        />
        
        <div className="px-3 py-2.5 flex items-center gap-2.5 relative">
          {/* Category icon - Unreal style */}
          <div 
            className="w-6 h-6 rounded flex items-center justify-center text-sm shrink-0"
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.25)',
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {getNodeCategoryIcon()}
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[9px] text-white/50 uppercase tracking-wider font-medium leading-tight">
              {getNodeSubtitle()}
            </span>
            <span className="text-[13px] font-semibold text-white truncate leading-snug" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
            </span>
          </div>
          
          {selected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
            >
              <Trash2 size={14} className="text-white/80" />
            </button>
          )}
        </div>
      </div>

      {/* Exec Ports Row - Unreal Blueprint style (primary flow only) */}
      {hasExecPorts && (
        <div 
          className="flex justify-between items-start"
          style={{
            padding: '10px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {/* Exec Input(s) */}
          <div className="flex flex-col gap-2.5">
            {execInputs.map((input) => {
              const connected = isPortConnected(input.id, true);
              return (
                <div key={input.id} className="flex items-center relative h-5">
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={input.id}
                    className="!border-0"
                    style={{
                      width: '16px',
                      height: '16px',
                      background: 'transparent',
                      left: '-4px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" className="pointer-events-none" style={{ filter: connected ? 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' : 'none' }}>
                      <polygon 
                        points="1,1 15,8 1,15" 
                        fill={connected ? '#ffffff' : '#2a2a2a'}
                        stroke="#ffffff" 
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Handle>
                  {input.label !== 'Exec' && input.label !== 'In' && !(isCallbackNode && input.label === 'Register') && (
                    <span className="ml-6 text-[11px] text-gray-400 font-medium">{input.label}</span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Primary Exec Output(s) - Next/Then only for callback nodes */}
          <div className="flex flex-col gap-2.5">
            {primaryExecOutputs.map((output) => {
              const connected = isPortConnected(output.id, false);
              return (
                <div key={output.id} className="flex items-center justify-end relative h-5">
                  {output.label !== 'Exec' && output.label !== 'Then' && output.label !== 'Out' && !(isCallbackNode && output.label === 'Next') && (
                    <span className="mr-6 text-[11px] text-gray-300 font-medium">{output.label}</span>
                  )}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={output.id}
                    className="!border-0"
                    style={{
                      width: '16px',
                      height: '16px',
                      background: 'transparent',
                      right: '-4px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" className="pointer-events-none" style={{ filter: connected ? 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' : 'none' }}>
                      <polygon 
                        points="1,1 15,8 1,15" 
                        fill={connected ? '#ffffff' : '#2a2a2a'}
                        stroke="#ffffff" 
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Handle>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Callback Event Section - event exec + data outputs */}
      {isCallbackNode && (eventExecOutputs.length > 0 || dataOutputs.length > 0 || dataInputs.length > 0) && (
        <div style={{ padding: '8px 8px 10px 8px' }}>
          {/* Event exec output(s) first, then data outputs below */}
          {eventExecOutputs.map((output) => {
            const connected = isPortConnected(output.id, false);
            return (
              <div key={output.id} className="flex items-center justify-end relative h-5 mb-2">
                <span className="mr-6 text-[11px] text-gray-300 font-medium">On Event</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.id}
                  className="!border-0"
                  style={{
                    width: '16px',
                    height: '16px',
                    background: 'transparent',
                    right: '-4px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" className="pointer-events-none" style={{ filter: connected ? 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' : 'none' }}>
                    <polygon 
                      points="1,1 15,8 1,15" 
                      fill={connected ? '#ffffff' : '#2a2a2a'}
                      stroke="#ffffff" 
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Handle>
              </div>
            );
          })}
          
          {/* Data ports - side by side layout */}
          {Array.from({ length: Math.max(dataInputs.length, dataOutputs.length) }).map((_, rowIndex) => {
            const input = dataInputs[rowIndex];
            const output = dataOutputs[rowIndex];
            const inputConnected = input ? isPortConnected(input.id, true) : false;
            const outputConnected = output ? isPortConnected(output.id, false) : false;
            const inputPinColor = input ? getPortColor(input.type, input.dataType) : '#888';
            const outputPinColor = output ? getPortColor(output.type, output.dataType) : '#888';
            
            return (
              <div key={rowIndex} className="flex justify-between items-center py-1.5 min-h-[26px]">
                {/* Left side - Input */}
                <div className="flex items-center flex-1">
                  {input && (
                    <div className="flex items-center relative whitespace-nowrap">
                      <Handle
                        type="target"
                        position={Position.Left}
                        id={input.id}
                        className="!border-0"
                        style={{
                          width: '12px',
                          height: '12px',
                          background: 'transparent',
                          left: '-4px',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: inputConnected ? `drop-shadow(0 0 4px ${inputPinColor})` : 'none' }}>
                          <circle 
                            cx="6" cy="6" r="5"
                            fill={inputConnected ? inputPinColor : '#1a1a1a'}
                            stroke={inputPinColor}
                            strokeWidth="1.5"
                          />
                        </svg>
                      </Handle>
                      <span className="ml-6 text-[11px] text-gray-300 font-medium">{input.label}</span>
                      {input.dataType && input.dataType !== 'any' && (
                        <span 
                          className="ml-1.5 text-[9px] px-1 py-0.5 rounded font-medium"
                          style={{ 
                            color: inputPinColor,
                            backgroundColor: `${inputPinColor}18`,
                          }}
                        >
                          {getTypeLabel(input.dataType)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Right side - Output */}
                <div className="flex items-center justify-end flex-1">
                  {output && (
                    <div className="flex items-center relative whitespace-nowrap">
                      {output.dataType && output.dataType !== 'any' && (
                        <span 
                          className="mr-1.5 text-[9px] px-1 py-0.5 rounded font-medium"
                          style={{ 
                            color: outputPinColor,
                            backgroundColor: `${outputPinColor}18`,
                          }}
                        >
                          {getTypeLabel(output.dataType)}
                        </span>
                      )}
                      <span className="mr-6 text-[11px] text-gray-300 font-medium">{output.label}</span>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={output.id}
                        className="!border-0"
                        style={{
                          width: '12px',
                          height: '12px',
                          background: 'transparent',
                          right: '-4px',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: outputConnected ? `drop-shadow(0 0 4px ${outputPinColor})` : 'none' }}>
                          <circle 
                            cx="6" cy="6" r="5"
                            fill={outputConnected ? outputPinColor : '#1a1a1a'}
                            stroke={outputPinColor}
                            strokeWidth="1.5"
                          />
                        </svg>
                      </Handle>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vector Make - special layout with separate sections */}
      {!isCallbackNode && node.type === 'vector-make' && (
        <>
          {/* Output section */}
          <div 
            style={{ 
              padding: '8px 8px 8px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            {dataOutputs.map((output) => {
              const outputConnected = isPortConnected(output.id, false);
              const pinColor = getPortColor(output.type, output.dataType);
              return (
                <div key={output.id} className="flex justify-end items-center py-1 min-h-[24px]">
                  <div className="flex items-center relative whitespace-nowrap">
                    {output.dataType && output.dataType !== 'any' && (
                      <span 
                        className="mr-1.5 text-[9px] px-1 py-0.5 rounded font-medium"
                        style={{ 
                          color: pinColor,
                          backgroundColor: `${pinColor}18`,
                        }}
                      >
                        {getTypeLabel(output.dataType)}
                      </span>
                    )}
                    <span className="mr-6 text-[11px] text-gray-300 font-medium">{output.label}</span>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={output.id}
                      className="!border-0"
                      style={{
                        width: '12px',
                        height: '12px',
                        background: 'transparent',
                        right: '-4px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: outputConnected ? `drop-shadow(0 0 4px ${pinColor})` : 'none' }}>
                        <circle 
                          cx="6" cy="6" r="5"
                          fill={outputConnected ? pinColor : '#1a1a1a'}
                          stroke={pinColor}
                          strokeWidth="1.5"
                        />
                      </svg>
                    </Handle>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Input section with inline editors */}
          <div style={{ padding: '8px 8px 10px 8px' }}>
            {dataInputs.map((input) => {
              const inputConnected = isPortConnected(input.id, true);
              const inputDataKey = input.label.toLowerCase();
              const pinColor = getPortColor(input.type, input.dataType);
              return (
                <div key={input.id} className="flex items-center py-1 min-h-[24px]">
                  <div className="flex items-center relative whitespace-nowrap">
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={input.id}
                      className="!border-0"
                      style={{
                        width: '12px',
                        height: '12px',
                        background: 'transparent',
                        left: '-4px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: inputConnected ? `drop-shadow(0 0 4px ${pinColor})` : 'none' }}>
                        <circle 
                          cx="6" cy="6" r="5"
                          fill={inputConnected ? pinColor : '#1a1a1a'}
                          stroke={pinColor}
                          strokeWidth="1.5"
                        />
                      </svg>
                    </Handle>
                    <span className="ml-6 text-[11px] text-gray-300 font-medium">{input.label}</span>
                    {/* Show inline input when not connected */}
                    {!inputConnected && (
                      <input
                        type="number"
                        step="0.1"
                        value={typeof node.data[inputDataKey] === 'number' ? node.data[inputDataKey] : 0}
                        onChange={(e) => onUpdate({ data: { ...node.data, [inputDataKey]: parseFloat(e.target.value) || 0 } })}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                        className="ml-2 w-14 px-1.5 py-0.5 bg-black/50 text-[10px] text-center text-gray-100 rounded outline-none transition-all duration-200 hover:bg-black/60 focus:bg-black/70 border border-white/10 focus:border-white/30"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Vector Break - special layout with separate sections */}
      {!isCallbackNode && node.type === 'vector-break' && (
        <>
          {/* Input section */}
          <div 
            style={{ 
              padding: '8px 8px 8px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            {dataInputs.map((input) => {
              const inputConnected = isPortConnected(input.id, true);
              const pinColor = getPortColor(input.type, input.dataType);
              return (
                <div key={input.id} className="flex items-center py-1 min-h-[24px]">
                  <div className="flex items-center relative whitespace-nowrap">
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={input.id}
                      className="!border-0"
                      style={{
                        width: '12px',
                        height: '12px',
                        background: 'transparent',
                        left: '-4px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: inputConnected ? `drop-shadow(0 0 4px ${pinColor})` : 'none' }}>
                        <circle 
                          cx="6" cy="6" r="5"
                          fill={inputConnected ? pinColor : '#1a1a1a'}
                          stroke={pinColor}
                          strokeWidth="1.5"
                        />
                      </svg>
                    </Handle>
                    <span className="ml-6 text-[11px] text-gray-300 font-medium">{input.label}</span>
                    {input.dataType && input.dataType !== 'any' && (
                      <span 
                        className="ml-1.5 text-[9px] px-1 py-0.5 rounded font-medium"
                        style={{ 
                          color: pinColor,
                          backgroundColor: `${pinColor}18`,
                        }}
                      >
                        {getTypeLabel(input.dataType)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Output section */}
          <div style={{ padding: '8px 8px 10px 8px' }}>
            {dataOutputs.map((output) => {
              const outputConnected = isPortConnected(output.id, false);
              const pinColor = getPortColor(output.type, output.dataType);
              return (
                <div key={output.id} className="flex justify-end items-center py-1 min-h-[24px]">
                  <div className="flex items-center relative whitespace-nowrap">
                    <span className="mr-6 text-[11px] text-gray-300 font-medium">{output.label}</span>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={output.id}
                      className="!border-0"
                      style={{
                        width: '12px',
                        height: '12px',
                        background: 'transparent',
                        right: '-4px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: outputConnected ? `drop-shadow(0 0 4px ${pinColor})` : 'none' }}>
                        <circle 
                          cx="6" cy="6" r="5"
                          fill={outputConnected ? pinColor : '#1a1a1a'}
                          stroke={pinColor}
                          strokeWidth="1.5"
                        />
                      </svg>
                    </Handle>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Data Ports - Unreal Blueprint style side by side layout (for non-callback nodes, excluding vector nodes) */}
      {!isCallbackNode && node.type !== 'vector-make' && node.type !== 'vector-break' && (dataInputs.length > 0 || dataOutputs.length > 0) && (
        <div style={{ padding: '8px 8px 10px 8px' }}>
          {/* Default layout: Render rows with inputs on left, outputs on right - Unreal style */}
          {(Array.from({ length: Math.max(dataInputs.length, dataOutputs.length) }).map((_, rowIndex) => {
              const input = dataInputs[rowIndex];
              const output = dataOutputs[rowIndex];
              const inputConnected = input ? isPortConnected(input.id, true) : false;
              const outputConnected = output ? isPortConnected(output.id, false) : false;
              const inputPinColor = input ? getPortColor(input.type, input.dataType) : '#888';
              const outputPinColor = output ? getPortColor(output.type, output.dataType) : '#888';
              
              return (
                <div key={rowIndex} className="flex justify-between items-center py-1.5 min-h-[26px]">
                  {/* Left side - Input */}
                  <div className="flex items-center flex-1">
                    {input && (
                      <div className="flex items-center relative whitespace-nowrap">
                        <Handle
                          type="target"
                          position={Position.Left}
                          id={input.id}
                          className="!border-0"
                          style={{
                            width: '12px',
                            height: '12px',
                            background: 'transparent',
                            left: '-4px',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: inputConnected ? `drop-shadow(0 0 4px ${inputPinColor})` : 'none' }}>
                            <circle 
                              cx="6" cy="6" r="5"
                              fill={inputConnected ? inputPinColor : '#1a1a1a'}
                              stroke={inputPinColor}
                              strokeWidth="1.5"
                            />
                          </svg>
                        </Handle>
                        <span className="ml-6 text-[11px] text-gray-300 font-medium">{input.label}</span>
                        {input.dataType && input.dataType !== 'any' && (
                          <span 
                            className="ml-1.5 text-[9px] px-1 py-0.5 rounded font-medium"
                            style={{ 
                              color: inputPinColor,
                              backgroundColor: `${inputPinColor}18`,
                            }}
                          >
                            {getTypeLabel(input.dataType)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Right side - Output */}
                  <div className="flex items-center justify-end flex-1">
                    {output && (
                      <div className="flex items-center relative whitespace-nowrap">
                        {output.dataType && output.dataType !== 'any' && (
                          <span 
                            className="mr-1.5 text-[9px] px-1 py-0.5 rounded font-medium"
                            style={{ 
                              color: outputPinColor,
                              backgroundColor: `${outputPinColor}18`,
                            }}
                          >
                            {getTypeLabel(output.dataType)}
                          </span>
                        )}
                        <span className="mr-6 text-[11px] text-gray-300 font-medium">{output.label}</span>
                        <Handle
                          type="source"
                          position={Position.Right}
                          id={output.id}
                          className="!border-0"
                          style={{
                            width: '12px',
                            height: '12px',
                            background: 'transparent',
                            right: '-4px',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: outputConnected ? `drop-shadow(0 0 4px ${outputPinColor})` : 'none' }}>
                            <circle 
                              cx="6" cy="6" r="5"
                              fill={outputConnected ? outputPinColor : '#1a1a1a'}
                              stroke={outputPinColor}
                              strokeWidth="1.5"
                            />
                          </svg>
                        </Handle>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Node Data Section - Unreal style inline editors */}
      {hasEditableData && (
        <div 
          style={{ 
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          {renderInlineEditor()}
        </div>
      )}
    </div>
  );
});
ScriptNodeComponent.displayName = 'ScriptNodeComponent';

// ============================================================================
// Comment Node Component (Material Design Style)
// ============================================================================

// Material design color palette
const COMMENT_COLORS = [
  '#455A64', // Blue Grey
  '#D32F2F', // Red
  '#F57C00', // Orange  
  '#FBC02D', // Yellow
  '#388E3C', // Green
  '#1976D2', // Blue
  '#7B1FA2', // Purple
  '#00796B', // Teal
];

const CommentNodeComponent = memo(({ data, selected }: NodeProps<Node<ScriptNodeData>>) => {
  const { scriptNode: node, onUpdate, onDelete, accentColor, nodeOpacity } = data;
  const commentText = typeof node.data.comment === 'string' ? node.data.comment : 'Comment';
  const commentColor = typeof node.data.commentColor === 'string' ? node.data.commentColor : '#455A64';

  return (
    <>
      {/* NodeResizer - no callbacks, React Flow handles via onNodesChange dimensions */}
      <NodeResizer
        minWidth={150}
        minHeight={80}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border-0 !rounded-full !shadow-md"
      />
      
      {/* Material card container */}
      <div
        className="w-full h-full rounded-md select-none overflow-hidden"
        style={{
          backgroundColor: `${commentColor}15`,
          opacity: nodeOpacity / 100,
          boxShadow: selected
            ? `0 8px 16px rgba(0,0,0,0.2), 0 0 0 2px ${commentColor}`
            : '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          border: `1px solid ${commentColor}30`,
        }}
      >
        {/* Material header bar */}
        <div 
          className="flex items-center gap-2 px-3 py-2 relative"
          style={{ 
            backgroundColor: commentColor,
            borderBottom: `1px solid ${commentColor}`,
          }}
        >
          <input
            type="text"
            value={commentText}
            onChange={(e) => onUpdate({ data: { ...node.data, comment: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-transparent text-white text-sm font-medium outline-none flex-1 min-w-0 nodrag placeholder:text-white/60 pr-6"
            placeholder="Comment"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          />
          {selected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors nodrag"
            >
              <Trash2 size={14} className="text-white/90" />
            </button>
          )}
        </div>

        {/* Color picker chips - Material style */}
        {selected && (
          <div className="absolute top-11 left-2 flex gap-1.5 p-1.5 bg-gray-900/90 rounded-lg shadow-lg z-10 backdrop-blur-sm">
            {COMMENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ data: { ...node.data, commentColor: color } });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`w-5 h-5 rounded-full transition-all duration-150 nodrag ${
                  color === commentColor 
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' 
                    : 'hover:scale-110 hover:shadow-md'
                }`}
                style={{ 
                  backgroundColor: color,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
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
// Reroute Node Component - Clean pill-shaped design
// ============================================================================

const RerouteNodeComponent = memo(({ data, selected }: NodeProps<Node<ScriptNodeData>>) => {
  const { scriptNode: node, accentColor, nodeOpacity } = data;
  const isExec = node.data.isExec === true;
  const dataType = node.inputs[0]?.dataType;
  const color = isExec ? '#ffffff' : getPortColor('data', dataType);
  
  // Use store selector for stable edge connection check - avoids re-renders on unrelated edge changes
  const { isInputConnected, isOutputConnected } = useStore(
    useCallback((state) => ({
      isInputConnected: state.edges.some(e => e.target === node.id),
      isOutputConnected: state.edges.some(e => e.source === node.id),
    }), [node.id]),
    (a, b) => a.isInputConnected === b.isInputConnected && a.isOutputConnected === b.isOutputConnected
  );
  const isConnected = isInputConnected || isOutputConnected;

  return (
    <div
      className="flex items-center"
      style={{
        opacity: nodeOpacity / 100,
      }}
    >
      {/* Main reroute body - pill shaped */}
      <div 
        style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
          padding: '4px 8px',
          backgroundColor: '#252525',
          borderRadius: '12px',
          border: selected ? `2px solid ${accentColor}` : '1px solid #3a3a3a',
          boxShadow: selected 
            ? `0 0 12px ${accentColor}40, 0 4px 12px rgba(0,0,0,0.4)` 
            : '0 2px 8px rgba(0,0,0,0.4)',
          transition: 'all 0.15s ease-out',
          cursor: 'grab',
        }}
      >
        {/* Input pin */}
        <div className="relative flex items-center justify-center" style={{ width: '12px', height: '12px' }}>
          <Handle
            type="target"
            position={Position.Left}
            id={node.inputs[0]?.id || 'input_0'}
            className="!border-0"
            style={{
              width: '12px',
              height: '12px',
              background: 'transparent',
              left: '-4px',
            }}
          >
            {isExec ? (
              <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none">
                <polygon 
                  points="1,1 11,6 1,11" 
                  fill={isInputConnected ? '#ffffff' : '#2a2a2a'}
                  stroke="#ffffff" 
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: isInputConnected ? `drop-shadow(0 0 4px ${color})` : 'none' }}>
                <circle 
                  cx="6" cy="6" r="5"
                  fill={isInputConnected ? color : '#1a1a1a'}
                  stroke={color}
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </Handle>
        </div>

        {/* Center line connector */}
        <div 
          style={{ 
            width: '16px',
            height: '2px',
            backgroundColor: isConnected ? color : '#444',
            borderRadius: '1px',
          }}
        />

        {/* Output pin */}
        <div className="relative flex items-center justify-center" style={{ width: '12px', height: '12px' }}>
          <Handle
            type="source"
            position={Position.Right}
            id={node.outputs[0]?.id || 'output_0'}
            className="!border-0"
            style={{
              width: '12px',
              height: '12px',
              background: 'transparent',
              right: '-4px',
            }}
          >
            {isExec ? (
              <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none">
                <polygon 
                  points="1,1 11,6 1,11" 
                  fill={isOutputConnected ? '#ffffff' : '#2a2a2a'}
                  stroke="#ffffff" 
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none" style={{ filter: isOutputConnected ? `drop-shadow(0 0 4px ${color})` : 'none' }}>
                <circle 
                  cx="6" cy="6" r="5"
                  fill={isOutputConnected ? color : '#1a1a1a'}
                  stroke={color}
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </Handle>
        </div>
      </div>
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

  // Animation class based on connection animation type - using classes prevents animation restart
  const getAnimationClass = (): string => {
    switch (connectionAnimation) {
      case 'pulse': return 'edge-animation-pulse';
      case 'dash': return 'edge-animation-dash';
      case 'glow': return 'edge-animation-glow';
      case 'flow': // Flow uses animated circles, not edge styling
      case 'none':
      default:
        return '';
    }
  };

  // Glow filter for glow animation
  const glowFilter = connectionAnimation === 'glow' 
    ? `drop-shadow(0 0 3px ${strokeColor}) drop-shadow(0 0 6px ${strokeColor})`
    : undefined;

  return (
    <>
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
      {/* Hover highlight effect - Unreal style glow */}
      {isHovered && !selected && (
        <path
          d={edgePath}
          stroke={strokeColor}
          strokeWidth={10}
          fill="none"
          style={{ opacity: 0.12, pointerEvents: 'none' }}
        />
      )}
      {/* Visible edge - Unreal Blueprint style thicker wire */}
      <BaseEdge
        id={id}
        path={edgePath}
        className={getAnimationClass()}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 4 : isHovered ? 3.5 : 3,
          filter: glowFilter || ((isHovered || selected) ? `drop-shadow(0 0 6px ${strokeColor}80)` : `drop-shadow(0 0 2px ${strokeColor}40)`),
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
              className={`flow-dot flow-dot-${i}`}
              style={{
                offsetPath: `path("${edgePath}")`,
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
  containerOffset?: { left: number; top: number };
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
  accentColor = '#8B5CF6',
  theme = 'dark',
  gridStyle = 'dots',
  coloredGrid = false,
  snapToGrid = false,
  connectionAnimation = 'none',
  isDev = false,
  minimapWidth = 320,
  minimapHeight = 260,
  onMinimapResize,
}: ReactFlowGraphProps) {
  const reactFlowInstance = useReactFlow();
  const [quickMenu, setQuickMenu] = useState<QuickMenuState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Minimap resize state
  const [localMinimapSize, setLocalMinimapSize] = useState({ width: minimapWidth, height: minimapHeight });
  const minimapResizing = useRef(false);
  const minimapResizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Sync local minimap size with props
  useEffect(() => {
    setLocalMinimapSize({ width: minimapWidth, height: minimapHeight });
  }, [minimapWidth, minimapHeight]);
  
  // Track which nodes are currently being dragged
  const draggingRef = useRef<Set<string>>(new Set());
  
  // Clipboard for copy/paste
  const clipboardRef = useRef<{ nodes: ScriptNode[]; connections: NodeConnection[] } | null>(null);
  
  // Debounce selection updates to reduce lag
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSelectionRef = useRef<string[] | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const activeConnectRef = useRef<{
    nodeId: string;
    portId: string;
    isInput: boolean;
    portType: 'exec' | 'data';
    dataType?: NodeDataType;
  } | null>(null);
  const suppressQuickMenuRef = useRef(false);
  const store = useStoreApi();

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

  const addNodeByType = useCallback((nodeType: string) => {
    const definition = getNodeDefinition(nodeType);
    const container = containerRef.current;
    if (!definition || !container) return;

    const rect = container.getBoundingClientRect();
    const mousePos = lastMousePosRef.current;
    const anchorPos = mousePos
      ? reactFlowInstance.screenToFlowPosition({ x: mousePos.x, y: mousePos.y })
      : reactFlowInstance.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

    const defaultWidth = 200;
    const defaultHeight = 100;
    const sourcePort = activeConnectRef.current;
    const preSnapPos = sourcePort
      ? {
        x: sourcePort.isInput ? anchorPos.x - defaultWidth : anchorPos.x,
        y: anchorPos.y - defaultHeight / 2,
      }
      : {
        x: anchorPos.x - 90,
        y: anchorPos.y - 30,
      };

    const snappedPos = snapToGrid ? {
      x: Math.round(preSnapPos.x / gridSize) * gridSize,
      y: Math.round(preSnapPos.y / gridSize) * gridSize,
    } : preSnapPos;

    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode: ScriptNode = {
      id: newNodeId,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position: snappedPos,
      data: { ...definition.defaultData },
      inputs: definition.inputs.map((input, idx) => ({
        id: `input_${idx}`,
        label: input.label,
        type: input.type,
        dataType: input.dataType,
        isInput: true,
        ...('defaultValue' in input && { defaultValue: (input as Record<string, unknown>).defaultValue }),
        ...('options' in input && { options: (input as Record<string, unknown>).options }),
      })),
      outputs: definition.outputs.map((output, idx) => ({
        id: `output_${idx}`,
        label: output.label,
        type: output.type,
        dataType: output.dataType,
        elementType: (output as { elementType?: NodeDataType }).elementType,
        isInput: false,
      })),
    };

    setDroppingNodeId(newNodeId);
    setTimeout(() => setDroppingNodeId(null), 300);

    onAddNode(newNode);

    if (sourcePort) {
      const targetPorts = sourcePort.isInput ? newNode.outputs : newNode.inputs;
      const matchIndex = targetPorts.findIndex(port => {
        if (port.type !== sourcePort.portType) return false;
        if (port.type === 'exec') return true;
        if (!sourcePort.dataType || !port.dataType) return true;
        return port.dataType === sourcePort.dataType || port.dataType === 'any' || port.dataType === 'var' || sourcePort.dataType === 'any' || sourcePort.dataType === 'var';
      });
      const targetPort = targetPorts[matchIndex >= 0 ? matchIndex : 0];
      if (targetPort) {
        const connection: NodeConnection = {
          id: `conn_${Date.now()}`,
          from: sourcePort.isInput
            ? { nodeId: newNodeId, portId: targetPort.id }
            : { nodeId: sourcePort.nodeId, portId: sourcePort.portId },
          to: sourcePort.isInput
            ? { nodeId: sourcePort.nodeId, portId: sourcePort.portId }
            : { nodeId: newNodeId, portId: targetPort.id },
        };
        onConnectProp(connection);
      }
      activeConnectRef.current = null;
      suppressQuickMenuRef.current = true;
      store.getState().cancelConnection();
    }

    onSelectNodes([newNodeId]);
    onRequestHistorySnapshot?.();
  }, [reactFlowInstance, snapToGrid, gridSize, onAddNode, onSelectNodes, onConnectProp, onRequestHistorySnapshot, store]);

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

      const plainKey = !e.ctrlKey && !e.metaKey && !e.altKey;
      const keyLower = e.key.toLowerCase();
      if (plainKey) {
        if (keyLower === 'r') {
          e.preventDefault();
          addNodeByType('reroute');
          return;
        }
        if (keyLower === 'b') {
          e.preventDefault();
          addNodeByType('branch');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          addNodeByType('vector-make');
          return;
        }
        if (e.key === '1') {
          e.preventDefault();
          addNodeByType('const-int');
          return;
        }
      }
      
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
  }, [selectedNodeIds, scriptNodes, connections, onDeleteNode, onSelectNodes, onAddNode, onConnectProp, onRequestHistorySnapshot, reactFlowInstance, addNodeByType]);

  // Convert script nodes to React Flow nodes - memoized base conversion
  // Note: Selection is NOT included here - React Flow handles it internally via onSelectionChange
  const baseFlowNodes = useMemo<Node<ScriptNodeData>[]>(() => {
    return scriptNodes.map(node => 
      scriptNodeToFlowNode(
        node,
        onUpdateNode,
        onDeleteNode,
        accentColor,
        nodeOpacity
      )
    );
  }, [scriptNodes, onUpdateNode, onDeleteNode, accentColor, nodeOpacity]);

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

  // Remove persistent selection rectangle after selection completes
  useEffect(() => {
    const removeSelectionRect = () => {
      // Remove all selection rectangle elements
      const selectionRects = document.querySelectorAll('.react-flow__nodesselection-rect, .react-flow__selection-rect, .react-flow__selectionbox');
      selectionRects.forEach(rect => {
        rect.remove();
      });
    };

    // Remove on selection change
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && (
              node.classList.contains('react-flow__nodesselection-rect') ||
              node.classList.contains('react-flow__selection-rect') ||
              node.classList.contains('react-flow__selectionbox')
            )) {
              // Immediately hide it
              node.style.display = 'none';
              node.style.opacity = '0';
              node.style.visibility = 'hidden';
              node.style.pointerEvents = 'none';
            }
          });
        }
      });
    });

    // Start observing the document body for selection rectangle elements
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Periodically remove any selection rectangles that appear
    const interval = setInterval(removeSelectionRect, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

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

  const onConnectStart: OnConnectStart = useCallback((event, params) => {
    const nodeId = params.nodeId;
    const handleId = params.handleId;
    const handleType = params.handleType;
    if (!nodeId || !handleId || !handleType) return;

    const sourceNode = scriptNodes.find(n => n.id === nodeId);
    if (!sourceNode) return;
    const isOutput = handleType === 'source';
    const portList = isOutput ? sourceNode.outputs : sourceNode.inputs;
    const port = portList.find(p => p.id === handleId);
    if (!port) return;

    activeConnectRef.current = {
      nodeId: sourceNode.id,
      portId: port.id,
      isInput: !isOutput,
      portType: port.type,
      dataType: port.dataType,
    };
  }, [scriptNodes]);

  // Handle edge deletion
  const onEdgesDelete = useCallback((edges: Edge[]) => {
    edges.forEach(edge => {
      onDeleteConnection?.(edge.id);
    });
  }, [onDeleteConnection]);

  // Handle dropping connection on empty space - show quick menu
  const onConnectEnd: OnConnectEnd = useCallback((event, connectionState) => {
    if (suppressQuickMenuRef.current) {
      suppressQuickMenuRef.current = false;
      activeConnectRef.current = null;
      return;
    }
    if (!connectionState.fromNode || !connectionState.fromHandle) return;

    // If a valid connection was made to another node, don't show quick menu
    if (connectionState.toNode || connectionState.toHandle) {
      activeConnectRef.current = null;
      return;
    }

    // Get mouse position
    const clientX = 'clientX' in event ? event.clientX : (event as TouchEvent).touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : (event as TouchEvent).touches[0].clientY;

    // Check if we dropped on a valid target (fallback check)
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
    activeConnectRef.current = null;
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
      // Don't pass containerOffset - screenPosition is already correct for context menu positioning
      // containerOffset is only needed for drag-drop operations from palette
      containerOffset: undefined,
    });
  }, []);

  // Drag state for drop animations (from palette)
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropPreviewPos, setDropPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [droppingNodeId, setDroppingNodeId] = useState<string | null>(null);
  
  // Drag state for node movement within graph (comment container tracking)
  
  // Track nodes contained within a dragged comment (stores offsets from comment position)
  const commentContainedNodesRef = useRef<{ nodeId: string; offsetX: number; offsetY: number }[]>([]);
  const draggingCommentIdRef = useRef<string | null>(null);
  
  // Get nodes that are inside a comment's bounds
  const getNodesInsideComment = useCallback((commentNode: Node<ScriptNodeData>, allNodes: Node<ScriptNodeData>[]) => {
    const commentPos = commentNode.position;
    const commentWidth = commentNode.measured?.width ?? commentNode.width ?? 200;
    const commentHeight = commentNode.measured?.height ?? commentNode.height ?? 100;
    
    const containedNodes: { nodeId: string; offsetX: number; offsetY: number }[] = [];
    
    allNodes.forEach(node => {
      // Don't include the comment itself or other comments
      if (node.id === commentNode.id || node.type === 'commentNode') return;
      
      const nodeWidth = node.measured?.width ?? 240;
      const nodeHeight = node.measured?.height ?? 60;
      const nodeCenterX = node.position.x + nodeWidth / 2;
      const nodeCenterY = node.position.y + nodeHeight / 2;
      
      // Check if node center is inside comment bounds
      if (
        nodeCenterX >= commentPos.x &&
        nodeCenterX <= commentPos.x + commentWidth &&
        nodeCenterY >= commentPos.y &&
        nodeCenterY <= commentPos.y + commentHeight
      ) {
        containedNodes.push({
          nodeId: node.id,
          offsetX: node.position.x - commentPos.x,
          offsetY: node.position.y - commentPos.y,
        });
      }
    });
    
    return containedNodes;
  }, []);
  
  // Handle node drag start (pickup)
  const handleNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    // If dragging a comment node, find all nodes inside it and store their offsets
    if (node.type === 'commentNode') {
      const flowNode = flowNodes.find(n => n.id === node.id);
      if (flowNode) {
        const containedNodes = getNodesInsideComment(flowNode, flowNodes);
        commentContainedNodesRef.current = containedNodes;
        draggingCommentIdRef.current = node.id;
      }
    }
  }, [flowNodes, getNodesInsideComment]);
  
  // Handle node drag (continuous movement) - update internal state for smooth visuals
  const handleNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    // If dragging a comment, move contained nodes along with it
    if (node.type === 'commentNode' && draggingCommentIdRef.current === node.id) {
      const containedNodes = commentContainedNodesRef.current;
      if (containedNodes.length > 0) {
        // Update internal nodes state to move contained nodes with the comment
        setInternalNodes(prevNodes => {
          return prevNodes.map(n => {
            const contained = containedNodes.find(c => c.nodeId === n.id);
            if (contained) {
              return {
                ...n,
                position: {
                  x: node.position.x + contained.offsetX,
                  y: node.position.y + contained.offsetY,
                },
              };
            }
            return n;
          });
        });
      }
    }
  }, []);
  
  // Handle node drag stop (drop) - sync to parent state
  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    // If we were dragging a comment, sync contained node positions to parent
    if (node.type === 'commentNode' && draggingCommentIdRef.current === node.id) {
      const containedNodes = commentContainedNodesRef.current;
      if (containedNodes.length > 0) {
        // Update parent state with final positions
        containedNodes.forEach(({ nodeId, offsetX, offsetY }) => {
          onUpdateNode(nodeId, {
            position: {
              x: node.position.x + offsetX,
              y: node.position.y + offsetY,
            },
          });
        });
      }
      // Clear refs
      commentContainedNodesRef.current = [];
      draggingCommentIdRef.current = null;
    }
  }, []);

  // Handle drag over from palette
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('node-type')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDraggingOver(true);
      
      // Update drop preview position - use screen coordinates relative to container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropPreviewPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
    setDropPreviewPos(null);
  }, []);

  // Handle drop from palette with animation
  const handleDrop = useCallback((e: React.DragEvent) => {
    const nodeType = e.dataTransfer.getData('node-type');
    if (!nodeType) return;
    
    e.preventDefault();
    setIsDraggingOver(false);
    setDropPreviewPos(null);

    const definition = getNodeDefinition(nodeType);
    if (!definition) return;

    // Get drop position
    const pos = reactFlowInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });

    // Snap to grid if enabled
    const snappedPos = snapToGrid ? {
      x: Math.round((pos.x - 90) / gridSize) * gridSize,
      y: Math.round((pos.y - 30) / gridSize) * gridSize,
    } : {
      x: pos.x - 90,
      y: pos.y - 30,
    };

    // Create the new node
    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode: ScriptNode = {
      id: newNodeId,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position: snappedPos,
      data: { ...definition.defaultData },
      inputs: definition.inputs.map((input, idx) => ({
        id: `input_${idx}`,
        label: input.label,
        type: input.type,
        dataType: input.dataType,
        isInput: true,
        ...('defaultValue' in input && { defaultValue: (input as Record<string, unknown>).defaultValue }),
        ...('options' in input && { options: (input as Record<string, unknown>).options }),
      })),
      outputs: definition.outputs.map((output, idx) => ({
        id: `output_${idx}`,
        label: output.label,
        type: output.type,
        dataType: output.dataType,
        elementType: (output as { elementType?: NodeDataType }).elementType,
        isInput: false,
      })),
    };

    // Trigger drop animation
    setDroppingNodeId(newNodeId);
    setTimeout(() => setDroppingNodeId(null), 300);

    onAddNode(newNode);
    onSelectNodes([newNodeId]);
    onRequestHistorySnapshot?.();
  }, [reactFlowInstance, snapToGrid, gridSize, onAddNode, onSelectNodes, onRequestHistorySnapshot]);

  // Handle view changes
  const onMoveEnd = useCallback((_: unknown, viewport: { x: number; y: number; zoom: number }) => {
    onViewChange?.({
      x: viewport.x,
      y: viewport.y,
      scale: viewport.zoom,
    });
  }, [onViewChange]);

  // Determine background variant
  const backgroundVariant = (() => {
    switch (gridStyle) {
      case 'dots':
        return BackgroundVariant.Dots;
      case 'lines':
        return BackgroundVariant.Lines;
      case 'cross':
        return BackgroundVariant.Cross;
      default:
        return BackgroundVariant.Dots;
    }
  })();

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="w-full h-full outline-none relative"
      style={{ backgroundColor: theme === 'dark' ? '#121212' : '#fafafa' }}
      onMouseMove={(e) => {
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Aggressive CSS to hide selection rectangles */}
      <style>{`
        /* Hide all selection rectangles aggressively */
        .react-flow__nodesselection-rect,
        .react-flow__selection-rect,
        .react-flow__selectionbox,
        .react-flow__selectionpane {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
        }
        
        /* Hide in all contexts */
        .react-flow__viewport .react-flow__nodesselection-rect,
        .react-flow__viewport .react-flow__selection-rect,
        .react-flow__viewport .react-flow__selectionbox,
        .react-flow__viewport .react-flow__selectionpane,
        .react-flow__selectionpane .react-flow__nodesselection-rect,
        .react-flow__selectionpane .react-flow__selection-rect,
        .react-flow__selectionpane .react-flow__selectionbox {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
        }
      `}</style>
      {/* Drop preview indicator */}
      {isDraggingOver && dropPreviewPos && (
        <div 
          className="absolute z-50 pointer-events-none"
          style={{
            left: dropPreviewPos.x,
            top: dropPreviewPos.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div 
            className="w-40 h-14 rounded-lg border-2 border-dashed flex items-center justify-center gap-2"
            style={{ 
              borderColor: accentColor,
              backgroundColor: `${accentColor}15`,
              boxShadow: `0 0 20px ${accentColor}30`,
            }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
            <span className="text-xs font-medium" style={{ color: accentColor }}>Drop here</span>
          </div>
        </div>
      )}
      
      {/* Animation styles for node interactions */}
      <style>{`
        /* Drop from palette animation */
        @keyframes nodeDropIn {
          0% { opacity: 0; filter: blur(4px); }
          50% { opacity: 1; filter: blur(0px); }
          100% { opacity: 1; filter: blur(0px); }
        }
        .node-dropping {
          animation: nodeDropIn 0.25s ease-out forwards;
        }
        .node-dropping > div {
          animation: nodeScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes nodeScaleIn {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        
        /* Comment nodes always stay behind */
        .comment-node {
          z-index: -1000 !important;
        }
      `}</style>
      
      <ReactFlow
        nodes={flowNodes.map(n => {
          let className = n.className || '';
          if (n.type === 'commentNode') className += ' comment-node';
          if (droppingNodeId === n.id) className += ' node-dropping';
          return { ...n, className: className.trim() };
        })}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onConnectStart={onConnectStart}
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
        elevateEdgesOnSelect={true} // Render edges on top when connected nodes are selected
        proOptions={{ hideAttribution: true }}
        style={{
          backgroundColor: theme === 'dark' ? '#121212' : '#fafafa',
        }}
      >
        {showGridLines && (
          <Background
            variant={backgroundVariant}
            gap={gridSize}
            size={gridStyle === 'dots' ? 1 : undefined}
            color={coloredGrid ? accentColor : (theme === 'dark' ? '#2d2d2d' : '#e0e0e0')}
          />
        )}
        <MiniMap
          nodeStrokeWidth={2}
          nodeStrokeColor={(node) => {
            const scriptNode = scriptNodes.find(n => n.id === node.id);
            if (scriptNode?.type === 'comment') {
              const color = typeof scriptNode.data.commentColor === 'string' ? scriptNode.data.commentColor : '#455A64';
              return color;
            }
            return theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
          }}
          nodeBorderRadius={3}
          nodeColor={(node) => {
            const scriptNode = scriptNodes.find(n => n.id === node.id);
            if (!scriptNode) return '#424242';
            if (scriptNode.type === 'comment') {
              const color = typeof scriptNode.data.commentColor === 'string' ? scriptNode.data.commentColor : '#455A64';
              return `${color}40`; // Transparent fill for comments
            }
            return getNodeColor(scriptNode.type);
          }}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)'}
          pannable
          zoomable
          zoomStep={2}
          style={{
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
            width: localMinimapSize.width,
            height: localMinimapSize.height,
            bottom: 50,
            right: 12,
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          }}
          position="bottom-right"
        />
        
        {/* Minimap resize handle */}
        <Panel position="bottom-right" style={{ bottom: 50 + localMinimapSize.height - 16, right: 12 + localMinimapSize.width - 16 }}>
          <div
            className="w-4 h-4 cursor-nw-resize flex items-center justify-center bg-[#2d2d2d] rounded-tl border-l border-t border-white/10 hover:bg-[#3d3d3d] transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              minimapResizing.current = true;
              minimapResizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                width: localMinimapSize.width,
                height: localMinimapSize.height,
              };
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!minimapResizing.current) return;
                
                const deltaX = minimapResizeStart.current.x - moveEvent.clientX;
                const deltaY = minimapResizeStart.current.y - moveEvent.clientY;
                
                const newWidth = Math.max(200, Math.min(600, minimapResizeStart.current.width + deltaX));
                const newHeight = Math.max(150, Math.min(500, minimapResizeStart.current.height + deltaY));
                
                setLocalMinimapSize({ width: newWidth, height: newHeight });
              };
              
              const handleMouseUp = () => {
                if (minimapResizing.current) {
                  minimapResizing.current = false;
                  onMinimapResize?.(localMinimapSize.width, localMinimapSize.height);
                }
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-gray-500">
              <path d="M0 8L8 0M3 8L8 3M6 8L8 6" stroke="currentColor" strokeWidth="1" fill="none"/>
            </svg>
          </div>
        </Panel>
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

      {/* Context Menu - Material Design */}
      {contextMenu && (
        <div
          data-context-menu="true"
          className="fixed z-[1100] bg-[#2d2d2d] rounded shadow-lg text-sm text-white min-w-[180px] py-2 overflow-hidden"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            boxShadow: '0 8px 10px -5px rgba(0,0,0,.2), 0 16px 24px 2px rgba(0,0,0,.14), 0 6px 30px 5px rgba(0,0,0,.12)',
          }}
        >
          {/* Canvas context menu */}
          {contextMenu.type === 'canvas' && (
            <>
              <button
                className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors"
                onClick={() => {
                  if (contextMenu.canvasPos) {
                    // Position QuickNodeMenu at the original right-click position
                    // The menu will center itself on this position
                    handleOpenQuickMenu(contextMenu.canvasPos, { x: contextMenu.x, y: contextMenu.y });
                  }
                }}
              >
                <span className="text-[#2196F3] text-lg">+</span> 
                <span className="text-gray-100">Add Node</span>
              </button>
              {clipboardRef.current && clipboardRef.current.nodes.length > 0 && (
                <button
                  className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors"
                  onClick={() => handlePasteNodes(contextMenu.canvasPos)}
                >
                  <span className="text-gray-100">Paste ({clipboardRef.current.nodes.length} node{clipboardRef.current.nodes.length > 1 ? 's' : ''})</span>
                </button>
              )}
            </>
          )}

          {/* Single node context menu */}
          {contextMenu.type === 'node' && contextMenu.nodeId && (
            <>
              <button
                className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors text-gray-100"
                onClick={() => handleCopyNodes([contextMenu.nodeId!])}
              >
                Copy
              </button>
              <button
                className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors text-gray-100"
                onClick={() => {
                  handleCopyNodes([contextMenu.nodeId!]);
                  handleDeleteNodes([contextMenu.nodeId!]);
                }}
              >
                Cut
              </button>
              <button
                className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors text-gray-100"
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
              <div className="border-t border-white/8 my-1" />
              <button
                className="px-4 py-2.5 hover:bg-[#F44336]/10 w-full text-left flex items-center gap-3 transition-colors text-[#EF5350]"
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
                className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors text-gray-100"
                onClick={() => handleCopyNodes(contextMenu.nodeIds!)}
              >
                Copy {contextMenu.nodeIds.length} Nodes
              </button>
              <button
                className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors text-gray-100"
                onClick={() => {
                  handleCopyNodes(contextMenu.nodeIds!);
                  handleDeleteNodes(contextMenu.nodeIds!);
                }}
              >
                Cut {contextMenu.nodeIds.length} Nodes
              </button>
              <div className="border-t border-white/8 my-1" />
              {onSaveAsTemplate && (
                <button
                  className="px-4 py-2.5 hover:bg-white/8 w-full text-left flex items-center gap-3 transition-colors text-gray-100"
                  onClick={() => {
                    onSaveAsTemplate(contextMenu.nodeIds!);
                    setContextMenu(null);
                  }}
                >
                  Save as Template
                </button>
              )}
              <div className="border-t border-white/8 my-1" />
              <button
                className="px-4 py-2.5 hover:bg-[#F44336]/10 w-full text-left flex items-center gap-3 transition-colors text-[#EF5350]"
                onClick={() => handleDeleteNodes(contextMenu.nodeIds!)}
              >
                Delete {contextMenu.nodeIds.length} Nodes
              </button>
            </>
          )}

          {/* Connection context menu */}
          {contextMenu.type === 'connection' && contextMenu.connectionId && (
            <button
              className="px-4 py-2.5 hover:bg-[#F44336]/10 w-full text-left flex items-center gap-3 transition-colors text-[#EF5350]"
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
