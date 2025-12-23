import { useState, useEffect, useRef } from 'react';
import FileExplorer from './FileExplorer';
import CodeEditor, { type CodeEditorHandle } from './CodeEditor';
import PropertyInspector from './PropertyInspector';
import NewModModal from './modals/NewModModal';
import type { FileItem } from '../types/electron';
import { parseVDF, type VDFModData } from '../utils/vdfParser';
import { parseSquirrelWeapon, parseSquirrelScript, type WeaponProperty, type SquirrelScriptStructure } from '../utils/squirrelParser';
import { parseWeaponTxt, getEditableWeaponProperties, type WeaponTxtProperty } from '../utils/weaponTxtParser';

export default function ModStudio() {
  const editorRef = useRef<CodeEditorHandle>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('vdf');
  const [showNewModModal, setShowNewModModal] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedData, setParsedData] = useState<VDFModData | WeaponProperty[] | WeaponTxtProperty[] | SquirrelScriptStructure | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Parse file content when it changes
  useEffect(() => {
    if (!fileContent || !fileType) {
      setParsedData(null);
      return;
    }

    if (fileType === 'vdf') {
      const vdfData = parseVDF(fileContent);
      setParsedData(vdfData);
    } else if (fileType === 'weapontxt') {
      const weaponData = parseWeaponTxt(fileContent);
      const editableProps = getEditableWeaponProperties(weaponData);
      setParsedData(editableProps.length > 0 ? editableProps : weaponData.properties);
    } else if (fileType === 'weapon' || fileType === 'script') {
      // Use the enhanced script parser for better structure visualization
      const scriptStructure = parseSquirrelScript(fileContent);
      setParsedData(scriptStructure);
    } else {
      setParsedData(null);
    }
  }, [fileContent, fileType]);

  const handleFileSelect = async (filePath: string, type: string) => {
    setSelectedFile(filePath);
    setFileType(type);
    setHasUnsavedChanges(false);
    
    // Load file content
    const result = await window.electronAPI.readFile(filePath);
    if (result.success && result.content) {
      setFileContent(result.content);
    } else {
      setFileContent('// Error loading file');
    }
  };

  const handleEditorChange = (newContent: string) => {
    setFileContent(newContent);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedFile || !hasUnsavedChanges || isSaving) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const result = await window.electronAPI.writeFile(selectedFile, fileContent);
      
      if (result.success) {
        setHasUnsavedChanges(false);
        setSaveStatus('success');
        
        // Clear success message after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } else {
        setSaveStatus('error');
        console.error('Save failed:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModCreated = async (modPath: string) => {
    // Auto-open the newly created mod folder
    const result = await window.electronAPI.openModFolder(modPath);
    if (result.success) {
      console.log('Mod created and opened at:', modPath);
    }
  };

  const handlePropertyChange = (key: string, value: any) => {
    console.log(`Property changed: ${key} = ${value}`);
    // TODO: Update file content based on property changes
  };

  const handleJumpToLine = (line: number) => {
    editorRef.current?.jumpToLine(line);
  };

  return (
    <>
      <div className="flex h-full">
        {/* Left: File Explorer */}
        <FileExplorer
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onNewMod={() => setShowNewModModal(true)}
        />

        {/* Center: Editor */}
        <CodeEditor
          ref={editorRef}
          fileName={selectedFile}
          fileType={fileType}
          fileContent={fileContent}
          onChange={handleEditorChange}
          onSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Right: Property Inspector */}
        <PropertyInspector
          fileName={selectedFile}
          fileType={fileType}
          parsedData={parsedData}
          onPropertyChange={handlePropertyChange}
          onJumpToLine={handleJumpToLine}
        />
      </div>

      {/* Save Status Toast */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-4 right-4 px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-slideIn">
          File saved successfully!
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg animate-slideIn">
          Failed to save file
        </div>
      )}

      {/* v>

      {/* Modals */}
      {showNewModModal && (
        <NewModModal 
          onClose={() => setShowNewModModal(false)}
          onModCreated={handleModCreated}
        />
      )}
    </>
  );
}
