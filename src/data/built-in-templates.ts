import type { NodeTemplate } from '../types/visual-scripting';

/**
 * Built-in templates that ship with the editor
 * These provide common patterns for R5 Reloaded modding
 */
export const BUILT_IN_TEMPLATES: NodeTemplate[] = [
  // ==================== BASIC PATTERNS ====================
  {
    id: 'builtin_server_init',
    name: 'Server Script Setup',
    description: 'Basic server-side script initialization',
    category: 'built-in',
    tags: ['init', 'server', 'basic'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-server',
        label: 'Server Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'print',
        label: 'Print',
        relativePosition: { x: 250, y: 0 },
        data: { message: 'Server script initialized!' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
    ],
  },
  {
    id: 'builtin_client_init',
    name: 'Client Script Setup',
    description: 'Basic client-side script initialization',
    category: 'built-in',
    tags: ['init', 'client', 'basic'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-client',
        label: 'Client Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'print',
        label: 'Print',
        relativePosition: { x: 250, y: 0 },
        data: { message: 'Client script initialized!' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
    ],
  },

  // ==================== CALLBACK PATTERNS ====================
  {
    id: 'builtin_spawn_callback',
    name: 'Player Spawn Handler',
    description: 'Register a callback for when players spawn',
    category: 'callbacks',
    tags: ['spawn', 'player', 'callback'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-server',
        label: 'Server Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'add-spawn-callback',
        label: 'Add Spawn Callback',
        relativePosition: { x: 250, y: 0 },
        data: {},
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'On Spawn', type: 'exec', isInput: false },
          { label: 'Player', type: 'data', dataType: 'player', isInput: false },
        ],
      },
      {
        type: 'print',
        label: 'Print',
        relativePosition: { x: 500, y: 60 },
        data: { message: 'Player spawned!' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 1, toNodeIndex: 2, toPortIndex: 0 },
    ],
  },
  {
    id: 'builtin_death_callback',
    name: 'Player Death Handler',
    description: 'Register a callback for when players die',
    category: 'callbacks',
    tags: ['death', 'player', 'callback', 'kill'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-server',
        label: 'Server Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'add-death-callback',
        label: 'Add Death Callback',
        relativePosition: { x: 250, y: 0 },
        data: {},
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'On Death', type: 'exec', isInput: false },
          { label: 'Victim', type: 'data', dataType: 'player', isInput: false },
          { label: 'Attacker', type: 'data', dataType: 'entity', isInput: false },
        ],
      },
      {
        type: 'print',
        label: 'Print',
        relativePosition: { x: 500, y: 60 },
        data: { message: 'Player died!' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 1, toNodeIndex: 2, toPortIndex: 0 },
    ],
  },
  {
    id: 'builtin_damage_callback',
    name: 'Damage Handler',
    description: 'Register a callback for damage events',
    category: 'callbacks',
    tags: ['damage', 'callback', 'hurt'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-server',
        label: 'Server Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'add-damage-callback',
        label: 'Add Damage Callback',
        relativePosition: { x: 250, y: 0 },
        data: {},
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'On Damage', type: 'exec', isInput: false },
          { label: 'Victim', type: 'data', dataType: 'entity', isInput: false },
          { label: 'Attacker', type: 'data', dataType: 'entity', isInput: false },
          { label: 'Damage', type: 'data', dataType: 'float', isInput: false },
        ],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
    ],
  },

  // ==================== GAMEMODE PATTERNS ====================
  {
    id: 'builtin_gamemode_register',
    name: 'Custom Gamemode',
    description: 'Register a new custom gamemode',
    category: 'gamemode',
    tags: ['gamemode', 'register', 'custom'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-server',
        label: 'Server Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'gamemode-create',
        label: 'Create Gamemode',
        relativePosition: { x: 250, y: 0 },
        data: { name: 'my_gamemode' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Name', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'Gamemode', type: 'data', dataType: 'struct', isInput: false },
        ],
      },
      {
        type: 'gamemode-set-name',
        label: 'Set Display Name',
        relativePosition: { x: 500, y: 0 },
        data: { displayName: 'My Custom Gamemode' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Gamemode', type: 'data', dataType: 'struct', isInput: true },
          { label: 'Display Name', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'Gamemode', type: 'data', dataType: 'struct', isInput: false },
        ],
      },
      {
        type: 'gamemode-register',
        label: 'Register Gamemode',
        relativePosition: { x: 750, y: 0 },
        data: {},
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Gamemode', type: 'data', dataType: 'struct', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
        ],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 0, toNodeIndex: 2, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 1, toNodeIndex: 2, toPortIndex: 1 },
      { fromNodeIndex: 2, fromPortIndex: 0, toNodeIndex: 3, toPortIndex: 0 },
      { fromNodeIndex: 2, fromPortIndex: 1, toNodeIndex: 3, toPortIndex: 1 },
    ],
  },

  // ==================== NPC SPAWNING ====================
  {
    id: 'builtin_npc_spawn',
    name: 'Spawn NPC',
    description: 'Create and spawn an NPC at a position',
    category: 'npc-spawning',
    tags: ['npc', 'spawn', 'ai', 'enemy'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-server',
        label: 'Server Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'create-npc-dummie',
        label: 'Create NPC',
        relativePosition: { x: 250, y: 0 },
        data: { npcClass: 'npc_soldier' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'NPC Class', type: 'data', dataType: 'string', isInput: true },
          { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
          { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'NPC', type: 'data', dataType: 'entity', isInput: false },
        ],
      },
      {
        type: 'set-team',
        label: 'Set Team',
        relativePosition: { x: 500, y: 0 },
        data: { team: 'TEAM_IMC' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'NPC', type: 'data', dataType: 'entity', isInput: true },
          { label: 'Team', type: 'data', dataType: 'int', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
        ],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 0, toNodeIndex: 2, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 1, toNodeIndex: 2, toPortIndex: 1 },
    ],
  },

  // ==================== WEAPON SETUP ====================
  {
    id: 'builtin_give_weapon',
    name: 'Give Weapon to Player',
    description: 'Give a weapon to a player on spawn',
    category: 'weapon-setup',
    tags: ['weapon', 'give', 'spawn', 'loadout'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-server',
        label: 'Server Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'add-spawn-callback',
        label: 'Add Spawn Callback',
        relativePosition: { x: 250, y: 0 },
        data: {},
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'On Spawn', type: 'exec', isInput: false },
          { label: 'Player', type: 'data', dataType: 'player', isInput: false },
        ],
      },
      {
        type: 'give-weapon',
        label: 'Give Weapon',
        relativePosition: { x: 500, y: 60 },
        data: { weaponClass: 'mp_weapon_r97' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Player', type: 'data', dataType: 'player', isInput: true },
          { label: 'Weapon Class', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
          { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
        ],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 1, toNodeIndex: 2, toPortIndex: 0 },
      { fromNodeIndex: 1, fromPortIndex: 2, toNodeIndex: 2, toPortIndex: 1 },
    ],
  },

  // ==================== FLOW CONTROL ====================
  {
    id: 'builtin_delay_sequence',
    name: 'Delayed Sequence',
    description: 'Execute actions with a delay between them',
    category: 'built-in',
    tags: ['delay', 'sequence', 'timer', 'wait'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'sequence',
        label: 'Sequence',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
        ],
        outputs: [
          { label: 'Then 0', type: 'exec', isInput: false },
          { label: 'Then 1', type: 'exec', isInput: false },
        ],
      },
      {
        type: 'delay',
        label: 'Delay',
        relativePosition: { x: 250, y: 60 },
        data: { duration: 1.0 },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Duration', type: 'data', dataType: 'float', isInput: true },
        ],
        outputs: [
          { label: 'Exec', type: 'exec', isInput: false },
        ],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 1, toNodeIndex: 1, toPortIndex: 0 },
    ],
  },
  {
    id: 'builtin_for_loop',
    name: 'For Loop Pattern',
    description: 'Loop a fixed number of times',
    category: 'built-in',
    tags: ['loop', 'for', 'iteration', 'repeat'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'loop-for',
        label: 'For Loop',
        relativePosition: { x: 0, y: 0 },
        data: { start: 0, end: 10, step: 1 },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Start', type: 'data', dataType: 'int', isInput: true },
          { label: 'End', type: 'data', dataType: 'int', isInput: true },
          { label: 'Step', type: 'data', dataType: 'int', isInput: true },
        ],
        outputs: [
          { label: 'Loop Body', type: 'exec', isInput: false },
          { label: 'Completed', type: 'exec', isInput: false },
          { label: 'Index', type: 'data', dataType: 'int', isInput: false },
        ],
      },
      {
        type: 'print',
        label: 'Print',
        relativePosition: { x: 280, y: 0 },
        data: { message: 'Loop iteration' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
    ],
  },
  {
    id: 'builtin_branch',
    name: 'Conditional Branch',
    description: 'Execute different paths based on a condition',
    category: 'built-in',
    tags: ['if', 'else', 'condition', 'branch'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'branch',
        label: 'Branch',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Condition', type: 'data', dataType: 'boolean', isInput: true },
        ],
        outputs: [
          { label: 'True', type: 'exec', isInput: false },
          { label: 'False', type: 'exec', isInput: false },
        ],
      },
      {
        type: 'print',
        label: 'Print (True)',
        relativePosition: { x: 280, y: -30 },
        data: { message: 'Condition is true!' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'print',
        label: 'Print (False)',
        relativePosition: { x: 280, y: 70 },
        data: { message: 'Condition is false!' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
      { fromNodeIndex: 0, fromPortIndex: 1, toNodeIndex: 2, toPortIndex: 0 },
    ],
  },

  // ==================== UI PATTERNS ====================
  {
    id: 'builtin_ui_init',
    name: 'UI Script Setup',
    description: 'Basic UI script initialization',
    category: 'ui-patterns',
    tags: ['ui', 'init', 'rui', 'menu'],
    createdAt: 0,
    isBuiltIn: true,
    nodes: [
      {
        type: 'init-ui',
        label: 'UI Init',
        relativePosition: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
      {
        type: 'print',
        label: 'Print',
        relativePosition: { x: 250, y: 0 },
        data: { message: 'UI script initialized!' },
        inputs: [
          { label: 'Exec', type: 'exec', isInput: true },
          { label: 'Message', type: 'data', dataType: 'string', isInput: true },
        ],
        outputs: [{ label: 'Exec', type: 'exec', isInput: false }],
      },
    ],
    connections: [
      { fromNodeIndex: 0, fromPortIndex: 0, toNodeIndex: 1, toPortIndex: 0 },
    ],
  },
];
