import { Folder, FileText, FileCode, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { FileItem } from '../types/electron';

interface FileExplorerProps {
  onFileSelect: (filePath: string, type: string) => void;
  selectedFile: string | null;
  onNewMod: () => void;
  onModOpened?: (tree: FileItem[], rootPath: string) => void;
}

export default function FileExplorer({ onFileSelect, selectedFile, onNewMod, onModOpened }: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [rootPath, setRootPath] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const handleOpenFolder = async () => {
    const selectedPath = await window.electronAPI.selectDirectory();
    if (selectedPath) {
      const result = await window.electronAPI.openModFolder(selectedPath);
      if (result.success && result.tree && result.rootPath) {
        setFileTree(result.tree);
        setRootPath(result.rootPath);
        setExpandedFolders(new Set([result.rootPath]));
        onModOpened?.(result.tree, result.rootPath);
      }
    }
  };

  const getFileType = (fileName: string): string => {
    if (fileName.endsWith('.vdf')) return 'vdf';
    if (fileName.endsWith('.txt') && (fileName.includes('weapon') || fileName.includes('ability'))) return 'weapontxt';
    if (fileName.includes('weapon') && fileName.endsWith('.nut')) return 'weapon';
    if (fileName.endsWith('.nut')) return 'script';
    if (fileName.endsWith('.json')) return 'json';
    return 'text';
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.nut')) return FileCode;
    return FileText;
  };

  const renderFileTree = (items: FileItem[], depth = 0): JSX.Element[] => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isSelected = selectedFile === item.path;
      const Icon = item.type === 'folder' ? Folder : getFileIcon(item.name);
      
      if (item.type === 'folder') {
        return (
          <div key={item.path}>
            <button
              onClick={() => toggleFolder(item.path)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all text-amber-400 hover:bg-white/5"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Icon size={15} />
              <span className="font-semibold">{item.name}</span>
            </button>
            {isExpanded && item.children && (
              <div>
                {renderFileTree(item.children, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <button
            key={item.path}
            onClick={() => onFileSelect(item.path, getFileType(item.name))}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
              isSelected
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-300 hover:bg-white/5'
            }`}
            style={{ paddingLeft: `${depth * 12 + 28}px` }}
          >
            <Icon size={15} className="opacity-70" />
            <span>{item.name}</span>
          </button>
        );
      }
    });
  };

  return (
    <div className="w-[280px] border-r border-white/10 flex flex-col bg-[#0f1419]">
      <div className="p-4 border-b border-white/10 bg-[#151a21]">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Project
        </div>
        <div className="flex gap-2">
          <button
            onClick={onNewMod}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:-translate-y-0.5"
          >
            New Mod
          </button>
          <button className="flex-1 px-4 py-2 bg-[#1a1f28] hover:bg-white/10 text-white text-sm font-semibold rounded-lg transition-all border border-white/10" onClick={handleOpenFolder}>
            Open
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {fileTree.length > 0 ? (
          <div className="space-y-1">
            {renderFileTree(fileTree)}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 text-sm">
            <p>No mod folder opened</p>
            <p className="text-xs mt-2">Click "Open" to browse for a mod</p>
          </div>
        )}
      </div>
    </div>
  );
}
