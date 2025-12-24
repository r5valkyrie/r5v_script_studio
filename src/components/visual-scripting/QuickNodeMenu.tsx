import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { NODE_DEFINITIONS } from '../../data/node-definitions';
import type { ScriptNode, NodeDefinition, NodeDataType } from '../../types/visual-scripting';
import { CATEGORY_INFO } from '../../types/visual-scripting';

interface QuickNodeMenuProps {
  position: { x: number; y: number };
  sourcePort: {
    nodeId: string;
    portId: string;
    isInput: boolean;
    portType: 'exec' | 'data';
    dataType?: NodeDataType;
  };
  onSelectNode: (node: ScriptNode, connectToPortIndex: number) => void;
  onClose: () => void;
}

// Check if two data types are compatible
function areTypesCompatible(sourceType?: NodeDataType, targetType?: NodeDataType): boolean {
  if (!sourceType || !targetType) return true;
  if (sourceType === 'any' || targetType === 'any') return true;
  if (sourceType === targetType) return true;

  const numberTypes: NodeDataType[] = ['number', 'int', 'float'];
  if (numberTypes.includes(sourceType) && numberTypes.includes(targetType)) return true;

  const rotationTypes: NodeDataType[] = ['vector', 'rotation'];
  if (rotationTypes.includes(sourceType) && rotationTypes.includes(targetType)) return true;

  // Entity subtypes are compatible with entity
  const entityTypes: NodeDataType[] = ['entity', 'player', 'weapon'];
  if (entityTypes.includes(sourceType) && entityTypes.includes(targetType)) return true;

  return false;
}

export default function QuickNodeMenu({
  position,
  sourcePort,
  onSelectNode,
  onClose,
}: QuickNodeMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Filter nodes based on port compatibility
  const compatibleNodes = useMemo(() => {
    return NODE_DEFINITIONS.filter((def) => {
      // If dragging from an output, we need nodes with compatible inputs
      // If dragging from an input, we need nodes with compatible outputs
      const portsToCheck = sourcePort.isInput ? def.outputs : def.inputs;

      return portsToCheck.some((port) => {
        // Exec ports only connect to exec ports
        if (sourcePort.portType === 'exec') {
          return port.type === 'exec';
        }
        // Data ports need type compatibility
        if (sourcePort.portType === 'data') {
          return port.type === 'data' && areTypesCompatible(sourcePort.dataType, port.dataType);
        }
        return false;
      });
    });
  }, [sourcePort]);

  // Filter by search and category
  const filteredNodes = useMemo(() => {
    let nodes = compatibleNodes;

    if (selectedCategory) {
      nodes = nodes.filter((n) => n.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query) ||
          n.type.toLowerCase().includes(query)
      );
    }

    const scoreByPort = (node: NodeDefinition) => {
      const portsToCheck = sourcePort.isInput ? node.outputs : node.inputs;
      if (sourcePort.portType === 'exec') {
        return portsToCheck.some(port => port.type === 'exec') ? 1 : 0;
      }
      if (sourcePort.dataType) {
        return portsToCheck.some(
          port => port.type === 'data' && areTypesCompatible(sourcePort.dataType, port.dataType)
        ) ? 1 : 0;
      }
      return 0;
    };

    if (sourcePort.portType === 'exec' || sourcePort.dataType) {
      const preferredLabels = sourcePort.dataType === 'number'
        ? ['float', 'int', 'number']
        : sourcePort.dataType
          ? [sourcePort.dataType.toLowerCase()]
          : [];
      const scoreByLabel = (node: NodeDefinition) => {
        if (preferredLabels.length === 0) return 0;
        const label = node.label.toLowerCase();
        if (preferredLabels.some(pref => label === pref)) return 2;
        if (preferredLabels.some(pref => label.includes(pref))) return 1;
        return 0;
      };

      nodes = [...nodes].sort((a, b) => {
        const portScore = scoreByPort(b) - scoreByPort(a);
        if (portScore !== 0) return portScore;
        return scoreByLabel(b) - scoreByLabel(a);
      });
    }

    return nodes;
  }, [compatibleNodes, selectedCategory, searchQuery]);

  // Group by category
  const groupedNodes = useMemo(() => {
    const groups: Record<string, NodeDefinition[]> = {};
    filteredNodes.forEach((node) => {
      if (!groups[node.category]) {
        groups[node.category] = [];
      }
      groups[node.category].push(node);
    });
    return groups;
  }, [filteredNodes]);

  const handleNodeClick = (definition: NodeDefinition) => {
    // Find the port index that will be connected
    const portsToCheck = sourcePort.isInput ? definition.outputs : definition.inputs;
    let connectPortIndex = -1;

    for (let i = 0; i < portsToCheck.length; i++) {
      const port = portsToCheck[i];
      if (sourcePort.portType === 'exec' && port.type === 'exec') {
        connectPortIndex = i;
        break;
      }
      if (
        sourcePort.portType === 'data' &&
        port.type === 'data' &&
        areTypesCompatible(sourcePort.dataType, port.dataType)
      ) {
        connectPortIndex = i;
        break;
      }
    }

    // Create the new node
    const newNode: ScriptNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position: { x: position.x - 90, y: position.y - 30 },
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

    onSelectNode(newNode, connectPortIndex);
  };

  const getCategoryColor = (categoryId: string): string => {
    const info = CATEGORY_INFO.find((c) => c.id === categoryId);
    return info?.color || '#6B7280';
  };

  const getCategoryLabel = (categoryId: string): string => {
    const info = CATEGORY_INFO.find((c) => c.id === categoryId);
    return info?.label || categoryId;
  };

  // Calculate menu position to keep it on screen
  const menuStyle = useMemo(() => {
    const menuWidth = 320;
    const menuHeight = 400;
    let x = position.x;
    let y = position.y;

    // Keep menu on screen
    if (typeof window !== 'undefined') {
      if (x + menuWidth > window.innerWidth - 20) {
        x = window.innerWidth - menuWidth - 20;
      }
      if (y + menuHeight > window.innerHeight - 20) {
        y = window.innerHeight - menuHeight - 20;
      }
      if (x < 20) x = 20;
      if (y < 20) y = 20;
    }

    return { left: x, top: y };
  }, [position]);

  return (
    <div
      ref={menuRef}
      data-quick-node-menu="true"
      className="fixed z-[1000] bg-[#1a1f28] border border-white/20 rounded-lg shadow-2xl overflow-hidden"
      style={{
        ...menuStyle,
        width: 320,
        maxHeight: 400,
      }}
    >
      {/* Header */}
      <div className="bg-[#0f1419] px-3 py-2 border-b border-white/10 flex items-center gap-2">
        <Search size={14} className="text-gray-500" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
        />
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 px-2 py-2 bg-[#151a21] border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          All
        </button>
        {Object.keys(groupedNodes).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
            style={{
              backgroundColor:
                selectedCategory === category ? getCategoryColor(category) : undefined,
            }}
          >
            {getCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* Node List */}
      <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
        {Object.entries(groupedNodes).length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No compatible nodes found
          </div>
        ) : (
          Object.entries(groupedNodes).map(([category, nodes]) => (
            <div key={category}>
              {!selectedCategory && (
                <div
                  className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider sticky top-0"
                  style={{
                    backgroundColor: getCategoryColor(category),
                    color: 'white',
                  }}
                >
                  {getCategoryLabel(category)}
                </div>
              )}
              {nodes.map((node) => (
                <button
                  key={node.type}
                  onClick={() => handleNodeClick(node)}
                  className="w-full px-3 py-2 text-left hover:bg-purple-600/20 transition-colors flex items-start gap-2 border-b border-white/5"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(node.category) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{node.label}</div>
                    <div className="text-xs text-gray-500 truncate">{node.description}</div>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-[#0f1419] border-t border-white/10 text-xs text-gray-600">
        {sourcePort.portType === 'exec' ? 'Showing nodes with exec ports' : `Showing nodes with ${sourcePort.dataType || 'data'} ports`}
      </div>
    </div>
  );
}
