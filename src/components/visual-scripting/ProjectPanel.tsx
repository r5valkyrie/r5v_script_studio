import { useState } from 'react';
import { X, FileCode, Plus, Trash2, FolderOpen, Folder, Edit2, FolderPlus, ChevronRight, ChevronDown } from 'lucide-react';
import type { ScriptFile } from '../../types/project';
import ConfirmDialog from './ConfirmDialog';

// Delete confirmation state type
interface DeleteConfirmState {
  isOpen: boolean;
  type: 'file' | 'folder';
  id: string;
  name: string;
}

interface ProjectPanelProps {
  scriptFiles: ScriptFile[];
  activeFileId: string | null;
  projectName: string;
  folders?: string[];
  onSelectFile: (fileId: string) => void;
  onCreateFile: (fileName: string) => void;
  onCreateFolder: (folderName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFolder: (folderPath: string) => void;
  onRenameFolder: (oldPath: string, newPath: string) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function ProjectPanel({
  scriptFiles,
  activeFileId,
  projectName,
  folders = [],
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onDeleteFolder,
  onRenameFolder,
  onClose,
  isEmbedded = false,
}: ProjectPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [draggedItem, setDraggedItem] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, type: 'file', id: '', name: '' });

  // Handle delete confirmation
  const showDeleteConfirm = (type: 'file' | 'folder', id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, type, id, name });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'file') {
      onDeleteFile(deleteConfirm.id);
    } else {
      onDeleteFolder(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, type: 'file', id: '', name: '' });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, type: 'file', id: '', name: '' });
  };

  // Group files by folder path and build folder tree structure
  const groupFilesByFolder = () => {
    const folderMap: Record<string, ScriptFile[]> = { root: [] };
    
    // Add explicit folders (including empty ones)
    folders.forEach(folder => {
      if (!folderMap[folder]) {
        folderMap[folder] = [];
      }
    });
    
    // Add files to their folders
    scriptFiles.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length === 1) {
        folderMap.root.push(file);
      } else {
        const folderPath = parts.slice(0, -1).join('/');
        if (!folderMap[folderPath]) {
          folderMap[folderPath] = [];
        }
        folderMap[folderPath].push(file);
      }
    });
    
    return folderMap;
  };

  // Get child folders of a parent folder
  const getChildFolders = (parentPath: string): string[] => {
    const allFolders = Object.keys(filesByFolder).filter(f => f !== 'root');
    
    if (parentPath === 'root') {
      // Get top-level folders (no slashes, or folders not inside another folder)
      return allFolders.filter(folder => !folder.includes('/'));
    }
    
    // Get direct children of this folder
    return allFolders.filter(folder => {
      if (!folder.startsWith(parentPath + '/')) return false;
      const remainder = folder.substring(parentPath.length + 1);
      return !remainder.includes('/'); // Only direct children, not grandchildren
    });
  };

  const filesByFolder = groupFilesByFolder();

  const handleCreate = () => {
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folderName = newFolderName.trim();
      onCreateFolder(folderName);
      setNewFolderName('');
      setIsCreatingFolder(false);
      // Expand the new folder
      setExpandedFolders(prev => new Set([...prev, folderName]));
    }
  };

  const handleRename = (fileId: string) => {
    if (renameValue.trim() && renameValue.trim() !== '') {
      onRenameFile(fileId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const startRename = (file: ScriptFile) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, type: 'file' | 'folder', id: string, name: string) => {
    setDraggedItem({ type, id, name });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderPath);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the container, not just entering a child
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    if (!draggedItem) return;

    if (draggedItem.type === 'file') {
      const file = scriptFiles.find(f => f.id === draggedItem.id);
      if (!file) return;

      const fileName = file.name.split('/').pop() || file.name;
      const newPath = targetFolder === 'root' ? fileName : `${targetFolder}/${fileName}`;
      
      if (newPath !== file.name) {
        onRenameFile(file.id, newPath);
      }
    } else if (draggedItem.type === 'folder') {
      // Move folder (and all its contents) to new location
      const oldFolderPath = draggedItem.name;
      const folderName = oldFolderPath.split('/').pop() || oldFolderPath;
      const newFolderPath = targetFolder === 'root' ? folderName : `${targetFolder}/${folderName}`;

      // Don't allow dropping a folder into itself or its children
      if (targetFolder === oldFolderPath || targetFolder.startsWith(oldFolderPath + '/')) {
        setDraggedItem(null);
        return;
      }

      if (newFolderPath !== oldFolderPath) {
        // Use onRenameFolder which handles updating both the folder and all files inside
        onRenameFolder(oldFolderPath, newFolderPath);
      }
    }

    setDraggedItem(null);
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'folder' ? 'Delete Folder' : 'Delete File'}
        message={
          deleteConfirm.type === 'folder'
            ? `Are you sure you want to delete the folder "${deleteConfirm.name}" and all its contents? This action cannot be undone.`
            : `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <div className={`${isEmbedded ? '' : 'w-full h-full bg-[#151a21]'} flex flex-col`}>
        {/* Header - only show when not embedded */}
        {!isEmbedded && (
          <div className="px-4 py-3 border-b border-white/10 bg-[#0f1419]">
            <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded" style={{ backgroundColor: 'var(--accent-color-bg)' }}>
              <FolderOpen size={14} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Project</span>
              <span className="text-sm font-medium text-white truncate block">{projectName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${isEmbedded ? 'bg-[#0f1419]/30' : 'border-b border-white/5 bg-[#0f1419]/50'}`}>
        <button
          onClick={() => setIsCreating(true)}
          className={`flex items-center gap-1 ${isEmbedded ? 'px-2 py-1' : 'px-2.5 py-1.5'} text-[10px] font-medium text-gray-300 hover:text-white bg-white/5 rounded transition-colors border border-transparent`}
          style={{ ['--hover-bg' as string]: 'var(--accent-color-bg)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-color-bg)'; e.currentTarget.style.borderColor = 'var(--accent-color-dim)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = 'transparent'; }}
          title="New Script File"
        >
          <Plus size={11} style={{ color: 'var(--accent-color)' }} />
          File
        </button>
        <button
          onClick={() => setIsCreatingFolder(true)}
          className={`flex items-center gap-1 ${isEmbedded ? 'px-2 py-1' : 'px-2.5 py-1.5'} text-[10px] font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-yellow-500/20 rounded transition-colors border border-transparent hover:border-yellow-500/50`}
          title="New Folder"
        >
          <FolderPlus size={11} className="text-yellow-400" />
          Folder
        </button>
      </div>

      {/* File List */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${isEmbedded ? '' : ''}`}>
        <div className={`${isEmbedded ? 'p-1.5' : 'p-2'} space-y-0.5`}>

          {/* New Folder Input */}
          {isCreatingFolder && (
            <div className="px-2 py-1.5 bg-white/5 rounded border border-yellow-500/30">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateFolder();
                  }
                  if (e.key === 'Escape') {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                onBlur={handleCreateFolder}
                placeholder="folder_name"
                className="w-full bg-transparent text-xs text-white outline-none placeholder-gray-500"
                autoFocus
              />
            </div>
          )}

          {/* New File Input */}
          {isCreating && (
            <div className="px-2 py-1.5 bg-white/5 rounded" style={{ border: '1px solid var(--accent-color-dim)' }}>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreate();
                  }
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewFileName('');
                  }
                }}
                onBlur={handleCreate}
                placeholder="script.nut"
                className="w-full bg-transparent text-xs text-white outline-none placeholder-gray-500"
                autoFocus
              />
            </div>
          )}

          {/* Root Level Drop Zone */}
          <div
            onDragOver={(e) => handleDragOver(e, 'root')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'root')}
            className={`min-h-[60px] transition-colors ${dragOverFolder === 'root' ? 'border-2 border-dashed rounded p-2' : ''}`}
            style={dragOverFolder === 'root' ? { backgroundColor: 'var(--accent-color-bg)', borderColor: 'var(--accent-color)' } : undefined}
          >
            {dragOverFolder === 'root' && scriptFiles.length > 0 && (
              <div className="text-sm text-center py-8 font-medium" style={{ color: 'var(--accent-color)' }}>Drop here to move to root</div>
            )}
            
            {/* Root level files */}
            {(filesByFolder['root'] || []).map((file: ScriptFile) => {
              const fileName = file.name.split('/').pop() || file.name;
              if (fileName === '.placeholder') return null;
              
              return (
                <div
                  key={file.id}
                  draggable={renamingId !== file.id}
                  onDragStart={(e) => handleDragStart(e, 'file', file.id, file.name)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-move transition-all border border-transparent ${
                    activeFileId === file.id
                      ? 'text-white shadow-sm'
                      : 'text-gray-300 hover:bg-white/5 hover:border-white/10 hover:text-white'
                  } ${draggedItem?.id === file.id ? 'opacity-50' : ''}`}
                  style={activeFileId === file.id ? { backgroundColor: 'var(--accent-color-bg)', borderColor: 'var(--accent-color-dim)' } : undefined}
                  onClick={() => renamingId !== file.id && onSelectFile(file.id)}
                >
                  {renamingId === file.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRename(file.id);
                        }
                        if (e.key === 'Escape') {
                          setRenamingId(null);
                          setRenameValue('');
                        }
                      }}
                      onBlur={() => setTimeout(() => handleRename(file.id), 100)}
                      className="flex-1 bg-[#1a1f28] px-2 py-1 text-xs text-white outline-none rounded"
                      style={{ boxShadow: '0 0 0 1px var(--accent-color-dim)' }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="p-1 rounded bg-blue-500/10">
                          <FileCode size={12} className="flex-shrink-0 text-blue-400" />
                        </div>
                        <span className="text-xs font-medium truncate">{fileName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); startRename(file); }}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="Rename"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); showDeleteConfirm('file', file.id, file.name); }}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            
            {/* Render top-level folders recursively */}
            {getChildFolders('root').sort().map(folderPath => (
              <FolderItem
                key={folderPath}
                folderPath={folderPath}
                depth={0}
                filesByFolder={filesByFolder}
                getChildFolders={getChildFolders}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                renamingFolder={renamingFolder}
                setRenamingFolder={setRenamingFolder}
                renameFolderValue={renameFolderValue}
                setRenameFolderValue={setRenameFolderValue}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                draggedItem={draggedItem}
                dragOverFolder={dragOverFolder}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                renamingId={renamingId}
                setRenamingId={setRenamingId}
                renameValue={renameValue}
                setRenameValue={setRenameValue}
                handleRename={handleRename}
                startRename={startRename}
                activeFileId={activeFileId}
                onSelectFile={onSelectFile}
                onDeleteFile={onDeleteFile}
                showDeleteConfirm={showDeleteConfirm}
              />
            ))}
          </div>

          {scriptFiles.length === 0 && !isCreating && !isCreatingFolder && (
            <div className="text-xs text-gray-500 text-center py-8">
              No script files yet.
              <br />
              Click "New File" or "New Folder" to start.
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

// Recursive FolderItem component for nested folders
function FolderItem({
  folderPath,
  depth,
  filesByFolder,
  getChildFolders,
  expandedFolders,
  toggleFolder,
  renamingFolder,
  setRenamingFolder,
  renameFolderValue,
  setRenameFolderValue,
  onRenameFolder,
  onDeleteFolder,
  draggedItem,
  dragOverFolder,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  renamingId,
  setRenamingId,
  renameValue,
  setRenameValue,
  handleRename,
  startRename,
  activeFileId,
  onSelectFile,
  onDeleteFile,
  showDeleteConfirm,
}: {
  folderPath: string;
  depth: number;
  filesByFolder: Record<string, ScriptFile[]>;
  getChildFolders: (parentPath: string) => string[];
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  renamingFolder: string | null;
  setRenamingFolder: (path: string | null) => void;
  renameFolderValue: string;
  setRenameFolderValue: (value: string) => void;
  onRenameFolder: (oldPath: string, newPath: string) => void;
  onDeleteFolder: (path: string) => void;
  draggedItem: { type: 'file' | 'folder'; id: string; name: string } | null;
  dragOverFolder: string | null;
  handleDragStart: (e: React.DragEvent, type: 'file' | 'folder', id: string, name: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, folderPath: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetFolder: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (value: string) => void;
  handleRename: (fileId: string) => void;
  startRename: (file: ScriptFile) => void;
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  showDeleteConfirm: (type: 'file' | 'folder', id: string, name: string) => void;
}) {
  const isExpanded = expandedFolders.has(folderPath);
  const folderFiles = filesByFolder[folderPath] || [];
  const childFolders = getChildFolders(folderPath);
  const folderName = folderPath.split('/').pop() || folderPath;
  const indentPx = depth * 16;

  return (
    <div>
      {/* Folder header */}
      <div
        draggable={renamingFolder !== folderPath}
        onDragStart={(e) => handleDragStart(e, 'folder', folderPath, folderPath)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, folderPath)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, folderPath)}
        className={`group flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer text-xs transition-all border border-transparent hover:border-white/10 ${
          dragOverFolder === folderPath ? 'bg-yellow-500/20 border-yellow-500/50' : ''
        } ${draggedItem?.name === folderPath ? 'opacity-50' : ''}`}
        style={{ marginLeft: `${indentPx}px` }}
        onClick={() => renamingFolder !== folderPath && toggleFolder(folderPath)}
      >
        {isExpanded ? (
          <ChevronDown size={12} className="flex-shrink-0 text-gray-500" />
        ) : (
          <ChevronRight size={12} className="flex-shrink-0 text-gray-500" />
        )}
        <div className="p-1 rounded bg-yellow-500/10">
          <Folder size={12} className="text-yellow-400 flex-shrink-0" />
        </div>
        {renamingFolder === folderPath ? (
          <input
            type="text"
            value={renameFolderValue}
            onChange={(e) => setRenameFolderValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (renameFolderValue.trim() && renameFolderValue !== folderPath) {
                  // When renaming, only change the last part of the path
                  const parentPath = folderPath.includes('/') ? folderPath.substring(0, folderPath.lastIndexOf('/')) : '';
                  const newFullPath = parentPath ? `${parentPath}/${renameFolderValue.trim()}` : renameFolderValue.trim();
                  onRenameFolder(folderPath, newFullPath);
                }
                setRenamingFolder(null);
                setRenameFolderValue('');
              }
              if (e.key === 'Escape') {
                setRenamingFolder(null);
                setRenameFolderValue('');
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                if (renameFolderValue.trim() && renameFolderValue !== folderName) {
                  const parentPath = folderPath.includes('/') ? folderPath.substring(0, folderPath.lastIndexOf('/')) : '';
                  const newFullPath = parentPath ? `${parentPath}/${renameFolderValue.trim()}` : renameFolderValue.trim();
                  onRenameFolder(folderPath, newFullPath);
                }
                setRenamingFolder(null);
                setRenameFolderValue('');
              }, 100);
            }}
            className="flex-1 bg-[#1a1f28] px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-yellow-500/50 rounded"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="truncate flex-1 font-medium">{folderName}</span>
            <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{folderFiles.filter(f => !f.name.endsWith('.placeholder')).length}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setRenamingFolder(folderPath); setRenameFolderValue(folderName); }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Rename Folder"
              >
                <Edit2 size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); showDeleteConfirm('folder', folderPath, folderPath); }}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="Delete Folder"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Folder contents (when expanded) */}
      {isExpanded && (
        <>
          {/* Files in this folder */}
          {folderFiles.map((file: ScriptFile) => {
            const fileName = file.name.split('/').pop() || file.name;
            if (fileName === '.placeholder') return null;
            
            return (
              <div
                key={file.id}
                draggable={renamingId !== file.id}
                onDragStart={(e) => handleDragStart(e, 'file', file.id, file.name)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-move transition-all border border-transparent ${
                  activeFileId === file.id
                    ? 'text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/5 hover:border-white/10 hover:text-white'
                } ${draggedItem?.id === file.id ? 'opacity-50' : ''}`}
                style={{ marginLeft: `${indentPx + 20}px`, ...(activeFileId === file.id ? { backgroundColor: 'var(--accent-color-bg)', borderColor: 'var(--accent-color-dim)' } : {}) }}
                onClick={() => renamingId !== file.id && onSelectFile(file.id)}
              >
                {renamingId === file.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleRename(file.id); }
                      if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                    }}
                    onBlur={() => setTimeout(() => handleRename(file.id), 100)}
                    className="flex-1 bg-[#1a1f28] px-2 py-1 text-xs text-white outline-none rounded"
                    style={{ boxShadow: '0 0 0 1px var(--accent-color-dim)' }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="p-1 rounded bg-blue-500/10">
                        <FileCode size={12} className="flex-shrink-0 text-blue-400" />
                      </div>
                      <span className="text-xs font-medium truncate">{fileName}</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(file); }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="Rename"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); showDeleteConfirm('file', file.id, file.name); }}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Child folders (recursive) */}
          {childFolders.sort().map(childPath => (
            <FolderItem
              key={childPath}
              folderPath={childPath}
              depth={depth + 1}
              filesByFolder={filesByFolder}
              getChildFolders={getChildFolders}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              renamingFolder={renamingFolder}
              setRenamingFolder={setRenamingFolder}
              renameFolderValue={renameFolderValue}
              setRenameFolderValue={setRenameFolderValue}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              draggedItem={draggedItem}
              dragOverFolder={dragOverFolder}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              handleRename={handleRename}
              startRename={startRename}
              activeFileId={activeFileId}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              showDeleteConfirm={showDeleteConfirm}
            />
          ))}
        </>
      )}
    </div>
  );
}
