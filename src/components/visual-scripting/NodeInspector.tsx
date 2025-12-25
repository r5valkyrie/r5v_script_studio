import type { ScriptNode } from '../../types/visual-scripting';
import CustomSelect from './CustomSelect';

interface NodeInspectorProps {
  node: ScriptNode;
  onUpdate: (updates: Partial<ScriptNode>) => void;
}

export default function NodeInspector({ node, onUpdate }: NodeInspectorProps) {
  const handleDataChange = (key: string, value: any) => {
    onUpdate({
      data: {
        ...node.data,
        [key]: value,
      },
    });
  };

  const renderLootTierSelect = (key: string, value: string) => {
    const options = ['NONE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'HEIRLOOM'];
    return (
      <CustomSelect
        value={value}
        options={options}
        onChange={(val) => handleDataChange(key, val)}
      />
    );
  };

  const renderWeaponTypeSelect = (key: string, value: string) => {
    const options = ['assault', 'smg', 'lmg', 'sniper', 'shotgun', 'pistol'];
    return (
      <CustomSelect
        value={value}
        options={options}
        onChange={(val) => handleDataChange(key, val)}
      />
    );
  };

  const renderAttachmentsMultiSelect = (key: string, value: string[]) => {
    const options = ['barrel', 'mag', 'sight', 'grip', 'hopup'];
    const selected = Array.isArray(value) ? value : [];
    const toggle = (attachment: string, checked: boolean) => {
      const next = checked
        ? Array.from(new Set([...selected, attachment]))
        : selected.filter(item => item !== attachment);
      handleDataChange(key, next);
    };

    return (
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <label key={option} className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(e) => toggle(option, e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-black/30 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
            />
            {option}
          </label>
        ))}
      </div>
    );
  };

  const renderEntityClassnameSelect = (key: string, value: string) => {
    const options = [
      // Props
      'prop_dynamic', 'prop_physics', 'prop_script', 'prop_door',
      // Triggers
      'trigger_cylinder', 'trigger_cylinder_heavy', 'trigger_point_gravity', 'trigger_updraft',
      // NPCs
      'npc_dummie', 'npc_prowler', 'npc_marvin', 'npc_spectre', 'npc_drone', 'npc_frag_drone',
      'npc_dropship', 'npc_gunship', 'npc_titan', 'npc_stalker', 'npc_super_spectre',
      'npc_soldier', 'npc_turret_mega', 'npc_turret_sentry', 'npc_turret_floor',
      // Particles & FX
      'info_particle_system', 'info_placement_helper', 'info_target', 'ambient_generic',
      // Movers
      'script_mover', 'script_mover_lightweight',
      // Ziplines
      'zipline', 'zipline_end',
      // Control & Logic
      'point_viewcontrol', 'assault_assaultpoint', 'info_node',
      // Physics
      'vortex_sphere', 'gravity_grenade_dvrt', 'phys_bone_follower',
      // Environment
      'env_fog_controller', 'env_wind', 'env_explosion', 'env_shake',
      // Titans
      'npc_titan_atlas', 'npc_titan_stryder', 'npc_titan_ogre', 'npc_titan_buddy',
      // Other
      'item_health', 'item_ammo', 'waypoint', 'control_point', 'func_brush', 'player_start'
    ];
    return (
      <CustomSelect
        value={value}
        options={options}
        onChange={(val) => handleDataChange(key, val)}
      />
    );
  };

  return (
    <div className="w-full h-full bg-[#151a21] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#0f1419] flex items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Inspector
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Node Info */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
            Node Type
          </label>
          <div className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300">
            {node.label}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
            Category
          </label>
          <div className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300 capitalize">
            {node.category.replace('-', ' ')}
          </div>
        </div>

        {/* Node Properties */}
        {Object.keys(node.data).length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Properties
            </h3>

            <div className="space-y-3">
              {Object.entries(node.data).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-400 block mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>

                  {node.type === 'const-loot-tier' && key === 'tier' ? (
                    renderLootTierSelect(key, value as string)
                  ) : node.type === 'const-weapon-type' && key === 'weaponType' ? (
                    renderWeaponTypeSelect(key, value as string)
                  ) : node.type === 'const-supported-attachments' && key === 'attachments' ? (
                    renderAttachmentsMultiSelect(key, value as string[])
                  ) : node.type === 'entity-classname' && key === 'className' ? (
                    renderEntityClassnameSelect(key, value as string)
                  ) : typeof value === 'boolean' ? (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleDataChange(key, e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-black/30 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                      />
                      <span className="ml-2 text-sm text-gray-300">
                        {value ? 'True' : 'False'}
                      </span>
                    </label>
                  ) : typeof value === 'number' ? (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleDataChange(key, parseFloat(e.target.value) || 0)}
                      step={key.includes('float') || key.includes('duration') ? '0.1' : '1'}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  ) : Array.isArray(value) ? (
                    <input
                      type="text"
                      value={value.join(', ')}
                      onChange={(e) => {
                        const items = e.target.value
                          .split(',')
                          .map(item => item.trim())
                          .filter(item => item.length > 0);
                        handleDataChange(key, items);
                      }}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => handleDataChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Port Information */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Connections
          </h3>

          {node.inputs.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1">Inputs ({node.inputs.length})</div>
              <div className="space-y-1">
                {node.inputs.map((input) => (
                  <div
                    key={input.id}
                    className="px-2 py-1 bg-black/20 rounded text-xs text-gray-400 flex items-center gap-2"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        input.type === 'exec' ? 'bg-white' : 'bg-orange-500'
                      }`}
                    />
                    {input.label}
                    {input.dataType && (
                      <span className="ml-auto text-[10px] text-gray-600">
                        {input.dataType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {node.outputs.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Outputs ({node.outputs.length})</div>
              <div className="space-y-1">
                {node.outputs.map((output) => (
                  <div
                    key={output.id}
                    className="px-2 py-1 bg-black/20 rounded text-xs text-gray-400 flex items-center gap-2"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        output.type === 'exec' ? 'bg-white' : 'bg-orange-500'
                      }`}
                    />
                    {output.label}
                    {output.dataType && (
                      <span className="ml-auto text-[10px] text-gray-600">
                        {output.dataType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-[#0f1419] text-[10px] text-gray-600">
        <p>Node ID: {node.id.substring(0, 12)}...</p>
      </div>
    </div>
  );
}
