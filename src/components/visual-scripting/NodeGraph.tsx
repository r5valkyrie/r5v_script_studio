import { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import type { ScriptNode, NodeConnection, NodeDataType } from '../../types/visual-scripting';
import { getNodeDefinition } from '../../data/node-definitions';
import QuickNodeMenu from './QuickNodeMenu';

interface NodeGraphProps {
  nodes: ScriptNode[];
  connections: NodeConnection[];
  selectedNodeIds: string[];
  onSelectNodes: (nodeIds: string[]) => void;
  onUpdateNode: (nodeId: string, updates: Partial<ScriptNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onConnect: (connection: NodeConnection) => void;
  onBreakInput: (nodeId: string, portId: string) => void;
  onAddNode: (node: ScriptNode) => void;
}

interface QuickMenuState {
  position: { x: number; y: number };
  sourcePort: {
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

export default function NodeGraph({
  nodes,
  connections,
  selectedNodeIds,
  onSelectNodes,
  onUpdateNode,
  onDeleteNode,
  onConnect,
  onBreakInput,
  onAddNode,
}: NodeGraphProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Use refs to store drag state (avoids useEffect re-registration)
  const tempConnectionRef = useRef<TempConnectionState | null>(null);
  const draggingNodeRef = useRef<DraggingNodeState | null>(null);
  const draggingSelectionRef = useRef<DraggingSelectionState | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const panningRef = useRef<PanState | null>(null);
  const selectionRef = useRef<{ start: { x: number; y: number }; shift: boolean } | null>(null);
  const selectionRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const selectionMadeRef = useRef(false);

  // Store callbacks in refs so they don't cause re-registration
  const onConnectRef = useRef(onConnect);
  const onUpdateNodeRef = useRef(onUpdateNode);
  const onAddNodeRef = useRef(onAddNode);

  useEffect(() => {
    onConnectRef.current = onConnect;
    onUpdateNodeRef.current = onUpdateNode;
    onAddNodeRef.current = onAddNode;
  }, [onConnect, onUpdateNode, onAddNode]);

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; portId: string } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

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
          className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[11px] text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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
          className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[11px] text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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
        <div className="grid grid-cols-3 gap-1">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <input
              key={axis}
              type="number"
              step="0.1"
              value={axis === 'x' ? x : axis === 'y' ? y : z}
              onChange={(e) => updateAxis(axis, parseFloat(e.target.value) || 0)}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-1 py-1 bg-black/30 border border-white/10 rounded text-[11px] text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
            />
          ))}
        </div>
      );
    }

    if (node.type === 'const-loot-tier') {
      const value = typeof node.data.tier === 'string' ? node.data.tier : 'COMMON';
      const options = ['NONE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'HEIRLOOM'];
      return (
        <select
          value={value}
          onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, tier: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-[#0f1419] border border-white/15 rounded text-[11px] text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 appearance-none"
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
        <select
          value={value}
          onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, weaponType: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-[#0f1419] border border-white/15 rounded text-[11px] text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 appearance-none"
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (node.type === 'custom-function') {
      const value = typeof node.data.functionName === 'string' ? node.data.functionName : 'MyFunction';
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdateNodeRef.current(node.id, { data: { ...node.data, functionName: e.target.value } })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[11px] text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
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
      
      // Only return valid coordinates
      if (x >= 0 && y >= 0) {
        return { x, y };
      }
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

        onUpdateNodeRef.current(nodeId, {
          position: {
            x: nodeStartX + dx,
            y: nodeStartY + dy,
          },
        });
      }

      if (draggingSelectionRef.current) {
        const { startX, startY, nodeStarts } = draggingSelectionRef.current;
        const dx = (e.clientX - startX) / view.scale;
        const dy = (e.clientY - startY) / view.scale;
        nodeStarts.forEach((pos, nodeId) => {
          onUpdateNodeRef.current(nodeId, {
            position: {
              x: pos.x + dx,
              y: pos.y + dy,
            },
          });
        });
      }

      if (panningRef.current) {
        const { startX, startY, viewStartX, viewStartY } = panningRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        setView(current => ({
          ...current,
          x: viewStartX + dx,
          y: viewStartY + dy,
        }));
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
          setQuickMenuRef.current({
            position: { x: e.clientX, y: e.clientY },
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
      }

      if (draggingSelectionRef.current) {
        draggingSelectionRef.current = null;
        setIsDragging(false);
      }

      if (panningRef.current) {
        panningRef.current = null;
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
        if (!target.closest('[data-context-menu="break-input"]')) {
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
    if (e.shiftKey) {
      const next = selectedNodeIds.includes(node.id)
        ? selectedNodeIds.filter(id => id !== node.id)
        : [...selectedNodeIds, node.id];
      onSelectNodes(next);
    } else if (!selectedNodeIds.includes(node.id)) {
      onSelectNodes([node.id]);
    }

    const dragIds = selectedNodeIds.includes(node.id) ? selectedNodeIds : [node.id];

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
      nodeId,
      portId,
    });
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

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (!canvasRef.current) return;
    if (panningRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(2.5, Math.max(0.3, view.scale * zoomFactor));

    if (newScale === view.scale) return;

    const scaleRatio = newScale / view.scale;
    setView(current => ({
      scale: newScale,
      x: cursor.x - (cursor.x - current.x) * scaleRatio,
      y: cursor.y - (cursor.y - current.y) * scaleRatio,
    }));
  };

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
    const newNode = buildNodeFromDefinition(definition, {
      x: worldPos.x - 90,
      y: worldPos.y - 30,
    });

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
    return {
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
  };

  const getConnectPortIndex = (
    definition: ReturnType<typeof getNodeDefinition>,
    sourcePort: QuickMenuState['sourcePort']
  ): number => {
    if (!definition) return -1;
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

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenPos = {
        x: quickMenu.position.x - rect.left,
        y: quickMenu.position.y - rect.top,
      };
      const worldPos = screenToWorld(screenPos);
      newNode.position = {
        x: worldPos.x - 90,
        y: worldPos.y - 30,
      };
    }

    // Add the new node
    onAddNode(newNode);

    // Create the connection
    const sourcePort = quickMenu.sourcePort;

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
      if (key === 'r') nodeType = tempConnectionRef.current.portType === 'exec' ? 'reroute-exec' : 'reroute';
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
      const newNode = buildNodeFromDefinition(definition, {
        x: worldPos.x - 90,
        y: worldPos.y - 30,
      });

      if (newNode) {
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

  // Render connection paths
  const renderConnections = () => {
    return connections.map((conn) => {
      const fromPos = getPortPositionFromDOM(conn.from.nodeId, conn.from.portId);
      const toPos = getPortPositionFromDOM(conn.to.nodeId, conn.to.portId);

      // Don't render if positions can't be determined
      if (!fromPos || !toPos) {
        return null;
      }

      const midX = (fromPos.x + toPos.x) / 2;
      const fromNode = nodes.find(node => node.id === conn.from.nodeId);
      const fromPort =
        fromNode?.outputs.find(port => port.id === conn.from.portId) ||
        fromNode?.inputs.find(port => port.id === conn.from.portId);
      const stroke = getLineColor(fromPort?.type || 'data', fromPort?.dataType);

      return (
        <path
          key={conn.id}
          d={`M ${fromPos.x} ${fromPos.y} C ${midX} ${fromPos.y}, ${midX} ${toPos.y}, ${toPos.x} ${toPos.y}`}
          stroke={stroke}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-[#1a1f28] overflow-hidden"
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseDownCapture={handleSelectionStart}
      onWheel={handleCanvasWheel}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      onContextMenu={(e) => {
        if (e.target === canvasRef.current || e.target === svgRef.current) {
          e.preventDefault();
          setContextMenu(null);
        }
      }}
      style={{
        backgroundImage: 'radial-gradient(circle, #2a2e38 1px, transparent 1px)',
        backgroundSize: `${20 * view.scale}px ${20 * view.scale}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
        cursor: isDragging || panningRef.current ? 'grabbing' : 'default',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render nodes first so DOM is ready for connection queries */}
        {nodes.map((node) => {
          const isSelected = selectedNodeIds.includes(node.id);
          const nodeColor = getNodeDefinitionColor(node.type);
          const isReroute = node.type === 'reroute' || node.type === 'reroute-exec';

          if (isReroute) {
            const inputPort = node.inputs[0];
            const outputPort = node.outputs[0];
            const portSize = 12;
            const hitSize = 20;
            const offset = hitSize / 2;

            return (
            <div
              key={node.id}
              className={`node-root absolute select-none ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0f1419]' : ''}`}
              data-node-id={node.id}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: 18,
                  height: 18,
                  cursor: 'grab',
                  userSelect: 'none',
                  zIndex: isSelected ? 100 : 1,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
              >
                <div className="w-full h-full rounded-full bg-[#2a2e38] border border-white/30" />

                {inputPort && (
                  <div
                    data-node-id={node.id}
                    data-port-id={inputPort.id}
                    data-is-input="true"
                    className="node-port absolute flex items-center justify-center cursor-crosshair group"
                    style={{
                      width: hitSize,
                      height: hitSize,
                      left: -offset,
                      top: (18 - hitSize) / 2,
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
                      right: -offset,
                      top: (18 - hitSize) / 2,
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

          return (
            <div
              key={node.id}
              className={`node-root absolute bg-[#2a2e38] rounded-lg shadow-xl select-none ${
                isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0f1419]' : ''
              }`}
              data-node-id={node.id}
              style={{
                left: node.position.x,
                top: node.position.y,
                minWidth: 180,
                cursor: 'grab',
                userSelect: 'none',
                zIndex: isSelected ? 100 : 1,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
            >
              {/* Node Header */}
              <div
                className="px-3 py-2 rounded-t-lg flex items-center justify-between"
                style={{ backgroundColor: nodeColor }}
              >
                <span className="text-xs font-semibold text-white truncate">
                  {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
                </span>
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(node.id);
                    }}
                    className="p-0.5 hover:bg-black/20 rounded transition-colors"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                )}
              </div>

              {/* Node Body */}
              <div className="p-2">
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
                <div className="my-2 px-2 py-1 bg-black/20 rounded text-[10px] text-gray-400">
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
      </div>

      {/* SVG for connections - rendered after nodes so DOM queries work */}
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 50, width: '100%', height: '100%' }}
        preserveAspectRatio="none"
      >
        {renderConnections()}

        {/* Draw temporary connection line */}
        {tempConnectionLine && (
          <line
            x1={tempConnectionLine.from.x}
            y1={tempConnectionLine.from.y}
            x2={tempConnectionLine.to.x}
            y2={tempConnectionLine.to.y}
            stroke={getLineColor(tempConnectionRef.current?.portType || 'exec', tempConnectionRef.current?.dataType)}
            strokeWidth="2.5"
            strokeDasharray="8,4"
            strokeLinecap="round"
          />
        )}
      </svg>

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
          position={quickMenu.position}
          sourcePort={quickMenu.sourcePort}
          onSelectNode={handleQuickNodeSelect}
          onClose={() => setQuickMenu(null)}
        />
      )}

      {selectionRect && (
        <div
          className="absolute border border-purple-400/80 bg-purple-500/10 pointer-events-none"
          style={{
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}

      {contextMenu && (
        <div
          data-context-menu="break-input"
          className="fixed z-[1100] bg-[#1a1f28] border border-white/20 rounded-md shadow-xl text-sm text-white"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="px-3 py-2 hover:bg-white/10 w-full text-left"
            onClick={() => {
              onBreakInput(contextMenu.nodeId, contextMenu.portId);
              setContextMenu(null);
            }}
          >
            Break Input
          </button>
        </div>
      )}
    </div>
  );
}
