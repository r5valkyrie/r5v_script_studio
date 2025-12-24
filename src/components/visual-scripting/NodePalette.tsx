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
  GripVertical
} from 'lucide-react';
import { NODE_DEFINITIONS, getNodesByCategory } from '../../data/node-definitions';
import type { ScriptNode, NodePort } from '../../types/visual-scripting';

interface NodePaletteProps {
  onAddNode: (node: ScriptNode) => void;
  onClose: () => void;
  collapsedCategories?: string[];
  onToggleCategory?: (category: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isEmbedded?: boolean;
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
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  'core-flow': { icon: <Workflow size={14} />, color: 'purple' },
  'events': { icon: <Zap size={14} />, color: 'yellow' },
  'entity': { icon: <User size={14} />, color: 'blue' },
  'weapons': { icon: <Sword size={14} />, color: 'red' },
  'status-effects': { icon: <Shield size={14} />, color: 'green' },
  'particles': { icon: <Sparkles size={14} />, color: 'pink' },
  'audio': { icon: <Volume2 size={14} />, color: 'cyan' },
  'damage': { icon: <Crosshair size={14} />, color: 'orange' },
  'ui': { icon: <Monitor size={14} />, color: 'indigo' },
  'math': { icon: <Calculator size={14} />, color: 'emerald' },
  'callbacks': { icon: <RotateCcw size={14} />, color: 'amber' },
  'data': { icon: <Database size={14} />, color: 'violet' },
  'utilities': { icon: <Wrench size={14} />, color: 'slate' },
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-400', hover: 'hover:bg-purple-500/20 hover:border-purple-500' },
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
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/50', text: 'text-slate-400', hover: 'hover:bg-slate-500/20 hover:border-slate-500' },
};

function CategorySection({ title, category, icon, color, onAddNode, defaultOpen = false, searchTerm = '', isCollapsed, onToggle }: CategorySectionProps) {
  const [localIsOpen, setLocalIsOpen] = useState(defaultOpen);
  // Use controlled state if provided, otherwise use local state
  const isOpen = isCollapsed !== undefined ? !isCollapsed : localIsOpen;
  const allNodes = getNodesByCategory(category);
  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.purple;
  
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

  // Auto-open if search matches
  const shouldShow = searchTerm ? nodes.length > 0 : true;
  const isExpanded = searchTerm ? nodes.length > 0 : isOpen;

  if (!shouldShow) return null;

  const handleNodeClick = (nodeType: string) => {
    const definition = NODE_DEFINITIONS.find(def => def.type === nodeType);
    if (!definition) return;

    // Create a new node instance
    const newNode: ScriptNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position: { x: 300, y: 200 }, // Default position in center
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

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => !searchTerm && handleToggle()}
        className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors group`}
      >
        <div className={`p-1.5 rounded ${colorClasses.bg} ${colorClasses.text}`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${colorClasses.text}`}>
          {title}
        </span>
        <span className="ml-auto text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
          {nodes.length}
        </span>
        {!searchTerm && (
          isExpanded ? (
            <ChevronDown size={12} className="text-gray-500" />
          ) : (
            <ChevronRight size={12} className="text-gray-500" />
          )
        )}
      </button>

      {isExpanded && (
        <div className="pb-2 pl-2">
          {nodes.map((node) => (
            <button
              key={node.type}
              onClick={() => handleNodeClick(node.type)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('node-type', node.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-400 
                ${colorClasses.hover} transition-all rounded-l-md border-l-2 border-transparent
                group/node cursor-grab active:cursor-grabbing`}
              title={node.description}
            >
              <GripVertical size={12} className="text-gray-600 opacity-0 group-hover/node:opacity-100 transition-opacity" />
              <span className="group-hover/node:text-white transition-colors">
                {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NodePalette({ onAddNode, onClose, collapsedCategories = [], onToggleCategory, isExpanded = true, onToggleExpanded, isEmbedded = false }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { title: 'Core Flow', category: 'core-flow', defaultOpen: true },
    { title: 'Events', category: 'events' },
    { title: 'Entity', category: 'entity' },
    { title: 'Weapons', category: 'weapons' },
    { title: 'Status Effects', category: 'status-effects' },
    { title: 'Particles', category: 'particles' },
    { title: 'Audio', category: 'audio' },
    { title: 'Damage', category: 'damage' },
    { title: 'UI', category: 'ui' },
    { title: 'Math', category: 'math' },
    { title: 'Callbacks', category: 'callbacks' },
    { title: 'Data', category: 'data' },
    { title: 'Utilities', category: 'utilities' },
    { title: 'String', category: 'string' }
  ];

  // Count total nodes
  const totalNodes = categories.reduce((acc, cat) => acc + getNodesByCategory(cat.category).length, 0);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Collapsible Header - matching Project style */}
      {isEmbedded && (
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0f1419] hover:bg-[#1a1f28] transition-colors border-b border-white/10 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-purple-500/10">
              <Workflow size={14} className="text-purple-400" />
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
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#151a21] to-[#0f1419]">
          {/* Non-embedded header */}
          {!isEmbedded && (
            <div className="flex-shrink-0 px-3 py-3 border-b border-white/10 bg-[#0a0d10] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-500/20">
                  <Workflow size={14} className="text-purple-400" />
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
          <div className="flex-shrink-0 p-2 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                >
                  <X size={12} className="text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {categories.map(cat => {
              const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG['core-flow'];
              const isCollapsed = collapsedCategories.includes(cat.category);
              return (
                <CategorySection
                  key={cat.category}
                  title={cat.title}
                  category={cat.category}
                  icon={config.icon}
                  color={config.color}
                  onAddNode={onAddNode}
                  defaultOpen={cat.defaultOpen}
                  searchTerm={searchTerm}
                  isCollapsed={isCollapsed}
                  onToggle={onToggleCategory ? () => onToggleCategory(cat.category) : undefined}
                />
              );
            })}
            {/* Bottom padding to ensure last items are visible */}
            <div className="h-4" />
          </div>

          {/* Footer hint */}
          <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 bg-black/20">
            <p className="text-[10px] text-gray-600 text-center">
              Drag nodes to canvas or click to add
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
