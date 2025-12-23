import { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import type { ScriptNode, NodeConnection } from '../../types/visual-scripting';
import { getNodeDefinition } from '../../data/node-definitions';

interface NodeGraphProps {
  nodes: ScriptNode[];
  connections: NodeConnection[];
  selectedNode: ScriptNode | null;
  onSelectNode: (node: ScriptNode | null) => void;
  onUpdateNode: (nodeId: string, updates: Partial<ScriptNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onConnect: (connection: NodeConnection) => void;
}

interface TempConnectionState {
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromNodeId: string;
  fromPortId: string;
  fromIsInput: boolean;
}

interface DraggingNodeState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

export default function NodeGraph({
  nodes,
  connections,
  selectedNode,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  onConnect,
}: NodeGraphProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Use refs to store drag state (avoids useEffect re-registration)
  const tempConnectionRef = useRef<TempConnectionState | null>(null);
  const draggingNodeRef = useRef<DraggingNodeState | null>(null);

  // Store callbacks in refs so they don't cause re-registration
  const onConnectRef = useRef(onConnect);
  const onUpdateNodeRef = useRef(onUpdateNode);

  useEffect(() => {
    onConnectRef.current = onConnect;
    onUpdateNodeRef.current = onUpdateNode;
  }, [onConnect, onUpdateNode]);

  // State for visual updates only
  const [tempConnectionLine, setTempConnectionLine] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, forceRender] = useState(0);

  const getNodeDefinitionColor = (type: string) => {
    const definition = getNodeDefinition(type);
    return definition?.color || '#6B7280';
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
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        onUpdateNodeRef.current(nodeId, {
          position: {
            x: nodeStartX + dx,
            y: nodeStartY + dy,
          },
        });
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
        }

        tempConnectionRef.current = null;
        setTempConnectionLine(null);
      }

      // Handle node drag end
      if (draggingNodeRef.current) {
        draggingNodeRef.current = null;
        setIsDragging(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle port mouse down - start connection
  const handlePortMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    isInput: boolean
  ) => {
    e.stopPropagation();
    e.preventDefault();

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
    const target = e.target as HTMLElement;
    if (target.classList.contains('node-port') || target.closest('button')) {
      return;
    }

    e.preventDefault();
    onSelectNode(node);

    draggingNodeRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.position.x,
      nodeStartY: node.position.y,
    };
    setIsDragging(true);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === svgRef.current) {
      onSelectNode(null);
    }
  };

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

      return (
        <path
          key={conn.id}
          d={`M ${fromPos.x} ${fromPos.y} C ${midX} ${fromPos.y}, ${midX} ${toPos.y}, ${toPos.x} ${toPos.y}`}
          stroke="#a78bfa"
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
      style={{
        backgroundImage: 'radial-gradient(circle, #2a2e38 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Render nodes first so DOM is ready for connection queries */}
      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const nodeColor = getNodeDefinitionColor(node.type);

        return (
          <div
            key={node.id}
            className={`absolute bg-[#2a2e38] rounded-lg shadow-xl select-none ${
              isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0f1419]' : ''
            }`}
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
                    className={`node-port w-4 h-4 rounded-full border-2 cursor-crosshair hover:scale-150 transition-transform ${
                      input.type === 'exec'
                        ? 'bg-white border-white hover:shadow-[0_0_8px_white]'
                        : 'bg-orange-500 border-orange-500 hover:shadow-[0_0_8px_orange]'
                    }`}
                    onMouseDown={(e) => handlePortMouseDown(e, node.id, input.id, true)}
                    title={`${input.label} (${input.type}${input.dataType ? ': ' + input.dataType : ''})`}
                  />
                  <span className="ml-2 text-xs text-gray-300">{input.label}</span>
                </div>
              ))}

              {/* Node Data Display */}
              {Object.keys(node.data).length > 0 && (
                <div className="my-2 px-2 py-1 bg-black/20 rounded text-[10px] text-gray-400">
                  {Object.entries(node.data).map(([key, value]) => (
                    <div key={key} className="truncate">
                      {key}: {String(value)}
                    </div>
                  ))}
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
                    className={`node-port w-4 h-4 rounded-full border-2 cursor-crosshair hover:scale-150 transition-transform ${
                      output.type === 'exec'
                        ? 'bg-white border-white hover:shadow-[0_0_8px_white]'
                        : 'bg-orange-500 border-orange-500 hover:shadow-[0_0_8px_orange]'
                    }`}
                    onMouseDown={(e) => handlePortMouseDown(e, node.id, output.id, false)}
                    title={`${output.label} (${output.type}${output.dataType ? ': ' + output.dataType : ''})`}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

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
            stroke="#9b59b6"
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
    </div>
  );
}
