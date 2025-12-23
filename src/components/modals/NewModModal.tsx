import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NewModModalProps {
  onClose: () => void;
  onModCreated?: (modPath: string) => void;
}

export default function NewModModal({ onClose, onModCreated }: NewModModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [modId, setModId] = useState('');
  const [path, setPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-generate mod ID
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAuthor = author.toLowerCase().replace(/[^a-z0-9]/g, '') || 'author';
    if (cleanName) {
      setModId(`${cleanAuthor}.${cleanName}`);
    }
  }, [name, author]);

  const handleBrowse = async () => {
    const selectedPath = await window.electronAPI.selectDirectory();
    if (selectedPath) {
      setPath(selectedPath);
    }
  };

  const handleCreate = async () => {
    setError('');
    
    if (!name || !author || !version || !path) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    
    const result = await window.electronAPI.createMod({
      name,
      description,
      author,
      version,
      modId,
      path,
    });

    setIsCreating(false);

    if (result.success && result.path) {
      onModCreated?.(result.path);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setAuthor('');
      setVersion('1.0.0');
      setModId('');
      setPath('');
    } else {
      setError(result.error || 'Failed to create mod');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#151a21] rounded-2xl border border-white/10 shadow-2xl w-[520px] max-w-[90vw] max-h-[85vh] overflow-hidden animate-slideIn">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#1a1f28]">
          <h2 className="text-lg font-bold text-white">Create a New Mod</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[calc(85vh-140px)] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Mod Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Mod"
              autoFocus
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Mod ID
            </label>
            <input
              type="text"
              value={modId}
              onChange={(e) => setModId(e.target.value)}
              placeholder="author.modname"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Project Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/mods/my_mod"
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <button className="px-4 py-2 bg-[#1a1f28] hover:bg-white/10 text-white text-sm font-semibold rounded-lg transition-all border border-white/10" onClick={handleBrowse}>
                Browse
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#0f1419]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a1f28] hover:bg-white/10 text-white text-sm font-semibold rounded-lg transition-all border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name || !author || !path}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:-translate-y-0.5"
          >
            {isCreating ? 'Creating...' : 'Create Mod'}
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
