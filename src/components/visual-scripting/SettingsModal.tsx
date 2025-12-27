import { useState, useEffect } from 'react';
import { X, Settings, Keyboard, Palette, Save, RotateCcw, Monitor } from 'lucide-react';

// Default keybindings
const DEFAULT_KEYBINDINGS: Record<string, string> = {
  'save': 'Ctrl+S',
  'saveAs': 'Ctrl+Shift+S',
  'open': 'Ctrl+O',
  'newProject': 'Ctrl+N',
  'compile': 'Ctrl+B',
  'undo': 'Ctrl+Z',
  'redo': 'Ctrl+Shift+Z',
  'delete': 'Delete',
  'copy': 'Ctrl+C',
  'paste': 'Ctrl+V',
  'cut': 'Ctrl+X',
  'selectAll': 'Ctrl+A',
  'search': 'Ctrl+F',
  'toggleCodePanel': 'Ctrl+Shift+C',
  'toggleSidebar': 'Ctrl+\\',
  'nodeSpotlight': 'Ctrl+Space',
};

// Keybinding labels
const KEYBINDING_LABELS: Record<string, string> = {
  'save': 'Save Project',
  'saveAs': 'Save Project As',
  'open': 'Open Project',
  'newProject': 'New Project',
  'compile': 'Compile Project',
  'undo': 'Undo',
  'redo': 'Redo',
  'delete': 'Delete Selected',
  'copy': 'Copy',
  'paste': 'Paste',
  'cut': 'Cut',
  'selectAll': 'Select All',
  'search': 'Search',
  'toggleCodePanel': 'Toggle Code Panel',
  'toggleSidebar': 'Toggle Sidebar',
  'nodeSpotlight': 'Node Spotlight',
};

// Group keybindings by category
const KEYBINDING_CATEGORIES = {
  'File': ['save', 'saveAs', 'open', 'newProject', 'compile'],
  'Edit': ['undo', 'redo', 'delete', 'copy', 'paste', 'cut', 'selectAll'],
  'View': ['toggleCodePanel', 'toggleSidebar', 'search', 'nodeSpotlight'],
};

// Default settings
export interface AppSettings {
  general: {
    autoSave: boolean;
    autoSaveInterval: number; // minutes
    confirmOnDelete: boolean;
    maxRecentProjects: number;
    exportPath: string; // Default mods folder path
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    showGridLines: boolean;
    gridStyle: 'dots' | 'lines' | 'cross';
    coloredGrid: boolean;
    gridSize: number;
    nodeOpacity: number;
    connectionStyle: 'bezier' | 'straight' | 'step' | 'smooth-step' | 'metro' | 'quadratic';
    connectionAnimation: 'none' | 'flow' | 'pulse' | 'dash' | 'glow';
  };
  editor: {
    snapToGrid: boolean;
    showNodeLabels: boolean;
    autoConnect: boolean;
    highlightConnections: boolean;
    connectionsBehindNodes: boolean;
  };
  ui: {
    isSidebarOpen: boolean;
    isProjectSectionExpanded: boolean;
    isNodesSectionExpanded: boolean;
    isInspectorOpen: boolean;
    isCodePanelOpen: boolean;
    sidebarWidth: number;
    inspectorWidth: number;
    codePanelWidth: number;
    minimapWidth: number;
    minimapHeight: number;
    collapsedCategories: string[];
  };
  keybindings: Record<string, string>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    autoSave: false,
    autoSaveInterval: 5,
    confirmOnDelete: true,
    maxRecentProjects: 10,
    exportPath: '',
  },
  appearance: {
    theme: 'dark',
    accentColor: '#2196F3', // Material Blue 500
    fontSize: 'medium',
    showGridLines: true,
    gridStyle: 'dots',
    coloredGrid: false,
    gridSize: 20,
    nodeOpacity: 100,
    connectionStyle: 'bezier',
    connectionAnimation: 'none',
  },
  editor: {
    snapToGrid: false,
    showNodeLabels: true,
    autoConnect: true,
    highlightConnections: true,
    connectionsBehindNodes: false,
  },
  ui: {
    isSidebarOpen: true,
    isProjectSectionExpanded: true,
    isNodesSectionExpanded: true,
    isInspectorOpen: true,
    isCodePanelOpen: false,
    sidebarWidth: 280,
    inspectorWidth: 320,
    codePanelWidth: 500,
    minimapWidth: 320,
    minimapHeight: 260,
    collapsedCategories: [],
  },
  keybindings: { ...DEFAULT_KEYBINDINGS },
};

// Load settings from localStorage
export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('r5v_mod_studio_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all keys exist
      return {
        general: { ...DEFAULT_SETTINGS.general, ...parsed.general },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
        editor: { ...DEFAULT_SETTINGS.editor, ...parsed.editor },
        ui: { ...DEFAULT_SETTINGS.ui, ...parsed.ui },
        keybindings: { ...DEFAULT_SETTINGS.keybindings, ...parsed.keybindings },
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

// Save settings to localStorage
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem('r5v_mod_studio_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onSave?: () => void;
}

type TabId = 'general' | 'appearance' | 'editor' | 'keybindings';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onSave,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [editingKeybind, setEditingKeybind] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingKeybind) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, editingKeybind]);

  if (!isOpen) return null;

  const updateSettings = <K extends keyof AppSettings>(
    category: K,
    key: keyof AppSettings[K],
    value: AppSettings[K][keyof AppSettings[K]]
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateKeybinding = (action: string, keybind: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      keybindings: {
        ...prev.keybindings,
        [action]: keybind,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    saveSettings(localSettings);
    setHasChanges(false);
    onSave?.();
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      setLocalSettings({ ...DEFAULT_SETTINGS });
      setHasChanges(true);
    }
  };

  const handleResetKeybindings = () => {
    if (confirm('Reset all keybindings to defaults?')) {
      setLocalSettings((prev) => ({
        ...prev,
        keybindings: { ...DEFAULT_KEYBINDINGS },
      }));
      setHasChanges(true);
    }
  };

  const handleKeybindCapture = (action: string, e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    let key = e.key;
    if (key === ' ') key = 'Space';
    else if (key === 'Escape') {
      setEditingKeybind(null);
      return;
    }
    else if (key.length === 1) key = key.toUpperCase();
    else if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') return;

    parts.push(key);
    const keybind = parts.join('+');

    updateKeybinding(action, keybind);
    setEditingKeybind(null);
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'editor', label: 'Editor', icon: <Monitor size={16} /> },
    { id: 'keybindings', label: 'Keybindings', icon: <Keyboard size={16} /> },
  ];

  const accentColors = [
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Yellow', value: '#EAB308' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
      <div 
        className="bg-[#2d2d2d] rounded w-[1000px] max-w-[90vw] h-[800px] max-h-[85vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 11px 15px -7px rgba(0,0,0,.2), 0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <Settings size={20} style={{ color: localSettings.appearance.accentColor }} />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/8 p-3 flex flex-col gap-1 bg-[#212121]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={activeTab === tab.id ? {
                  backgroundColor: `${localSettings.appearance.accentColor}30`,
                  color: localSettings.appearance.accentColor,
                } : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">General Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Auto Save</div>
                      <div className="text-xs text-gray-500">Automatically save projects at regular intervals</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.general.autoSave}
                      onChange={(e) => updateSettings('general', 'autoSave', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>

                  {localSettings.general.autoSave && (
                    <div className="ml-4 pl-4 border-l border-white/8">
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Auto Save Interval (minutes)</span>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={localSettings.general.autoSaveInterval}
                          onChange={(e) => updateSettings('general', 'autoSaveInterval', parseInt(e.target.value) || 5)}
                          className="w-20 px-3 py-1.5 bg-black/30 border border-white/8 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50"
                        />
                      </label>
                    </div>
                  )}

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Confirm on Delete</div>
                      <div className="text-xs text-gray-500">Show confirmation dialog when deleting nodes</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.general.confirmOnDelete}
                      onChange={(e) => updateSettings('general', 'confirmOnDelete', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-white">Max Recent Projects</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={localSettings.general.maxRecentProjects}
                      onChange={(e) => updateSettings('general', 'maxRecentProjects', parseInt(e.target.value) || 10)}
                      className="w-20 px-3 py-1.5 bg-black/30 border border-white/8 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50"
                    />
                  </label>

                  <div className="pt-4 border-t border-white/8">
                    <label className="block">
                      <span className="text-sm text-white mb-2 block">Default Export Path</span>
                      <p className="text-xs text-gray-500 mb-2">Folder where compiled mods will be exported (e.g., R5VLibrary/LIVE/mods/)</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={localSettings.general.exportPath}
                          placeholder="e.g., /path/to/R5VLibrary/LIVE/mods/"
                          className="flex-1 px-3 py-2 bg-black/30 border border-white/8 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50 text-sm"
                          readOnly
                        />
                        <button
                          onClick={async () => {
                            if (window.electronAPI) {
                              const dir = await window.electronAPI.selectDirectory();
                              if (dir) {
                                updateSettings('general', 'exportPath', dir);
                              }
                            }
                          }}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                          Browse
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Appearance Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white mb-2 block">Theme</label>
                    <div className="flex gap-2">
                      {(['dark', 'light', 'system'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => updateSettings('appearance', 'theme', theme)}
                          className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                            localSettings.appearance.theme === theme
                              ? 'text-white'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                          style={localSettings.appearance.theme === theme ? {
                            backgroundColor: localSettings.appearance.accentColor,
                          } : undefined}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white mb-2 block">Accent Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {accentColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => updateSettings('appearance', 'accentColor', color.value)}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            localSettings.appearance.accentColor === color.value
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2d2d2d] scale-110'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white mb-2 block">Font Size</label>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateSettings('appearance', 'fontSize', size)}
                          className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                            localSettings.appearance.fontSize === size
                              ? 'text-white'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                          style={localSettings.appearance.fontSize === size ? {
                            backgroundColor: localSettings.appearance.accentColor,
                          } : undefined}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Show Grid</div>
                      <div className="text-xs text-gray-500">Display grid in the node editor</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.appearance.showGridLines}
                      onChange={(e) => updateSettings('appearance', 'showGridLines', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>

                  {localSettings.appearance.showGridLines && (
                    <div>
                      <label className="text-sm text-white mb-2 block">Grid Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['dots', 'lines', 'cross'] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => updateSettings('appearance', 'gridStyle', style)}
                            className={`px-2 py-2 rounded-lg text-xs capitalize transition-all duration-200 flex flex-col items-center gap-1 ${
                              localSettings.appearance.gridStyle === style
                                ? 'text-white'
                                : 'bg-black/30 text-gray-400 hover:bg-black/40 hover:text-white'
                            }`}
                            style={localSettings.appearance.gridStyle === style ? {
                              backgroundColor: `${localSettings.appearance.accentColor}30`,
                              boxShadow: `0 0 0 2px ${localSettings.appearance.accentColor}`,
                            } : undefined}
                          >
                            {/* Grid style preview */}
                            <div className="w-7 h-7 rounded border border-white/20 bg-[#212121] overflow-hidden">
                              {style === 'dots' && (
                                <svg viewBox="0 0 24 24" className="w-full h-full">
                                  {[4, 12, 20].map(x => [4, 12, 20].map(y => (
                                    <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#4b5563" />
                                  )))}
                                </svg>
                              )}
                              {style === 'lines' && (
                                <svg viewBox="0 0 24 24" className="w-full h-full">
                                  {[8, 16].map(pos => (
                                    <g key={pos}>
                                      <line x1={pos} y1="0" x2={pos} y2="24" stroke="#4b5563" strokeWidth="0.5" />
                                      <line x1="0" y1={pos} x2="24" y2={pos} stroke="#4b5563" strokeWidth="0.5" />
                                    </g>
                                  ))}
                                </svg>
                              )}
                              {style === 'cross' && (
                                <svg viewBox="0 0 24 24" className="w-full h-full">
                                  {[8, 16].map(pos => (
                                    <g key={pos}>
                                      <line x1={pos-2} y1={pos} x2={pos+2} y2={pos} stroke="#4b5563" strokeWidth="0.5" />
                                      <line x1={pos} y1={pos-2} x2={pos} y2={pos+2} stroke="#4b5563" strokeWidth="0.5" />
                                    </g>
                                  ))}
                                </svg>
                              )}
                            </div>
                            <span className="text-[10px] leading-tight">{style}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {localSettings.appearance.showGridLines && (
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">Colored Grid</div>
                        <div className="text-xs text-gray-500">Tint the grid with your accent color</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localSettings.appearance.coloredGrid}
                        onChange={(e) => updateSettings('appearance', 'coloredGrid', e.target.checked)}
                        className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                      />
                    </label>
                  )}

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-white">Grid Size</span>
                    <input
                      type="number"
                      min={10}
                      max={50}
                      value={localSettings.appearance.gridSize}
                      onChange={(e) => updateSettings('appearance', 'gridSize', parseInt(e.target.value) || 20)}
                      className="w-20 px-3 py-1.5 bg-black/30 border border-white/8 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50"
                    />
                  </label>

                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">Node Opacity</span>
                      <span className="text-sm text-gray-400">{localSettings.appearance.nodeOpacity}%</span>
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={localSettings.appearance.nodeOpacity}
                      onChange={(e) => updateSettings('appearance', 'nodeOpacity', parseInt(e.target.value))}
                      className="w-full"
                      style={{ accentColor: localSettings.appearance.accentColor }}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white mb-2 block">Connection Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['bezier', 'straight', 'step', 'smooth-step', 'metro', 'quadratic'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => updateSettings('appearance', 'connectionStyle', style)}
                          className={`px-2 py-2 rounded-lg text-xs capitalize transition-all duration-200 flex flex-col items-center gap-1 ${
                            localSettings.appearance.connectionStyle === style
                              ? 'text-white'
                              : 'bg-black/30 text-gray-400 hover:bg-black/40 hover:text-white'
                          }`}
                          style={localSettings.appearance.connectionStyle === style ? {
                            backgroundColor: `${localSettings.appearance.accentColor}30`,
                            boxShadow: `0 0 0 2px ${localSettings.appearance.accentColor}`,
                          } : undefined}
                        >
                          {/* Connection style preview */}
                          <div className="w-10 h-7 rounded border border-white/20 bg-[#212121] overflow-hidden">
                            {style === 'bezier' && (
                              <svg viewBox="0 0 40 28" className="w-full h-full">
                                <path d="M4 14 C16 14, 16 6, 36 6" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <path d="M4 22 C20 22, 20 14, 36 14" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <circle cx="4" cy="14" r="2" fill="#6b7280" />
                                <circle cx="36" cy="6" r="2" fill="#6b7280" />
                                <circle cx="4" cy="22" r="2" fill="#6b7280" />
                                <circle cx="36" cy="14" r="2" fill="#6b7280" />
                              </svg>
                            )}
                            {style === 'straight' && (
                              <svg viewBox="0 0 40 28" className="w-full h-full">
                                <line x1="4" y1="14" x2="36" y2="6" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <line x1="4" y1="22" x2="36" y2="14" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <circle cx="4" cy="14" r="2" fill="#6b7280" />
                                <circle cx="36" cy="6" r="2" fill="#6b7280" />
                                <circle cx="4" cy="22" r="2" fill="#6b7280" />
                                <circle cx="36" cy="14" r="2" fill="#6b7280" />
                              </svg>
                            )}
                            {style === 'step' && (
                              <svg viewBox="0 0 40 28" className="w-full h-full">
                                <path d="M4 10 L20 10 L20 6 L36 6" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <path d="M4 22 L20 22 L20 18 L36 18" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <circle cx="4" cy="10" r="2" fill="#6b7280" />
                                <circle cx="36" cy="6" r="2" fill="#6b7280" />
                                <circle cx="4" cy="22" r="2" fill="#6b7280" />
                                <circle cx="36" cy="18" r="2" fill="#6b7280" />
                              </svg>
                            )}
                            {style === 'smooth-step' && (
                              <svg viewBox="0 0 40 28" className="w-full h-full">
                                <path d="M4 10 L16 10 Q20 10 20 6 L20 6 Q20 2 24 2 L36 2" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <path d="M4 22 L16 22 Q20 22 20 18 L20 18 Q20 14 24 14 L36 14" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <circle cx="4" cy="10" r="2" fill="#6b7280" />
                                <circle cx="36" cy="2" r="2" fill="#6b7280" />
                                <circle cx="4" cy="22" r="2" fill="#6b7280" />
                                <circle cx="36" cy="14" r="2" fill="#6b7280" />
                              </svg>
                            )}
                            {style === 'metro' && (
                              <svg viewBox="0 0 40 28" className="w-full h-full">
                                <path d="M4 14 L10 14 L16 8 L30 8 L36 6" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <path d="M4 24 L10 24 L16 18 L30 18 L36 16" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <circle cx="4" cy="14" r="2" fill="#6b7280" />
                                <circle cx="36" cy="6" r="2" fill="#6b7280" />
                                <circle cx="4" cy="24" r="2" fill="#6b7280" />
                                <circle cx="36" cy="16" r="2" fill="#6b7280" />
                              </svg>
                            )}
                            {style === 'quadratic' && (
                              <svg viewBox="0 0 40 28" className="w-full h-full">
                                <path d="M4 14 Q20 14 20 10 T36 6" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <path d="M4 24 Q20 24 20 20 T36 16" fill="none" stroke={localSettings.appearance.connectionStyle === style ? localSettings.appearance.accentColor : '#4b5563'} strokeWidth="1.5" />
                                <circle cx="4" cy="14" r="2" fill="#6b7280" />
                                <circle cx="36" cy="6" r="2" fill="#6b7280" />
                                <circle cx="4" cy="24" r="2" fill="#6b7280" />
                                <circle cx="36" cy="16" r="2" fill="#6b7280" />
                              </svg>
                            )}
                          </div>
                          {style.replace('-', ' ')}
                        </button>
                      ))}
                      </div>
                  </div>

                  <div>
                    <label className="text-sm text-white mb-2 block">Connection Animation</label>
                    <div className="text-xs text-gray-500 mb-2">Animate the flow of connections</div>
                    <div className="grid grid-cols-5 gap-2">
                      {(['none', 'flow', 'pulse', 'dash', 'glow'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => updateSettings('appearance', 'connectionAnimation', style)}
                          className={`px-2 py-2 rounded-lg text-xs capitalize transition-all duration-200 ${
                            localSettings.appearance.connectionAnimation === style
                              ? 'text-white'
                              : 'bg-black/30 text-gray-400 hover:bg-black/40 hover:text-white'
                          }`}
                          style={localSettings.appearance.connectionAnimation === style ? {
                            backgroundColor: `${localSettings.appearance.accentColor}30`,
                            boxShadow: `0 0 0 2px ${localSettings.appearance.accentColor}`,
                          } : undefined}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Editor Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Snap to Grid</div>
                      <div className="text-xs text-gray-500">Align nodes to the grid when moving</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.snapToGrid}
                      onChange={(e) => updateSettings('editor', 'snapToGrid', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Show Node Labels</div>
                      <div className="text-xs text-gray-500">Always show node labels on the canvas</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.showNodeLabels}
                      onChange={(e) => updateSettings('editor', 'showNodeLabels', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Auto Connect</div>
                      <div className="text-xs text-gray-500">Automatically connect nodes when dropping near a port</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.autoConnect}
                      onChange={(e) => updateSettings('editor', 'autoConnect', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Highlight Connections</div>
                      <div className="text-xs text-gray-500">Highlight connections when hovering over a node</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.highlightConnections}
                      onChange={(e) => updateSettings('editor', 'highlightConnections', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Connections Behind Nodes</div>
                      <div className="text-xs text-gray-500">Render connection lines behind nodes instead of in front</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.connectionsBehindNodes}
                      onChange={(e) => updateSettings('editor', 'connectionsBehindNodes', e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-[#2196F3]"
                    />
                  </label>


                </div>
              </div>
            )}

            {activeTab === 'keybindings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Keybindings</h3>
                  <button
                    onClick={handleResetKeybindings}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    <RotateCcw size={12} />
                    Reset to Defaults
                  </button>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Click on a keybinding to change it. Press Escape to cancel.
                </div>
                
                {Object.entries(KEYBINDING_CATEGORIES).map(([category, actions]) => (
                  <div key={category} className="space-y-2">
                    <h4 
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: localSettings.appearance.accentColor }}
                    >
                      {category}
                    </h4>
                    <div className="space-y-1">
                      {actions.map((action) => (
                        <div
                          key={action}
                          className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
                        >
                          <span className="text-sm text-gray-300">{KEYBINDING_LABELS[action]}</span>
                          <button
                            onClick={() => setEditingKeybind(action)}
                            onKeyDown={(e) => editingKeybind === action && handleKeybindCapture(action, e)}
                            className={`min-w-[120px] px-3 py-1.5 rounded text-sm font-mono transition-colors ${
                              editingKeybind === action
                                ? 'text-white animate-pulse'
                                : 'bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white'
                            }`}
                            style={editingKeybind === action ? {
                              backgroundColor: localSettings.appearance.accentColor,
                            } : undefined}
                          >
                            {editingKeybind === action ? 'Press keys...' : localSettings.keybindings[action]}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8 bg-[#212121]">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            Reset All
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                hasChanges
                  ? 'text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              style={hasChanges ? {
                backgroundColor: localSettings.appearance.accentColor,
              } : undefined}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
