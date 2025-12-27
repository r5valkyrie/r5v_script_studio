import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command } from 'lucide-react';
import { NODE_DEFINITIONS } from '../../data/node-definitions';
import { CATEGORY_INFO } from '../../types/visual-scripting';
import type { ScriptNode, NodePort, NodeDefinition } from '../../types/visual-scripting';

interface NodeSpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (node: ScriptNode) => void;
  viewState: { x: number; y: number; scale: number };
  canvasSize: { width: number; height: number };
  accentColor?: string;
}

// Helper to get category info
const getCategoryInfo = (categoryId: string) => {
  return CATEGORY_INFO.find(c => c.id === categoryId);
};

export default function NodeSpotlight({ isOpen, onClose, onAddNode, viewState, canvasSize, accentColor = '#ef4444' }: NodeSpotlightProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!search.trim()) {
      // Show a curated list of common nodes when no search
      return NODE_DEFINITIONS.slice(0, 15);
    }
    
    const term = search.toLowerCase();
    return NODE_DEFINITIONS.filter(node => {
      const labelMatch = node.label.toLowerCase().includes(term);
      const typeMatch = node.type.toLowerCase().includes(term);
      const categoryMatch = node.category.toLowerCase().includes(term);
      const descMatch = node.description?.toLowerCase().includes(term);
      return labelMatch || typeMatch || categoryMatch || descMatch;
    }).slice(0, 20); // Limit results for performance
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Global escape key handler
  useEffect(() => {
    if (!isOpen) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredNodes.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredNodes.length]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNodes[selectedIndex]) {
        handleSelectNode(filteredNodes[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectNode = (definition: NodeDefinition) => {
    // Calculate center of visible canvas
    const centerX = (-viewState.x + canvasSize.width / 2) / viewState.scale;
    const centerY = (-viewState.y + canvasSize.height / 2) / viewState.scale;
    
    // Add some randomness so multiple nodes don't stack exactly
    const offsetX = (Math.random() - 0.5) * 50;
    const offsetY = (Math.random() - 0.5) * 50;

    const newNode: ScriptNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position: { x: centerX + offsetX, y: centerY + offsetY },
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

    onAddNode(newNode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Spotlight Modal */}
      <div className="relative w-[500px] max-w-[90vw] bg-[#1a1d24] border border-white/8 rounded shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <Search size={18} className="text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes... (e.g., 'init', 'print', 'event')"
            className="flex-1 bg-transparent text-white text-sm placeholder-white/40 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/40">
            <Command size={10} />
            <span>Space</span>
          </div>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="max-h-[400px] overflow-y-auto"
        >
          {filteredNodes.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/40 text-sm">
              No nodes found for "{search}"
            </div>
          ) : (
            filteredNodes.map((node, index) => (
              <div
                key={node.type}
                onClick={() => handleSelectNode(node)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? '' 
                    : 'hover:bg-white/5'
                }`}
                style={index === selectedIndex ? { backgroundColor: `${accentColor}20` } : undefined}
              >
                {/* Node color indicator */}
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: node.color }}
                />
                
                {/* Node info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">
                      {node.label}
                    </span>
                    <span className={`text-[10px] ${getCategoryInfo(node.category)?.textClass || 'text-white/40'}`}>
                      {getCategoryInfo(node.category)?.label || node.category}
                    </span>
                  </div>
                  {node.description && (
                    <div className="text-white/40 text-xs truncate mt-0.5">
                      {node.description}
                    </div>
                  )}
                </div>

                {/* Keyboard hint for selected */}
                {index === selectedIndex && (
                  <div className="text-[10px] text-white/30 flex-shrink-0">
                    Enter ↵
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/8 bg-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/40">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            <span>{filteredNodes.length} nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
