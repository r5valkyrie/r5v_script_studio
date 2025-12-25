import { useState, useEffect } from 'react';
import { X, Save, Folder, Plus, Trash2, FileText } from 'lucide-react';
import type { ModSettings } from '../../types/project';
import { DEFAULT_MOD_SETTINGS } from '../../types/project';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modSettings: ModSettings | undefined;
  onSave: (settings: ModSettings) => void;
  accentColor?: string;
}

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  modSettings,
  onSave,
  accentColor = '#8B5CF6',
}: ProjectSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<ModSettings>(modSettings || DEFAULT_MOD_SETTINGS);
  const [newLocPath, setNewLocPath] = useState('');

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(modSettings || DEFAULT_MOD_SETTINGS);
      setNewLocPath('');
    }
  }, [isOpen, modSettings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const updateField = (field: keyof ModSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const addLocalizationFile = () => {
    if (!newLocPath.trim()) return;
    setLocalSettings(prev => ({
      ...prev,
      localizationFiles: [...prev.localizationFiles, { path: newLocPath.trim(), enabled: true }],
    }));
    setNewLocPath('');
  };

  const removeLocalizationFile = (index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      localizationFiles: prev.localizationFiles.filter((_, i) => i !== index),
    }));
  };

  const toggleLocalizationFile = (index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      localizationFiles: prev.localizationFiles.map((file, i) => 
        i === index ? { ...file, enabled: !file.enabled } : file
      ),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#1a1f28] rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Folder size={20} style={{ color: accentColor }} />
            <h2 className="text-lg font-semibold text-white">Project Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mod Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mod Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-300">Mod ID</label>
                <input
                  type="text"
                  value={localSettings.modId}
                  onChange={(e) => updateField('modId', e.target.value.replace(/\s+/g, '_').toLowerCase())}
                  placeholder="my_mod"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">Unique identifier (no spaces)</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-300">Mod Name</label>
                <input
                  type="text"
                  value={localSettings.modName}
                  onChange={(e) => updateField('modName', e.target.value)}
                  placeholder="My Awesome Mod"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">Display name for the mod</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-300">Version</label>
                <input
                  type="text"
                  value={localSettings.modVersion}
                  onChange={(e) => updateField('modVersion', e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-300">Author</label>
                <input
                  type="text"
                  value={localSettings.modAuthor}
                  onChange={(e) => updateField('modAuthor', e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Description</label>
              <textarea
                value={localSettings.modDescription}
                onChange={(e) => updateField('modDescription', e.target.value)}
                placeholder="A brief description of your mod..."
                rows={3}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Localization Files Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Localization Files</h3>
            <p className="text-xs text-gray-500">
              Add paths to localization files that should be included in mod.vdf (e.g., resource/localization/mymod_%language%.txt)
            </p>

            {/* Add new localization file */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocPath}
                onChange={(e) => setNewLocPath(e.target.value)}
                placeholder="resource/localization/mymod_%language%.txt"
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addLocalizationFile()}
              />
              <button
                onClick={addLocalizationFile}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {/* Localization file list */}
            {localSettings.localizationFiles.length > 0 ? (
              <div className="space-y-2">
                {localSettings.localizationFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-3 py-2 bg-black/20 border border-white/5 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={file.enabled}
                      onChange={() => toggleLocalizationFile(index)}
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-purple-500"
                    />
                    <FileText size={14} className="text-gray-500" />
                    <span className={`flex-1 text-sm font-mono ${file.enabled ? 'text-gray-300' : 'text-gray-500 line-through'}`}>
                      {file.path}
                    </span>
                    <button
                      onClick={() => removeLocalizationFile(index)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No localization files added
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">mod.vdf Preview</h3>
            <pre className="p-4 bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto">
{`"mod"
{
        "name" "${localSettings.modName}"
        "id" "${localSettings.modId}"
        "description" "${localSettings.modDescription}"
        "version" "${localSettings.modVersion}"
        "author" "${localSettings.modAuthor}"
${localSettings.localizationFiles.filter(f => f.enabled).length > 0 ? `
        "LocalizationFiles"
        {
${localSettings.localizationFiles.filter(f => f.enabled).map(f => `                "${f.path}" "1"`).join('\n')}
        }` : ''}
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
