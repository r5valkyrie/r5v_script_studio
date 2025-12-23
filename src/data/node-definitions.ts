import type { NodeDefinition } from '../types/visual-scripting';

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // Init Nodes
  {
    type: 'init-server',
    category: 'core-flow',
    label: 'Init: Server',
    description: 'Server initialization (#if SERVER)',
    color: '#E67E22',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_ModInit' },
  },
  {
    type: 'init-client',
    category: 'core-flow',
    label: 'Init: Client',
    description: 'Client initialization (#if CLIENT)',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'ClientCodeCallback_ModInit' },
  },
  {
    type: 'init-ui',
    category: 'core-flow',
    label: 'Init: UI',
    description: 'UI initialization (#if UI)',
    color: '#9B59B6',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'UICodeCallback_ModInit' },
  },

  // Core Flow Nodes
  {
    type: 'event',
    category: 'core-flow',
    label: 'Event: Custom',
    description: 'Custom event/callback function',
    color: '#4A90E2',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'CustomEvent' },
  },
  {
    type: 'sequence',
    category: 'core-flow',
    label: 'Flow: Sequence',
    description: 'Execute actions in sequence',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Out 1', type: 'exec', isInput: false },
      { label: 'Out 2', type: 'exec', isInput: false },
      { label: 'Out 3', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'branch',
    category: 'core-flow',
    label: 'Add Branch',
    description: 'Conditional branch based on boolean',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Condition', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'True', type: 'exec', isInput: false },
      { label: 'False', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'delay',
    category: 'core-flow',
    label: 'Add Delay',
    description: 'Wait for specified duration',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 1.0 },
  },

  // Weapon Callback Nodes
  {
    type: 'on-weapon-activate',
    category: 'game',
    label: 'OnWeaponActivate',
    description: 'Called when weapon is activated',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnWeaponActivate' },
  },
  {
    type: 'on-weapon-primary-attack',
    category: 'game',
    label: 'OnWeaponPrimaryAttack',
    description: 'Called when weapon fires',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: false },
      { label: 'AttackParams', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { functionName: 'OnWeaponPrimaryAttack' },
  },
  {
    type: 'on-projectile-collision',
    category: 'game',
    label: 'OnProjectileCollision',
    description: 'Called when projectile hits something',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Projectile', type: 'data', dataType: 'entity', isInput: false },
      { label: 'HitEnt', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnProjectileCollision' },
  },

  // Game Nodes
  {
    type: 'is-valid',
    category: 'game',
    label: 'IsValid',
    description: 'Check if entity is valid',
    color: '#E8A838',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Valid', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-owner',
    category: 'game',
    label: 'GetOwner',
    description: 'Get entity owner (player/weapon)',
    color: '#E8A838',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Owner', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'thread',
    category: 'game',
    label: 'Thread (Async)',
    description: 'Start asynchronous thread',
    color: '#E8A838',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Function', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'AsyncFunction' },
  },
  {
    type: 'wait',
    category: 'game',
    label: 'Wait',
    description: 'Wait for specified duration',
    color: '#E8A838',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 1.0 },
  },
  {
    type: 'give-weapon',
    category: 'game',
    label: 'GiveWeapon',
    description: 'Give a weapon to a player',
    color: '#E8A838',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { weaponName: 'mp_weapon_r97' },
  },
  {
    type: 'emit-sound',
    category: 'game',
    label: 'EmitSoundOnEntity',
    description: 'Play sound on entity',
    color: '#E8A838',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { soundName: 'sound_name' },
  },
  {
    type: 'play-sound',
    category: 'game',
    label: 'Play Sound',
    description: 'Play a sound effect',
    color: '#E8A838',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { soundName: 'sound_name' },
  },
  {
    type: 'set-health',
    category: 'game',
    label: 'Set Health',
    description: 'Set player health',
    color: '#E8A838',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Health', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { health: 100 },
  },

  // Mod Nodes
  {
    type: 'precache-weapon',
    category: 'mods',
    label: 'PrecacheWeapon',
    description: 'Precache weapon for use',
    color: '#9B59B6',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'WeaponClass', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { weaponClass: 'mp_weapon_custom' },
  },
  {
    type: 'add-callback',
    category: 'mods',
    label: 'AddCallback',
    description: 'Add callback function',
    color: '#9B59B6',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'CallbackType', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { callbackType: 'AddClientCommandCallback', functionName: 'MyCallback' },
  },
  {
    type: 'weapon-has-mod',
    category: 'mods',
    label: 'Weapon.HasMod',
    description: 'Check if weapon has mod',
    color: '#9B59B6',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: true },
      { label: 'ModName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'HasMod', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { modName: 'mod_name' },
  },
  {
    type: 'weapon-add-mod',
    category: 'mods',
    label: 'Weapon.AddMod',
    description: 'Add mod to weapon',
    color: '#9B59B6',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: true },
      { label: 'ModName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { modName: 'mod_name' },
  },
  {
    type: 'register-custom-damage',
    category: 'mods',
    label: 'RegisterCustomWeaponDamageDef',
    description: 'Register custom weapon damage type',
    color: '#9B59B6',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'WeaponClass', type: 'data', dataType: 'string', isInput: true },
      { label: 'DisplayName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { weaponClass: 'mp_weapon_custom', displayName: 'Custom Weapon' },
  },

  // Data Nodes
  {
    type: 'string',
    category: 'data',
    label: 'Data: String',
    description: 'String value',
    color: '#27AE60',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { value: '' },
  },
  {
    type: 'float',
    category: 'data',
    label: 'Float',
    description: 'Floating point number',
    color: '#27AE60',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { value: 0.0 },
  },
  {
    type: 'int',
    category: 'data',
    label: 'Int',
    description: 'Integer number',
    color: '#27AE60',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { value: 0 },
  },
  {
    type: 'bool',
    category: 'data',
    label: 'Hints',
    description: 'Boolean value',
    color: '#27AE60',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { value: true },
  },

  // Action Nodes
  {
    type: 'give-weapon-action',
    category: 'actions',
    label: 'Action: GiveWeapon',
    description: 'Give weapon to player',
    color: '#E67E22',
    inputs: [
      { label: 'Exec', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
];

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return NODE_DEFINITIONS.find(def => def.type === type);
}

export function getNodesByCategory(category: string): NodeDefinition[] {
  return NODE_DEFINITIONS.filter(def => def.category === category);
}
