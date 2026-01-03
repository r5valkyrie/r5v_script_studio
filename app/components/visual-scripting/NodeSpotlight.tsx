import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, Star } from 'lucide-react';
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

// Storage key for favorites (same as UnifiedSidebar)
const FAVORITES_KEY = 'r5v_node_favorites';

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function NodeSpotlight({ isOpen, onClose, onAddNode, viewState, canvasSize, accentColor = '#2196F3' }: NodeSpotlightProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load favorites when opened
  useEffect(() => {
    if (isOpen) {
      setFavorites(loadFavorites());
    }
  }, [isOpen]);

  // Filter nodes based on search, with favorites at top
  const filteredNodes = useMemo(() => {
    let nodes: NodeDefinition[];
    
    if (!search.trim()) {
      // Show favorites first, then a curated list
      const favoriteNodes = NODE_DEFINITIONS.filter(n => favorites.includes(n.type));
      const otherNodes = NODE_DEFINITIONS.filter(n => !favorites.includes(n.type)).slice(0, 15 - favoriteNodes.length);
      nodes = [...favoriteNodes, ...otherNodes];
    } else {
      const term = search.toLowerCase();
      const matchedNodes = NODE_DEFINITIONS.filter(node => {
        const labelMatch = node.label.toLowerCase().includes(term);
        const typeMatch = node.type.toLowerCase().includes(term);
        const categoryMatch = node.category.toLowerCase().includes(term);
        const descMatch = node.description?.toLowerCase().includes(term);
        return labelMatch || typeMatch || categoryMatch || descMatch;
      });
      
      // Sort favorites to top within search results
      nodes = matchedNodes.sort((a, b) => {
        const aFav = favorites.includes(a.type);
        const bFav = favorites.includes(b.type);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
      }).slice(0, 20);
    }
    
    return nodes;
  }, [search, favorites]);

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Spotlight Modal - Material Design */}
      <div 
        className="relative w-[600px] max-w-[90vw] bg-[#252525] rounded-xl overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        {/* Search Input - Material Design filled style */}
        <div className="flex items-center gap-3 px-4 py-4 bg-[#2a2a2a]">
          <Search size={18} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.08] rounded text-[10px] text-gray-400 font-medium">
            <Command size={10} />
            <span>Space</span>
          </div>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="max-h-[500px] overflow-y-auto"
        >
          {filteredNodes.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500 text-sm">
              No nodes found for "{search}"
            </div>
          ) : (
            filteredNodes.map((node, index) => {
              const categoryInfo = getCategoryInfo(node.category);
              const isFavorite = favorites.includes(node.type);
              return (
                <div
                  key={node.type}
                  onClick={() => handleSelectNode(node)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 ${
                    index === selectedIndex 
                      ? 'bg-white/[0.08]' 
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Favorite indicator */}
                  {isFavorite && (
                    <Star size={12} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                  )}
                  
                  {/* Node color indicator */}
                  <div 
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: node.color }}
                  />
                  
                  {/* Node info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 text-[13px] font-medium truncate">
                        {node.label}
                      </span>
                      <span 
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${categoryInfo?.color || '#6B7280'}15`,
                          color: categoryInfo?.color || '#6B7280'
                        }}
                      >
                        {categoryInfo?.label || node.category}
                      </span>
                    </div>
                    {node.description && (
                      <div className="text-gray-500 text-[11px] truncate mt-0.5">
                        {node.description}
                      </div>
                    )}
                  </div>

                  {/* Keyboard hint for selected */}
                  {index === selectedIndex && (
                    <div className="text-[10px] text-gray-600 flex-shrink-0 font-medium">
                      ↵
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 bg-[#1f1f1f]">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-[9px] text-gray-400">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-[9px] text-gray-400">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-[9px] text-gray-400">Esc</kbd> Close</span>
            </div>
            <span className="text-gray-600">{filteredNodes.length} nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
