import { useState } from 'react';
import { FileCode, Crosshair, Plus, FolderPlus, Trash2, Edit2, Folder, ChevronRight, ChevronDown } from 'lucide-react';
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
  onRenameScriptFolder: (oldPath: string, newPath: string) => void;
  
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
  onRenameWeaponFolder: (oldPath: string, newPath: string) => void;
  
  // General
  activeFileType: 'script' | 'weapon';
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
  activeFileType,
  modifiedFileIds,
  accentColor = '#22d3ee',
}: ProjectSidebarProps) {
  const [activeSection, setActiveSection] = useState<FileSection>(activeFileType === 'weapon' ? 'weapons' : 'scripts');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedBaseWeapon, setSelectedBaseWeapon] = useState<string>('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'file' | 'folder'; id: string; name: string; section: FileSection }>({
    isOpen: false, type: 'file', id: '', name: '', section: 'scripts'
  });
  const [showBaseWeaponDropdown, setShowBaseWeaponDropdown] = useState(false);

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

  const showDeleteConfirm = (type: 'file' | 'folder', id: string, name: string, section: FileSection) => {
    setDeleteConfirm({ isOpen: true, type, id, name, section });
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
    if (newFileName.trim()) {
      if (activeSection === 'scripts') {
        onCreateScriptFile(newFileName.trim());
      } else {
        onCreateWeaponFile(newFileName.trim(), selectedBaseWeapon || undefined);
      }
      setNewFileName('');
      setSelectedBaseWeapon('');
      setIsCreating(false);
    }
  };

  const handleRename = (fileId: string) => {
    if (renameValue.trim()) {
      if (activeSection === 'scripts') {
        onRenameScriptFile(fileId, renameValue.trim());
      } else {
        onRenameWeaponFile(fileId, renameValue.trim());
      }
    }
    setRenamingId(null);
    setRenameValue('');
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

  const currentFiles = activeSection === 'scripts' ? scriptFiles : weaponFiles;
  const currentFolders = activeSection === 'scripts' ? scriptFolders : weaponFolders;
  const currentFilesByFolder = activeSection === 'scripts' ? scriptsByFolder : weaponsByFolder;
  const currentActiveId = activeSection === 'scripts' ? activeScriptFileId : activeWeaponFileId;

  const getChildFolders = (parentPath: string): string[] => {
    const allFolders = Object.keys(currentFilesByFolder).filter(f => f !== 'root');
    
    if (parentPath === 'root') {
      return allFolders.filter(folder => !folder.includes('/'));
    }
    
    return allFolders.filter(folder => {
      if (!folder.startsWith(parentPath + '/')) return false;
      const remainder = folder.substring(parentPath.length + 1);
      return !remainder.includes('/');
    });
  };

  const renderFile = (file: ScriptFile | WeaponFile, depth: number = 0) => {
    const fileName = file.name.split('/').pop() || file.name;
    const isActive = file.id === currentActiveId;
    const isModified = modifiedFileIds.has(file.id);
    const isRenaming = renamingId === file.id;
    const isScript = activeSection === 'scripts';
    const extension = isScript ? '.nut' : '.txt';

    return (
      <div
        key={file.id}
        className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all ${
          isActive
            ? 'text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        style={{
          paddingLeft: `${8 + depth * 16}px`,
          backgroundColor: isActive ? `${accentColor}15` : undefined,
          borderLeft: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
        }}
        onClick={() => {
          if (!isRenaming) {
            if (activeSection === 'scripts') {
              onSelectScriptFile(file.id);
            } else {
              onSelectWeaponFile(file.id);
            }
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isScript ? (
            <FileCode size={14} style={{ color: isActive ? accentColor : undefined }} className="flex-shrink-0" />
          ) : (
            <Crosshair size={14} style={{ color: isActive ? accentColor : undefined }} className="flex-shrink-0" />
          )}
          
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRename(file.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(file.id);
                if (e.key === 'Escape') {
                  setRenamingId(null);
                  setRenameValue('');
                }
              }}
              className="flex-1 bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-cyan-400"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs truncate">
              {fileName.replace(extension, '')}{extension}
            </span>
          )}
          
          {isModified && !isRenaming && (
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
          )}
        </div>

        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingId(file.id);
                setRenameValue(fileName.replace(extension, ''));
              }}
              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Rename"
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                showDeleteConfirm('file', file.id, fileName, activeSection);
              }}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFolder = (folderPath: string, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folderPath);
    const folderName = folderPath.split('/').pop() || folderPath;
    const files = currentFilesByFolder[folderPath] || [];
    const childFolders = getChildFolders(folderPath);

    return (
      <div key={folderPath}>
        <div
          className="group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => toggleFolder(folderPath)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Folder size={14} className="text-yellow-500" />
            <span className="text-xs">{folderName}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                showDeleteConfirm('folder', folderPath, folderName, activeSection);
              }}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Delete folder"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div>
            {childFolders.map(child => renderFolder(child, depth + 1))}
            {files.map(file => renderFile(file, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1419]">
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

      {/* Section Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveSection('scripts')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === 'scripts'
              ? 'text-white border-b-2'
              : 'text-gray-400 hover:text-white'
          }`}
          style={{
            borderColor: activeSection === 'scripts' ? accentColor : 'transparent',
          }}
        >
          <FileCode size={14} />
          <span>Scripts</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
            {scriptFiles.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('weapons')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === 'weapons'
              ? 'text-white border-b-2'
              : 'text-gray-400 hover:text-white'
          }`}
          style={{
            borderColor: activeSection === 'weapons' ? accentColor : 'transparent',
          }}
        >
          <Crosshair size={14} />
          <span>Weapons</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
            {weaponFiles.length}
          </span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/5">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-300 hover:text-white bg-white/5 rounded transition-colors"
          style={{ borderColor: accentColor }}
        >
          <Plus size={11} style={{ color: accentColor }} />
          {activeSection === 'scripts' ? 'Script' : 'Weapon'}
        </button>
        <button
          onClick={() => {
            const name = prompt('Enter folder name:');
            if (name) {
              if (activeSection === 'scripts') {
                onCreateScriptFolder(name);
              } else {
                onCreateWeaponFolder(name);
              }
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-300 hover:text-white bg-white/5 rounded transition-colors"
        >
          <FolderPlus size={11} className="text-yellow-400" />
          Folder
        </button>
      </div>

      {/* Create New File Form */}
      {isCreating && (
        <div className="p-2 border-b border-white/10 bg-white/5">
          <input
            type="text"
            placeholder={activeSection === 'scripts' ? 'script_name.nut' : 'mp_weapon_name'}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFileName('');
                setSelectedBaseWeapon('');
              }
            }}
            className="w-full bg-black/50 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400 mb-2"
            autoFocus
          />
          
          {activeSection === 'weapons' && (
            <div className="relative mb-2">
              <button
                onClick={() => setShowBaseWeaponDropdown(!showBaseWeaponDropdown)}
                className="w-full flex items-center justify-between px-2 py-1.5 bg-black/50 border border-white/20 rounded text-xs text-gray-400 hover:text-white transition-colors"
              >
                <span>{selectedBaseWeapon ? BASE_WEAPONS.find(b => b.id === selectedBaseWeapon)?.name : 'Select base weapon (optional)'}</span>
                <ChevronDown size={12} className={`transition-transform ${showBaseWeaponDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBaseWeaponDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1f28] border border-white/20 rounded shadow-lg max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedBaseWeapon('');
                      setShowBaseWeaponDropdown(false);
                    }}
                    className="w-full px-2 py-1.5 text-xs text-left text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    None (empty template)
                  </button>
                  {BASE_WEAPONS.map(base => (
                    <button
                      key={base.id}
                      onClick={() => {
                        setSelectedBaseWeapon(base.id);
                        setShowBaseWeaponDropdown(false);
                      }}
                      className="w-full px-2 py-1.5 text-xs text-left text-gray-400 hover:text-white hover:bg-white/10"
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
              className="flex-1 px-2 py-1 text-[10px] font-medium text-white rounded transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewFileName('');
                setSelectedBaseWeapon('');
              }}
              className="flex-1 px-2 py-1 text-[10px] font-medium text-gray-400 bg-white/10 rounded hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {/* Root level files */}
        {(currentFilesByFolder['root'] || []).map(file => renderFile(file))}
        
        {/* Folders */}
        {getChildFolders('root').map(folder => renderFolder(folder))}
        
        {/* Empty state */}
        {currentFiles.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No {activeSection} yet.
            <br />
            Click the + button to create one.
          </div>
        )}
      </div>

      {/* Section Info */}
      <div className="px-2 py-1.5 border-t border-white/10 text-[10px] text-gray-500">
        {activeSection === 'scripts' ? (
          <span>scripts/vscripts/*.nut</span>
        ) : (
          <span>scripts/weapons/*.txt</span>
        )}
      </div>
    </div>
  );
}
