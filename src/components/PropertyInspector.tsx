import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { VDFModData } from '../utils/vdfParser';
import type { WeaponProperty, SquirrelScriptStructure } from '../utils/squirrelParser';
import type { WeaponTxtProperty } from '../utils/weaponTxtParser';
import ScriptTreeView from './ScriptTreeView';

interface PropertyInspectorProps {
  fileName: string | null;
  fileType: string;
  parsedData?: VDFModData | WeaponProperty[] | WeaponTxtProperty[] | SquirrelScriptStructure | null;
  onPropertyChange?: (key: string, value: any) => void;
  onJumpToLine?: (line: number) => void;
}

interface InspectorSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function InspectorSection({ title, children, defaultOpen = true }: InspectorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 bg-[#151a21] hover:bg-[#1a1f28] transition-colors"
      >
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full border transition-colors ${
        checked
          ? 'bg-purple-600 border-purple-600'
          : 'bg-white/10 border-white/10'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function PropertyInspector({ fileName, fileType, parsedData, onPropertyChange, onJumpToLine }: PropertyInspectorProps) {
  const [vdfData, setVdfData] = useState<VDFModData>({});
  const [weaponProps, setWeaponProps] = useState<WeaponProperty[]>([]);
  const [weaponTxtProps, setWeaponTxtProps] = useState<WeaponTxtProperty[]>([]);
  const [scriptStructure, setScriptStructure] = useState<SquirrelScriptStructure | null>(null);

  useEffect(() => {
    if (fileType === 'vdf' && parsedData && !Array.isArray(parsedData)) {
      setVdfData(parsedData as VDFModData);
      setWeaponProps([]);
      setWeaponTxtProps([]);
      setScriptStructure(null);
    } else if (fileType === 'weapontxt' && Array.isArray(parsedData)) {
      setWeaponTxtProps(parsedData as WeaponTxtProperty[]);
      setVdfData({});
      setWeaponProps([]);
      setScriptStructure(null);
    } else if ((fileType === 'weapon' || fileType === 'script') && parsedData) {
      // Check if it's the new SquirrelScriptStructure format or legacy format
      if (!Array.isArray(parsedData) && 'functions' in parsedData && 'compilationBlocks' in parsedData) {
        setScriptStructure(parsedData as SquirrelScriptStructure);
        setWeaponProps([]);
      } else if (Array.isArray(parsedData)) {
        setWeaponProps(parsedData as WeaponProperty[]);
        setScriptStructure(null);
      }
      setVdfData({});
      setWeaponTxtProps([]);
    }
  }, [parsedData, fileType]);

  const handleVdfChange = (key: keyof VDFModData, value: any) => {
    setVdfData(prev => ({ ...prev, [key]: value }));
    onPropertyChange?.(key, value);
  };

  const handleWeaponPropChange = (index: number, value: any) => {
    const newProps = [...weaponProps];
    newProps[index].value = value;
    setWeaponProps(newProps);
    onPropertyChange?.(newProps[index].name, value);
  };

  const handleWeaponTxtPropChange = (index: number, value: any) => {
    const newProps = [...weaponTxtProps];
    newProps[index].value = value;
    setWeaponTxtProps(newProps);
    onPropertyChange?.(newProps[index].key, value);
  };

  return (
    <div className="w-[340px] border-l border-white/10 flex flex-col bg-[#0f1419]">
      <div className="p-4 border-b border-white/10 bg-[#151a21]">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Inspector
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Script Tree View */}
        {(fileType === 'weapon' || fileType === 'script') && scriptStructure && (
          <ScriptTreeView structure={scriptStructure} onJumpToLine={onJumpToLine} />
        )}

        {fileType === 'vdf' && (
          <>
            <InspectorSection title="Mod Info">
              <FormGroup label="Name">
                <input
                  type="text"
                  value={vdfData.name || ''}
                  onChange={(e) => handleVdfChange('name', e.target.value)}
                  placeholder="Mod name"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </FormGroup>
              <FormGroup label="Description">
                <input
                  type="text"
                  value={vdfData.description || ''}
                  onChange={(e) => handleVdfChange('description', e.target.value)}
                  placeholder="Mod description"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </FormGroup>
              <FormGroup label="Version">
                <input
                  type="text"
                  value={vdfData.version || ''}
                  onChange={(e) => handleVdfChange('version', e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </FormGroup>
              <FormGroup label="Author">
                <input
                  type="text"
                  value={vdfData.author || ''}
                  onChange={(e) => handleVdfChange('author', e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </FormGroup>
              <FormGroup label="Required On Client">
                <select 
                  value={vdfData.requiredOnClient || '1'}
                  onChange={(e) => handleVdfChange('requiredOnClient', e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </FormGroup>
            </InspectorSection>

            {vdfData.convars && Object.keys(vdfData.convars).length > 0 && (
              <InspectorSection title="ConVars">
                {Object.entries(vdfData.convars).map(([key, value]) => (
                  <FormGroup key={key} label={key}>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newConvars = { ...vdfData.convars, [key]: e.target.value };
                        handleVdfChange('convars', newConvars);
                      }}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </FormGroup>
                ))}
              </InspectorSection>
            )}

            {vdfData.localization && Object.keys(vdfData.localization).length > 0 && (
              <InspectorSection title="Localization" defaultOpen={false}>
                {Object.entries(vdfData.localization).map(([key, value]) => (
                  <FormGroup key={key} label={key}>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newLoc = { ...vdfData.localization, [key]: e.target.value };
                        handleVdfChange('localization', newLoc);
                      }}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </FormGroup>
                ))}
              </InspectorSection>
            )}
          </>
        )}

        {(fileType === 'weapon' || fileType === 'script') && !scriptStructure && weaponProps.length > 0 && (
          <>
            <InspectorSection title="Squirrel Properties">
              {weaponProps.map((prop, index) => (
                <FormGroup key={`${prop.name}-${index}`} label={prop.name}>
                  {prop.type === 'boolean' ? (
                    <div className="flex items-center justify-between">
                      <Toggle 
                        checked={prop.value as boolean} 
                        onChange={(checked) => handleWeaponPropChange(index, checked)} 
                      />
                    </div>
                  ) : prop.type === 'number' ? (
                    <input
                      type="number"
                      value={prop.value as number}
                      onChange={(e) => handleWeaponPropChange(index, parseFloat(e.target.value) || 0)}
                      step="0.1"
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  ) : (
                    <input
                      type="text"
                      value={prop.value as string}
                      onChange={(e) => handleWeaponPropChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  )}
                  {prop.line && (
                    <div className="text-xs text-gray-600 mt-1">Line {prop.line}</div>
                  )}
                </FormGroup>
              ))}
            </InspectorSection>
          </>
        )}

        {fileType === 'weapontxt' && weaponTxtProps.length > 0 && (
          <>
            <InspectorSection title="Weapon Properties">
              {weaponTxtProps.map((prop, index) => (
                <FormGroup key={`${prop.key}-${index}`} label={prop.key}>
                  {prop.type === 'number' ? (
                    <input
                      type="number"
                      value={prop.value as number}
                      onChange={(e) => handleWeaponTxtPropChange(index, parseFloat(e.target.value) || 0)}
                      step="0.1"
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  ) : (
                    <input
                      type="text"
                      value={prop.value as string}
                      onChange={(e) => handleWeaponTxtPropChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  )}
                  {prop.section && (
                    <div className="text-xs text-purple-400 mt-1 capitalize">{prop.section}</div>
                  )}
                  {prop.line && (
                    <div className="text-xs text-gray-600 mt-1">Line {prop.line}</div>
                  )}
                </FormGroup>
              ))}
            </InspectorSection>
          </>
        )}

        {!fileName && (
          <div className="p-8 text-center text-gray-500 text-sm">
            <p>Select a file to view its properties</p>
          </div>
        )}

        {fileName &&
         fileType !== 'vdf' &&
         fileType !== 'weapon' &&
         fileType !== 'script' &&
         fileType !== 'weapontxt' &&
         !scriptStructure && (
          <div className="p-8 text-center text-gray-500 text-sm">
            <p>No properties available for this file type</p>
          </div>
        )}
      </div>
    </div>
  );
}
