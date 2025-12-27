import { useState, useEffect, useCallback, useMemo } from 'react';
import { Languages, Plus, Trash2, Search, Copy, Download, RotateCcw, Info } from 'lucide-react';
import type { LocalizationFile } from '../../types/project';
import { serializeLocalizationFile } from '../../utils/project-manager';

interface LocalizationEditorProps {
  localizationFile: LocalizationFile | null;
  onTokensChange: (fileId: string, tokens: Record<string, string>) => void;
  isModified?: boolean;
  accentColor?: string;
}

export default function LocalizationEditor({
  localizationFile,
  onTokensChange,
  isModified = false,
  accentColor = '#22c55e',
}: LocalizationEditorProps) {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Sync tokens with file
  useEffect(() => {
    if (localizationFile) {
      setTokens(localizationFile.tokens || {});
    }
  }, [localizationFile?.id, localizationFile?.tokens]);

  // Update parent when tokens change
  const handleTokensChange = useCallback((newTokens: Record<string, string>) => {
    setTokens(newTokens);
    if (localizationFile) {
      onTokensChange(localizationFile.id, newTokens);
    }
  }, [localizationFile, onTokensChange]);

  // Add new token
  const handleAddToken = useCallback(() => {
    if (!newKey.trim()) return;
    const key = newKey.trim().toUpperCase().replace(/\s+/g, '_');
    if (tokens[key]) {
      // Key already exists
      return;
    }
    const newTokens = { ...tokens, [key]: newValue };
    handleTokensChange(newTokens);
    setNewKey('');
    setNewValue('');
  }, [newKey, newValue, tokens, handleTokensChange]);

  // Delete token
  const handleDeleteToken = useCallback((key: string) => {
    const newTokens = { ...tokens };
    delete newTokens[key];
    handleTokensChange(newTokens);
  }, [tokens, handleTokensChange]);

  // Update token value
  const handleUpdateValue = useCallback((key: string, value: string) => {
    const newTokens = { ...tokens, [key]: value };
    handleTokensChange(newTokens);
  }, [tokens, handleTokensChange]);

  // Start editing key
  const startEditingKey = useCallback((key: string) => {
    setEditingKey(key);
    setEditingValue(key);
  }, []);

  // Finish editing key (rename)
  const finishEditingKey = useCallback((oldKey: string) => {
    if (!editingValue.trim() || editingValue === oldKey) {
      setEditingKey(null);
      return;
    }
    const newKey = editingValue.trim().toUpperCase().replace(/\s+/g, '_');
    if (tokens[newKey] && newKey !== oldKey) {
      // Key already exists
      setEditingKey(null);
      return;
    }
    const value = tokens[oldKey];
    const newTokens = { ...tokens };
    delete newTokens[oldKey];
    newTokens[newKey] = value;
    handleTokensChange(newTokens);
    setEditingKey(null);
  }, [editingValue, tokens, handleTokensChange]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (localizationFile) {
      const content = serializeLocalizationFile(localizationFile);
      navigator.clipboard.writeText(content);
    }
  }, [localizationFile]);

  // Reset to saved
  const handleReset = useCallback(() => {
    if (localizationFile) {
      setTokens(localizationFile.tokens || {});
    }
  }, [localizationFile]);

  // Filter tokens by search
  const filteredTokens = useMemo(() => {
    const entries = Object.entries(tokens);
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(([key, value]) => 
      key.toLowerCase().includes(query) || value.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  if (!localizationFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#121212] text-center p-8">
        <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${accentColor}20` }}>
          <Languages size={48} style={{ color: `${accentColor}80` }} />
        </div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">No Localization File Open</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Select a localization file from the Project panel to begin editing, or create a new one.
        </p>
      </div>
    );
  }

  const tokenCount = Object.keys(tokens).length;

  return (
    <div className="h-full flex flex-col bg-[#121212]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <Languages size={16} style={{ color: accentColor }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{localizationFile.name}</span>
              <span className="text-xs text-gray-500">_{localizationFile.language}.txt</span>
              {isModified && (
                <span className="w-2 h-2 rounded-full bg-orange-400" title="Unsaved changes" />
              )}
            </div>
            <span className="text-[10px] text-gray-600 capitalize">{localizationFile.language} Localization</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
            title="Reset to saved"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="px-4 py-2 border-b border-white/10 bg-[#1a2518] flex items-center gap-2">
        <Info size={14} className="text-green-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          Localization files contain translation strings. Keys are referenced in code/UI with their exact name.
          Files compile to <code className="text-green-400/80">resource/localization/{localizationFile.name}_{localizationFile.language}.txt</code>
        </p>
      </div>

      {/* Search and Add */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#1a1a1a] space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keys or values..."
            className="w-full bg-[#2d2d2d] border border-white/10 rounded pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500/50"
          />
        </div>

        {/* Add new token */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddToken()}
            placeholder="NEW_KEY"
            className="flex-1 bg-[#2d2d2d] border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500/50 font-mono"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddToken()}
            placeholder="Translation value..."
            className="flex-[2] bg-[#2d2d2d] border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500/50"
          />
          <button
            onClick={handleAddToken}
            disabled={!newKey.trim()}
            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus size={14} />
            <span className="text-xs">Add</span>
          </button>
        </div>
      </div>

      {/* Token Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#1a1a1a] border-b border-white/10">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2 w-1/3">Key</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Value</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.map(([key, value]) => (
              <tr key={key} className="border-b border-white/5 hover:bg-white/5 group">
                <td className="px-4 py-2">
                  {editingKey === key ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => finishEditingKey(key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditingKey(key);
                        if (e.key === 'Escape') setEditingKey(null);
                      }}
                      className="w-full bg-[#2d2d2d] border border-green-500/50 rounded px-2 py-1 text-xs text-white font-mono outline-none"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="text-xs text-green-400 font-mono cursor-pointer hover:underline"
                      onClick={() => startEditingKey(key)}
                      title="Click to rename"
                    >
                      {key}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateValue(key, e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-green-500/50 focus:bg-[#2d2d2d] rounded px-2 py-1 text-xs text-gray-300 outline-none transition-colors"
                  />
                </td>
                <td className="px-2">
                  <button
                    onClick={() => handleDeleteToken(key)}
                    className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete token"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTokens.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-600 text-sm">
                  {searchQuery ? 'No tokens match your search' : 'No tokens yet. Add one above!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-white/10 bg-[#1a1a1a] flex items-center justify-between text-[10px] text-gray-600">
        <div className="flex items-center gap-4">
          <span>{tokenCount} token{tokenCount !== 1 ? 's' : ''}</span>
          {searchQuery && <span>{filteredTokens.length} shown</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="capitalize">{localizationFile.language}</span>
          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
            TXT
          </span>
        </div>
      </div>
    </div>
  );
}
