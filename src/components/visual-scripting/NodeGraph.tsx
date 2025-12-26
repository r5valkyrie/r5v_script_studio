import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { ScriptNode, NodeConnection, NodeDataType } from '../../types/visual-scripting';
import { getNodeDefinition } from '../../data/node-definitions';
import QuickNodeMenu from './QuickNodeMenu';
import CustomSelect from './CustomSelect';

interface NodeGraphProps {
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
}

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

interface TempConnectionState {
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromNodeId: string;
  fromPortId: string;
  fromIsInput: boolean;
  portType: 'exec' | 'data';
  dataType?: NodeDataType;
}

interface DraggingNodeState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

interface DraggingSelectionState {
  startX: number;
  startY: number;
  nodeStarts: Map<string, { x: number; y: number }>;
}

interface PanState {
  startX: number;
  startY: number;
  viewStartX: number;
  viewStartY: number;
}

interface ResizingCommentState {
  nodeId: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  edge: 'right' | 'bottom' | 'corner';
}

export default function NodeGraph({
  nodes,
  connections,
  selectedNodeIds,
  onSelectNodes,
  onUpdateNode,
  onDeleteNode,
  onConnect,
  onBreakInput,
  onDeleteConnection = () => {},
  onAddNode,
  onViewChange,
  onRequestHistorySnapshot,
  // Appearance settings with defaults
  showGridLines = true,
  gridStyle = 'dots',
  coloredGrid = false,
  gridSize = 20,
  nodeOpacity = 100,
  connectionStyle = 'bezier',
  connectionsBehindNodes = false,
  accentColor = '#8B5CF6',
  theme = 'dark',
  // Editor settings with defaults
  snapToGrid = false,
  autoConnect = true,
  highlightConnections = true,
  animateConnections = false,
}: NodeGraphProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // RAF throttling for smooth panning (especially on Windows)
  const rafRef = useRef<number | null>(null);
  const pendingViewRef = useRef<{ x: number; y: number } | null>(null);

  // Use refs to store drag state (avoids useEffect re-registration)
  const tempConnectionRef = useRef<TempConnectionState | null>(null);
  const draggingNodeRef = useRef<DraggingNodeState | null>(null);
  const draggingSelectionRef = useRef<DraggingSelectionState | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const panningRef = useRef<PanState | null>(null);
  const selectionRef = useRef<{ start: { x: number; y: number }; shift: boolean } | null>(null);
  const selectionRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const selectionMadeRef = useRef(false);
  const resizingCommentRef = useRef<ResizingCommentState | null>(null);
  const rewireActiveRef = useRef(false);

  // Cache for port positions - measured from DOM after render, used during pan/zoom
  const portPositionCacheRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [portCacheVersion, setPortCacheVersion] = useState(0);
  const viewScaleRef = useRef(1); // Track current scale for port measurements

  // Store callbacks in refs so they don't cause re-registration
  const onConnectRef = useRef(onConnect);
  const onUpdateNodeRef = useRef(onUpdateNode);
  const onAddNodeRef = useRef(onAddNode);
  const onDeleteConnectionRef = useRef(onDeleteConnection);

  // Store settings in refs for use in event handlers
  const snapToGridRef = useRef(snapToGrid);
  const gridSizeRef = useRef(gridSize);
  const prevSnapToGridRef = useRef(snapToGrid);

  useEffect(() => {
    onConnectRef.current = onConnect;
    onUpdateNodeRef.current = onUpdateNode;
    onAddNodeRef.current = onAddNode;
    onDeleteConnectionRef.current = onDeleteConnection;
    snapToGridRef.current = snapToGrid;
    gridSizeRef.current = gridSize;
  }, [onConnect, onUpdateNode, onAddNode, onDeleteConnection, snapToGrid, gridSize]);

  // Snap all existing nodes to grid when snapToGrid is enabled
  useEffect(() => {
    if (snapToGrid && !prevSnapToGridRef.current && nodes.length > 0) {
      // snapToGrid just turned on - snap all existing nodes
      nodes.forEach(node => {
        const snappedX = Math.round(node.position.x / gridSize) * gridSize;
        const snappedY = Math.round(node.position.y / gridSize) * gridSize;
        if (snappedX !== node.position.x || snappedY !== node.position.y) {
          onUpdateNode(node.id, { position: { x: snappedX, y: snappedY } });
        }
      });
    }
    prevSnapToGridRef.current = snapToGrid;
  }, [snapToGrid, gridSize, nodes, onUpdateNode]);

  // Measure and cache port positions after nodes render
  // This runs after DOM updates but cached positions are used during pan/zoom
  useEffect(() => {
    const measurePorts = () => {
      const newCache = new Map<string, { x: number; y: number }>();
      const scale = viewScaleRef.current;
      
      // Find all port elements
      const portElements = document.querySelectorAll('.node-port[data-node-id][data-port-id]');
      
      portElements.forEach((el) => {
        const portElement = el as HTMLElement;
        const nodeId = portElement.dataset.nodeId;
        const portId = portElement.dataset.portId;
        
        if (nodeId && portId) {
          // Find the node to get its position
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            // Get the port's position relative to the node
            const nodeEl = portElement.closest('.node-root') as HTMLElement;
            if (nodeEl) {
              const nodeRect = nodeEl.getBoundingClientRect();
              const portRect = portElement.getBoundingClientRect();
              
              // Calculate position in canvas space (divide by scale since DOM is scaled)
              const relativeX = (portRect.left - nodeRect.left + portRect.width / 2) / scale;
              const relativeY = (portRect.top - nodeRect.top + portRect.height / 2) / scale;
              
              newCache.set(`${nodeId}:${portId}`, {
                x: node.position.x + relativeX,
                y: node.position.y + relativeY,
              });
            }
          }
        }
      });
      
      portPositionCacheRef.current = newCache;
      setPortCacheVersion(v => v + 1);
    };
    
    // Use requestAnimationFrame to ensure DOM is painted
    const rafId = requestAnimationFrame(() => {
      measurePorts();
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [nodes, connections]);

  // Quick node menu state
  const [quickMenu, setQuickMenu] = useState<QuickMenuState | null>(null);
  const setQuickMenuRef = useRef(setQuickMenu);
  useEffect(() => {
    setQuickMenuRef.current = setQuickMenu;
  }, [setQuickMenu]);

  // State for visual updates only
  const [tempConnectionLine, setTempConnectionLine] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [renderKey, forceRender] = useState(0);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'canvas' | 'node' | 'nodes' | 'connection' | 'port';
    nodeId?: string;
    nodeIds?: string[];
    portId?: string;
    connectionId?: string;
    canvasPos?: { x: number; y: number };
  } | null>(null);
  const [codeEditorModal, setCodeEditorModal] = useState<{ nodeId: string; code: string } | null>(null);
  const [clipboard, setClipboard] = useState<{ nodes: ScriptNode[]; connections: NodeConnection[] }>({ nodes: [], connections: [] });
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Notify parent when view changes and update scale ref
  useEffect(() => {
    viewScaleRef.current = view.scale;
    onViewChange?.(view);
  }, [view, onViewChange]);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Helper to snap a position to the grid if snap is enabled
  const snapPosition = (pos: { x: number; y: number }): { x: number; y: number } => {
    if (!snapToGridRef.current) return pos;
    return {
      x: Math.round(pos.x / gridSizeRef.current) * gridSizeRef.current,
      y: Math.round(pos.y / gridSizeRef.current) * gridSizeRef.current,
    };
  };

  const getNodeDefinitionColor = (type: string) => {
    const definition = getNodeDefinition(type);
    return definition?.color || '#6B7280';
  };

  const areTypesCompatible = (sourceType?: NodeDataType, targetType?: NodeDataType): boolean => {
    if (!sourceType || !targetType) return true;
    if (sourceType === 'any' || targetType === 'any') return true;
    if (sourceType === targetType) return true;

    const numberTypes: NodeDataType[] = ['number', 'int', 'float'];
    if (numberTypes.includes(sourceType) && numberTypes.includes(targetType)) return true;

    const rotationTypes: NodeDataType[] = ['vector', 'rotation'];
    if (rotationTypes.includes(sourceType) && rotationTypes.includes(targetType)) return true;

    const entityTypes: NodeDataType[] = ['entity', 'player', 'weapon'];
    if (entityTypes.includes(sourceType) && entityTypes.includes(targetType)) return true;

    return false;
  };

  const getPortClasses = (portType: 'exec' | 'data', dataType?: NodeDataType): string => {
    if (portType === 'exec') {
      return 'bg-white border-white hover:shadow-[0_0_8px_white]';
    }

    const colorMap: Record<string, string> = {
      int: 'bg-blue-500 border-blue-500 hover:shadow-[0_0_8px_#3b82f6]',
      float: 'bg-green-500 border-green-500 hover:shadow-[0_0_8px_#22c55e]',
      number: 'bg-green-500 border-green-500 hover:shadow-[0_0_8px_#22c55e]',
      string: 'bg-pink-500 border-pink-500 hover:shadow-[0_0_8px_#ec4899]',
      vector: 'bg-yellow-400 border-yellow-400 hover:shadow-[0_0_8px_#facc15]',
      rotation: 'bg-orange-500 border-orange-500 hover:shadow-[0_0_8px_#f97316]',
      boolean: 'bg-red-500 border-red-500 hover:shadow-[0_0_8px_#ef4444]',
      entity: 'bg-teal-400 border-teal-400 hover:shadow-[0_0_8px_#2dd4bf]',
      player: 'bg-cyan-400 border-cyan-400 hover:shadow-[0_0_8px_#22d3ee]',
      weapon: 'bg-amber-400 border-amber-400 hover:shadow-[0_0_8px_#fbbf24]',
      array: 'bg-purple-500 border-purple-500 hover:shadow-[0_0_8px_#a855f7]',
      table: 'bg-indigo-500 border-indigo-500 hover:shadow-[0_0_8px_#6366f1]',
      asset: 'bg-lime-500 border-lime-500 hover:shadow-[0_0_8px_#84cc16]',
      function: 'bg-slate-400 border-slate-400 hover:shadow-[0_0_8px_#94a3b8]',
      any: 'bg-gray-500 border-gray-500 hover:shadow-[0_0_8px_#6b7280]',
    };

    return colorMap[dataType || 'any'] || colorMap.any;
  };

  const getPortShapeClass = (portType: 'exec' | 'data'): string => {
    return portType === 'exec' ? 'rounded-sm' : 'rounded-full';
  };

  const getPortShapeStyle = (portType: 'exec' | 'data'): React.CSSProperties | undefined => {
    if (portType !== 'exec') return undefined;
    return { clipPath: 'polygon(0 0, 100% 50%, 0 100%)' };
  };

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

  // Get port position from cache (measured from DOM after render)
  const getPortPositionFromCache = (nodeId: string, portId: string): { x: number; y: number } | null => {
    const cached = portPositionCacheRef.current.get(`${nodeId}:${portId}`);
    if (cached) return cached;
    
    // Fallback to estimate if not in cache yet
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // Handle reroute nodes - port is at center
    if (node.type === 'reroute') {
      const nodeSize = 36;
      return {
        x: node.position.x + nodeSize / 2,
        y: node.position.y + nodeSize / 2,
      };
    }
    
    // Handle comment nodes - no ports
    if (node.type === 'comment') return null;
    
    // Simple fallback estimate
    const nodeWidth = node.size?.width || 180;
    const isOutput = node.outputs.some(p => p.id === portId);
    return {
      x: node.position.x + (isOutput ? nodeWidth - 12 : 12),
      y: node.position.y + 50, // rough center
    };
  };

  // Legacy function kept for backward compatibility (used by temp connection line)
  const getPortPositionFromState = (nodeId: string, portId: string): { x: number; y: number } | null => {
    return getPortPositionFromCache(nodeId, portId);
  };

  // Generate connection path based on style setting (canvas-space, no view.scale dependency)
  const generateConnectionPathCanvasSpace = (
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number }
  ): string => {
    if (connectionStyle === 'straight') {
      return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
    }
    
    if (connectionStyle === 'step') {
      const midX = (fromPos.x + toPos.x) / 2;
      return `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`;
    }
    
    if (connectionStyle === 'smooth-step') {
      // Right-angle lines with rounded corners (like Unreal Blueprints)
      const midX = (fromPos.x + toPos.x) / 2;
      const radius = Math.min(15, Math.abs(toPos.y - fromPos.y) / 2, Math.abs(midX - fromPos.x) / 2);
      const yDir = toPos.y > fromPos.y ? 1 : -1;
      
      if (radius < 2) {
        // Too small for curves, fall back to step
        return `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`;
      }
      
      return `M ${fromPos.x} ${fromPos.y} ` +
        `L ${midX - radius} ${fromPos.y} ` +
        `Q ${midX} ${fromPos.y} ${midX} ${fromPos.y + radius * yDir} ` +
        `L ${midX} ${toPos.y - radius * yDir} ` +
        `Q ${midX} ${toPos.y} ${midX + radius} ${toPos.y} ` +
        `L ${toPos.x} ${toPos.y}`;
    }
    
    if (connectionStyle === 'metro') {
      // Clean metro-style with 45° diagonal in the middle
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const absDy = Math.abs(dy);
      const absDx = Math.abs(dx);
      const yDir = dy > 0 ? 1 : -1;
      
      // For very short or nearly horizontal connections, use straight
      if (absDx < 20 || absDy < 5) {
        return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
      }
      
      // Calculate diagonal segment - the 45° part covers the vertical distance
      // Horizontal segments at start and end
      const minHorizontal = 20;
      const availableForDiagonal = absDx - (minHorizontal * 2);
      
      if (availableForDiagonal < absDy) {
        // Not enough horizontal space for a clean 45° - use a steeper angle with mid horizontal
        const startH = minHorizontal;
        const endH = minHorizontal;
        const midX = (fromPos.x + toPos.x) / 2;
        const diagLen = Math.min(absDy / 2, (midX - fromPos.x - startH));
        
        return `M ${fromPos.x} ${fromPos.y} ` +
          `L ${fromPos.x + startH} ${fromPos.y} ` +
          `L ${fromPos.x + startH + diagLen} ${fromPos.y + diagLen * yDir} ` +
          `L ${midX} ${fromPos.y + diagLen * yDir} ` +
          `L ${midX} ${toPos.y - diagLen * yDir} ` +
          `L ${toPos.x - endH - diagLen} ${toPos.y - diagLen * yDir} ` +
          `L ${toPos.x - endH} ${toPos.y} ` +
          `L ${toPos.x} ${toPos.y}`;
      }
      
      // Standard metro: horizontal -> 45° diagonal -> horizontal
      // The diagonal covers the full vertical distance at 45°
      const diagonalHorizontal = absDy; // At 45°, horizontal = vertical distance
      const remainingHorizontal = absDx - diagonalHorizontal;
      const startH = remainingHorizontal / 2;
      const endH = remainingHorizontal / 2;
      
      return `M ${fromPos.x} ${fromPos.y} ` +
        `L ${fromPos.x + startH} ${fromPos.y} ` +
        `L ${fromPos.x + startH + diagonalHorizontal} ${toPos.y} ` +
        `L ${toPos.x} ${toPos.y}`;
    }
    
    if (connectionStyle === 'quadratic') {
      // Simple single control point curve (lighter performance)
      const midX = (fromPos.x + toPos.x) / 2;
      const controlX = midX;
      const controlY = (fromPos.y + toPos.y) / 2;
      
      // Use the midpoint but offset it based on horizontal distance for a nice curve
      const offset = Math.min(Math.abs(toPos.x - fromPos.x) * 0.3, 80);
      
      return `M ${fromPos.x} ${fromPos.y} ` +
        `Q ${fromPos.x + offset} ${fromPos.y}, ${midX} ${controlY} ` +
        `T ${toPos.x} ${toPos.y}`;
    }
    
    // Default: bezier curve (fixed values - no scale dependency for stable canvas-space rendering)
    const distance = Math.abs(toPos.x - fromPos.x);
    const verticalDistance = Math.abs(toPos.y - fromPos.y);
    const alignmentRatio = distance > 0 ? Math.min(verticalDistance / distance, 2) : 1;
    const stackFactor = distance > 0 
      ? Math.min(1, Math.max(0, (100 - distance) / 100)) * (verticalDistance > distance ? 1 : 0.5)
      : 1;
    const minLength = 5 + alignmentRatio * 20;
    const maxLength = 40 + alignmentRatio * 20;
    const straightSegmentLength = Math.min(80, minLength + (maxLength - minLength) * stackFactor);
    const baseStrength = Math.min(distance * (0.6 + alignmentRatio * 0.1), 200);
    
    const fromControlX = fromPos.x + straightSegmentLength + baseStrength;
    const fromControlY = fromPos.y;
    const toControlX = toPos.x - straightSegmentLength - baseStrength;
    const toControlY = toPos.y;
    
    return `M ${fromPos.x} ${fromPos.y} C ${fromControlX} ${fromControlY}, ${toControlX} ${toControlY}, ${toPos.x} ${toPos.y}`;
  };

  // Screen-space version for temporary connection line (still needs view.scale)
  const generateConnectionPath = (
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number }
  ): string => {
    if (connectionStyle === 'straight') {
      return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
    }
    
    if (connectionStyle === 'step') {
      const midX = (fromPos.x + toPos.x) / 2;
      return `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`;
    }
    
    const scale = view.scale;
    
    if (connectionStyle === 'smooth-step') {
      const midX = (fromPos.x + toPos.x) / 2;
      const radius = Math.min(15 * scale, Math.abs(toPos.y - fromPos.y) / 2, Math.abs(midX - fromPos.x) / 2);
      const yDir = toPos.y > fromPos.y ? 1 : -1;
      
      if (radius < 2 * scale) {
        return `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`;
      }
      
      return `M ${fromPos.x} ${fromPos.y} ` +
        `L ${midX - radius} ${fromPos.y} ` +
        `Q ${midX} ${fromPos.y} ${midX} ${fromPos.y + radius * yDir} ` +
        `L ${midX} ${toPos.y - radius * yDir} ` +
        `Q ${midX} ${toPos.y} ${midX + radius} ${toPos.y} ` +
        `L ${toPos.x} ${toPos.y}`;
    }
    
    if (connectionStyle === 'metro') {
      // Clean metro-style with 45° diagonal in the middle
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const absDy = Math.abs(dy);
      const absDx = Math.abs(dx);
      const yDir = dy > 0 ? 1 : -1;
      
      // For very short or nearly horizontal connections, use straight
      if (absDx < 20 * scale || absDy < 5 * scale) {
        return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
      }
      
      const minHorizontal = 20 * scale;
      const availableForDiagonal = absDx - (minHorizontal * 2);
      
      if (availableForDiagonal < absDy) {
        const startH = minHorizontal;
        const endH = minHorizontal;
        const midX = (fromPos.x + toPos.x) / 2;
        const diagLen = Math.min(absDy / 2, (midX - fromPos.x - startH));
        
        return `M ${fromPos.x} ${fromPos.y} ` +
          `L ${fromPos.x + startH} ${fromPos.y} ` +
          `L ${fromPos.x + startH + diagLen} ${fromPos.y + diagLen * yDir} ` +
          `L ${midX} ${fromPos.y + diagLen * yDir} ` +
          `L ${midX} ${toPos.y - diagLen * yDir} ` +
          `L ${toPos.x - endH - diagLen} ${toPos.y - diagLen * yDir} ` +
          `L ${toPos.x - endH} ${toPos.y} ` +
          `L ${toPos.x} ${toPos.y}`;
      }
      
      const diagonalHorizontal = absDy;
      const remainingHorizontal = absDx - diagonalHorizontal;
      const startH = remainingHorizontal / 2;
      
      return `M ${fromPos.x} ${fromPos.y} ` +
        `L ${fromPos.x + startH} ${fromPos.y} ` +
        `L ${fromPos.x + startH + diagonalHorizontal} ${toPos.y} ` +
        `L ${toPos.x} ${toPos.y}`;
    }
    
    if (connectionStyle === 'quadratic') {
      const midX = (fromPos.x + toPos.x) / 2;
      const controlY = (fromPos.y + toPos.y) / 2;
      const offset = Math.min(Math.abs(toPos.x - fromPos.x) * 0.3, 80 * scale);
      
      return `M ${fromPos.x} ${fromPos.y} ` +
        `Q ${fromPos.x + offset} ${fromPos.y}, ${midX} ${controlY} ` +
        `T ${toPos.x} ${toPos.y}`;
    }
    
    // Default: bezier curve with scale for screen-space temp line
    const distance = Math.abs(toPos.x - fromPos.x);
    const verticalDistance = Math.abs(toPos.y - fromPos.y);
    const alignmentRatio = distance > 0 ? Math.min(verticalDistance / distance, 2) : 1;
    const stackFactor = distance > 0 
      ? Math.min(1, Math.max(0, (100 * scale - distance) / (100 * scale))) * (verticalDistance > distance ? 1 : 0.5)
      : 1;
    const minLength = (5 + alignmentRatio * 20) * scale;
    const maxLength = (40 + alignmentRatio * 20) * scale;
    const straightSegmentLength = Math.min(80 * scale, minLength + (maxLength - minLength) * stackFactor);
    const baseStrength = Math.min(distance * (0.6 + alignmentRatio * 0.1), 200 * scale);
    
    const fromControlX = fromPos.x + straightSegmentLength + baseStrength;
    const fromControlY = fromPos.y;
    const toControlX = toPos.x - straightSegmentLength - baseStrength;
    const toControlY = toPos.y;
    
    return `M ${fromPos.x} ${fromPos.y} C ${fromControlX} ${fromControlY}, ${toControlX} ${toControlY}, ${toPos.x} ${toPos.y}`;
  };

  const formatNodeDataValue = (value: unknown): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (Array.isArray(value)) {
      return `[${value.map(formatNodeDataValue).join(', ')}]`;
    }
    if (value && typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const renderInlineEditor = (node: ScriptNode) => {
    if (node.type === 'const-string') {
      const value = typeof node.data.value === 'string' ? node.data.value : '';
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, value: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
        />
      );
    }

    if (node.type === 'const-asset') {
      const value = typeof node.data.value === 'string' ? node.data.value : '$\"\"';
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, value: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[11px] text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
      );
    }

    if (node.type === 'const-int' || node.type === 'const-float') {
      const value = typeof node.data.value === 'number' ? node.data.value : 0;
      const step = node.type === 'const-float' ? '0.1' : '1';
      return (
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, value: parseFloat(e.target.value) || 0 } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
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
            onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, value: e.target.checked } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded border-white/10 bg-black/30 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
          />
          {value ? 'True' : 'False'}
        </label>
      );
    }

    if (node.type === 'const-vector') {
      const x = typeof node.data.x === 'number' ? node.data.x : 0;
      const y = typeof node.data.y === 'number' ? node.data.y : 0;
      const z = typeof node.data.z === 'number' ? node.data.z : 0;
      const updateAxis = (axis: 'x' | 'y' | 'z', val: number) => {
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, [axis]: val },
        });
      };
      return (
        <div className="grid grid-cols-3 gap-1" style={{ width: '140px' }}>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <input
              key={axis}
              type="number"
              step="0.1"
              value={axis === 'x' ? x : axis === 'y' ? y : z}
              onChange={(e) => updateAxis(axis, parseFloat(e.target.value) || 0)}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-1 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
            />
          ))}
        </div>
      );
    }

    if (node.type === 'const-loot-tier') {
      const value = typeof node.data.tier === 'string' ? node.data.tier : 'COMMON';
      const options = ['NONE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'HEIRLOOM'];
      return (
        <CustomSelect
          value={value}
          options={options}
          onChange={(val) => onUpdateNodeRef.current(node.id, { data: { ...node.data, tier: val } })}
        />
      );
    }

    if (node.type === 'const-supported-attachments') {
      const options = ['barrel', 'mag', 'sight', 'grip', 'hopup'];
      const selected = Array.isArray(node.data.attachments) ? node.data.attachments : [];
      const toggle = (attachment: string, checked: boolean) => {
        const next = checked
          ? Array.from(new Set([...selected, attachment]))
          : selected.filter((item) => item !== attachment);
        onUpdateNodeRef.current(node.id, { data: { ...node.data, attachments: next } });
      };
      return (
        <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-300">
          {options.map((attachment) => (
            <label key={attachment} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={selected.includes(attachment)}
                onChange={(e) => toggle(attachment, e.target.checked)}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-3 h-3 rounded border-white/10 bg-black/30 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
              />
              {attachment}
            </label>
          ))}
        </div>
      );
    }

    if (node.type === 'const-weapon-type') {
      const value = typeof node.data.weaponType === 'string' ? node.data.weaponType : 'pistol';
      const options = ['assault', 'smg', 'lmg', 'sniper', 'shotgun', 'pistol'];
      return (
        <CustomSelect
          value={value}
          options={options}
          onChange={(val) => onUpdateNodeRef.current(node.id, { data: { ...node.data, weaponType: val } })}
        />
      );
    }

    if (node.type === 'entity-classname') {
      const value = typeof node.data.className === 'string' ? node.data.className : 'prop_dynamic';
      const options = [
        // Props
        'prop_dynamic', 'prop_physics', 'prop_script', 'prop_door',
        // Triggers
        'trigger_cylinder', 'trigger_cylinder_heavy', 'trigger_point_gravity', 'trigger_updraft',
        // NPCs
        'npc_dummie', 'npc_prowler', 'npc_marvin', 'npc_spectre', 'npc_drone', 'npc_frag_drone',
        'npc_dropship', 'npc_gunship', 'npc_titan', 'npc_stalker', 'npc_super_spectre',
        'npc_soldier', 'npc_turret_mega', 'npc_turret_sentry', 'npc_turret_floor',
        // Particles & FX
        'info_particle_system', 'info_placement_helper', 'info_target', 'ambient_generic',
        // Movers
        'script_mover', 'script_mover_lightweight',
        // Ziplines
        'zipline', 'zipline_end',
        // Control & Logic
        'point_viewcontrol', 'assault_assaultpoint', 'info_node',
        // Physics
        'vortex_sphere', 'gravity_grenade_dvrt', 'phys_bone_follower',
        // Environment
        'env_fog_controller', 'env_wind', 'env_explosion', 'env_shake',
        // Titans
        'npc_titan_atlas', 'npc_titan_stryder', 'npc_titan_ogre', 'npc_titan_buddy',
        // Other
        'item_health', 'item_ammo', 'waypoint', 'control_point', 'func_brush', 'player_start'
      ];
      return (
        <CustomSelect
          value={value}
          options={options}
          onChange={(val) => onUpdateNodeRef.current(node.id, { data: { ...node.data, className: val } })}
        />
      );
    }

    if (node.type === 'define-const') {
      const constName = typeof node.data.constName === 'string' ? node.data.constName : 'MY_CONSTANT';
      const constType = typeof node.data.constType === 'string' ? node.data.constType : 'int';
      const constValue = node.data.constValue ?? '100';
      const isGlobal = node.data.isGlobal !== false;
      const typeOptions = ['int', 'float', 'bool', 'string', 'vector', 'asset'];
      
      return (
        <div className="space-y-2" style={{ width: '180px' }}>
          {/* Global checkbox */}
          <label className="flex items-center gap-2 text-[10px] text-gray-400">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, isGlobal: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded border-white/10 bg-black/30 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
            />
            Global
          </label>
          {/* Type dropdown */}
          <CustomSelect
            value={constType}
            options={typeOptions}
            onChange={(val) => onUpdateNodeRef.current(node.id, { data: { ...node.data, constType: val } })}
          />
          {/* Name input */}
          <input
            type="text"
            value={constName}
            placeholder="Name"
            onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, constName: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[11px] text-gray-200 focus:outline-none focus:border-purple-500"
          />
          {/* Value input */}
          <input
            type="text"
            value={constValue}
            placeholder="Value"
            onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, constValue: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[11px] text-gray-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      );
    }

    // Make Global node - no configuration needed, just connect exec to array/table nodes
    if (node.type === 'global-variable') {
      return null; // No inline editor - it's just a marker node
    }

    if (node.type === 'call-function') {
      const returnType = typeof node.data.returnType === 'string' ? node.data.returnType : 'none';
      const returnTypes = ['none', 'var', 'entity', 'int', 'float', 'bool', 'string', 'vector', 'array'];
      const argCount = typeof node.data.argCount === 'number' ? node.data.argCount : 1;
      const threaded = typeof node.data.threaded === 'boolean' ? node.data.threaded : false;
      
      const addArg = () => {
        const newCount = argCount + 1;
        const newInputs = [...node.inputs, {
          id: `input_${newCount + 1}`,
          label: `Arg ${newCount}`,
          type: 'data' as const,
          dataType: 'any' as const,
          isInput: true,
        }];
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, argCount: newCount },
          inputs: newInputs,
        });
      };

      const removeArg = () => {
        if (argCount <= 0) return;
        const newCount = argCount - 1;
        // Keep exec input (0) and function input (1), remove last arg
        const newInputs = node.inputs.slice(0, 2 + newCount);
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, argCount: newCount },
          inputs: newInputs,
        });
      };
      
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500">Returns:</span>
            <CustomSelect
              value={returnType}
              options={returnTypes}
              onChange={(value) => onUpdateNodeRef.current(node.id, { data: { ...node.data, returnType: value } })}
              className="flex-1"
              size="sm"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={threaded}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, threaded: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded bg-[#1a1f28] border border-white/10 accent-purple-500"
            />
            <span className="text-[9px] text-gray-500">Threaded</span>
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400">{argCount} args</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeArg();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={argCount <= 0}
                className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addArg();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (node.type === 'set-portal' || node.type === 'get-portal') {
      const portalName = typeof node.data.portalName === 'string' ? node.data.portalName : 'MyPortal';
      
      return (
        <input
          type="text"
          value={portalName}
          onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, portalName: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
          placeholder="PortalName"
        />
      );
    }

    // Server callback event nodes - show function name input
    if (['on-entities-did-load', 'on-client-connected', 'on-client-disconnected', 'on-player-killed', 'on-player-respawned'].includes(node.type)) {
      const functionName = typeof node.data.functionName === 'string' ? node.data.functionName : '';
      
      return (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-500">Function Name:</span>
          <input
            type="text"
            value={functionName}
            onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, functionName: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
            placeholder="MyCallback"
          />
        </div>
      );
    }

    // Give weapon node - show slot dropdown
    if (node.type === 'give-weapon') {
      const slot = typeof node.data.slot === 'string' ? node.data.slot : 'WEAPON_INVENTORY_SLOT_PRIMARY_0';
      const weaponSlots = [
        { value: 'WEAPON_INVENTORY_SLOT_PRIMARY_0', label: 'Primary 0' },
        { value: 'WEAPON_INVENTORY_SLOT_PRIMARY_1', label: 'Primary 1' },
        { value: 'WEAPON_INVENTORY_SLOT_PRIMARY_2', label: 'Primary 2' },
        { value: 'WEAPON_INVENTORY_SLOT_PRIMARY_3', label: 'Primary 3' },
        { value: 'WEAPON_INVENTORY_SLOT_ANTI_TITAN', label: 'Anti-Titan' },
        { value: 'WEAPON_INVENTORY_SLOT_ANY', label: 'Any' },
        { value: 'WEAPON_INVENTORY_SLOT_DUALPRIMARY_0', label: 'Dual Primary 0' },
        { value: 'WEAPON_INVENTORY_SLOT_DUALPRIMARY_1', label: 'Dual Primary 1' },
        { value: 'WEAPON_INVENTORY_SLOT_DUALPRIMARY_2', label: 'Dual Primary 2' },
        { value: 'WEAPON_INVENTORY_SLOT_DUALPRIMARY_3', label: 'Dual Primary 3' },
      ];
      
      return (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-500">Slot:</span>
          <CustomSelect
            value={slot}
            options={weaponSlots}
            onChange={(value) => onUpdateNodeRef.current(node.id, { data: { ...node.data, slot: value } })}
            size="sm"
          />
        </div>
      );
    }

    if (node.type === 'custom-function') {
      const functionName = typeof node.data.functionName === 'string' ? node.data.functionName : 'MyFunction';
      const returnType = typeof node.data.returnType === 'string' ? node.data.returnType : 'void';
      const returnTypes = ['void', 'int', 'float', 'bool', 'entity', 'string', 'vector', 'var'];
      const paramCount = typeof node.data.paramCount === 'number' ? node.data.paramCount : 1;
      const paramNames = Array.isArray(node.data.paramNames) ? node.data.paramNames : [];
      const paramTypes = Array.isArray(node.data.paramTypes) ? node.data.paramTypes : [];
      const isGlobal = typeof node.data.isGlobal === 'boolean' ? node.data.isGlobal : false;
      
      const addParam = () => {
        const newCount = paramCount + 1;
        const newOutputs = [...node.outputs, {
          id: `output_${newCount}`,
          label: `Param ${newCount}`,
          type: 'data' as const,
          dataType: 'any' as const,
          isInput: false,
        }];
        const newParamNames = [...paramNames, `arg${newCount}`];
        const newParamTypes = [...paramTypes, 'var'];
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, paramCount: newCount, paramNames: newParamNames, paramTypes: newParamTypes },
          outputs: newOutputs,
        });
      };

      const removeParam = () => {
        if (paramCount <= 0) return;
        const newCount = paramCount - 1;
        // Keep exec output (0), remove last param
        const newOutputs = node.outputs.slice(0, 1 + newCount);
        const newParamNames = paramNames.slice(0, newCount);
        const newParamTypes = paramTypes.slice(0, newCount);
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, paramCount: newCount, paramNames: newParamNames, paramTypes: newParamTypes },
          outputs: newOutputs,
        });
      };

      const updateParamName = (index: number, name: string) => {
        const newParamNames = [...paramNames];
        newParamNames[index] = name;
        onUpdateNodeRef.current(node.id, { data: { ...node.data, paramNames: newParamNames } });
      };

      const updateParamType = (index: number, type: string) => {
        const newParamTypes = [...paramTypes];
        newParamTypes[index] = type;
        onUpdateNodeRef.current(node.id, { data: { ...node.data, paramTypes: newParamTypes } });
      };
      
      return (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={functionName}
            onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, functionName: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
            placeholder="FunctionName"
          />
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500">Returns:</span>
            <CustomSelect
              value={returnType}
              options={returnTypes}
              onChange={(value) => onUpdateNodeRef.current(node.id, { data: { ...node.data, returnType: value } })}
              className="flex-1"
              size="sm"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, isGlobal: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded bg-[#1a1f28] border border-white/10 accent-purple-500"
            />
            <span className="text-[9px] text-gray-500">Global Function</span>
          </label>
          
          {/* Parameter list with name and type editors */}
          {paramCount > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] text-gray-500">Parameters:</span>
              {Array.from({ length: paramCount }).map((_, i) => (
                <div key={i} className="flex gap-1">
                  <input
                    type="text"
                    value={paramNames[i] || `arg${i + 1}`}
                    onChange={(e) => updateParamName(i, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={`arg${i + 1}`}
                    className="flex-1 px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                  />
                  <CustomSelect
                    value={paramTypes[i] || 'var'}
                    options={returnTypes.filter(t => t !== 'void')}
                    onChange={(value) => updateParamType(i, value)}
                    className="w-16"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400">{paramCount} params</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeParam();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={paramCount <= 0}
                className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addParam();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Struct Define - inline editor with +/- for fields
    if (node.type === 'struct-define') {
      const structName = typeof node.data.structName === 'string' ? node.data.structName : 'MyStruct';
      const accessorName = typeof node.data.accessorName === 'string' ? node.data.accessorName : '';
      const isGlobal = typeof node.data.isGlobal === 'boolean' ? node.data.isGlobal : false;
      const fieldCount = typeof node.data.fieldCount === 'number' ? node.data.fieldCount : 2;
      const fieldNames = Array.isArray(node.data.fieldNames) ? node.data.fieldNames : ['field1', 'field2'];
      const fieldTypes = Array.isArray(node.data.fieldTypes) ? node.data.fieldTypes : ['var', 'var'];
      const fieldDefaults = Array.isArray(node.data.fieldDefaults) ? node.data.fieldDefaults : ['', ''];
      // Extended type options including typed containers
      const typeOptions = ['var', 'int', 'float', 'bool', 'string', 'vector', 'entity', 'array', 'array<var>', 'array<int>', 'array<string>', 'array<entity>', 'table', 'table<string, var>', 'table<var, string>', 'table<string, string>'];

      const addField = () => {
        const newCount = fieldCount + 1;
        const newFieldNames = [...fieldNames, `field${newCount}`];
        const newFieldTypes = [...fieldTypes, 'var'];
        const newFieldDefaults = [...fieldDefaults, ''];
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, fieldCount: newCount, fieldNames: newFieldNames, fieldTypes: newFieldTypes, fieldDefaults: newFieldDefaults },
        });
      };

      const removeField = () => {
        if (fieldCount <= 1) return;
        const newCount = fieldCount - 1;
        const newFieldNames = fieldNames.slice(0, newCount);
        const newFieldTypes = fieldTypes.slice(0, newCount);
        const newFieldDefaults = fieldDefaults.slice(0, newCount);
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, fieldCount: newCount, fieldNames: newFieldNames, fieldTypes: newFieldTypes, fieldDefaults: newFieldDefaults },
        });
      };

      // Check if a type is a container (table/array) that shouldn't have default values
      const isContainerType = (type: string) => type.startsWith('table') || type.startsWith('array');

      return (
        <div className="flex flex-col gap-1.5">
          {/* Struct name (required) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500">Struct Type Name:</span>
            <input
              type="text"
              value={structName}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, structName: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
              placeholder="MyStruct"
            />
          </div>

          {/* Accessor name (optional) - used to access fields like file.menu */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500">Accessor Name (optional):</span>
            <input
              type="text"
              value={accessorName}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, accessorName: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
              placeholder="(none)"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, isGlobal: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded bg-[#1a1f28] border border-white/10 accent-purple-500"
            />
            <span className="text-[9px] text-gray-500">Global Struct</span>
          </label>

          {/* Field list */}
          {fieldCount > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] text-gray-500">Fields:</span>
              {Array.from({ length: fieldCount }).map((_, i) => {
                const currentType = fieldTypes[i] || 'var';
                const showDefault = !isContainerType(currentType);
                return (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex gap-1">
                      <CustomSelect
                        value={currentType}
                        options={typeOptions}
                        onChange={(value) => {
                          const newTypes = [...fieldTypes];
                          newTypes[i] = value;
                          // Clear default value if switching to container type
                          const newDefaults = [...fieldDefaults];
                          if (isContainerType(value)) {
                            newDefaults[i] = '';
                          }
                          onUpdateNodeRef.current(node.id, { data: { ...node.data, fieldTypes: newTypes, fieldDefaults: newDefaults } });
                        }}
                        className="w-28"
                        size="sm"
                      />
                      <input
                        type="text"
                        value={fieldNames[i] || `field${i + 1}`}
                        onChange={(e) => {
                          const newNames = [...fieldNames];
                          newNames[i] = e.target.value;
                          onUpdateNodeRef.current(node.id, { data: { ...node.data, fieldNames: newNames } });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder={`field${i + 1}`}
                        className="flex-1 px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                      />
                    </div>
                    {showDefault && (
                      <input
                        type="text"
                        value={fieldDefaults[i] || ''}
                        onChange={(e) => {
                          const newDefaults = [...fieldDefaults];
                          newDefaults[i] = e.target.value;
                          onUpdateNodeRef.current(node.id, { data: { ...node.data, fieldDefaults: newDefaults } });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="default value (optional)"
                        className="w-full px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400">{fieldCount} fields</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); removeField(); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={fieldCount <= 1}
                className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addField(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Enum Define - inline editor with +/- for values
    if (node.type === 'enum-define') {
      const enumName = typeof node.data.enumName === 'string' ? node.data.enumName : 'MyEnum';
      const isGlobal = typeof node.data.isGlobal === 'boolean' ? node.data.isGlobal : true;
      const valueCount = typeof node.data.valueCount === 'number' ? node.data.valueCount : 3;
      const valueNames = Array.isArray(node.data.valueNames) ? node.data.valueNames : ['VALUE_A', 'VALUE_B', 'VALUE_C'];
      const explicitValues = Array.isArray(node.data.explicitValues) ? node.data.explicitValues : [null, null, null];

      const addValue = () => {
        const newCount = valueCount + 1;
        const newNames = [...valueNames, `VALUE_${String.fromCharCode(65 + newCount - 1)}`];
        const newExplicit = [...explicitValues, null];
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, valueCount: newCount, valueNames: newNames, explicitValues: newExplicit },
        });
      };

      const removeValue = () => {
        if (valueCount <= 1) return;
        const newCount = valueCount - 1;
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, valueCount: newCount, valueNames: valueNames.slice(0, newCount), explicitValues: explicitValues.slice(0, newCount) },
        });
      };

      return (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={enumName}
            onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, enumName: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
            placeholder="EnumName"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, isGlobal: e.target.checked } })}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded bg-[#1a1f28] border border-white/10 accent-purple-500"
            />
            <span className="text-[9px] text-gray-500">Global Enum</span>
          </label>

          {/* Value list */}
          {valueCount > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] text-gray-500">Values:</span>
              {Array.from({ length: valueCount }).map((_, i) => (
                <div key={i} className="flex gap-1">
                  <input
                    type="text"
                    value={valueNames[i] || `VALUE_${i}`}
                    onChange={(e) => {
                      const newNames = [...valueNames];
                      newNames[i] = e.target.value;
                      onUpdateNodeRef.current(node.id, { data: { ...node.data, valueNames: newNames } });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={`VALUE_${i}`}
                    className="flex-1 px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                  />
                  <input
                    type="text"
                    value={explicitValues[i] !== null ? String(explicitValues[i]) : ''}
                    onChange={(e) => {
                      const newExplicit = [...explicitValues];
                      newExplicit[i] = e.target.value === '' ? null : e.target.value;
                      onUpdateNodeRef.current(node.id, { data: { ...node.data, explicitValues: newExplicit } });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="auto"
                    className="w-12 px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10 text-center"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400">{valueCount} values</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); removeValue(); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={valueCount <= 1}
                className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addValue(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Array Create Typed - inline editor with +/- for initial values
    if (node.type === 'array-create-typed') {
      const varName = typeof node.data.varName === 'string' ? node.data.varName : '';
      const elementType = typeof node.data.elementType === 'string' ? node.data.elementType : 'entity';
      const initialValues = Array.isArray(node.data.initialValues) ? node.data.initialValues : [];
      const typeOptions = ['int', 'float', 'bool', 'string', 'vector', 'entity', 'var'];

      const addValue = () => {
        const newValues = [...initialValues, ''];
        onUpdateNodeRef.current(node.id, { data: { ...node.data, initialValues: newValues } });
      };

      const removeValue = () => {
        if (initialValues.length <= 0) return;
        onUpdateNodeRef.current(node.id, { data: { ...node.data, initialValues: initialValues.slice(0, -1) } });
      };

      return (
        <div className="flex flex-col gap-1.5">
          {/* Variable name (optional, used for global variables) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500">Name (optional):</span>
            <input
              type="text"
              value={varName}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, varName: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="auto"
              className="w-full px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500">Type:</span>
            <CustomSelect
              value={elementType}
              options={typeOptions}
              onChange={(value) => onUpdateNodeRef.current(node.id, { data: { ...node.data, elementType: value } })}
              className="flex-1"
              size="sm"
            />
          </div>

          {/* Initial values list */}
          {initialValues.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] text-gray-500">Initial Values:</span>
              {initialValues.map((val, i) => (
                <input
                  key={i}
                  type="text"
                  value={String(val)}
                  onChange={(e) => {
                    const newValues = [...initialValues];
                    newValues[i] = e.target.value;
                    onUpdateNodeRef.current(node.id, { data: { ...node.data, initialValues: newValues } });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={`value ${i}`}
                  className="w-full px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400">{initialValues.length} items</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); removeValue(); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={initialValues.length <= 0}
                className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addValue(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Table Create Typed - inline editor with +/- for initial key-value pairs
    if (node.type === 'table-create-typed') {
      const varName = typeof node.data.varName === 'string' ? node.data.varName : '';
      const keyType = typeof node.data.keyType === 'string' ? node.data.keyType : 'string';
      const valueType = typeof node.data.valueType === 'string' ? node.data.valueType : 'int';
      const initialKeys = Array.isArray(node.data.initialKeys) ? node.data.initialKeys : [];
      const initialVals = Array.isArray(node.data.initialVals) ? node.data.initialVals : [];
      const typeOptions = ['int', 'float', 'bool', 'string', 'vector', 'entity', 'var'];

      const addPair = () => {
        const newKeys = [...initialKeys, ''];
        const newVals = [...initialVals, ''];
        onUpdateNodeRef.current(node.id, { data: { ...node.data, initialKeys: newKeys, initialVals: newVals } });
      };

      const removePair = () => {
        if (initialKeys.length <= 0) return;
        onUpdateNodeRef.current(node.id, { 
          data: { ...node.data, initialKeys: initialKeys.slice(0, -1), initialVals: initialVals.slice(0, -1) } 
        });
      };

      return (
        <div className="flex flex-col gap-1.5">
          {/* Variable name (optional, used for global variables) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-500">Name (optional):</span>
            <input
              type="text"
              value={varName}
              onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, varName: e.target.value } })}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="auto"
              className="w-full px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500">Key:</span>
            <CustomSelect
              value={keyType}
              options={typeOptions}
              onChange={(value) => onUpdateNodeRef.current(node.id, { data: { ...node.data, keyType: value } })}
              className="flex-1"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500">Val:</span>
            <CustomSelect
              value={valueType}
              options={typeOptions}
              onChange={(value) => onUpdateNodeRef.current(node.id, { data: { ...node.data, valueType: value } })}
              className="flex-1"
              size="sm"
            />
          </div>

          {/* Initial key-value pairs */}
          {initialKeys.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] text-gray-500">Initial Entries:</span>
              {initialKeys.map((key, i) => (
                <div key={i} className="flex gap-1">
                  <input
                    type="text"
                    value={String(key)}
                    onChange={(e) => {
                      const newKeys = [...initialKeys];
                      newKeys[i] = e.target.value;
                      onUpdateNodeRef.current(node.id, { data: { ...node.data, initialKeys: newKeys } });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="key"
                    className="flex-1 px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                  />
                  <input
                    type="text"
                    value={String(initialVals[i] || '')}
                    onChange={(e) => {
                      const newVals = [...initialVals];
                      newVals[i] = e.target.value;
                      onUpdateNodeRef.current(node.id, { data: { ...node.data, initialVals: newVals } });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="value"
                    className="flex-1 px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400">{initialKeys.length} entries</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); removePair(); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={initialKeys.length <= 0}
                className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addPair(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (node.type === 'thread') {
      const value = typeof node.data.functionName === 'string' ? node.data.functionName : 'ThreadFunc';
      return (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-500">Thread Function:</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, functionName: e.target.value } })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
            placeholder="ThreadFunc"
          />
        </div>
      );
    }

    if (node.type === 'custom-code') {
      const code = typeof node.data.code === 'string' ? node.data.code : '// Your code here';
      const lineCount = code.split('\n').length;
      const preview = lineCount > 3 ? code.split('\n').slice(0, 3).join('\n') + '...' : code;
      
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-500">Custom Code ({lineCount} lines):</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCodeEditorModal({ nodeId: node.id, code });
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-2 py-0.5 rounded text-[9px] transition-colors"
              style={{ backgroundColor: 'var(--accent-color-bg)', color: 'var(--accent-color)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color-dim)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color-bg)'}
            >
              Edit Code
            </button>
          </div>
          <div className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[9px] text-gray-400 font-mono max-h-[60px] overflow-hidden whitespace-pre-wrap">
            {preview || '// Click Edit Code to write your code'}
          </div>
        </div>
      );
    }

    if (node.type === 'exec-sequence') {
      const outputCount = typeof node.data.outputCount === 'number' ? node.data.outputCount : 2;
      
      const addOutput = () => {
        const newCount = outputCount + 1;
        const newOutputs = [...node.outputs, {
          id: `output_${newCount - 1}`,
          label: `Then ${newCount - 1}`,
          type: 'exec' as const,
          isInput: false,
        }];
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, outputCount: newCount },
          outputs: newOutputs,
        });
      };

      const removeOutput = () => {
        if (outputCount <= 1) return;
        const newCount = outputCount - 1;
        const newOutputs = node.outputs.slice(0, newCount);
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, outputCount: newCount },
          outputs: newOutputs,
        });
      };

      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-400">{outputCount} outputs</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeOutput();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={outputCount <= 1}
              className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
            >
              −
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addOutput();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      );
    }

    // String builder - dynamic input count
    if (node.type === 'string-builder') {
      const inputCount = typeof node.data.inputCount === 'number' ? node.data.inputCount : 2;
      
      const addInput = () => {
        const newCount = inputCount + 1;
        const newInputs = [...node.inputs, {
          id: `input_${newCount - 1}`,
          label: `Part ${newCount - 1}`,
          type: 'data' as const,
          dataType: 'any' as const,
          isInput: true,
        }];
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, inputCount: newCount },
          inputs: newInputs,
        });
      };

      const removeInput = () => {
        if (inputCount <= 1) return;
        const newCount = inputCount - 1;
        const newInputs = node.inputs.slice(0, newCount);
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, inputCount: newCount },
          inputs: newInputs,
        });
      };

      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-400">{inputCount} parts</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeInput();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={inputCount <= 1}
              className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
            >
              −
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addInput();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      );
    }

    // Print - dynamic part count (auto-concatenates)
    if (node.type === 'printf') {
      const partCount = typeof node.data.partCount === 'number' ? node.data.partCount : 2;
      
      const addPart = () => {
        const newCount = partCount + 1;
        const newInputs = [...node.inputs, {
          id: `input_${newCount}`,
          label: `Part ${newCount - 1}`,
          type: 'data' as const,
          dataType: 'any' as const,
          isInput: true,
        }];
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, partCount: newCount },
          inputs: newInputs,
        });
      };

      const removePart = () => {
        if (partCount <= 1) return;
        const newCount = partCount - 1;
        // Keep exec input (0), remove last part
        const newInputs = node.inputs.slice(0, 1 + newCount);
        onUpdateNodeRef.current(node.id, {
          data: { ...node.data, partCount: newCount },
          inputs: newInputs,
        });
      };

      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-400">{partCount} parts</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removePart();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={partCount <= 1}
              className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400 text-xs font-bold"
            >
              −
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addPart();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-5 h-5 flex items-center justify-center rounded bg-green-500/20 hover:bg-green-500/40 transition-colors text-green-400 text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      );
    }

    // ==================== GENERIC FALLBACK EDITOR ====================
    // Render editable fields for any node with data properties
    const dataKeys = Object.keys(node.data);
    // Skip internal/computed fields and empty data
    const editableKeys = dataKeys.filter(key => 
      !['isExec', 'comment', 'commentColor'].includes(key) &&
      node.data[key] !== undefined
    );
    
    if (editableKeys.length > 0) {
      return (
        <div className="flex flex-col gap-1.5">
          {editableKeys.map((key) => {
            const value = node.data[key];
            const labelText = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            
            // Boolean field
            if (typeof value === 'boolean') {
              return (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, [key]: e.target.checked } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-3 h-3 rounded bg-[#1a1f28] border border-white/10 accent-purple-500"
                  />
                  <span className="text-[9px] text-gray-500">{labelText}</span>
                </label>
              );
            }
            
            // Number field
            if (typeof value === 'number') {
              const isFloat = !Number.isInteger(value) || key.toLowerCase().includes('float') || key.toLowerCase().includes('duration') || key.toLowerCase().includes('time') || key.toLowerCase().includes('scale');
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500">{labelText}:</span>
                  <input
                    type="number"
                    value={value}
                    step={isFloat ? '0.1' : '1'}
                    onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, [key]: parseFloat(e.target.value) || 0 } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
                  />
                </div>
              );
            }
            
            // String field
            if (typeof value === 'string') {
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500">{labelText}:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, [key]: e.target.value } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
                    placeholder={labelText}
                  />
                </div>
              );
            }
            
            // Array field - show count and basic editor
            if (Array.isArray(value)) {
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500">{labelText} ({value.length}):</span>
                  {value.map((item, i) => (
                    <input
                      key={i}
                      type="text"
                      value={String(item)}
                      onChange={(e) => {
                        const newArr = [...value];
                        newArr[i] = e.target.value;
                        onUpdateNodeRef.current(node.id, { data: { ...node.data, [key]: newArr } });
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full px-1.5 py-0.5 bg-[#1a1f28] rounded text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors border border-white/10"
                    />
                  ))}
                </div>
              );
            }
            
            // Fallback: show as text
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-gray-500">{labelText}:</span>
                <input
                  type="text"
                  value={String(value ?? '')}
                  onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, [key]: e.target.value } })}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 bg-[#1a1f28] rounded text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 hover:bg-[#151a21] transition-colors"
                />
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const screenToWorld = (screen: { x: number; y: number }) => {
    return {
      x: (screen.x - view.x) / view.scale,
      y: (screen.y - view.y) / view.scale,
    };
  };

  // Get port position by querying DOM with more robust selector
  const getPortPositionFromDOM = (nodeId: string, portId: string): { x: number; y: number } | null => {
    const portElement = document.querySelector(
      `.node-port[data-node-id="${nodeId}"][data-port-id="${portId}"]`
    ) as HTMLElement | null;

    if (portElement && canvasRef.current) {
      const portRect = portElement.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Account for canvas scroll and position
      const x = portRect.left - canvasRect.left + portRect.width / 2;
      const y = portRect.top - canvasRect.top + portRect.height / 2;
      
      return { x, y };
    }
    
    // Fallback: use node position if port not found (node may be off-screen)
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Estimate port position based on node position and whether it's input/output
      const isOutput = portId.startsWith('output_') || portId === 'flow_out';
      const offsetX = isOutput ? 180 : 0; // Approximate node width
      return {
        x: node.position.x + offsetX,
        y: node.position.y + 20 // Approximate vertical offset
      };
    }
    
    return null;
  };

  // Global mouse event handlers - registered once
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      lastMousePosRef.current = {
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
      };

      // Handle connection dragging
      if (tempConnectionRef.current) {
        // Update the "from" position in case node moved
        const fromPos = getPortPositionFromDOM(
          tempConnectionRef.current.fromNodeId,
          tempConnectionRef.current.fromPortId
        );

        const newTo = {
          x: e.clientX - canvasRect.left,
          y: e.clientY - canvasRect.top,
        };

        setTempConnectionLine({
          from: fromPos || tempConnectionRef.current.from,
          to: newTo,
        });
      }

      // Handle node dragging
      if (draggingNodeRef.current) {
        const { nodeId, startX, startY, nodeStartX, nodeStartY } = draggingNodeRef.current;
        const dx = (e.clientX - startX) / view.scale;
        const dy = (e.clientY - startY) / view.scale;

        let newX = nodeStartX + dx;
        let newY = nodeStartY + dy;

        // Apply snap-to-grid if enabled
        if (snapToGridRef.current) {
          newX = Math.round(newX / gridSizeRef.current) * gridSizeRef.current;
          newY = Math.round(newY / gridSizeRef.current) * gridSizeRef.current;
        }

        onUpdateNodeRef.current(nodeId, {
          position: { x: newX, y: newY },
        });
      }

      if (draggingSelectionRef.current) {
        const { startX, startY, nodeStarts } = draggingSelectionRef.current;
        const dx = (e.clientX - startX) / view.scale;
        const dy = (e.clientY - startY) / view.scale;
        nodeStarts.forEach((pos, nodeId) => {
          let newX = pos.x + dx;
          let newY = pos.y + dy;

          // Apply snap-to-grid if enabled
          if (snapToGridRef.current) {
            newX = Math.round(newX / gridSizeRef.current) * gridSizeRef.current;
            newY = Math.round(newY / gridSizeRef.current) * gridSizeRef.current;
          }

          onUpdateNodeRef.current(nodeId, {
            position: { x: newX, y: newY },
          });
        });
      }

      if (panningRef.current) {
        const { startX, startY, viewStartX, viewStartY } = panningRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newX = viewStartX + dx;
        const newY = viewStartY + dy;
        
        // Use RAF throttling for smoother panning (especially on Windows)
        pendingViewRef.current = { x: newX, y: newY };
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            if (pendingViewRef.current) {
              setView(current => ({
                ...current,
                x: pendingViewRef.current!.x,
                y: pendingViewRef.current!.y,
              }));
            }
          });
        }
      }

      // Handle comment resizing
      if (resizingCommentRef.current) {
        const { nodeId, startX, startY, startWidth, startHeight, edge } = resizingCommentRef.current;
        const dx = (e.clientX - startX) / view.scale;
        const dy = (e.clientY - startY) / view.scale;

        const minWidth = 200;
        const minHeight = 100;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (edge === 'right' || edge === 'corner') {
          newWidth = Math.max(minWidth, startWidth + dx);
          // Snap width to grid if enabled
          if (snapToGridRef.current) {
            newWidth = Math.round(newWidth / gridSizeRef.current) * gridSizeRef.current;
          }
        }
        if (edge === 'bottom' || edge === 'corner') {
          newHeight = Math.max(minHeight, startHeight + dy);
          // Snap height to grid if enabled
          if (snapToGridRef.current) {
            newHeight = Math.round(newHeight / gridSizeRef.current) * gridSizeRef.current;
          }
        }

        onUpdateNodeRef.current(nodeId, {
          size: { width: newWidth, height: newHeight },
        });
      }

      if (selectionRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const start = selectionRef.current.start;
        const current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const x = Math.min(start.x, current.x);
        const y = Math.min(start.y, current.y);
        const width = Math.abs(start.x - current.x);
        const height = Math.abs(start.y - current.y);
        const nextRect = { x, y, width, height };
        selectionRectRef.current = nextRect;
        setSelectionRect(nextRect);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Handle connection end
      if (tempConnectionRef.current) {
        const tempConn = tempConnectionRef.current;

        // Find port under mouse
        const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
        const portElement = elementsUnderMouse.find(el => el.classList.contains('node-port')) as HTMLElement | undefined;

        if (portElement) {
          const targetNodeId = portElement.getAttribute('data-node-id');
          const targetPortId = portElement.getAttribute('data-port-id');
          const targetIsInput = portElement.getAttribute('data-is-input') === 'true';

          if (targetNodeId && targetPortId) {
            const canConnect =
              targetNodeId !== tempConn.fromNodeId &&
              targetIsInput !== tempConn.fromIsInput;

            if (canConnect) {
              const connection: NodeConnection = {
                id: `conn_${Date.now()}`,
                from: tempConn.fromIsInput
                  ? { nodeId: targetNodeId, portId: targetPortId }
                  : { nodeId: tempConn.fromNodeId, portId: tempConn.fromPortId },
                to: tempConn.fromIsInput
                  ? { nodeId: tempConn.fromNodeId, portId: tempConn.fromPortId }
                  : { nodeId: targetNodeId, portId: targetPortId },
              };
              onConnectRef.current(connection);
            }
          }
        } else {
          // Dropped on empty space - show QuickNodeMenu
          const rect = canvasRef.current?.getBoundingClientRect();
          const screenPos = { x: e.clientX, y: e.clientY };
          const canvasPos = rect ? screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }) : screenPos;
          setQuickMenuRef.current({
            screenPosition: screenPos,
            canvasPosition: canvasPos,
            sourcePort: {
              nodeId: tempConn.fromNodeId,
              portId: tempConn.fromPortId,
              isInput: tempConn.fromIsInput,
              portType: tempConn.portType,
              dataType: tempConn.dataType,
            },
          });
        }

        tempConnectionRef.current = null;
        setTempConnectionLine(null);
      }

      // Handle node drag end
      if (draggingNodeRef.current) {
        draggingNodeRef.current = null;
        setIsDragging(false);
        onRequestHistorySnapshot?.();
      }

      if (draggingSelectionRef.current) {
        draggingSelectionRef.current = null;
        setIsDragging(false);
        onRequestHistorySnapshot?.();
      }

      if (rewireActiveRef.current) {
        setTimeout(() => {
          rewireActiveRef.current = false;
        }, 0);
      }

      if (panningRef.current) {
        panningRef.current = null;
      }

      // Handle comment resize end
      if (resizingCommentRef.current) {
        resizingCommentRef.current = null;
        setIsDragging(false);
        onRequestHistorySnapshot?.();
      }

      if (selectionRef.current && canvasRef.current) {
        const shift = selectionRef.current.shift;
        const start = selectionRef.current.start;
        selectionRef.current = null;
        setSelectionRect(null);
        selectionRectRef.current = null;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const current = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
        const rect = {
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          width: Math.abs(start.x - current.x),
          height: Math.abs(start.y - current.y),
        };

        if (rect.width > 0 || rect.height > 0) {
          const selected: string[] = [];
          const elements = document.querySelectorAll('.node-root');
          elements.forEach((el) => {
            const nodeId = (el as HTMLElement).dataset.nodeId;
            if (!nodeId) return;
            const nodeRect = (el as HTMLElement).getBoundingClientRect();
            const localRect = {
              left: nodeRect.left - canvasRect.left,
              right: nodeRect.right - canvasRect.left,
              top: nodeRect.top - canvasRect.top,
              bottom: nodeRect.bottom - canvasRect.top,
            };

            const intersects =
              rect.x < localRect.right &&
              rect.x + rect.width > localRect.left &&
              rect.y < localRect.bottom &&
              rect.y + rect.height > localRect.top;

            if (intersects) selected.push(nodeId);
          });

          if (selected.length > 0) {
            const next = shift
              ? Array.from(new Set([...selectedNodeIds, ...selected]))
              : selected;
            onSelectNodes(next);
          } else if (!shift) {
            onSelectNodes([]);
          }
          selectionMadeRef.current = true;
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Clean up any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [view.scale, selectedNodeIds, onSelectNodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (contextMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-context-menu="true"]')) {
          setContextMenu(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [contextMenu]);

  const handleAddCommentForSelection = useCallback(() => {
    if (!canvasRef.current || selectedNodeIds.length === 0) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const elements = Array.from(document.querySelectorAll('.node-root')) as HTMLElement[];
    const selectedElements = elements.filter(el => selectedNodeIds.includes(el.dataset.nodeId || ''));
    if (selectedElements.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      minX = Math.min(minX, rect.left - canvasRect.left);
      minY = Math.min(minY, rect.top - canvasRect.top);
      maxX = Math.max(maxX, rect.right - canvasRect.left);
      maxY = Math.max(maxY, rect.bottom - canvasRect.top);
    });

    if (!isFinite(minX) || !isFinite(minY)) return;

    const topLeft = screenToWorld({ x: minX, y: minY });
    const bottomRight = screenToWorld({ x: maxX, y: maxY });
    const pad = 20 / view.scale;
    const header = 28 / view.scale;

    const definition = getNodeDefinition('comment');
    const snappedPos = snapPosition({
      x: topLeft.x - pad,
      y: topLeft.y - pad - header,
    });
    const commentNode = buildNodeFromDefinition(definition, snappedPos);
    if (!commentNode) return;

    commentNode.size = {
      width: (bottomRight.x - topLeft.x) + pad * 2,
      height: (bottomRight.y - topLeft.y) + pad * 2 + header,
    };

    onAddNodeRef.current(commentNode);
    onSelectNodes([...selectedNodeIds, commentNode.id]);
  }, [selectedNodeIds, view.scale, onSelectNodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest('input, textarea')) return;
      if (tempConnectionRef.current || quickMenu) return;

      const key = e.key.toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && key === 'c') {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          handleCopyNodes(selectedNodeIds);
        }
        return;
      }

      if (isCtrl && key === 'v') {
        e.preventDefault();
        const pastePos = lastMousePosRef.current ? screenToWorld(lastMousePosRef.current) : undefined;
        handlePasteNodes(pastePos);
        return;
      }

      if (!isCtrl && key === 'c') {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          handleAddCommentForSelection();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeIds, quickMenu, handleAddCommentForSelection]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      forceRender(k => k + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [view]);

  // Handle port mouse down - start connection
  const handlePortMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    isInput: boolean,
    portType: 'exec' | 'data',
    dataType?: NodeDataType
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setContextMenu(null);

    const portElement = e.currentTarget as HTMLElement;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const portRect = portElement.getBoundingClientRect();
    const portPos = {
      x: portRect.left - canvasRect.left + portRect.width / 2,
      y: portRect.top - canvasRect.top + portRect.height / 2,
    };

    tempConnectionRef.current = {
      from: portPos,
      to: portPos,
      fromNodeId: nodeId,
      fromPortId: portId,
      fromIsInput: isInput,
      portType,
      dataType,
    };

    setTempConnectionLine({
      from: portPos,
      to: portPos,
    });
  };

  const startConnectionDragFromPort = (
    nodeId: string,
    portId: string,
    isInput: boolean,
    portType: 'exec' | 'data',
    dataType?: NodeDataType
  ) => {
    const portPos = getPortPositionFromDOM(nodeId, portId);
    if (!portPos) return;

    tempConnectionRef.current = {
      from: portPos,
      to: portPos,
      fromNodeId: nodeId,
      fromPortId: portId,
      fromIsInput: isInput,
      portType,
      dataType,
    };

    setTempConnectionLine({
      from: portPos,
      to: portPos,
    });
  };

  // Handle node mouse down - start dragging
  const handleNodeMouseDown = (
    e: React.MouseEvent,
    node: ScriptNode
  ) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.classList.contains('node-port') || target.closest('button')) {
      return;
    }

    e.preventDefault();
    const isCommentNode = node.type === 'comment';
    let commentContainedIds: string[] = [];
    if (isCommentNode && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const commentElement = target.closest('.node-root') as HTMLElement | null;
      const commentRect = commentElement?.getBoundingClientRect();
      if (commentRect) {
        const padding = 6;
        const elements = Array.from(document.querySelectorAll('.node-root')) as HTMLElement[];
        commentContainedIds = elements
          .map((el) => {
            const nodeId = el.dataset.nodeId;
            if (!nodeId || nodeId === node.id) return null;
            const rect = el.getBoundingClientRect();
            const inside =
              rect.left >= commentRect.left + padding &&
              rect.right <= commentRect.right - padding &&
              rect.top >= commentRect.top + padding &&
              rect.bottom <= commentRect.bottom - padding;
            return inside ? nodeId : null;
          })
          .filter((id): id is string => !!id);
      }
    }
    if (e.shiftKey) {
      const next = selectedNodeIds.includes(node.id)
        ? selectedNodeIds.filter(id => id !== node.id)
        : [...selectedNodeIds, node.id];
      onSelectNodes(next);
    } else if (!selectedNodeIds.includes(node.id)) {
      onSelectNodes([node.id]);
    }

    const dragIds = isCommentNode
      ? Array.from(new Set([node.id, ...commentContainedIds]))
      : (selectedNodeIds.includes(node.id) ? selectedNodeIds : [node.id]);

    if (dragIds.length > 1) {
      const nodeStarts = new Map<string, { x: number; y: number }>();
      nodes.forEach((n) => {
        if (dragIds.includes(n.id)) {
          nodeStarts.set(n.id, { x: n.position.x, y: n.position.y });
        }
      });
      draggingSelectionRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        nodeStarts,
      };
    } else {
      draggingNodeRef.current = {
        nodeId: node.id,
        startX: e.clientX,
        startY: e.clientY,
        nodeStartX: node.position.x,
        nodeStartY: node.position.y,
      };
    }
    setIsDragging(true);
  };

  // Handle comment resize start
  const handleCommentResizeStart = (
    e: React.MouseEvent,
    node: ScriptNode,
    edge: 'right' | 'bottom' | 'corner'
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const width = node.size?.width || 300;
    const height = node.size?.height || 150;

    resizingCommentRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: width,
      startHeight: height,
      edge,
    };
    setIsDragging(true);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (selectionMadeRef.current) {
      selectionMadeRef.current = false;
      return;
    }
    if (e.target === canvasRef.current || e.target === svgRef.current) {
      onSelectNodes([]);
      setContextMenu(null);
    }
  };

  const handlePortContextMenu = (
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    isInput: boolean
  ) => {
    if (!isInput) return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'port',
      nodeId,
      portId,
    });
  };

  // Context menu for canvas (empty area)
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    // Calculate canvas position for node placement
    const canvasPos = {
      x: (e.clientX - canvasRect.left - view.x) / view.scale,
      y: (e.clientY - canvasRect.top - view.y) / view.scale,
    };
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
      canvasPos,
    });
  };

  // Context menu for a single node
  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If multiple nodes are selected and this node is one of them, show multi-node menu
    if (selectedNodeIds.length > 1 && selectedNodeIds.includes(nodeId)) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'nodes',
        nodeIds: selectedNodeIds,
      });
    } else {
      // Single node - select it if not already selected
      if (!selectedNodeIds.includes(nodeId)) {
        onSelectNodes([nodeId]);
      }
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'node',
        nodeId,
      });
    }
  };

  // Context menu for a connection
  const handleConnectionContextMenu = (e: React.MouseEvent, connectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (rewireActiveRef.current || e.ctrlKey) return;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'connection',
      connectionId,
    });
  };

  // Copy selected nodes to clipboard
  const handleCopyNodes = (nodeIds: string[]) => {
    const nodesToCopy = nodes.filter(n => nodeIds.includes(n.id));
    // Also copy connections that are between the copied nodes
    const connectionsToCopy = connections.filter(c => 
      nodeIds.includes(c.from.nodeId) && nodeIds.includes(c.to.nodeId)
    );
    setClipboard({
      nodes: nodesToCopy.map(n => ({ ...n })),
      connections: connectionsToCopy.map(c => ({ ...c })),
    });
    setContextMenu(null);
  };

  // Paste nodes from clipboard
  const handlePasteNodes = (position?: { x: number; y: number }) => {
    if (clipboard.nodes.length === 0) return;
    
    // Calculate offset from original positions
    const minX = Math.min(...clipboard.nodes.map(n => n.position.x));
    const minY = Math.min(...clipboard.nodes.map(n => n.position.y));
    
    // Snap the base paste position if grid is enabled
    const basePastePos = snapPosition({
      x: position?.x ?? minX + 50,
      y: position?.y ?? minY + 50,
    });
    
    const offsetX = basePastePos.x - minX;
    const offsetY = basePastePos.y - minY;
    
    // Create new nodes with new IDs
    const idMap = new Map<string, string>();
    const newNodes: ScriptNode[] = clipboard.nodes.map(n => {
      const newId = `${n.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(n.id, newId);
      // Snap each node's new position to maintain relative alignment on grid
      const newPos = snapPosition({
        x: n.position.x + offsetX,
        y: n.position.y + offsetY,
      });
      return {
        ...n,
        id: newId,
        position: newPos,
      };
    });
    
    // Add all new nodes
    newNodes.forEach(n => onAddNodeRef.current(n));
    
    // Recreate connections between pasted nodes
    clipboard.connections.forEach(conn => {
      const newFromId = idMap.get(conn.from.nodeId);
      const newToId = idMap.get(conn.to.nodeId);
      if (newFromId && newToId) {
        const newConnection: NodeConnection = {
          id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          from: { nodeId: newFromId, portId: conn.from.portId },
          to: { nodeId: newToId, portId: conn.to.portId },
        };
        onConnectRef.current(newConnection);
      }
    });
    
    // Select the newly pasted nodes
    onSelectNodes(newNodes.map(n => n.id));
    setContextMenu(null);
  };

  // Delete selected nodes
  const handleDeleteNodes = (nodeIds: string[]) => {
    nodeIds.forEach(id => onDeleteNode(id));
    onSelectNodes([]);
    setContextMenu(null);
  };

  // Break a connection
  const handleBreakConnection = (connectionId: string) => {
    onDeleteConnectionRef.current?.(connectionId);
    setContextMenu(null);
  };

  const handleConnectionRewireStart = (e: React.MouseEvent, conn: NodeConnection) => {
    if (e.button !== 2 || !e.ctrlKey) return;
    e.preventDefault();
    e.stopPropagation();
    rewireActiveRef.current = true;

    const fromNode = nodes.find(node => node.id === conn.from.nodeId);
    const toNode = nodes.find(node => node.id === conn.to.nodeId);
    if (!fromNode || !toNode) return;

    const fromPort = fromNode.outputs.find(port => port.id === conn.from.portId);
    const toPort = toNode.inputs.find(port => port.id === conn.to.portId);
    if (!fromPort || !toPort) return;

    const fromPos = getPortPositionFromDOM(conn.from.nodeId, conn.from.portId);
    const toPos = getPortPositionFromDOM(conn.to.nodeId, conn.to.portId);
    if (!fromPos || !toPos) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    const distToFrom = Math.hypot(mouseX - fromPos.x, mouseY - fromPos.y);
    const distToTo = Math.hypot(mouseX - toPos.x, mouseY - toPos.y);
    const grabInputSide = distToTo <= distToFrom;

    onDeleteConnectionRef.current?.(conn.id);

    if (grabInputSide) {
      startConnectionDragFromPort(conn.to.nodeId, conn.to.portId, true, toPort.type, toPort.dataType);
    } else {
      startConnectionDragFromPort(conn.from.nodeId, conn.from.portId, false, fromPort.type, fromPort.dataType);
    }
  };

  const handleInsertReroute = (e: React.MouseEvent, conn: NodeConnection) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;

    const fromNode = nodes.find(node => node.id === conn.from.nodeId);
    const fromPort =
      fromNode?.outputs.find(port => port.id === conn.from.portId) ||
      fromNode?.inputs.find(port => port.id === conn.from.portId);
    if (!fromPort) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const screenPos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
    const worldPos = screenToWorld(screenPos);
    const definition = getNodeDefinition('reroute');
    const snappedPos = snapPosition({
      x: worldPos.x - 18,
      y: worldPos.y - 18,
    });
    const newNode = buildNodeFromDefinition(definition, snappedPos);
    if (!newNode) return;

    // Set port types based on the connection being rerouted
    const isExec = fromPort.type === 'exec';
    newNode.data.isExec = isExec;
    if (isExec) {
      newNode.inputs[0].type = 'exec';
      newNode.outputs[0].type = 'exec';
    } else {
      newNode.inputs[0].dataType = fromPort.dataType;
      newNode.outputs[0].dataType = fromPort.dataType;
    }

    onAddNodeRef.current(newNode);
    onDeleteConnectionRef.current?.(conn.id);

    const inputPort = newNode.inputs[0];
    const outputPort = newNode.outputs[0];
    if (!inputPort || !outputPort) return;

    onConnectRef.current({
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      from: { nodeId: conn.from.nodeId, portId: conn.from.portId },
      to: { nodeId: newNode.id, portId: inputPort.id },
    });
    onConnectRef.current({
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      from: { nodeId: newNode.id, portId: outputPort.id },
      to: { nodeId: conn.to.nodeId, portId: conn.to.portId },
    });
  };

  // Open quick node menu from context menu
  const handleOpenQuickMenu = (canvasPosition: { x: number; y: number }, screenPosition: { x: number; y: number }) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    // Store the canvas position for node placement, screen position for menu display
    // No sourcePort means show all nodes
    setQuickMenu({
      screenPosition: screenPosition,
      canvasPosition: canvasPosition,
      sourcePort: undefined,
    });
    setContextMenu(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    panningRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      viewStartX: view.x,
      viewStartY: view.y,
    };
  };

  const handleSelectionStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!canvasRef.current) return;
    if (tempConnectionRef.current || panningRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-connection-hit="true"]')) return;
    if (target.closest('.node-root') || target.classList.contains('node-port')) return;

    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    selectionRef.current = {
      start: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      shift: e.shiftKey,
    };
    const nextRect = { x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 };
    selectionRectRef.current = nextRect;
    setSelectionRect(nextRect);
    if (!e.shiftKey) {
      onSelectNodes([]);
    }
  };

  // Wheel handler attached via useEffect with { passive: false } to allow preventDefault
  const handleCanvasWheelRef = useRef<((e: WheelEvent) => void) | undefined>(undefined);
  handleCanvasWheelRef.current = (e: WheelEvent) => {
    if (!canvasRef.current) return;
    if (panningRef.current) return;
    if (e.target instanceof Element && e.target.closest('[data-quick-node-menu="true"]')) return;
    e.preventDefault();

    // Cancel any pending RAF pan updates to avoid conflicts
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    setView(current => {
      // Use pending view position if available (from in-flight pan updates)
      const currentX = pendingViewRef.current?.x ?? current.x;
      const currentY = pendingViewRef.current?.y ?? current.y;
      pendingViewRef.current = null;

      const newScale = Math.min(2.5, Math.max(0.3, current.scale * zoomFactor));
      if (newScale === current.scale) return current;

      const scaleRatio = newScale / current.scale;
      return {
        scale: newScale,
        x: cursor.x - (cursor.x - currentX) * scaleRatio,
        y: cursor.y - (cursor.y - currentY) * scaleRatio,
      };
    });
  };

  // Attach wheel listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      handleCanvasWheelRef.current?.(e);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('node-type')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    const nodeType = e.dataTransfer.getData('node-type');
    if (!nodeType || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPos = screenToWorld(screenPos);
    const definition = getNodeDefinition(nodeType);
    const snappedPos = snapPosition({
      x: worldPos.x - 90,
      y: worldPos.y - 30,
    });
    const newNode = buildNodeFromDefinition(definition, snappedPos);

    if (newNode) {
      onAddNodeRef.current(newNode);
      setContextMenu(null);
      requestAnimationFrame(() => {
        forceRender(k => k + 1);
      });
    }
  };

  const buildNodeFromDefinition = (definition: ReturnType<typeof getNodeDefinition>, position: { x: number; y: number }): ScriptNode | null => {
    if (!definition) return null;
    const node: ScriptNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position,
      data: { ...definition.defaultData },
      inputs: definition.inputs.map((input, idx) => ({
        ...input,
        id: `input_${idx}`,
      })),
      outputs: definition.outputs.map((output, idx) => ({
        ...output,
        id: `output_${idx}`,
      })),
    };

    // Set default size for comment nodes
    if (definition.type === 'comment') {
      node.size = { width: 300, height: 150 };
    }

    return node;
  };

  const getConnectPortIndex = (
    definition: ReturnType<typeof getNodeDefinition>,
    sourcePort: QuickMenuState['sourcePort']
  ): number => {
    if (!definition || !sourcePort) return -1;
    const portsToCheck = sourcePort.isInput ? definition.outputs : definition.inputs;

    for (let i = 0; i < portsToCheck.length; i++) {
      const port = portsToCheck[i];
      if (sourcePort.portType === 'exec' && port.type === 'exec') {
        return i;
      }
      if (
        sourcePort.portType === 'data' &&
        port.type === 'data' &&
        areTypesCompatible(sourcePort.dataType, port.dataType)
      ) {
        return i;
      }
    }

    return -1;
  };

  // Handle node selection from QuickNodeMenu
  const handleQuickNodeSelect = useCallback((newNode: ScriptNode, connectToPortIndex: number) => {
    if (!quickMenu) return;

    // Use the pre-computed canvas position directly, with grid snap
    newNode.position = snapPosition({
      x: quickMenu.canvasPosition.x - 90,
      y: quickMenu.canvasPosition.y - 30,
    });

    // Add the new node
    onAddNode(newNode);

    // Create the connection only if we have a sourcePort
    const sourcePort = quickMenu.sourcePort;

    if (sourcePort && connectToPortIndex >= 0) {
      // Determine which port on the new node to connect to
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
        onConnect(connection);
      }
    }

    // Close the menu
    setQuickMenu(null);

    // Force re-render after DOM updates so connection lines appear
    requestAnimationFrame(() => {
      forceRender(k => k + 1);
    });
  }, [quickMenu, onAddNode, onConnect, view]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tempConnectionRef.current || quickMenu) return;
      if (e.target && (e.target as HTMLElement).closest('input, textarea')) return;

      const key = e.key.toLowerCase();
      let nodeType: string | null = null;

      if (key === 'b') nodeType = 'branch';
      if (key === 'r') nodeType = 'reroute';
      if (key === '1') nodeType = 'const-int';
      if (key === '3') nodeType = 'const-vector';
      if (!nodeType) return;

      const tempConn = tempConnectionRef.current;
      if (!tempConn) return;

      e.preventDefault();

      const definition = getNodeDefinition(nodeType);
      const sourcePort: QuickMenuState['sourcePort'] = {
        nodeId: tempConn.fromNodeId,
        portId: tempConn.fromPortId,
        isInput: tempConn.fromIsInput,
        portType: tempConn.portType,
        dataType: tempConn.dataType,
      };

      const connectPortIndex = getConnectPortIndex(definition, sourcePort);
      const fallbackPos = tempConnectionLine?.to || tempConn.to;
      const cursorPos = lastMousePosRef.current || fallbackPos;
      const worldPos = screenToWorld(cursorPos);
      const snappedPos = snapPosition({
        x: worldPos.x - (nodeType === 'reroute' ? 18 : 90),
        y: worldPos.y - (nodeType === 'reroute' ? 18 : 30),
      });
      const newNode = buildNodeFromDefinition(definition, snappedPos);

      if (newNode) {
        // Configure reroute node port types based on the connection type
        if (nodeType === 'reroute') {
          const isExec = sourcePort.portType === 'exec';
          newNode.data.isExec = isExec;
          if (isExec) {
            newNode.inputs[0].type = 'exec';
            newNode.outputs[0].type = 'exec';
          } else {
            newNode.inputs[0].dataType = sourcePort.dataType;
            newNode.outputs[0].dataType = sourcePort.dataType;
          }
        }

        onAddNodeRef.current(newNode);

        if (connectPortIndex >= 0) {
          const newNodePorts = sourcePort.isInput ? newNode.outputs : newNode.inputs;
          const targetPort = newNodePorts[connectPortIndex];
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
            onConnectRef.current(connection);
          }
        }

        tempConnectionRef.current = null;
        setTempConnectionLine(null);
        setQuickMenu(null);

        requestAnimationFrame(() => {
          forceRender(k => k + 1);
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [buildNodeFromDefinition, getConnectPortIndex, quickMenu, tempConnectionLine]);

  // Cache connection paths - recalculates when nodes, connections, or port positions change
  const cachedConnectionPaths = useMemo(() => {
    return connections.map((conn) => {
      const fromPos = getPortPositionFromCache(conn.from.nodeId, conn.from.portId);
      const toPos = getPortPositionFromCache(conn.to.nodeId, conn.to.portId);
      
      if (!fromPos || !toPos) return null;
      
      const pathD = generateConnectionPathCanvasSpace(fromPos, toPos);
      
      const fromNode = nodes.find(node => node.id === conn.from.nodeId);
      const fromPort =
        fromNode?.outputs.find(port => port.id === conn.from.portId) ||
        fromNode?.inputs.find(port => port.id === conn.from.portId);
      const stroke = getLineColor(fromPort?.type || 'data', fromPort?.dataType);
      
      return {
        id: conn.id,
        pathD,
        stroke,
        fromNodeId: conn.from.nodeId,
        toNodeId: conn.to.nodeId,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, connections, connectionStyle, portCacheVersion]);

  // Memoize node positions for stable rendering
  const nodePositions = useMemo(() => {
    return new Map(nodes.map(n => [n.id, n.position]));
  }, [nodes]);

  // Render connection paths using cached data - memoized to prevent recreation
  const renderConnections = useCallback(() => {
    // Fixed stroke widths since SVG is inside transformed container
    const baseStroke = 2.5;
    const hoverStroke = 3.5;
    const glowStroke = 8;
    const hitStroke = 12;
    const flowRadius = 3;

    return cachedConnectionPaths.map((cached) => {
      const { id, pathD, stroke, fromNodeId, toNodeId } = cached;
      const conn = connections.find(c => c.id === id);
      if (!conn) return null;
      
      const isHovered = hoveredConnection === id;
      
      // Highlight connections when hovering over connected node
      const isNodeHighlighted = highlightConnections && hoveredNodeId && 
        (fromNodeId === hoveredNodeId || toNodeId === hoveredNodeId);

      return (
        <g key={id}>
          {/* Glow effect on hover or node highlight */}
          {(isHovered || isNodeHighlighted) && (
            <path
              d={pathD}
              stroke={stroke}
              strokeWidth={glowStroke}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none', opacity: 0.3, filter: 'blur(4px)' }}
            />
          )}
          {/* Invisible wider path for easier clicking */}
          <path
            d={pathD}
            stroke="transparent"
            strokeWidth={hitStroke}
            fill="none"
            pointerEvents="stroke"
            style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
            data-connection-hit="true"
            onMouseEnter={() => setHoveredConnection(id)}
            onMouseLeave={() => setHoveredConnection(null)}
            onContextMenu={(e) => handleConnectionContextMenu(e, id)}
            onMouseDown={(e) => handleConnectionRewireStart(e, conn)}
            onDoubleClick={(e) => handleInsertReroute(e, conn)}
          />
          {/* Visible connection line */}
          <path
            d={pathD}
            stroke={stroke}
            strokeWidth={(isHovered || isNodeHighlighted) ? hoverStroke : baseStroke}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ 
              pointerEvents: 'none',
              transition: 'stroke-width 0.15s ease-out',
              filter: (isHovered || isNodeHighlighted) ? 'brightness(1.3)' : undefined
            }}
          />
          {/* Animated flow indicator */}
          {animateConnections && (
            <circle
              r={flowRadius}
              fill={stroke}
              style={{
                filter: 'brightness(1.5)',
              }}
            >
              <animateMotion
                dur="1.5s"
                repeatCount="indefinite"
                path={pathD}
              />
            </circle>
          )}
        </g>
      );
    });
  }, [cachedConnectionPaths, connections, hoveredConnection, highlightConnections, hoveredNodeId, animateConnections, handleConnectionContextMenu, handleConnectionRewireStart, handleInsertReroute]);

  return (
    <div
      ref={canvasRef}
      className="node-graph-container relative w-full h-full bg-[#1a1f28] overflow-hidden"
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseDownCapture={handleSelectionStart}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      onContextMenu={(e) => {
        if (rewireActiveRef.current || e.ctrlKey) {
          e.preventDefault();
          return;
        }
        // Only show canvas context menu if clicking on empty area (not on nodes)
        const target = e.target as HTMLElement;
        const isNode = target.closest('.node-root');
        const isPort = target.closest('.node-port');
        if (!isNode && !isPort) {
          handleCanvasContextMenu(e);
        }
      }}
      style={{
        cursor: isDragging || panningRef.current ? 'grabbing' : 'default',
        contain: 'layout style paint',
        isolation: 'isolate',
      }}
    >
      {/* Separate background layer for GPU compositing */}
      {showGridLines && (() => {
        // Grid color helpers - use accent color when coloredGrid is enabled
        const gridColor = coloredGrid 
          ? `${accentColor}${theme === 'light' ? '25' : '35'}` 
          : (theme === 'light' ? 'rgba(0,0,0,0.08)' : '#2a2e38');
        const gridColorLight = coloredGrid 
          ? `${accentColor}${theme === 'light' ? '15' : '20'}` 
          : (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)');
        const gridColorStrong = coloredGrid 
          ? `${accentColor}${theme === 'light' ? '40' : '50'}` 
          : (theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)');
        const dotColor = coloredGrid 
          ? `${accentColor}${theme === 'light' ? '40' : '60'}` 
          : (theme === 'light' ? 'rgba(0,0,0,0.15)' : '#2a2e38');
        const svgStrokeColor = coloredGrid 
          ? accentColor.replace('#', '%23') 
          : (theme === 'light' ? '%23000' : '%23444');
        const svgStrokeOpacity = coloredGrid 
          ? (theme === 'light' ? '0.25' : '0.4') 
          : (theme === 'light' ? '0.12' : '0.35');
        const hexStrokeColor = coloredGrid 
          ? accentColor 
          : (theme === 'light' ? '#000' : '#555');
        const hexStrokeOpacity = coloredGrid 
          ? (theme === 'light' ? '0.3' : '0.5') 
          : (theme === 'light' ? '0.1' : '0.25');
        const bgTint = coloredGrid || gridStyle === 'blueprint' 
          ? (theme === 'light' ? `${accentColor}10` : `${accentColor}15`) 
          : undefined;
        
        return (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: bgTint,
            backgroundImage: gridStyle === 'dots' 
              ? `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`
              : gridStyle === 'lines'
              ? `linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                 linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`
              : gridStyle === 'crosshatch'
              ? `linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                 linear-gradient(to bottom, ${gridColor} 1px, transparent 1px),
                 repeating-linear-gradient(45deg, transparent, transparent 10px, ${gridColorLight} 10px, ${gridColorLight} 11px),
                 repeating-linear-gradient(-45deg, transparent, transparent 10px, ${gridColorLight} 10px, ${gridColorLight} 11px)`
              : gridStyle === 'hexagons'
              ? `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='50' height='86.6' viewBox='0 0 50 86.6'><polygon fill='none' stroke='${hexStrokeColor}' stroke-width='1' stroke-opacity='${hexStrokeOpacity}' points='25,0 50,14.43 50,43.3 25,57.74 0,43.3 0,14.43'/><polygon fill='none' stroke='${hexStrokeColor}' stroke-width='1' stroke-opacity='${hexStrokeOpacity}' points='50,43.3 75,57.74 75,86.6 50,101.04 25,86.6 25,57.74'/><polygon fill='none' stroke='${hexStrokeColor}' stroke-width='1' stroke-opacity='${hexStrokeOpacity}' points='0,43.3 25,57.74 25,86.6 0,101.04 -25,86.6 -25,57.74'/></svg>`)}")`
              : gridStyle === 'isometric'
              ? `repeating-linear-gradient(30deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent 20px),
                 repeating-linear-gradient(150deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent 20px),
                 repeating-linear-gradient(90deg, ${gridColorLight} 0px, ${gridColorLight} 1px, transparent 1px, transparent 20px)`
              : gridStyle === 'blueprint'
              ? `linear-gradient(to right, ${accentColor}30 1px, transparent 1px),
                 linear-gradient(to bottom, ${accentColor}30 1px, transparent 1px),
                 linear-gradient(to right, ${accentColor}60 1px, transparent 1px),
                 linear-gradient(to bottom, ${accentColor}60 1px, transparent 1px)`
              : gridStyle === 'diamonds'
              ? `repeating-linear-gradient(45deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent 14px),
                 repeating-linear-gradient(-45deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent 14px)`
              : gridStyle === 'triangles'
              ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Cpath fill='none' stroke='${svgStrokeColor}' stroke-width='0.5' stroke-opacity='${svgStrokeOpacity}' d='M20 0 L40 35 L0 35 Z M0 0 L20 35 L40 0'/%3E%3C/svg%3E")`
              : gridStyle === 'graph'
              ? `linear-gradient(to right, ${gridColorLight} 1px, transparent 1px),
                 linear-gradient(to bottom, ${gridColorLight} 1px, transparent 1px),
                 linear-gradient(to right, ${gridColorStrong} 1px, transparent 1px),
                 linear-gradient(to bottom, ${gridColorStrong} 1px, transparent 1px)`
              : // waves
                `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cpath fill='none' stroke='${svgStrokeColor}' stroke-width='0.5' stroke-opacity='${coloredGrid ? (theme === 'light' ? '0.25' : '0.4') : (theme === 'light' ? '0.1' : '0.3')}' d='M0 10 Q10 0, 20 10 T40 10'/%3E%3C/svg%3E")`,
            backgroundSize: gridStyle === 'dots'
              ? `${gridSize * view.scale}px ${gridSize * view.scale}px`
              : gridStyle === 'lines'
              ? `${gridSize * view.scale}px ${gridSize * view.scale}px`
              : gridStyle === 'crosshatch'
              ? `${gridSize * view.scale}px ${gridSize * view.scale}px, ${gridSize * view.scale}px ${gridSize * view.scale}px, auto, auto`
              : gridStyle === 'hexagons'
              ? `${50 * view.scale}px ${86.6 * view.scale}px`
              : gridStyle === 'isometric'
              ? 'auto'
              : gridStyle === 'blueprint'
              ? `${gridSize * view.scale}px ${gridSize * view.scale}px, ${gridSize * view.scale}px ${gridSize * view.scale}px, ${gridSize * 5 * view.scale}px ${gridSize * 5 * view.scale}px, ${gridSize * 5 * view.scale}px ${gridSize * 5 * view.scale}px`
              : gridStyle === 'diamonds'
              ? 'auto'
              : gridStyle === 'triangles'
              ? `${40 * view.scale}px ${35 * view.scale}px`
              : gridStyle === 'graph'
              ? `${gridSize * view.scale}px ${gridSize * view.scale}px, ${gridSize * view.scale}px ${gridSize * view.scale}px, ${gridSize * 5 * view.scale}px ${gridSize * 5 * view.scale}px, ${gridSize * 5 * view.scale}px ${gridSize * 5 * view.scale}px`
              : // waves
                `${40 * view.scale}px ${20 * view.scale}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
            willChange: 'background-position, background-size',
            contain: 'strict',
          }}
        />
        );
      })()}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          zIndex: connectionsBehindNodes ? 10 : 1,
          // Force crisp rendering at any scale
          imageRendering: 'auto',
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'subpixel-antialiased',
        } as React.CSSProperties}
      >
        {/* Render nodes first so DOM is ready for connection queries */}
        {nodes.map((node) => {
          const isSelected = selectedNodeIds.includes(node.id);
          const nodeColor = getNodeDefinitionColor(node.type);
          const isReroute = node.type === 'reroute';
          const isComment = node.type === 'comment';

          // Render comment nodes as resizable boxes that stay behind other nodes
          if (isComment) {
            const width = node.size?.width || 300;
            const height = node.size?.height || 150;
            const commentColor = typeof node.data.commentColor === 'string' ? node.data.commentColor : '#6C7A89';
            const commentText = typeof node.data.comment === 'string' ? node.data.comment : 'Comment';

            return (
              <div
                key={node.id}
                className="node-root absolute select-none"
                data-node-id={node.id}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width,
                  height,
                  zIndex: isSelected ? 0 : -1, // Always behind other nodes
                  cursor: 'grab',
                  opacity: nodeOpacity / 100,
                  userSelect: 'none',
                  boxShadow: isSelected ? `0 0 0 2px ${accentColor}` : undefined,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Comment background */}
                <div
                  className="absolute inset-0 rounded-xl border-2"
                  style={{
                    backgroundColor: `${commentColor}15`,
                    borderColor: `${commentColor}50`,
                    boxShadow: `inset 0 0 0 1px ${commentColor}10`,
                  }}
                />

                {/* Comment header/title bar */}
                <div
                  className="absolute top-0 left-0 right-0 px-3 py-2 rounded-t-xl flex items-center justify-between border-b"
                  style={{ 
                    background: `linear-gradient(135deg, ${commentColor} 0%, ${commentColor}dd 100%)`,
                    borderColor: `${commentColor}80`,
                  }}
                >
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, comment: e.target.value } })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="bg-transparent text-white text-sm font-semibold outline-none flex-1 min-w-0"
                    placeholder="Comment"
                  />
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      className="p-0.5 hover:bg-black/20 rounded transition-colors ml-2"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  )}
                </div>

                {/* Color picker - only shown when selected */}
                {isSelected && (
                  <div className="absolute top-8 left-2 flex gap-1">
                    {['#6C7A89', '#E74C3C', '#E67E22', '#F1C40F', '#27AE60', '#3498DB', '#9B59B6', '#1ABC9C'].map((color) => (
                      <button
                        key={color}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateNodeRef.current(node.id, { data: { ...node.data, commentColor: color } });
                        }}
                        className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${color === commentColor ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}

                {/* Resize handle - right edge */}
                <div
                  className="absolute top-8 bottom-2 right-0 w-2 cursor-ew-resize hover:bg-purple-500/30 transition-colors"
                  onMouseDown={(e) => handleCommentResizeStart(e, node, 'right')}
                />

                {/* Resize handle - bottom edge */}
                <div
                  className="absolute bottom-0 left-0 right-2 h-2 cursor-ns-resize hover:bg-purple-500/30 transition-colors"
                  onMouseDown={(e) => handleCommentResizeStart(e, node, 'bottom')}
                />

                {/* Resize handle - corner */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group"
                  onMouseDown={(e) => handleCommentResizeStart(e, node, 'corner')}
                >
                  <svg
                    className="w-full h-full text-white/30 group-hover:text-purple-400 transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M14 14H16V16H14V14ZM10 14H12V16H10V14ZM14 10H16V12H14V10Z" />
                  </svg>
                </div>
              </div>
            );
          }

          if (isReroute) {
            const inputPort = node.inputs[0];
            const outputPort = node.outputs[0];
            const portSize = 16;
            const nodeSize = 36;
            const hitSize = 28;
            const portOffset = hitSize / 2;
            // Determine if this reroute is for exec flow by checking connected port types
            const incomingConn = connections.find(c => c.to.nodeId === node.id && c.to.portId === inputPort?.id);
            const outgoingConn = connections.find(c => c.from.nodeId === node.id && c.from.portId === outputPort?.id);
            const connectedNode = incomingConn ? nodes.find(n => n.id === incomingConn.from.nodeId) : (outgoingConn ? nodes.find(n => n.id === outgoingConn.to.nodeId) : null);
            const connectedPort = incomingConn 
              ? connectedNode?.outputs.find(p => p.id === incomingConn.from.portId) 
              : (outgoingConn ? connectedNode?.inputs.find(p => p.id === outgoingConn.to.portId) : null);
            const isExec = connectedPort?.type === 'exec' || node.data?.isExec === true;

            return (
            <div
              key={node.id}
              className="node-root absolute select-none"
              data-node-id={node.id}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: nodeSize,
                height: nodeSize,
                cursor: 'grab',
                userSelect: 'none',
                zIndex: isSelected ? 100 : 1,
                opacity: nodeOpacity / 100,
                boxShadow: isSelected ? `0 0 0 2px ${accentColor}` : undefined,
                borderRadius: '4px',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              {/* Central diamond/circle shape */}
              <div 
                className={`absolute inset-1 ${isExec ? 'rotate-45' : 'rounded-full'} border-2 transition-colors ${isSelected ? '' : 'border-white/30 hover:border-white/50'}`}
                style={{ 
                  backgroundColor: theme === 'light' 
                    ? (isExec ? '#e9ecef' : '#f8f9fa') 
                    : (isExec ? '#2a303c' : '#1a1f28'),
                  borderColor: isSelected ? accentColor : (theme === 'light' ? 'rgba(0,0,0,0.2)' : undefined),
                  boxShadow: theme === 'light' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              />

                {inputPort && (
                  <div
                    data-node-id={node.id}
                    data-port-id={inputPort.id}
                    data-is-input="true"
                    className="node-port absolute flex items-center justify-center cursor-crosshair group"
                    style={{
                      width: hitSize,
                      height: hitSize,
                      left: -portOffset,
                      top: (nodeSize - hitSize) / 2,
                    }}
                    onMouseDown={(e) => handlePortMouseDown(e, node.id, inputPort.id, true, inputPort.type, inputPort.dataType)}
                    onContextMenu={(e) => handlePortContextMenu(e, node.id, inputPort.id, true)}
                    title={`${inputPort.label} (${inputPort.type}${inputPort.dataType ? ': ' + inputPort.dataType : ''})`}
                  >
                    <div
                      className={`border-2 transition-transform group-hover:scale-125 ${getPortClasses(inputPort.type, inputPort.dataType)} ${getPortShapeClass(inputPort.type)}`}
                      style={{
                        width: portSize,
                        height: portSize,
                        ...getPortShapeStyle(inputPort.type),
                      }}
                    />
                  </div>
                )}

                {outputPort && (
                  <div
                    data-node-id={node.id}
                    data-port-id={outputPort.id}
                    data-is-input="false"
                    className="node-port absolute flex items-center justify-center cursor-crosshair group"
                    style={{
                      width: hitSize,
                      height: hitSize,
                      right: -portOffset,
                      top: (nodeSize - hitSize) / 2,
                    }}
                    onMouseDown={(e) => handlePortMouseDown(e, node.id, outputPort.id, false, outputPort.type, outputPort.dataType)}
                    title={`${outputPort.label} (${outputPort.type}${outputPort.dataType ? ': ' + outputPort.dataType : ''})`}
                  >
                    <div
                      className={`border-2 transition-transform group-hover:scale-125 ${getPortClasses(outputPort.type, outputPort.dataType)} ${getPortShapeClass(outputPort.type)}`}
                      style={{
                        width: portSize,
                        height: portSize,
                        ...getPortShapeStyle(outputPort.type),
                      }}
                    />
                  </div>
                )}
              </div>
            );
          }

          // Calculate grid-aligned dimensions - use stored size or min values
          const baseMinWidth = 200;
          const gridAlignedMinWidth = snapToGrid 
            ? Math.ceil(baseMinWidth / gridSize) * gridSize 
            : baseMinWidth;
          // Use stored node dimensions if available
          const nodeWidth = snapToGrid && node.size?.width 
            ? node.size.width 
            : undefined;
          const nodeHeight = snapToGrid && node.size?.height 
            ? node.size.height 
            : undefined;

          // Ref callback to measure and snap node dimensions
          const measureNodeSize = (el: HTMLDivElement | null) => {
            if (!el || !snapToGrid) return;
            // Wait for content to render
            requestAnimationFrame(() => {
              // Temporarily remove height constraint to measure natural content height
              const originalHeight = el.style.height;
              el.style.height = 'auto';
              
              const naturalWidth = el.scrollWidth;
              const naturalHeight = el.scrollHeight;
              
              // Restore height
              el.style.height = originalHeight;
              
              const snappedWidth = Math.ceil(naturalWidth / gridSize) * gridSize;
              const snappedHeight = Math.ceil(naturalHeight / gridSize) * gridSize;
              // Only update if dimensions changed
              const widthChanged = snappedWidth !== node.size?.width && snappedWidth >= gridAlignedMinWidth;
              const heightChanged = snappedHeight !== node.size?.height;
              if (widthChanged || heightChanged) {
                onUpdateNodeRef.current(node.id, { 
                  size: { 
                    width: widthChanged ? snappedWidth : (node.size?.width || gridAlignedMinWidth),
                    height: heightChanged ? snappedHeight : node.size?.height,
                  } 
                });
              }
            });
          };

          return (
            <div
              key={node.id}
              ref={measureNodeSize}
              className="node-root absolute bg-[#1a1f28] rounded-xl select-none border border-white/10"
              data-node-id={node.id}
              style={{
                left: node.position.x,
                top: node.position.y,
                minWidth: gridAlignedMinWidth,
                width: nodeWidth,
                height: nodeHeight,
                cursor: 'grab',
                userSelect: 'none',
                zIndex: isSelected ? 100 : 1,
                opacity: nodeOpacity / 100,
                boxShadow: isSelected 
                  ? `0 0 0 2px ${accentColor}, 0 0 0 4px #0f1419, 0 8px 24px rgba(0, 0, 0, 0.4)` 
                  : '0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
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
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(node.id);
                    }}
                    className="p-0.5 hover:bg-white/20 rounded transition-colors"
                  >
                    <Trash2 size={12} className="text-white/90" />
                  </button>
                )}
              </div>

              {/* Node Body */}
              <div className="p-2.5">
                {/* Input Ports */}
                {node.inputs.map((input) => (
                  <div key={input.id} className="flex items-center mb-2">
                    <div
                      data-node-id={node.id}
                      data-port-id={input.id}
                      data-is-input="true"
                      className="node-port w-6 h-6 flex items-center justify-center cursor-crosshair group"
                      onMouseDown={(e) => handlePortMouseDown(e, node.id, input.id, true, input.type, input.dataType)}
                      onContextMenu={(e) => handlePortContextMenu(e, node.id, input.id, true)}
                      title={`${input.label} (${input.type}${input.dataType ? ': ' + input.dataType : ''})`}
                    >
                      <div
                        className={`w-4 h-4 border-2 transition-transform group-hover:scale-125 ${getPortClasses(input.type, input.dataType)} ${getPortShapeClass(input.type)}`}
                        style={getPortShapeStyle(input.type)}
                      />
                    </div>
                    <span className="ml-2 text-xs text-gray-300">{input.label}</span>
                  </div>
                ))}

              {/* Node Data Display */}
              {Object.keys(node.data).length > 0 && (
                <div className="my-2 px-2.5 py-2 bg-black/30 border border-white/5 rounded-lg text-[10px] text-gray-400">
                  {renderInlineEditor(node) ?? (
                    <>
                      {Object.entries(node.data).map(([key, value]) => (
                        <div key={key} className="truncate">
                          {key}: {formatNodeDataValue(value)}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

                {/* Output Ports */}
                {node.outputs.map((output) => (
                  <div key={output.id} className="flex items-center justify-end mb-2">
                    <span className="mr-2 text-xs text-gray-300">{output.label}</span>
                    <div
                      data-node-id={node.id}
                      data-port-id={output.id}
                      data-is-input="false"
                      className="node-port w-6 h-6 flex items-center justify-center cursor-crosshair group"
                      onMouseDown={(e) => handlePortMouseDown(e, node.id, output.id, false, output.type, output.dataType)}
                      title={`${output.label} (${output.type}${output.dataType ? ': ' + output.dataType : ''})`}
                    >
                      <div
                        className={`w-4 h-4 border-2 transition-transform group-hover:scale-125 ${getPortClasses(output.type, output.dataType)} ${getPortShapeClass(output.type)}`}
                        style={getPortShapeStyle(output.type)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* SVG for connections - inside transformed container for lag-free pan/zoom */}
        <svg
          ref={svgRef}
          className="absolute pointer-events-none"
          style={{ 
            zIndex: connectionsBehindNodes ? -1 : 100,
            // Large SVG to cover all possible node positions
            width: '200000px',
            height: '200000px',
            left: '-100000px',
            top: '-100000px',
            overflow: 'visible',
            // GPU acceleration for SVG
            willChange: 'contents',
            contain: 'layout style',
          }}
          preserveAspectRatio="none"
        >
          <g transform="translate(100000, 100000)">
            {renderConnections()}
          </g>
        </svg>
      </div>

      {/* Temporary connection line - in screen space (outside transformed container) */}
      {tempConnectionLine && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 200, width: '100%', height: '100%' }}
        >
          <path
            d={generateConnectionPath(tempConnectionLine.from, tempConnectionLine.to)}
            stroke={getLineColor(tempConnectionRef.current?.portType || 'exec', tempConnectionRef.current?.dataType)}
            strokeWidth={2.5 * view.scale}
            strokeDasharray={`${8 * view.scale},${4 * view.scale}`}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
          <div className="text-center">
            <p className="mb-2">Click nodes in the palette to add them to the canvas</p>
            <p className="text-xs text-gray-700">Drag nodes to reposition • Click and drag between ports to connect</p>
          </div>
        </div>
      )}

      {/* Quick Node Menu - appears when dragging connection to empty space */}
      {quickMenu && (
        <QuickNodeMenu
          position={quickMenu.screenPosition}
          sourcePort={quickMenu.sourcePort}
          onSelectNode={handleQuickNodeSelect}
          onClose={() => setQuickMenu(null)}
        />
      )}

      {selectionRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
            border: `1px solid ${accentColor}`,
            backgroundColor: `${accentColor}15`,
          }}
        />
      )}

      {contextMenu && (
        <div
          data-context-menu="true"
          className="fixed z-[1100] bg-[#1a1f28] border border-white/20 rounded-md shadow-xl text-sm text-white min-w-[160px] py-1"
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
              {clipboard.nodes.length > 0 && (
                <button
                  className="px-3 py-2 hover:bg-white/10 w-full text-left flex items-center gap-2"
                  onClick={() => handlePasteNodes(contextMenu.canvasPos)}
                >
                  Paste ({clipboard.nodes.length} node{clipboard.nodes.length > 1 ? 's' : ''})
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

          {/* Port context menu (break input) */}
          {contextMenu.type === 'port' && contextMenu.nodeId && contextMenu.portId && (
            <button
              className="px-3 py-2 hover:bg-red-500/20 w-full text-left flex items-center gap-2 text-red-400"
              onClick={() => {
                onBreakInput(contextMenu.nodeId!, contextMenu.portId!);
                setContextMenu(null);
              }}
            >
              Break Input
            </button>
          )}
        </div>
      )}

      {/* Code Editor Modal */}
      {codeEditorModal && (
        <div 
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70"
          onClick={() => setCodeEditorModal(null)}
        >
          <div 
            className="bg-[#1a1f28] rounded-lg shadow-2xl w-[800px] h-[40vh] max-w-[90vw] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-semibold">Custom Code Editor</h3>
              <button
                onClick={() => setCodeEditorModal(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 p-4 overflow-hidden">
              <textarea
                value={codeEditorModal.code}
                onChange={(e) => setCodeEditorModal({ ...codeEditorModal, code: e.target.value })}
                className="w-full h-full bg-[#0f1419] text-gray-200 font-mono text-sm p-4 rounded border border-white/10 focus:outline-none focus:border-purple-500 resize-none"
                placeholder="// Write your Squirrel code here&#10;// This will be inserted directly into the generated script"
                spellCheck={false}
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-xs text-gray-500">
                {codeEditorModal.code.split('\n').length} lines • {codeEditorModal.code.length} characters
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCodeEditorModal(null)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateNodeRef.current(codeEditorModal.nodeId, { 
                      data: { code: codeEditorModal.code } 
                    });
                    setCodeEditorModal(null);
                  }}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-sm transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
