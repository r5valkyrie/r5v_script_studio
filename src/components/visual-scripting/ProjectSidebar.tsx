import { useState } from 'react';
import { FileCode, Crosshair, Plus, FolderPlus, Trash2, Edit2, Folder, FolderOpen, ChevronRight, ChevronDown, MoreVertical } from 'lucide-react';
import type { ScriptFile, WeaponFile } from '../../types/project';
import ConfirmDialog from './ConfirmDialog';

type FileSection = 'scripts' | 'weapons';

interface ProjectSidebarProps {
  // Script files
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
  
  // Weapon files
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
  
  // General
  modifiedFileIds: Set<string>;
  accentColor?: string;
}

// Base weapon options for quick creation
const BASE_WEAPONS = [
  { id: '_base_assault_rifle', name: 'Assault Rifle' },
  { id: '_base_smg', name: 'SMG' },
  { id: '_base_lmg', name: 'LMG' },
  { id: '_base_sniper', name: 'Sniper' },
  { id: '_base_shotgun', name: 'Shotgun' },
  { id: '_base_handgun', name: 'Pistol' },
  { id: '_base_melee', name: 'Melee' },
  { id: '_base_ability_tactical', name: 'Tactical Ability' },
  { id: '_base_ability_ultimate', name: 'Ultimate Ability' },
];

export default function ProjectSidebar({
  scriptFiles,
  activeScriptFileId,
  scriptFolders,
  onSelectScriptFile,
  onCreateScriptFile,
  onDeleteScriptFile,
  onRenameScriptFile,
  onCreateScriptFolder,
  onDeleteScriptFolder,
  weaponFiles,
  activeWeaponFileId,
  weaponFolders,
  onSelectWeaponFile,
  onCreateWeaponFile,
  onDeleteWeaponFile,
  onRenameWeaponFile,
  onCreateWeaponFolder,
  onDeleteWeaponFolder,
  modifiedFileIds,
  accentColor = '#22d3ee',
}: ProjectSidebarProps) {
  // Expand both sections by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['scripts', 'weapons']));
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  
  // Creation state
  const [creatingIn, setCreatingIn] = useState<{ section: FileSection; folder?: string } | null>(null);
  const [newFileName, setNewFileName] = useState('');
  
  // Folder creation state
  const [creatingFolderIn, setCreatingFolderIn] = useState<FileSection | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedBaseWeapon, setSelectedBaseWeapon] = useState<string>('');
  const [showBaseWeaponDropdown, setShowBaseWeaponDropdown] = useState(false);
  
  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'file' | 'folder' | 'section'; id: string; section: FileSection } | null>(null);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'file' | 'folder'; id: string; name: string; section: FileSection }>({
    isOpen: false, type: 'file', id: '', name: '', section: 'scripts'
  });

  // Drag state for file moving
  const [draggedFile, setDraggedFile] = useState<{ id: string; section: FileSection } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.section === 'scripts') {
      if (deleteConfirm.type === 'file') {
        onDeleteScriptFile(deleteConfirm.id);
      } else {
        onDeleteScriptFolder(deleteConfirm.id);
      }
    } else {
      if (deleteConfirm.type === 'file') {
        onDeleteWeaponFile(deleteConfirm.id);
      } else {
        onDeleteWeaponFolder(deleteConfirm.id);
      }
    }
    setDeleteConfirm({ isOpen: false, type: 'file', id: '', name: '', section: 'scripts' });
  };

  const handleCreate = () => {
    if (newFileName.trim() && creatingIn) {
      const fileName = creatingIn.folder ? `${creatingIn.folder}/${newFileName.trim()}` : newFileName.trim();
      if (creatingIn.section === 'scripts') {
        onCreateScriptFile(fileName);
      } else {
        onCreateWeaponFile(fileName, selectedBaseWeapon || undefined);
      }
      setNewFileName('');
      setSelectedBaseWeapon('');
      setCreatingIn(null);
    }
  };

  const handleCreateFolder = (section: FileSection) => {
    setCreatingFolderIn(section);
    setNewFolderName('');
    // Auto-expand the section
    setExpandedSections(prev => new Set([...prev, section]));
  };
  
  const confirmCreateFolder = () => {
    if (newFolderName.trim() && creatingFolderIn) {
      if (creatingFolderIn === 'scripts') {
        onCreateScriptFolder(newFolderName.trim());
      } else {
        onCreateWeaponFolder(newFolderName.trim());
      }
      setCreatingFolderIn(null);
      setNewFolderName('');
    }
  };

  const handleRename = (fileId: string, section: FileSection) => {
    if (renameValue.trim()) {
      if (section === 'scripts') {
        onRenameScriptFile(fileId, renameValue.trim());
      } else {
        onRenameWeaponFile(fileId, renameValue.trim());
      }
    }
    setRenamingId(null);
    setRenameValue('');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, fileId: string, section: FileSection) => {
    setDraggedFile({ id: fileId, section });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetFolder: string, targetSection: FileSection) => {
    e.preventDefault();
    // Only allow drop if the file is from the same section
    if (draggedFile && draggedFile.section === targetSection) {
      setDropTarget(targetFolder);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolder: string, targetSection: FileSection) => {
    e.preventDefault();
    setDropTarget(null);
    
    if (!draggedFile) return;
    
    // Don't allow dropping files into a different section
    if (draggedFile.section !== targetSection) {
      setDraggedFile(null);
      return;
    }
    
    const files = draggedFile.section === 'scripts' ? scriptFiles : weaponFiles;
    const file = files.find(f => f.id === draggedFile.id);
    if (!file) return;
    
    const fileName = file.name.split('/').pop() || file.name;
    const newPath = targetFolder === 'root' ? fileName : `${targetFolder}/${fileName}`;
    
    if (file.name !== newPath) {
      if (draggedFile.section === 'scripts') {
        onRenameScriptFile(draggedFile.id, newPath);
      } else {
        onRenameWeaponFile(draggedFile.id, newPath);
      }
    }
    
    setDraggedFile(null);
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
    setDropTarget(null);
  };

  // Group files by folder
  const groupFilesByFolder = <T extends { name: string }>(files: T[], folders: string[]): Record<string, T[]> => {
    const folderMap: Record<string, T[]> = { root: [] };
    
    folders.forEach(folder => {
      if (!folderMap[folder]) {
        folderMap[folder] = [];
      }
    });
    
    files.forEach(file => {
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

  const scriptsByFolder = groupFilesByFolder(scriptFiles, scriptFolders);
  const weaponsByFolder = groupFilesByFolder(weaponFiles, weaponFolders);

  const getChildFolders = (parentPath: string, allFolders: string[]): string[] => {
    if (parentPath === 'root') {
      return allFolders.filter(folder => !folder.includes('/'));
    }
    
    return allFolders.filter(folder => {
      if (!folder.startsWith(parentPath + '/')) return false;
      const remainder = folder.substring(parentPath.length + 1);
      return !remainder.includes('/');
    });
  };

  // Render a file item
  const renderFile = (file: ScriptFile | WeaponFile, section: FileSection, depth: number = 0) => {
    const fileName = file.name.split('/').pop() || file.name;
    const isActive = section === 'scripts' ? file.id === activeScriptFileId : file.id === activeWeaponFileId;
    const isModified = modifiedFileIds.has(file.id);
    const isRenaming = renamingId === file.id;
    const isScript = section === 'scripts';
    const extension = isScript ? '.nut' : '.txt';

    return (
      <div
        key={file.id}
        className={`group flex items-center gap-1.5 py-1 pr-2 cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-500/20 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          if (!isRenaming) {
            if (section === 'scripts') {
              onSelectScriptFile(file.id);
            } else {
              onSelectWeaponFile(file.id);
            }
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, type: 'file', id: file.id, section });
        }}
      >
        {/* Tree line spacer */}
        <span className="w-3" />
        
        {/* Icon */}
        {isScript ? (
          <FileCode size={14} className={isActive ? 'text-blue-400' : 'text-gray-500'} />
        ) : (
          <Crosshair size={14} className={isActive ? 'text-orange-400' : 'text-gray-500'} />
        )}
        
        {/* Name */}
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => handleRename(file.id, section)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename(file.id, section);
              if (e.key === 'Escape') {
                setRenamingId(null);
                setRenameValue('');
              }
            }}
            className="flex-1 bg-[#2d2d2d] border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-xs truncate flex-1">
            {fileName.replace(extension, '')}<span className="text-gray-600">{extension}</span>
          </span>
        )}
        
        {/* Modified indicator */}
        {isModified && !isRenaming && (
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Unsaved changes" />
        )}

        {/* Actions */}
        {!isRenaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ x: e.clientX, y: e.clientY, type: 'file', id: file.id, section });
            }}
            className="p-0.5 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={12} />
          </button>
        )}
      </div>
    );
  };

  // Render a folder
  const renderFolder = (folderPath: string, section: FileSection, filesByFolder: Record<string, (ScriptFile | WeaponFile)[]>, allFolders: string[], depth: number = 0) => {
    const isExpanded = expandedFolders.has(folderPath);
    const folderName = folderPath.split('/').pop() || folderPath;
    const files = filesByFolder[folderPath] || [];
    const childFolders = getChildFolders(folderPath, allFolders);
    const isDropTarget = dropTarget === folderPath;

    return (
      <div key={folderPath}>
        <div
          className={`group flex items-center gap-1.5 py-1 pr-2 cursor-pointer text-gray-400 hover:text-gray-200 transition-colors ${
            isDropTarget ? 'bg-blue-500/20' : 'hover:bg-white/5'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => toggleFolder(folderPath)}
          onDragOver={(e) => handleDragOver(e, folderPath, section)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folderPath, section)}
        >
          {isExpanded ? (
            <ChevronDown size={12} className="text-gray-500" />
          ) : (
            <ChevronRight size={12} className="text-gray-500" />
          )}
          {isExpanded ? (
            <FolderOpen size={14} className="text-yellow-600" />
          ) : (
            <Folder size={14} className="text-yellow-600" />
          )}
          <span className="text-xs flex-1">{folderName}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm({ isOpen: true, type: 'folder', id: folderPath, name: folderName, section });
            }}
            className="p-0.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete folder"
          >
            <Trash2 size={12} />
          </button>
        </div>
        
        {isExpanded && (
          <div>
            {childFolders.map(child => renderFolder(child, section, filesByFolder, allFolders, depth + 1))}
            {files.map(file => renderFile(file, section, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render creation form (inline style like folder creation)
  const renderCreateForm = (section: FileSection) => {
    if (!creatingIn || creatingIn.section !== section) return null;
    
    const isScript = section === 'scripts';
    const icon = isScript ? <FileCode size={14} className="text-blue-400" /> : <Crosshair size={14} className="text-orange-400" />;
    
    return (
      <div className="flex items-center gap-1.5 py-1 pr-2" style={{ paddingLeft: '28px' }}>
        {icon}
        <input
          type="text"
          placeholder={isScript ? 'script_name' : 'weapon_name'}
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') {
              setCreatingIn(null);
              setNewFileName('');
              setSelectedBaseWeapon('');
            }
          }}
          className="flex-1 bg-[#2d2d2d] border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none"
          autoFocus
        />
        <button
          onClick={handleCreate}
          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded"
          title="Create file"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={() => { setCreatingIn(null); setNewFileName(''); setSelectedBaseWeapon(''); }}
          className="p-1 text-gray-500 hover:text-gray-300 hover:bg-white/10 rounded"
          title="Cancel"
        >
          <Trash2 size={10} />
        </button>
      </div>
    );
  };

  // Render folder creation form
  const renderFolderCreateForm = (section: FileSection) => {
    if (creatingFolderIn !== section) return null;
    
    return (
      <div className="flex items-center gap-1.5 py-1 pr-2" style={{ paddingLeft: '28px' }}>
        <Folder size={14} className="text-yellow-600" />
        <input
          type="text"
          placeholder="folder_name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmCreateFolder();
            if (e.key === 'Escape') {
              setCreatingFolderIn(null);
              setNewFolderName('');
            }
          }}
          className="flex-1 bg-[#2d2d2d] border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none"
          autoFocus
        />
        <button
          onClick={confirmCreateFolder}
          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded"
          title="Create folder"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={() => { setCreatingFolderIn(null); setNewFolderName(''); }}
          className="p-1 text-gray-500 hover:text-gray-300 hover:bg-white/10 rounded"
          title="Cancel"
        >
          <Trash2 size={10} />
        </button>
      </div>
    );
  };

  // Render a section (Scripts or Weapons) as a root folder
  const renderSection = (
    section: FileSection,
    title: string,
    icon: React.ReactNode,
    files: (ScriptFile | WeaponFile)[],
    folders: string[],
    filesByFolder: Record<string, (ScriptFile | WeaponFile)[]>
  ) => {
    const isExpanded = expandedSections.has(section);
    const rootFiles = filesByFolder['root'] || [];
    const rootFolders = getChildFolders('root', folders);
    const isRootDropTarget = dropTarget === 'root' && draggedFile?.section === section;
    const folderColor = section === 'scripts' ? 'text-blue-500' : 'text-orange-500';

    return (
      <div>
        {/* Root Folder Header */}
        <div
          className={`group flex items-center gap-1.5 py-1.5 pr-2 cursor-pointer transition-colors hover:bg-white/5 ${
            isRootDropTarget ? 'bg-blue-500/10' : ''
          }`}
          style={{ paddingLeft: '8px' }}
          onClick={() => toggleSection(section)}
          onDragOver={(e) => handleDragOver(e, 'root', section)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'root', section)}
        >
          {isExpanded ? (
            <ChevronDown size={12} className="text-gray-500" />
          ) : (
            <ChevronRight size={12} className="text-gray-500" />
          )}
          {isExpanded ? (
            <FolderOpen size={14} className={folderColor} />
          ) : (
            <Folder size={14} className={folderColor} />
          )}
          <span className="text-xs font-medium text-gray-300 flex-1">{title}</span>
          <span className="text-[10px] text-gray-600 mr-1">{files.length}</span>
          
          {/* Quick actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); setCreatingIn({ section }); }}
              className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={`New ${section === 'scripts' ? 'script' : 'weapon'}`}
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCreateFolder(section); }}
              className="p-1 text-gray-500 hover:text-yellow-500 hover:bg-white/10 rounded transition-colors"
              title="New folder"
            >
              <FolderPlus size={12} />
            </button>
          </div>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div>
            {renderCreateForm(section)}
            {renderFolderCreateForm(section)}
            
            {/* Folders first, then root files */}
            {rootFolders.map(folder => renderFolder(folder, section, filesByFolder, folders, 1))}
            {rootFiles.map(file => renderFile(file, section, 1))}
            
            {/* Empty state */}
            {files.length === 0 && !creatingIn && !creatingFolderIn && (
              <div 
                className="py-3 text-center cursor-pointer hover:bg-white/5 transition-colors"
                style={{ paddingLeft: '28px' }}
                onClick={() => setCreatingIn({ section })}
              >
                <p className="text-[10px] text-gray-600">
                  Click to add {section === 'scripts' ? 'a script' : 'a weapon'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-xs" onClick={() => setContextMenu(null)}>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={`Delete ${deleteConfirm.type === 'file' ? 'File' : 'Folder'}?`}
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        variant="danger"
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#2d2d2d] border border-white/10 rounded py-1 min-w-[140px]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            boxShadow: '0 4px 12px rgba(0,0,0,.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const files = contextMenu.section === 'scripts' ? scriptFiles : weaponFiles;
              const file = files.find(f => f.id === contextMenu.id);
              if (file) {
                const ext = contextMenu.section === 'scripts' ? '.nut' : '.txt';
                setRenamingId(contextMenu.id);
                setRenameValue((file.name.split('/').pop() || file.name).replace(ext, ''));
              }
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/10"
          >
            <Edit2 size={12} />
            Rename
          </button>
          <button
            onClick={() => {
              const files = contextMenu.section === 'scripts' ? scriptFiles : weaponFiles;
              const file = files.find(f => f.id === contextMenu.id);
              if (file) {
                setDeleteConfirm({
                  isOpen: true,
                  type: 'file',
                  id: contextMenu.id,
                  name: file.name.split('/').pop() || file.name,
                  section: contextMenu.section
                });
              }
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1" style={{ minHeight: 220 }}>
        {/* Scripts Section */}
        {renderSection(
          'scripts',
          'Scripts',
          <FileCode size={14} />,
          scriptFiles,
          scriptFolders,
          scriptsByFolder
        )}

        {/* Weapons Section */}
        {renderSection(
          'weapons',
          'Weapons',
          <Crosshair size={14} />,
          weaponFiles,
          weaponFolders,
          weaponsByFolder
        )}
      </div>

      {/* Footer info */}
      <div className="px-2 py-1.5 border-t border-white/5 text-[10px] text-gray-600">
        Right-click for options
      </div>
    </div>
  );
}
