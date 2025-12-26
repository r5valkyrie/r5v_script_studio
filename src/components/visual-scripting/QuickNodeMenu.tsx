import { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { NODE_DEFINITIONS } from '../../data/node-definitions';
import type { ScriptNode, NodeDefinition, NodeDataType } from '../../types/visual-scripting';
import { CATEGORY_INFO } from '../../types/visual-scripting';

interface QuickNodeMenuProps {
  position: { x: number; y: number };
  containerOffset?: { left: number; top: number };
  sourcePort?: {
    nodeId: string;
    portId: string;
    isInput: boolean;
    portType: 'exec' | 'data';
    dataType?: NodeDataType;
  };
  onSelectNode: (node: ScriptNode, connectToPortIndex: number) => void;
  onClose: () => void;
  accentColor?: string;
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
  containerOffset,
  sourcePort,
  onSelectNode,
  onClose,
  accentColor = '#8B5CF6',
}: QuickNodeMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
    // If no sourcePort, show all nodes
    if (!sourcePort) {
      return NODE_DEFINITIONS;
    }
    
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

    // Only apply port-based sorting if we have a sourcePort
    if (sourcePort) {
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
    }

    return nodes;
  }, [compatibleNodes, selectedCategory, searchQuery, sourcePort]);

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
    // Find the port index that will be connected (only if we have a sourcePort)
    let connectPortIndex = -1;
    
    if (sourcePort) {
      const portsToCheck = sourcePort.isInput ? definition.outputs : definition.inputs;

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

  // Flat list for keyboard navigation
  const flatNodeList = useMemo(() => {
    const flat: NodeDefinition[] = [];
    Object.values(groupedNodes).forEach(nodes => flat.push(...nodes));
    return flat;
  }, [groupedNodes]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, selectedCategory]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current && flatNodeList.length > 0) {
      const items = listRef.current.querySelectorAll('[data-node-item]');
      const selected = items[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, flatNodeList.length]);

  // Calculate menu position to keep it on screen
  const menuStyle = useMemo(() => {
    const menuWidth = 360;
    const menuHeight = 420;
    // Convert to position relative to container if offset provided
    let x = containerOffset ? position.x - containerOffset.left : position.x;
    let y = containerOffset ? position.y - containerOffset.top : position.y;

    // Keep menu on screen (use container dimensions if available)
    if (typeof window !== 'undefined') {
      const maxX = containerOffset ? window.innerWidth - containerOffset.left : window.innerWidth;
      const maxY = containerOffset ? window.innerHeight - containerOffset.top : window.innerHeight;
      if (x + menuWidth > maxX - 20) {
        x = maxX - menuWidth - 20;
      }
      if (y + menuHeight > maxY - 20) {
        y = maxY - menuHeight - 20;
      }
      if (x < 20) x = 20;
      if (y < 20) y = 20;
    }

    return { left: x, top: y };
  }, [position, containerOffset]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatNodeList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatNodeList[selectedIndex]) {
        handleNodeClick(flatNodeList[selectedIndex]);
      }
    }
  };

  return (
    <div
      ref={menuRef}
      data-quick-node-menu="true"
      className="absolute z-[1000] w-[340px] bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      style={menuStyle}
      onWheel={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      {/* Search Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <Search size={16} className="text-white/40" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
        />
        {sourcePort && (
          <div 
            className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/40"
          >
            {sourcePort.portType === 'exec' ? 'exec' : sourcePort.dataType || 'data'}
          </div>
        )}
      </div>

      {/* Results List */}
      <div ref={listRef} className="max-h-[320px] overflow-y-auto">
        {Object.entries(groupedNodes).length === 0 ? (
          <div className="px-4 py-8 text-center text-white/40 text-sm">
            No compatible nodes found
          </div>
        ) : (
          Object.entries(groupedNodes).map(([category, nodes]) => {
            // Calculate starting index for this category
            let startIdx = 0;
            for (const [cat, catNodes] of Object.entries(groupedNodes)) {
              if (cat === category) break;
              startIdx += catNodes.length;
            }
            
            return (
              <div key={category}>
                {/* Category Header */}
                <div
                  className="px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider sticky top-0 bg-[#1a1d24] border-b border-white/5"
                  style={{ color: getCategoryColor(category) }}
                >
                  {getCategoryLabel(category)}
                </div>
                
                {/* Nodes */}
                {nodes.map((node, nodeIdx) => {
                  const globalIdx = startIdx + nodeIdx;
                  const isSelected = globalIdx === selectedIndex;
                  
                  return (
                    <div
                      key={node.type}
                      data-node-item
                      onClick={() => handleNodeClick(node)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        isSelected ? '' : 'hover:bg-white/5'
                      }`}
                      style={isSelected ? { backgroundColor: `${accentColor}20` } : undefined}
                    >
                      {/* Node color indicator */}
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(node.category) }}
                      />
                      
                      {/* Node info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {node.label}
                        </div>
                        {node.description && (
                          <div className="text-white/40 text-xs truncate mt-0.5">
                            {node.description}
                          </div>
                        )}
                      </div>

                      {/* Keyboard hint for selected */}
                      {isSelected && (
                        <div className="text-[10px] text-white/30 flex-shrink-0">
                          Enter ↵
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
          <span>{flatNodeList.length} nodes</span>
        </div>
      </div>
    </div>
  );
}
