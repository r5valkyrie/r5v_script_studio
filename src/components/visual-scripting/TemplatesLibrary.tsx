import { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Trash2,
  Plus,
  Library,
  Sword,
  Target,
  Gamepad2,
  RotateCcw,
  Monitor,
  Folder,
} from 'lucide-react';
import type { NodeTemplate, TemplateCategory, ScriptNode, NodeConnection } from '../../types/visual-scripting';
import { TEMPLATE_CATEGORY_INFO } from '../../types/visual-scripting';
import { loadTemplates, deleteTemplate as deleteTemplateFromStorage, instantiateTemplate } from '../../utils/template-storage';
import { BUILT_IN_TEMPLATES } from '../../data/built-in-templates';

interface TemplatesLibraryProps {
  onInsertTemplate: (nodes: ScriptNode[], connections: NodeConnection[]) => void;
  onSaveTemplate?: () => void;
  hasSelection?: boolean;
  viewState?: { x: number; y: number; scale: number };
  canvasSize?: { width: number; height: number };
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isEmbedded?: boolean;
  refreshKey?: number;
  accentColor?: string;
}

// Category icons
const CATEGORY_ICONS: Record<TemplateCategory, React.ReactNode> = {
  'built-in': <Library size={14} />,
  'weapon-setup': <Sword size={14} />,
  'npc-spawning': <Target size={14} />,
  'gamemode': <Gamepad2 size={14} />,
  'callbacks': <RotateCcw size={14} />,
  'ui-patterns': <Monitor size={14} />,
  'custom': <Folder size={14} />,
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-400', hover: 'hover:bg-purple-500/20 hover:border-purple-500' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', hover: 'hover:bg-yellow-500/20 hover:border-yellow-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', hover: 'hover:bg-blue-500/20 hover:border-blue-500' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', hover: 'hover:bg-red-500/20 hover:border-red-500' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-400', hover: 'hover:bg-green-500/20 hover:border-green-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-400', hover: 'hover:bg-orange-500/20 hover:border-orange-500' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/20 hover:border-cyan-500' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/50', text: 'text-slate-400', hover: 'hover:bg-slate-500/20 hover:border-slate-500' },
};

// Map hex colors to Tailwind color names
const hexToTailwindColor = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#8B5CF6': 'purple',
    '#E67E22': 'orange',
    '#27AE60': 'green',
    '#C0392B': 'red',
    '#8E44AD': 'purple',
    '#3498DB': 'blue',
    '#95A5A6': 'slate',
  };
  return colorMap[hex] || 'purple';
};

interface CategorySectionProps {
  category: TemplateCategory;
  templates: NodeTemplate[];
  isOpen: boolean;
  onToggle: () => void;
  onInsert: (template: NodeTemplate) => void;
  onDelete: (templateId: string, templateName: string) => void;
  searchTerm: string;
}

function CategorySection({
  category,
  templates,
  isOpen,
  onToggle,
  onInsert,
  onDelete,
  searchTerm,
}: CategorySectionProps) {
  const categoryInfo = TEMPLATE_CATEGORY_INFO.find(c => c.id === category);
  const color = categoryInfo ? hexToTailwindColor(categoryInfo.color) : 'purple';
  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.purple;
  const icon = CATEGORY_ICONS[category] || <Library size={14} />;

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    const term = searchTerm.toLowerCase();
    return templates.filter(
      t =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }, [templates, searchTerm]);

  const shouldShow = searchTerm ? filteredTemplates.length > 0 : templates.length > 0;
  const isExpanded = searchTerm ? filteredTemplates.length > 0 : isOpen;

  if (!shouldShow) return null;

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => !searchTerm && onToggle()}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors group"
      >
        <div className={`p-1.5 rounded ${colorClasses.bg} ${colorClasses.text}`}>{icon}</div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${colorClasses.text}`}>
          {categoryInfo?.label || category}
        </span>
        <span className="ml-auto text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
          {filteredTemplates.length}
        </span>
        {!searchTerm &&
          (isExpanded ? (
            <ChevronDown size={12} className="text-gray-500" />
          ) : (
            <ChevronRight size={12} className="text-gray-500" />
          ))}
      </button>

      {isExpanded && (
        <div className="pb-2 pl-2">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`w-full flex items-center gap-1 pr-1.5 text-left text-sm text-gray-400 
                ${colorClasses.hover} transition-all rounded-l-md border-l-2 border-transparent
                group/template`}
            >
              <button
                onClick={() => onInsert(template)}
                className="flex-1 flex flex-col gap-0.5 px-3 py-2 cursor-pointer"
                title={template.description}
              >
                <span className="group-hover/template:text-white transition-colors text-left font-medium">
                  {template.name}
                </span>
                <span className="text-[10px] text-gray-600 text-left truncate max-w-[180px]">
                  {template.nodes.length} nodes • {template.description}
                </span>
              </button>
              {/* Delete button for custom templates */}
              {!template.isBuiltIn && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(template.id, template.name);
                  }}
                  className="p-1.5 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all flex-shrink-0 opacity-0 group-hover/template:opacity-100"
                  title="Delete template"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TemplatesLibrary({
  onInsertTemplate,
  onSaveTemplate,
  hasSelection = false,
  viewState,
  canvasSize,
  isExpanded = true,
  onToggleExpanded,
  isEmbedded = false,
  refreshKey = 0,
  accentColor = '#8B5CF6',
}: TemplatesLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<TemplateCategory>>(new Set(['built-in']));
  const [userTemplates, setUserTemplates] = useState<NodeTemplate[]>(() => loadTemplates());

  // Reload templates when refreshKey changes
  useEffect(() => {
    setUserTemplates(loadTemplates());
  }, [refreshKey]);

  // Combine built-in and user templates
  const allTemplates = useMemo(() => {
    return [...BUILT_IN_TEMPLATES, ...userTemplates];
  }, [userTemplates]);

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const grouped: Record<TemplateCategory, NodeTemplate[]> = {
      'built-in': [],
      'weapon-setup': [],
      'npc-spawning': [],
      'gamemode': [],
      'callbacks': [],
      'ui-patterns': [],
      'custom': [],
    };

    allTemplates.forEach(template => {
      const cat = template.category as TemplateCategory;
      if (cat in grouped) {
        grouped[cat].push(template);
      } else {
        grouped['custom'].push(template);
      }
    });

    return grouped;
  }, [allTemplates]);

  const handleToggleCategory = (category: TemplateCategory) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleInsert = (template: NodeTemplate) => {
    // Calculate center of view for spawn position
    let spawnX = 300;
    let spawnY = 200;
    if (viewState && canvasSize) {
      const screenCenterX = canvasSize.width / 2;
      const screenCenterY = canvasSize.height / 2;
      spawnX = (screenCenterX - viewState.x) / viewState.scale - 90;
      spawnY = (screenCenterY - viewState.y) / viewState.scale - 30;
    }

    const { nodes, connections } = instantiateTemplate(template, { x: spawnX, y: spawnY });
    onInsertTemplate(nodes, connections);
  };

  const handleDelete = (templateId: string, templateName: string) => {
    if (window.confirm(`Delete template "${templateName}"? This cannot be undone.`)) {
      const updated = deleteTemplateFromStorage(templateId);
      setUserTemplates(updated);
    }
  };

  // Count total templates
  const totalTemplates = allTemplates.length;

  // Categories to display (in order)
  const categories: TemplateCategory[] = ['built-in', 'weapon-setup', 'npc-spawning', 'gamemode', 'callbacks', 'ui-patterns', 'custom'];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Collapsible Header */}
      {isEmbedded && (
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0f1419] hover:bg-[#1a1f28] transition-colors border-b border-white/10 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded" style={{ backgroundColor: 'var(--accent-color-bg)' }}>
              <Library size={14} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-semibold tracking-wider text-gray-500 uppercase">
                Templates
              </span>
              <span className="text-xs font-medium text-white">{totalTemplates} available</span>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          />
        </button>
      )}

      {/* Content */}
      {(isExpanded || !isEmbedded) && (
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#151a21] to-[#0f1419]">
          {/* Search + Save Button */}
          <div className="flex-shrink-0 p-2 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-color-dim)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-color-bg)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
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

            {/* Save Selection as Template button */}
            {onSaveTemplate && (
              <button
                onClick={onSaveTemplate}
                disabled={!hasSelection}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  hasSelection
                    ? 'hover:brightness-110'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'
                }`}
                style={hasSelection ? {
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `${accentColor}50`
                } : undefined}
              >
                <Plus size={14} />
                Save Selection as Template
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {categories.map(category => (
              <CategorySection
                key={category}
                category={category}
                templates={templatesByCategory[category]}
                isOpen={openCategories.has(category)}
                onToggle={() => handleToggleCategory(category)}
                onInsert={handleInsert}
                onDelete={handleDelete}
                searchTerm={searchTerm}
              />
            ))}
            <div className="h-4" />
          </div>

          {/* Footer hint */}
          <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 bg-black/20">
            <p className="text-[10px] text-gray-600 text-center">Click a template to insert it</p>
          </div>
        </div>
      )}
    </div>
  );
}
