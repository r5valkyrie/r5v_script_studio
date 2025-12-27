import { useState } from 'react';
import { FileCode, Crosshair, Plus, FolderPlus, Trash2, Edit2, Folder, ChevronRight, ChevronDown, GripVertical, MoreVertical } from 'lucide-react';
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
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      if (section === 'scripts') {
        onCreateScriptFolder(name.trim());
      } else {
        onCreateWeaponFolder(name.trim());
      }
      // Auto-expand the section
      setExpandedSections(prev => new Set([...prev, section]));
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
        draggable={!isRenaming}
        onDragStart={(e) => handleDragStart(e, file.id, section)}
        onDragEnd={handleDragEnd}
        className={`group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        } ${draggedFile?.id === file.id ? 'opacity-50' : ''}`}
        style={{
          marginLeft: `${depth * 16}px`,
          borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
        }}
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
        {/* Drag handle */}
        <GripVertical size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />
        
        {/* Icon */}
        {isScript ? (
          <FileCode size={16} style={{ color: isActive ? accentColor : undefined }} className="flex-shrink-0" />
        ) : (
          <Crosshair size={16} style={{ color: isActive ? accentColor : undefined }} className="flex-shrink-0" />
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
            className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white outline-none focus:border-cyan-400"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm truncate flex-1">
            {fileName.replace(extension, '')}<span className="text-gray-500">{extension}</span>
          </span>
        )}
        
        {/* Modified indicator */}
        {isModified && !isRenaming && (
          <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" title="Unsaved changes" />
        )}

        {/* Actions */}
        {!isRenaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ x: e.clientX, y: e.clientY, type: 'file', id: file.id, section });
            }}
            className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
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
          className={`group flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-gray-400 hover:text-white transition-all ${
            isDropTarget ? 'bg-cyan-500/20 ring-1 ring-cyan-500/50' : 'hover:bg-white/5'
          }`}
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => toggleFolder(folderPath)}
          onDragOver={(e) => handleDragOver(e, folderPath, section)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folderPath, section)}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Folder size={16} className="text-amber-500" />
          <span className="text-sm flex-1">{folderName}</span>
          <span className="text-xs text-gray-600">{files.length}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm({ isOpen: true, type: 'folder', id: folderPath, name: folderName, section });
            }}
            className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete folder"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-0.5">
            {childFolders.map(child => renderFolder(child, section, filesByFolder, allFolders, depth + 1))}
            {files.map(file => renderFile(file, section, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render creation form
  const renderCreateForm = (section: FileSection) => {
    if (!creatingIn || creatingIn.section !== section) return null;
    
    return (
      <div className="mx-2 my-2 p-3 bg-[#1a1f28] rounded border border-white/10">
        <input
          type="text"
          placeholder={section === 'scripts' ? 'script_name' : 'mp_weapon_name'}
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
          className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 mb-2"
          autoFocus
        />
        
        {section === 'weapons' && (
          <div className="relative mb-2">
            <button
              onClick={() => setShowBaseWeaponDropdown(!showBaseWeaponDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-black/50 border border-white/20 rounded text-sm text-gray-400 hover:text-white"
            >
              <span>{selectedBaseWeapon ? BASE_WEAPONS.find(b => b.id === selectedBaseWeapon)?.name : 'Base weapon (optional)'}</span>
              <ChevronDown size={14} className={`transition-transform ${showBaseWeaponDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showBaseWeaponDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-[#1a1f28] border border-white/20 rounded shadow-xl max-h-48 overflow-y-auto">
                <button
                  onClick={() => { setSelectedBaseWeapon(''); setShowBaseWeaponDropdown(false); }}
                  className="w-full px-3 py-2 text-sm text-left text-gray-400 hover:text-white hover:bg-white/10"
                >
                  None
                </button>
                {BASE_WEAPONS.map(base => (
                  <button
                    key={base.id}
                    onClick={() => { setSelectedBaseWeapon(base.id); setShowBaseWeaponDropdown(false); }}
                    className="w-full px-3 py-2 text-sm text-left text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    {base.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="flex-1 px-3 py-2 text-sm font-medium text-white rounded"
            style={{ backgroundColor: accentColor }}
          >
            Create
          </button>
          <button
            onClick={() => { setCreatingIn(null); setNewFileName(''); setSelectedBaseWeapon(''); }}
            className="px-3 py-2 text-sm text-gray-400 bg-white/10 rounded hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Render a section (Scripts or Weapons)
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

    return (
      <div className="border-b border-white/5 last:border-b-0">
        {/* Section Header */}
        <div
          className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => toggleSection(section)}
        >
          <div className="flex items-center gap-2.5">
            {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
            <span className="text-gray-400">{icon}</span>
            <span className="text-sm font-medium text-gray-300">{title}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500">{files.length}</span>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCreatingIn({ section })}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={`New ${section === 'scripts' ? 'script' : 'weapon'}`}
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => handleCreateFolder(section)}
              className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-white/10 rounded transition-colors"
              title="New folder"
            >
              <FolderPlus size={16} />
            </button>
          </div>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div 
            className={`pb-1 ${isRootDropTarget ? 'bg-cyan-500/10' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'root', section)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'root', section)}
          >
            {renderCreateForm(section)}
            
            {/* Folders first, then root files */}
            {rootFolders.map(folder => renderFolder(folder, section, filesByFolder, folders))}
            {rootFiles.map(file => renderFile(file, section))}
            
            {/* Empty state */}
            {files.length === 0 && !creatingIn && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-600 mb-3">No {section} yet</p>
                <button
                  onClick={() => setCreatingIn({ section })}
                  className="text-sm px-3 py-2 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Create your first {section === 'scripts' ? 'script' : 'weapon'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-sm" onClick={() => setContextMenu(null)}>
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
          className="fixed z-50 bg-[#1a1f28] border border-white/10 rounded-lg shadow-xl py-1.5 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
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
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10"
          >
            <Edit2 size={16} />
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
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}

      {/* Scripts Section */}
      {renderSection(
        'scripts',
        'Scripts',
        <FileCode size={18} />,
        scriptFiles,
        scriptFolders,
        scriptsByFolder
      )}

      {/* Weapons Section */}
      {renderSection(
        'weapons',
        'Weapons',
        <Crosshair size={18} />,
        weaponFiles,
        weaponFolders,
        weaponsByFolder
      )}

      {/* Footer info */}
      <div className="mt-auto px-3 py-2 border-t border-white/5 text-xs text-gray-600">
        Drag files to move • Right-click for options
      </div>
    </div>
  );
}
