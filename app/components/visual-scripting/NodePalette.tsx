import { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  X, 
  Search,
  Workflow,
  Zap,
  User,
  Sword,
  Shield,
  Sparkles,
  Volume2,
  Crosshair,
  Monitor,
  Calculator,
  RotateCcw,
  Database,
  Wrench,
  GripVertical,
  Gamepad2,
  Boxes,
  Play,
  GitBranch,
  Repeat,
  Timer,
  MessageSquare,
  Target,
  Hexagon,
  Box,
  Tags,
  Type,
  Layers,
  Package,
  Flag,
  Heart,
  Cpu,
  Eye,
  Music,
  Palette,
  FileText,
  Hash,
  Map,
  ShieldAlert,
  Users,
  Scroll
} from 'lucide-react';
import { NODE_DEFINITIONS, getNodesByCategory } from '../../data/node-definitions';
import { CATEGORY_INFO } from '../../types/visual-scripting';
import type { ScriptNode, NodePort, NodeCategory, NodeType } from '../../types/visual-scripting';

interface NodePaletteProps {
  onAddNode: (node: ScriptNode) => void;
  onClose: () => void;
  collapsedCategories?: string[];
  onToggleCategory?: (category: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isEmbedded?: boolean;
  viewState?: { x: number; y: number; scale: number };
  canvasSize?: { width: number; height: number };
  onShowNodeDoc?: (nodeType: NodeType) => void;
}

interface CategorySectionProps {
  title: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  onAddNode: (node: ScriptNode) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
  searchTerm?: string;
  onShowNodeDoc?: (nodeType: NodeType) => void;
}

// Icons for each category
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'init': <Play size={14} />,
  'flow': <Workflow size={14} />,
  'gamemodes': <Gamepad2 size={14} />,
  'callbacks': <RotateCcw size={14} />,
  'entity': <User size={14} />,
  'entity-creation': <Box size={14} />,
  'entity-props': <Cpu size={14} />,
  'npc': <Target size={14} />,
  'weapons': <Sword size={14} />,
  'status-effects': <Shield size={14} />,
  'vfx': <Sparkles size={14} />,
  'audio': <Volume2 size={14} />,
  'damage': <Crosshair size={14} />,
  'ui': <Monitor size={14} />,
  'math': <Calculator size={14} />,
  'string': <Type size={14} />,
  'structures': <Boxes size={14} />,
  'collections': <Layers size={14} />,
  'survival': <Map size={14} />,
  'passives': <Heart size={14} />,
  'character': <Users size={14} />,
  // Legacy categories for backward compatibility
  'core-flow': <Workflow size={14} />,
  'particles': <Sparkles size={14} />,
  'utilities': <Wrench size={14} />,
  'keyvalues': <Tags size={14} />,
};

// Map hex colors to Tailwind color names for dynamic class generation
const hexToTailwindColor = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#4A90E2': 'blue',
    '#E8A838': 'yellow',
    '#27AE60': 'green',
    '#E67E22': 'orange',
    '#9B59B6': 'purple',
    '#F39C12': 'pink',
    '#1ABC9C': 'cyan',
    '#E74C3C': 'red',
    '#3498DB': 'indigo',
    '#95A5A6': 'emerald',
    '#8E44AD': 'amber',
    '#2ECC71': 'violet',
    '#16A085': 'teal',
    '#34495E': 'slate',
    '#C0392B': 'red',
  };
  return colorMap[hex] || 'slate';
};

// Helper to get category info
const getCategoryInfo = (categoryId: string) => {
  return CATEGORY_INFO.find(c => c.id === categoryId);
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  purple: { bg: 'bg-[#2196F3]/10', border: 'border-purple-500/50', text: 'text-[#64B5F6]', hover: 'hover:bg-[#2196F3]/20 hover:border-purple-500' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', hover: 'hover:bg-yellow-500/20 hover:border-yellow-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', hover: 'hover:bg-blue-500/20 hover:border-blue-500' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', hover: 'hover:bg-red-500/20 hover:border-red-500' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-400', hover: 'hover:bg-green-500/20 hover:border-green-500' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/50', text: 'text-pink-400', hover: 'hover:bg-pink-500/20 hover:border-pink-500' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/20 hover:border-cyan-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-400', hover: 'hover:bg-orange-500/20 hover:border-orange-500' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/50', text: 'text-indigo-400', hover: 'hover:bg-indigo-500/20 hover:border-indigo-500' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/20 hover:border-emerald-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-400', hover: 'hover:bg-amber-500/20 hover:border-amber-500' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/50', text: 'text-violet-400', hover: 'hover:bg-violet-500/20 hover:border-violet-500' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/50', text: 'text-teal-400', hover: 'hover:bg-teal-500/20 hover:border-teal-500' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/50', text: 'text-slate-400', hover: 'hover:bg-slate-500/20 hover:border-slate-500' },
};

function CategorySection({ title, category, icon, color, onAddNode, defaultOpen = false, searchTerm = '', isCollapsed, onToggle, viewState, canvasSize, onShowNodeDoc }: CategorySectionProps & { viewState?: { x: number; y: number; scale: number }; canvasSize?: { width: number; height: number } }) {
  const [localIsOpen, setLocalIsOpen] = useState(defaultOpen);
  // Use controlled state if provided, otherwise use local state
  const isOpen = isCollapsed !== undefined ? !isCollapsed : localIsOpen;
  const allNodes = getNodesByCategory(category);
  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.purple;
  const info = getCategoryInfo(category);
  const categoryColor = info?.color || '#8B5CF6';
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalIsOpen(!localIsOpen);
    }
  };
  
  // Filter nodes based on search term
  const nodes = useMemo(() => {
    if (!searchTerm) return allNodes;
    const term = searchTerm.toLowerCase();
    return allNodes.filter(node => 
      node.label.toLowerCase().includes(term) || 
      node.description?.toLowerCase().includes(term)
    );
  }, [allNodes, searchTerm]);

  // Group nodes by subcategory if they have one
  const groupedNodes = useMemo(() => {
    const groups: Record<string, typeof nodes> = {};
    const ungrouped: typeof nodes = [];
    
    nodes.forEach(node => {
      // Try to extract subcategory from node type or use a default grouping
      const typePrefix = node.type.split('-')[0];
      if (typePrefix && nodes.filter(n => n.type.startsWith(typePrefix)).length >= 2) {
        if (!groups[typePrefix]) groups[typePrefix] = [];
        groups[typePrefix].push(node);
      } else {
        ungrouped.push(node);
      }
    });
    
    // If most nodes are ungrouped or search is active, don't use subcategories
    if (ungrouped.length > nodes.length * 0.7 || searchTerm) {
      return { _all: nodes };
    }
    
    if (ungrouped.length > 0) {
      groups['other'] = ungrouped;
    }
    
    return groups;
  }, [nodes, searchTerm]);

  // Auto-open if search matches
  const shouldShow = searchTerm ? nodes.length > 0 : true;
  const isExpanded = searchTerm ? nodes.length > 0 : isOpen;

  if (!shouldShow) return null;

  const handleNodeClick = (nodeType: string) => {
    const definition = NODE_DEFINITIONS.find(def => def.type === nodeType);
    if (!definition) return;

    // Calculate center of view
    let spawnX = 300;
    let spawnY = 200;
    if (viewState && canvasSize) {
      // Convert screen center to world coordinates
      const screenCenterX = canvasSize.width / 2;
      const screenCenterY = canvasSize.height / 2;
      spawnX = (screenCenterX - viewState.x) / viewState.scale - 90; // Offset by half node width
      spawnY = (screenCenterY - viewState.y) / viewState.scale - 30; // Offset by half node height
    }

    // Create a new node instance
    const newNode: ScriptNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position: { x: spawnX, y: spawnY },
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
  };

  const renderNodeItem = (node: typeof nodes[0]) => {
    const hasDoc = !!node.documentation;
    return (
      <div
        key={node.type}
        className="group/node flex items-center"
      >
        <button
          onClick={() => handleNodeClick(node.type)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('node-type', node.type);
            e.dataTransfer.effectAllowed = 'copy';
          }}
          className="flex-1 flex items-center gap-2 pl-5 pr-3 py-1.5 text-left text-[11px] text-gray-400 
            hover:bg-white/5 hover:text-white transition-all cursor-grab active:cursor-grabbing rounded-md mx-1"
          title={node.description}
        >
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <span className="flex-1 truncate">
            {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowNodeDoc?.(node.type);
          }}
          className={`p-2 -m-1 mr-1 rounded hover:bg-white/10 transition-all flex-shrink-0 opacity-0 group-hover/node:opacity-100 ${
            hasDoc ? 'text-[#64B5F6]' : 'text-gray-600 hover:text-[#64B5F6]'
          }`}
          title={hasDoc ? "View documentation" : "View node info"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="mb-1">
      {/* Category Header */}
      <button
        onClick={() => !searchTerm && handleToggle()}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors rounded-lg mx-1 my-0.5"
        style={{ width: 'calc(100% - 8px)' }}
      >
        {!searchTerm && (
          isExpanded ? (
            <ChevronDown size={10} className="text-gray-500" />
          ) : (
            <ChevronRight size={10} className="text-gray-500" />
          )
        )}
        <div 
          className="w-3 h-3 rounded flex items-center justify-center"
          style={{ backgroundColor: categoryColor }}
        >
          {icon && <span className="text-white text-[8px]" style={{ transform: 'scale(0.7)' }}>{icon}</span>}
        </div>
        <span className="text-[11px] font-semibold text-white uppercase tracking-wide flex-1 text-left">
          {title}
        </span>
        <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
          {nodes.length}
        </span>
      </button>

      {/* Nodes List */}
      {isExpanded && (
        <div className="ml-3 border-l border-white/8 pl-1">
          {Object.keys(groupedNodes).length === 1 && groupedNodes['_all'] ? (
            // No subcategories
            groupedNodes['_all'].map(renderNodeItem)
          ) : (
            // With subcategories
            Object.entries(groupedNodes).map(([subcat, subNodes]) => (
              <div key={subcat} className="mb-1">
                {subcat !== '_all' && (
                  <div className="px-3 py-1 text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                    {subcat === 'other' ? 'General' : subcat.replace(/-/g, ' ')}
                  </div>
                )}
                {subNodes.map(renderNodeItem)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function NodePalette({ onAddNode, onClose, collapsedCategories = [], onToggleCategory, isExpanded = true, onToggleExpanded, isEmbedded = false, viewState, canvasSize, onShowNodeDoc }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Derive categories from centralized CATEGORY_INFO
  const categories = useMemo(() => 
    CATEGORY_INFO.map((info, index) => ({
      title: info.label,
      category: info.id,
      defaultOpen: index === 0, // First category is open by default
    })),
    []
  );

  // Count total nodes
  const totalNodes = categories.reduce((acc, cat) => acc + getNodesByCategory(cat.category).length, 0);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#1e1e1e]">
      {/* Collapsible Header - matching Project style */}
      {isEmbedded && (
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] transition-colors border-b border-white/8 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded" style={{ backgroundColor: 'var(--accent-color-bg)' }}>
              <Workflow size={14} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-semibold tracking-wider text-gray-500 uppercase">Nodes</span>
              <span className="text-xs font-medium text-white">{totalNodes} available</span>
            </div>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
        </button>
      )}

      {/* Content - only show when expanded (or always when not embedded) */}
      {(isExpanded || !isEmbedded) && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Non-embedded header */}
          {!isEmbedded && (
            <div className="flex-shrink-0 px-3 py-3 border-b border-white/8 bg-[#212121] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded" style={{ backgroundColor: 'var(--accent-color-bg)' }}>
                  <Workflow size={14} style={{ color: 'var(--accent-color)' }} />
                </div>
                <span className="text-sm font-semibold text-white">Nodes</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                title="Hide palette"
              >
                <X size={14} className="text-gray-500 hover:text-white" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="flex-shrink-0 p-3 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#121212] border-none rounded text-[11px] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                >
                  <X size={10} className="text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 py-2">
            {categories.map(cat => {
              const info = getCategoryInfo(cat.category);
              const icon = CATEGORY_ICONS[cat.category] || <Database size={14} />;
              const color = info ? hexToTailwindColor(info.color) : 'purple';
              const isCollapsed = collapsedCategories.includes(cat.category);
              return (
                <CategorySection
                  key={cat.category}
                  title={cat.title}
                  category={cat.category}
                  icon={icon}
                  color={color}
                  onAddNode={onAddNode}
                  defaultOpen={cat.defaultOpen}
                  searchTerm={searchTerm}
                  isCollapsed={isCollapsed}
                  onToggle={onToggleCategory ? () => onToggleCategory(cat.category) : undefined}
                  viewState={viewState}
                  canvasSize={canvasSize}
                  onShowNodeDoc={onShowNodeDoc}
                />
              );
            })}
            {/* Bottom padding to ensure last items are visible */}
            <div className="h-4" />
          </div>

          {/* Footer hint */}
          <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 bg-[#1e1e1e]">
            <p className="text-[9px] text-gray-600 text-center">
              Click or drag nodes to canvas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
