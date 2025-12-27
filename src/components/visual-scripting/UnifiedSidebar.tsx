import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Search,
  Workflow,
  Star,
  Package,
  X,
  PanelLeft,
  Folder,
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
  Gamepad2,
  Boxes,
  Play,
  GitBranch,
  Target,
  Box,
  Tags,
  Type,
  Layers,
  Heart,
  Cpu,
  Map,
  Users,
  Library,
  Trash2,
  Plus,
  Info
} from 'lucide-react';
import { NODE_DEFINITIONS, getNodesByCategory } from '../../data/node-definitions';
import { CATEGORY_INFO, TEMPLATE_CATEGORY_INFO } from '../../types/visual-scripting';
import type { ScriptNode, NodeType, NodeTemplate, TemplateCategory, NodeConnection } from '../../types/visual-scripting';
import { loadTemplates, deleteTemplate as deleteTemplateFromStorage, instantiateTemplate } from '../../utils/template-storage';
import { BUILT_IN_TEMPLATES } from '../../data/built-in-templates';
import ProjectSidebar from './ProjectSidebar';
import type { ScriptFile, WeaponFile } from '../../types/project';

type SidebarTab = 'project' | 'nodes' | 'presets';

// Icons for each node category
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'init': <Play size={12} />,
  'flow': <Workflow size={12} />,
  'gamemodes': <Gamepad2 size={12} />,
  'callbacks': <RotateCcw size={12} />,
  'entity': <User size={12} />,
  'entity-creation': <Box size={12} />,
  'entity-props': <Cpu size={12} />,
  'npc': <Target size={12} />,
  'weapons': <Sword size={12} />,
  'status-effects': <Shield size={12} />,
  'vfx': <Sparkles size={12} />,
  'audio': <Volume2 size={12} />,
  'damage': <Crosshair size={12} />,
  'ui': <Monitor size={12} />,
  'math': <Calculator size={12} />,
  'string': <Type size={12} />,
  'structures': <Boxes size={12} />,
  'collections': <Layers size={12} />,
  'survival': <Map size={12} />,
  'passives': <Heart size={12} />,
  'character': <Users size={12} />,
};

// Icons for template categories
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  'built-in': <Library size={12} />,
  'weapon-setup': <Sword size={12} />,
  'npc-spawning': <Target size={12} />,
  'gamemode': <Gamepad2 size={12} />,
  'callbacks': <RotateCcw size={12} />,
  'ui-patterns': <Monitor size={12} />,
  'custom': <Folder size={12} />,
};

interface UnifiedSidebarProps {
  // Project props
  projectName: string;
  scriptFiles: ScriptFile[];
  activeScriptFileId: string | null;
  scriptFolders: string[];
  onSelectScriptFile: (fileId: string) => void;
  onCreateScriptFile: (fileName: string) => void;
  onDeleteScriptFile: (fileId: string) => void;
  onRenameScriptFile: (fileId: string, newName: string) => void;
  onCreateScriptFolder: (folderPath: string) => void;
  onDeleteScriptFolder: (folderPath: string) => void;
  onRenameScriptFolder?: (oldPath: string, newPath: string) => void;
  weaponFiles: WeaponFile[];
  activeWeaponFileId: string | null;
  weaponFolders: string[];
  onSelectWeaponFile: (fileId: string) => void;
  onCreateWeaponFile: (fileName: string, baseWeapon?: string) => void;
  onDeleteWeaponFile: (fileId: string) => void;
  onRenameWeaponFile: (fileId: string, newName: string) => void;
  onCreateWeaponFolder: (folderPath: string) => void;
  onDeleteWeaponFolder: (folderPath: string) => void;
  onRenameWeaponFolder?: (oldPath: string, newPath: string) => void;
  modifiedFileIds: Set<string>;
  
  // Node palette props
  onAddNode: (node: ScriptNode) => void;
  viewState?: { x: number; y: number; scale: number };
  canvasSize?: { width: number; height: number };
  onShowNodeDoc?: (nodeType: NodeType) => void;
  
  // Templates props
  onInsertTemplate: (nodes: ScriptNode[], connections: any[]) => void;
  onSaveTemplate: () => void;
  hasSelection: boolean;
  templateRefreshKey?: number;
  
  // General
  accentColor: string;
  activeFileType: 'script' | 'weapon';
  onClose: () => void;
}

// Storage key for favorites
const FAVORITES_KEY = 'r5v_node_favorites';

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export default function UnifiedSidebar({
  projectName,
  scriptFiles,
  activeScriptFileId,
  scriptFolders,
  onSelectScriptFile,
  onCreateScriptFile,
  onDeleteScriptFile,
  onRenameScriptFile,
  onCreateScriptFolder,
  onDeleteScriptFolder,
  onRenameScriptFolder,
  weaponFiles,
  activeWeaponFileId,
  weaponFolders,
  onSelectWeaponFile,
  onCreateWeaponFile,
  onDeleteWeaponFile,
  onRenameWeaponFile,
  onCreateWeaponFolder,
  onDeleteWeaponFolder,
  onRenameWeaponFolder,
  modifiedFileIds,
  onAddNode,
  viewState,
  canvasSize,
  onShowNodeDoc,
  onInsertTemplate,
  onSaveTemplate,
  hasSelection,
  templateRefreshKey,
  accentColor,
  activeFileType,
  onClose,
}: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('nodes');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['init', 'flow']));
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  
  // Template state
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [expandedTemplateCategories, setExpandedTemplateCategories] = useState<Set<string>>(new Set(['built-in']));
  const [userTemplates, setUserTemplates] = useState<NodeTemplate[]>([]);
  
  // Load user templates
  useEffect(() => {
    setUserTemplates(loadTemplates());
  }, [templateRefreshKey]);

  // Toggle template category expansion
  const toggleTemplateCategory = useCallback((category: string) => {
    setExpandedTemplateCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);
  
  // Handle template deletion
  const handleDeleteTemplate = useCallback((templateId: string) => {
    deleteTemplateFromStorage(templateId);
    setUserTemplates(loadTemplates());
  }, []);
  
  // Handle template insertion
  const handleInsertTemplate = useCallback((template: NodeTemplate) => {
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
  }, [viewState, canvasSize, onInsertTemplate]);

  // Toggle favorite
  const toggleFavorite = useCallback((nodeType: string) => {
    setFavorites(prev => {
      const next = prev.includes(nodeType)
        ? prev.filter(t => t !== nodeType)
        : [...prev, nodeType];
      saveFavorites(next);
      return next;
    });
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Get category info
  const getCategoryInfo = (categoryId: string) => {
    return CATEGORY_INFO.find(c => c.id === categoryId);
  };

  // Group nodes by subcategory (using type prefix as grouping)
  const getSubcategories = useCallback((category: string, nodes: typeof NODE_DEFINITIONS) => {
    const subcategories: Record<string, typeof nodes> = {};
    
    nodes.forEach(node => {
      // Group by common type prefix (e.g., "entity-spawn" -> "spawn")
      const typeParts = node.type.split('-');
      const subcat = typeParts.length > 1 ? typeParts.slice(0, 2).join('-') : 'general';
      if (!subcategories[subcat]) {
        subcategories[subcat] = [];
      }
      subcategories[subcat].push(node);
    });
    
    // If only one group or mostly in general, just return all as general
    const keys = Object.keys(subcategories);
    if (keys.length <= 2 || (subcategories['general']?.length || 0) > nodes.length * 0.6) {
      return { 'general': nodes };
    }
    
    return subcategories;
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((nodeType: string) => {
    const definition = NODE_DEFINITIONS.find(def => def.type === nodeType);
    if (!definition) return;

    let spawnX = 300;
    let spawnY = 200;
    if (viewState && canvasSize) {
      const screenCenterX = canvasSize.width / 2;
      const screenCenterY = canvasSize.height / 2;
      spawnX = (screenCenterX - viewState.x) / viewState.scale - 90;
      spawnY = (screenCenterY - viewState.y) / viewState.scale - 30;
    }

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
  }, [viewState, canvasSize, onAddNode]);

  // Filter nodes by search
  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    return CATEGORY_INFO.map(catInfo => {
      const nodes = getNodesByCategory(catInfo.id);
      const filteredNodes = term
        ? nodes.filter(n => 
            n.label.toLowerCase().includes(term) || 
            n.description?.toLowerCase().includes(term) ||
            n.type.toLowerCase().includes(term)
          )
        : nodes;
      
      return {
        ...catInfo,
        nodes: filteredNodes,
        subcategories: getSubcategories(catInfo.id, filteredNodes),
      };
    }).filter(cat => cat.nodes.length > 0);
  }, [searchTerm, getSubcategories]);

  // Get favorite nodes
  const favoriteNodes = useMemo(() => {
    return NODE_DEFINITIONS.filter(n => favorites.includes(n.type));
  }, [favorites]);

  // Render a node card with tooltip
  const renderNodeCard = (node: typeof NODE_DEFINITIONS[0], categoryColor: string) => {
    const isFavorite = favorites.includes(node.type);
    
    return (
      <div
        key={node.type}
        className="group/card flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing transition-all active:scale-95 active:opacity-70"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('node-type', node.type);
          e.dataTransfer.effectAllowed = 'copy';
          
          // Create custom drag image
          const dragEl = document.createElement('div');
          dragEl.className = 'flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-medium';
          dragEl.style.cssText = `
            background: linear-gradient(135deg, ${categoryColor}dd 0%, ${categoryColor}99 100%);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${categoryColor}40;
            border: 1px solid rgba(255,255,255,0.2);
            position: absolute;
            top: -1000px;
            left: -1000px;
            white-space: nowrap;
          `;
          dragEl.innerHTML = `
            <span style="width: 8px; height: 8px; background: white; border-radius: 50%; opacity: 0.8;"></span>
            <span>${node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}</span>
          `;
          document.body.appendChild(dragEl);
          e.dataTransfer.setDragImage(dragEl, 20, 16);
          
          // Clean up after drag starts
          requestAnimationFrame(() => {
            document.body.removeChild(dragEl);
          });
        }}
        onClick={() => handleNodeClick(node.type)}
      >
        {/* Node icon/indicator */}
        <div 
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}30` }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
        </div>
        
        {/* Node label */}
        <span className="flex-1 text-[11px] text-gray-300 truncate">
          {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
        </span>
        
        {/* Info button for docs */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowNodeDoc?.(node.type);
          }}
          className="p-0.5 rounded transition-all opacity-0 group-hover/card:opacity-100 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20"
          title="View documentation"
        >
          <Info size={10} />
        </button>
        
        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(node.type);
          }}
          className={`p-0.5 rounded transition-all opacity-0 group-hover/card:opacity-100 ${
            isFavorite ? 'text-yellow-400 opacity-100' : 'text-gray-500 hover:text-yellow-400'
          }`}
        >
          <Star size={10} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* Header with close button */}
      <div className="flex-shrink-0 bg-[#212121] border-b border-white/8">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-gray-400">Explorer</span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Close Sidebar"
          >
            <PanelLeft size={14} />
          </button>
        </div>
      </div>
      {/* Project view always visible */}
      <div className="bg-[#212121] border-b border-white/10" style={{ minHeight: 120 }}>
        <ProjectSidebar
          scriptFiles={scriptFiles}
          activeScriptFileId={activeScriptFileId}
          scriptFolders={scriptFolders}
          onSelectScriptFile={onSelectScriptFile}
          onCreateScriptFile={onCreateScriptFile}
          onDeleteScriptFile={onDeleteScriptFile}
          onRenameScriptFile={onRenameScriptFile}
          onCreateScriptFolder={onCreateScriptFolder}
          onDeleteScriptFolder={onDeleteScriptFolder}
          onRenameScriptFolder={onRenameScriptFolder}
          weaponFiles={weaponFiles}
          activeWeaponFileId={activeWeaponFileId}
          weaponFolders={weaponFolders}
          onSelectWeaponFile={onSelectWeaponFile}
          onCreateWeaponFile={onCreateWeaponFile}
          onDeleteWeaponFile={onDeleteWeaponFile}
          onRenameWeaponFile={onRenameWeaponFile}
          onCreateWeaponFolder={onCreateWeaponFolder}
          onDeleteWeaponFolder={onDeleteWeaponFolder}
          onRenameWeaponFolder={onRenameWeaponFolder}
          modifiedFileIds={modifiedFileIds}
          accentColor={accentColor}
        />
      </div>
      {/* Tabs for Nodes and Presets below project view */}
      <div className="flex-shrink-0 bg-[#212121] border-b border-white/8">
        <div className="flex border-t border-white/5">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'nodes'
                ? 'text-white border-current'
                : 'text-gray-500 hover:text-gray-300 border-transparent'
            }`}
            style={{ borderColor: activeTab === 'nodes' ? accentColor : 'transparent' }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Workflow size={12} />
              Nodes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'presets'
                ? 'text-white border-current'
                : 'text-gray-500 hover:text-gray-300 border-transparent'
            }`}
            style={{ borderColor: activeTab === 'presets' ? accentColor : 'transparent' }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Package size={12} />
              Presets
            </div>
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Nodes Tab */}
        {activeTab === 'nodes' && activeFileType === 'script' && (
          <div className="h-full flex flex-col">
            {/* Search */}
            <div className="flex-shrink-0 p-3 border-b border-white/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#121212] border border-white/8 rounded text-[11px] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2196F3]/50 transition-all"
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

            {/* Node List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
              {/* Favorites Section */}
              <div className="mb-2">
                <button
                  onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                  className="w-full flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  {favoritesExpanded ? (
                    <ChevronDown size={12} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={12} className="text-gray-500" />
                  )}
                  <Star size={12} className="text-yellow-400" />
                  <span className="text-[11px] font-semibold text-white uppercase tracking-wide flex-1 text-left">
                    Favorites
                  </span>
                  <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                    {favoriteNodes.length}
                  </span>
                </button>
                
                {favoritesExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {favoriteNodes.length === 0 ? (
                      <div className="text-[10px] text-gray-500 px-2 py-3 text-center">
                        No Favorites.
                      </div>
                    ) : (
                      favoriteNodes.map(node => {
                        const catInfo = getCategoryInfo(node.category);
                        return renderNodeCard(node, catInfo?.color || '#888');
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Category Sections */}
              {filteredCategories.map(category => {
                const isExpanded = expandedCategories.has(category.id) || !!searchTerm;
                const icon = CATEGORY_ICONS[category.id] || <Database size={12} />;
                
                return (
                  <div key={category.id} className="mb-2">
                    {/* Category Header */}
                    <button
                      onClick={() => !searchTerm && toggleCategory(category.id)}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {!searchTerm && (
                        isExpanded ? (
                          <ChevronDown size={12} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={12} className="text-gray-500" />
                        )
                      )}
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}30` }}
                      >
                        <span style={{ color: category.color }}>{icon}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-white uppercase tracking-wide flex-1 text-left">
                        {category.label}
                      </span>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                        {category.nodes.length}
                      </span>
                    </button>

                    {/* Category Content */}
                    {isExpanded && (
                      <div className="ml-4 mt-1">
                        {Object.entries(category.subcategories).map(([subcat, nodes]) => (
                          <div key={subcat} className="mb-2">
                            {/* Subcategory header */}
                            {Object.keys(category.subcategories).length > 1 && subcat !== 'general' && (
                              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-medium px-2 py-1 border-b border-white/5 mb-1">
                                {subcat.replace(/-/g, ' ')}
                              </div>
                            )}
                            {/* Node cards */}
                            <div className="space-y-1">
                              {nodes.map(node => renderNodeCard(node, category.color))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 bg-[#1e1e1e]">
              <p className="text-[9px] text-gray-600 text-center">
                Click or drag nodes to canvas
              </p>
            </div>
          </div>
        )}

        {/* Nodes tab when weapon file is active */}
        {activeTab === 'nodes' && activeFileType === 'weapon' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 px-4">
              <Sword size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">Visual nodes are only available for script files.</p>
              <p className="text-[10px] mt-1 text-gray-600">Switch to a .nut file to use nodes.</p>
            </div>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="h-full flex flex-col">
            {/* Search and Save */}
            <div className="flex-shrink-0 px-3 pt-3 pb-2 space-y-2">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearchTerm}
                  onChange={(e) => setTemplateSearchTerm(e.target.value)}
                  className="w-full bg-[#2d2d2d] border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              
              {/* Save Selection Button */}
              <button
                onClick={onSaveTemplate}
                disabled={!hasSelection}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                  hasSelection
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                <Plus size={12} />
                Save Selection as Template
              </button>
            </div>

            {/* Template Categories */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {(() => {
                const searchLower = templateSearchTerm.toLowerCase();
                
                // Combine built-in and user templates by category
                const templatesByCategory: Record<string, NodeTemplate[]> = {};
                
                // Add built-in templates
                BUILT_IN_TEMPLATES.forEach(template => {
                  const category = template.category;
                  if (!templatesByCategory[category]) {
                    templatesByCategory[category] = [];
                  }
                  templatesByCategory[category].push(template);
                });
                
                // Add user templates to 'custom' category
                if (userTemplates.length > 0) {
                  if (!templatesByCategory['custom']) {
                    templatesByCategory['custom'] = [];
                  }
                  templatesByCategory['custom'].push(...userTemplates);
                }
                
                // Filter by search
                const filteredCategories = Object.entries(templatesByCategory)
                  .map(([categoryId, templates]) => {
                    const filteredTemplates = templateSearchTerm
                      ? templates.filter(t => 
                          t.name.toLowerCase().includes(searchLower) ||
                          t.description?.toLowerCase().includes(searchLower)
                        )
                      : templates;
                    
                    const categoryInfo = TEMPLATE_CATEGORY_INFO.find(c => c.id === categoryId);
                    
                    return {
                      id: categoryId,
                      label: categoryInfo?.label || categoryId,
                      color: categoryInfo?.color || '#888888',
                      description: categoryInfo?.description || '',
                      templates: filteredTemplates,
                    };
                  })
                  .filter(cat => cat.templates.length > 0);

                if (filteredCategories.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Library size={24} className="mx-auto mb-2 text-gray-600" />
                      <p className="text-[11px] text-gray-500">No templates found</p>
                    </div>
                  );
                }

                return filteredCategories.map(category => {
                  const isExpanded = expandedTemplateCategories.has(category.id) || !!templateSearchTerm;
                  const icon = TEMPLATE_ICONS[category.id] || <Library size={12} />;

                  return (
                    <div key={category.id} className="mb-2">
                      {/* Category Header */}
                      <button
                        onClick={() => !templateSearchTerm && toggleTemplateCategory(category.id)}
                        className="w-full flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {!templateSearchTerm && (
                          isExpanded ? (
                            <ChevronDown size={12} className="text-gray-500" />
                          ) : (
                            <ChevronRight size={12} className="text-gray-500" />
                          )
                        )}
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}30` }}
                        >
                          <span style={{ color: category.color }}>{icon}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-white uppercase tracking-wide flex-1 text-left">
                          {category.label}
                        </span>
                        <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {category.templates.length}
                        </span>
                      </button>

                      {/* Template Cards */}
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {category.templates.map(template => (
                            <div
                              key={template.id}
                              onClick={() => handleInsertTemplate(template)}
                              className="group flex items-start gap-2 px-2 py-2 rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                            >
                              <div 
                                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: `${category.color}30` }}
                              >
                                <Package size={12} style={{ color: category.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-medium text-gray-200 truncate">
                                    {template.name}
                                  </span>
                                  <span className="text-[9px] text-gray-500 bg-white/5 px-1 py-0.5 rounded flex-shrink-0">
                                    {template.nodes.length} node{template.nodes.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                {template.description && (
                                  <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-2">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                              {/* Delete button for custom templates */}
                              {category.id === 'custom' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplate(template.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                  title="Delete template"
                                >
                                  <Trash2 size={10} className="text-red-400" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 bg-[#1e1e1e]">
              <p className="text-[9px] text-gray-600 text-center">
                Click to insert template at viewport center
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
