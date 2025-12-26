import { useState, useEffect, useMemo } from 'react';
import { X, Save, Tag, Library, Folder } from 'lucide-react';
import type { TemplateCategory } from '../../types/visual-scripting';
import { TEMPLATE_CATEGORY_INFO } from '../../types/visual-scripting';
import CustomSelect from './CustomSelect';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, category: TemplateCategory, tags: string[]) => void;
  nodeCount: number;
  accentColor?: string;
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  nodeCount,
  accentColor = '#8B5CF6',
}: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [tagsInput, setTagsInput] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setCategory('custom');
      setTagsInput('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onSave(name.trim(), description.trim(), category, tags);
    onClose();
  };

  // Filter out built-in category from options
  const categoryOptions = TEMPLATE_CATEGORY_INFO.filter(c => c.id !== 'built-in');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1a1f28] border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-white/10"
          style={{ background: `linear-gradient(to right, ${accentColor}10, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Library size={18} style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Save as Template</h2>
              <p className="text-xs text-gray-500">{nodeCount} node{nodeCount !== 1 ? 's' : ''} selected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Template Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Player Spawn Setup"
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              style={{
                ['--tw-ring-color' as string]: `${accentColor}20`,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = `${accentColor}50`;
                e.target.style.boxShadow = `0 0 0 2px ${accentColor}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefly describe what this template does..."
              rows={2}
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none transition-all resize-none"
              onFocus={(e) => {
                e.target.style.borderColor = `${accentColor}50`;
                e.target.style.boxShadow = `0 0 0 2px ${accentColor}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              <Folder size={12} className="inline mr-1" />
              Category
            </label>
            <CustomSelect
              value={category}
              options={categoryOptions.map(cat => ({ value: cat.id, label: cat.label }))}
              onChange={(val) => setCategory(val as TemplateCategory)}
              className="w-full"
              size="lg"
              accentColor={accentColor}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              <Tag size={12} className="inline mr-1" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g., spawn, player, callback"
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              onFocus={(e) => {
                e.target.style.borderColor = `${accentColor}50`;
                e.target.style.boxShadow = `0 0 0 2px ${accentColor}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
              style={{ backgroundColor: accentColor }}
            >
              <Save size={14} />
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
