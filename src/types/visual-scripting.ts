export type NodeCategory =
  | 'init'            // Init nodes (Server/Client/UI)
  | 'flow'            // Sequence, branch, loops, switch, delay, wait, return, signals
  | 'gamemodes'       // Gamemode registration and config
  | 'callbacks'       // Register callbacks (AddDamageCallback, AddSpawnCallback, etc.)
  | 'entity'          // Entity manipulation (get/set properties)
  | 'entity-creation' // Create Entity, Props, Triggers
  | 'entity-props'    // Script structs (.p, .e, .ai, .w, .proj, .soul)
  | 'npc'             // NPC/AI creation and manipulation
  | 'weapons'         // Weapon-specific operations
  | 'passives'        // Passive ability system
  | 'character'       // Character abilities and classes
  | 'survival'        // Survival loot and inventory system
  | 'status-effects'  // Status effect system
  | 'vfx'             // Particle and FX
  | 'audio'           // Sound and audio
  | 'damage'          // Damage system, traces
  | 'ui'              // RUI system
  | 'math'            // Math operations
  | 'string'          // String manipulation
  | 'structures'      // Structs, enums, typedefs
  | 'variables'       // Variable operations (Get, Set, Declare, Make Global/Local)
  | 'collections'     // Arrays and Tables
  | 'debug'           // Debug nodes (Print, Assert, Warning)
  | 'utilities'       // Utility functions (Time, Precache, Portals, Entity getters)

export type NodeDataType =
  | 'int'
  | 'float'
  | 'string'
  | 'number'
  | 'boolean'
  | 'entity'
  | 'weapon'
  | 'player'
  | 'vector'
  | 'rotation'
  | 'asset'
  | 'function'
  | 'struct'
  | 'enum'
  | 'array'
  | 'table'
  | 'var'
  | 'any'
  | 'itemflavor';

export type NodeType =
  // ==================== INIT ====================
  | 'init-server'
  | 'init-client'
  | 'init-ui'

  // ==================== FLOW CONTROL ====================
  | 'sequence'
  | 'exec-sequence'
  | 'branch'
  | 'delay'
  | 'loop-for'
  | 'loop-foreach'
  | 'loop-while'
  | 'wait'
  | 'signal'
  | 'end-signal'
  | 'wait-signal'
  | 'register-signal'
  | 'return'
  | 'comment'
  | 'reroute'
  | 'custom-function'
  | 'call-function'
  | 'custom-code'
  | 'thread'
  | 'set-portal'
  | 'get-portal'
  | 'switch'
  | 'switch-case'
  | 'switch-default'
  | 'break'
  | 'continue'

  // ==================== STRUCTS & ENUMS ====================
  | 'struct-define'
  | 'struct-create'
  | 'struct-get-field'
  | 'struct-set-field'
  | 'enum-define'
  | 'enum-value'

  // ==================== GAMEMODES ====================
  | 'gamemode-create'
  | 'gamemode-set-name'
  | 'gamemode-set-desc'
  | 'gamemode-set-score-limits'
  | 'gamemode-set-time-limits'
  | 'gamemode-add-scoreboard-column'
  | 'gamemode-add-shared-init'
  | 'gamemode-add-server-init'
  | 'gamemode-add-client-init'
  | 'gamemode-set-evac'
  | 'gamemode-register'
  | 'gamemode-register-spawn-func'
  | 'get-game-state'
  | 'set-game-state'

  // ==================== EVENTS ====================
  // Weapon Events
  | 'on-weapon-activate'
  | 'on-weapon-deactivate'
  | 'on-weapon-primary-attack'
  | 'on-weapon-charge-begin'
  | 'on-weapon-charge-end'
  | 'on-weapon-reload'
  | 'on-weapon-zoom-fov'
  | 'on-weapon-sustained-discharge-begin'
  | 'on-weapon-sustained-discharge-end'
  | 'on-weapon-toss-release-animvent'
  | 'on-weapon-owner-changed'
  | 'on-projectile-collision'
  | 'on-projectile-explode'
  // Animation Events
  | 'on-anim-event'
  // Entity Events
  | 'on-spawn'
  | 'on-death'
  | 'on-damage'
  | 'on-killed'
  // Ability Events
  | 'on-ability-start'
  | 'on-ability-end'
  | 'on-ability-charge-begin'
  | 'on-ability-execute'

  // ==================== SERVER CALLBACKS ====================
  | 'on-entities-did-load'
  | 'on-client-connected'
  | 'on-client-disconnected'
  | 'on-player-killed'
  | 'on-player-respawned'
  | 'on-npc-killed'
  | 'on-client-connecting'
  | 'on-entity-changed-team'
  | 'on-player-assist'
  | 'on-player-inventory-changed'
  | 'on-weapon-attack'
  | 'on-death-box-spawned'
  | 'on-game-state-enter'
  | 'on-player-weapon-activated'
  | 'on-player-used-offhand'
  | 'on-leave-match'
  | 'on-use-button-pressed'
  | 'on-use-button-released'
  | 'on-player-class-changed'
  | 'on-vehicle-launch'
  | 'on-vehicle-collide'
  | 'on-player-changed-team'
  | 'on-player-zoom-in'
  | 'on-player-zoom-out'
  | 'on-passive-changed'
  | 'on-ping-created'
  | 'on-player-match-state-changed'
  | 'on-deathfield-stage-changed'
  | 'on-bleedout-started'
  | 'on-bleedout-ended'
  | 'on-player-life-state-changed'
  | 'on-you-respawned'
  | 'on-you-died'
  | 'on-player-scored'
  | 'on-lootbin-opened'
  | 'on-player-add-weapon-mod'
  | 'on-player-remove-weapon-mod'
  | 'on-grappled'
  | 'on-grapple-detached'

  // ==================== ENTITY OPERATIONS ====================
  | 'get-origin'
  | 'set-origin'
  | 'get-angles'
  | 'set-angles'
  | 'get-velocity'
  | 'set-velocity'
  | 'get-health'
  | 'set-health'
  | 'get-max-health'
  | 'set-max-health'
  | 'get-shield-health'
  | 'set-shield-health'
  | 'get-team'
  | 'set-team'
  | 'get-owner'
  | 'set-owner'
  | 'get-parent'
  | 'set-parent'
  | 'clear-parent'
  | 'is-valid'
  | 'is-alive'
  | 'is-player'
  | 'is-npc'
  | 'is-titan'
  | 'is-pilot'
  | 'get-class-name'
  | 'get-ent-index'
  | 'get-script-name'
  | 'set-script-name'
  | 'set-visible'
  | 'set-solid'
  | 'make-invisible'
  | 'get-forward-vector'
  | 'get-right-vector'
  | 'get-up-vector'
  | 'get-eye-position'
  | 'get-eye-angles'
  | 'get-view-vector'
  | 'get-player-name'
  | 'freeze'
  | 'unfreeze'
  | 'look-at'

  // ==================== ENTITY CREATION ====================
  | 'create-entity'
  | 'entity-classname'
  | 'create-script-mover'
  | 'create-prop-dynamic'
  | 'create-prop-physics'
  | 'create-info-target'
  | 'create-particle-system'
  | 'create-control-point'
  | 'create-ambient-generic'
  | 'create-vortex-sphere'
  | 'create-zipline'
  | 'create-point-viewcontrol'
  | 'dispatch-spawn'
  | 'set-model'
  | 'set-effect-name'
  | 'set-entity-kv'
  | 'create-trigger-cylinder'
  | 'create-trigger-radius-multiple'
  | 'trigger-set-enabled'
  | 'trigger-set-radius'
  | 'trigger-set-above-height'
  | 'trigger-set-below-height'
  | 'trigger-set-enter-callback'
  | 'trigger-set-leave-callback'
  | 'trigger-search-new-touching'

  // ==================== KEYVALUES (merged with entity creation) ====================
  | 'kv-solid'
  | 'kv-rendercolor'
  | 'kv-renderamt'
  | 'kv-rendermode'
  | 'kv-visibility-flags'
  | 'kv-spawnflags'
  | 'kv-collision-group'
  | 'kv-start-active'
  | 'kv-fadedist'
  | 'kv-modelscale'
  | 'kv-trigger-filter'
  | 'kv-custom'

  // ==================== ENTITY PROPERTIES (Script Structs) ====================
  // Context-aware nodes that detect SERVER/CLIENT based on init node connection
  // player.p.* (ServerPlayerStruct / ClientPlayerStruct)
  | 'player-get-property'
  | 'player-set-property'
  // entity.e.* (ServerEntityStruct / ClientEntityStruct)
  | 'entity-get-property'
  | 'entity-set-property'
  // npc.ai.* (ServerAIStruct) - Server only
  | 'npc-get-property'
  | 'npc-set-property'
  // weapon.w.* (ServerWeaponStruct / ClientWeaponStruct)
  | 'weapon-get-struct-property'
  | 'weapon-set-struct-property'
  // projectile.proj.* (ServerProjectileStruct / ClientProjectileStruct)
  | 'projectile-get-property'
  | 'projectile-set-property'
  // soul.soul.* (ServerTitanSoulStruct / ClientTitanSoulStruct)
  | 'soul-get-property'
  | 'soul-set-property'

  // ==================== NPC ====================
  | 'create-npc-dummie'
  | 'create-npc-prowler'
  | 'create-npc-spectre'
  | 'create-npc-marvin'
  | 'create-npc-drone'
  | 'create-npc-dropship'
  | 'create-npc-turret'
  | 'set-spawn-option-ai'
  | 'set-behavior-selector'
  | 'enable-npc-flag'

  // ==================== WEAPONS ====================
  | 'get-active-weapon'
  | 'get-weapon-owner'
  | 'get-weapon-class-name'
  | 'register-mod-weapon'
  | 'give-weapon'
  | 'take-weapon'
  | 'take-all-weapons'
  | 'switch-to-weapon'
  | 'weapon-has-mod'
  | 'weapon-add-mod'
  | 'weapon-remove-mod'
  | 'weapon-set-mods'
  | 'get-weapon-setting-int'
  | 'get-weapon-setting-float'
  | 'get-weapon-setting-bool'
  | 'get-weapon-setting-string'
  | 'get-weapon-ammo'
  | 'set-weapon-ammo'
  | 'get-weapon-clip'
  | 'set-weapon-clip'
  | 'set-weapon-burst-fire-count'
  | 'weapon-emit-sound-1p3p'
  | 'fire-weapon-bullet'
  | 'fire-weapon-bolt'
  | 'fire-weapon-grenade'
  | 'get-offhand-weapon'
  | 'get-weapon-primary-clip-count'
  | 'get-weapon-ammo-pool-type'
  | 'ammo-type-get-ref-from-index'
  | 'take-primary-weapon'
  | 'set-active-weapon-by-name'

  // ==================== STATUS EFFECTS ====================
  | 'status-effect-add'
  | 'status-effect-add-timed'
  | 'status-effect-stop'
  | 'status-effect-stop-all-of-type'
  | 'status-effect-stop-all'
  | 'status-effect-get'
  | 'status-effect-has'
  | 'status-effect-has-severity'
  | 'status-effect-get-severity'
  | 'status-effect-register-callback'
  | 'add-shared-energy'
  | 'get-shared-energy'
  | 'set-shared-energy'
  | 'get-shared-energy-max'
  | 'status-effect-stim'
  | 'status-effect-cloak'
  | 'status-effect-phase'
  | 'status-effect-slow'
  | 'status-effect-speed-boost'

  // ==================== VFX/PARTICLES ====================
  | 'precache-particle'
  | 'start-particle-on-entity'
  | 'start-particle-on-entity-with-pos'
  | 'start-particle-effect-in-world'
  | 'stop-particle'
  | 'effect-stop-all-on-entity'
  | 'set-particle-control-point'
  | 'get-particle-fx-handle'
  | 'play-fx-on-entity'
  | 'play-fx-on-entity-with-pos'

  // ==================== AUDIO ====================
  | 'emit-sound-on-entity'
  | 'emit-sound-at-position'
  | 'emit-weapon-sound-1p3p'
  | 'emit-weapon-npc-sound'
  | 'stop-sound-on-entity'
  | 'play-sound-to-player'
  | 'play-sound-on-entity'
  | 'fade-out-sound-on-entity'
  | 'set-sound-entity-parameter'

  // ==================== DAMAGE ====================
  | 'radius-damage'
  | 'radius-damage-with-falloff'
  | 'entity-take-damage'
  | 'create-damage-info'
  | 'add-damage-callback-source'
  | 'remove-damage-callback'
  | 'trace-line'
  | 'trace-hull'
  | 'trace-line-simple'
  | 'trace-hull-simple'
  | 'get-damage-source-identifier'
  | 'register-damage-source'
  | 'set-damage-source-identifier'
  // DamageInfo operations
  | 'damageinfo-set-damage'
  | 'damageinfo-get-damage'
  | 'damageinfo-get-inflictor'
  | 'damageinfo-set-damage-source-identifier'
  | 'damageinfo-get-custom-damage-type'
  | 'damageinfo-add-custom-damage-type'
  | 'damageinfo-scale-damage'
  | 'damageinfo-get-attacker'
  | 'damageinfo-get-force-kill'
  | 'damageinfo-get-weapon'
  | 'damageinfo-print'
  | 'damageinfo-get-critical-hit-scale'
  | 'damageinfo-get-shield-scale'
  | 'damageinfo-get-damage-position'
  | 'damageinfo-get-hitgroup'
  | 'damageinfo-get-hitbox'
  | 'damageinfo-get-death-package'
  | 'damageinfo-set-death-package'
  | 'damageinfo-get-viewpunch-multiplier'
  | 'damageinfo-get-dist-from-attack-origin'
  | 'damageinfo-get-dist-from-explosion-center'
  | 'damageinfo-get-damage-force'
  | 'damageinfo-get-damage-force-direction'
  | 'damageinfo-is-ragdoll-allowed'
  | 'damageinfo-get-damage-flags'
  | 'damageinfo-get-damage-weapon-name'
  | 'damageinfo-should-record-stats'
  | 'damageinfo-get-damage-type'

  // ==================== UI/RUI ====================
  | 'rui-create'
  | 'rui-create-hud'
  | 'rui-destroy'
  | 'rui-set-string'
  | 'rui-set-int'
  | 'rui-set-float'
  | 'rui-set-bool'
  | 'rui-set-image'
  | 'rui-set-float3'
  | 'rui-set-color-alpha'
  | 'rui-track-float'
  | 'rui-track-int'
  | 'rui-track-game-time'
  | 'announcement'
  | 'server-to-client-string-command'

  // ==================== STRING ====================
  | 'string-concat'
  | 'string-format'
  | 'to-string'
  | 'get-player-name'
  | 'string-builder'
  | 'string-length'
  | 'string-substring'
  | 'string-split'
  | 'string-replace'
  | 'string-to-lower'
  | 'string-to-upper'
  | 'string-trim'
  | 'string-contains'
  | 'string-find'
  | 'string-repeat'
  | 'string-reverse'

  // ==================== MATH ====================
  | 'vector-create'
  | 'vector-add'
  | 'vector-subtract'
  | 'vector-multiply'
  | 'vector-divide'
  | 'vector-dot'
  | 'vector-cross'
  | 'vector-normalize'
  | 'vector-length'
  | 'vector-distance'
  | 'vector-lerp'
  | 'angles-to-forward'
  | 'angles-to-right'
  | 'angles-to-up'
  | 'vector-to-angles'
  | 'math-add'
  | 'math-subtract'
  | 'math-multiply'
  | 'math-divide'
  | 'math-modulo'
  | 'math-min'
  | 'math-max'
  | 'math-clamp'
  | 'math-abs'
  | 'math-floor'
  | 'math-ceil'
  | 'math-round'
  | 'math-sin'
  | 'math-cos'
  | 'math-tan'
  | 'math-pow'
  | 'math-random-int'
  | 'math-random-float'
  | 'math-lerp'
  | 'graph-capped'
  | 'compare-equal'
  | 'compare-not-equal'
  | 'compare-greater'
  | 'compare-less'
  | 'compare-greater-equal'
  | 'compare-less-equal'
  | 'logic-and'
  | 'logic-or'
  | 'logic-not'

  // ==================== CALLBACKS ====================
  | 'add-callback'
  | 'add-client-command-callback'
  | 'add-damage-callback'
  | 'add-spawn-callback'
  | 'add-death-callback'
  | 'add-player-connected-callback'
  | 'add-player-disconnected-callback'
  | 'add-anim-event-callback'
  | 'register-weapon-damage-source'

  // ==================== DATA ====================
  | 'const-string'
  | 'const-float'
  | 'const-int'
  | 'const-bool'
  | 'const-vector'
  | 'const-asset'
  | 'const-loot-tier'
  | 'const-supported-attachments'
  | 'const-weapon-type'
  | 'define-const'
  | 'global-variable'
  | 'local-variable'
  | 'variable-get'
  | 'variable-set'
  | 'variable-declare'

  // ==================== COLLECTIONS ====================
  // Arrays
  | 'array-create'
  | 'array-create-typed'
  | 'array-append'
  | 'array-extend'
  | 'array-remove'
  | 'array-remove-by-index'
  | 'array-get'
  | 'array-set'
  | 'array-length'
  | 'array-contains'
  | 'array-find'
  | 'array-clear'
  | 'array-resize'
  | 'array-randomize'
  | 'array-getrandom'
  | 'array-slice'
  // Tables
  | 'table-create'
  | 'table-create-typed'
  | 'table-get'
  | 'table-set'
  | 'table-add-slot'
  | 'table-has-key'
  | 'table-delete'
  | 'table-keys'
  | 'table-values'
  | 'table-clear'

  // ==================== UTILITIES ====================
  | 'print'
  | 'printf'
  | 'printt'
  | 'printl'
  | 'code-warning'
  | 'assert'
  | 'assert-true'
  | 'assert-false'
  | 'assert-not-null'
  | 'assert-not-equal'
  | 'assert-equal'
  | 'assert-valid'
  | 'assert-alive'
  | 'assert-is-player'
  | 'assert-is-npc'
  | 'assert-is-titan'
  | 'assert-is-pilot'
  | 'get-game-time'
  | 'get-frame-time'
  | 'get-map-name'
  | 'get-all-players'
  | 'get-player-array'
  | 'get-npc-array'
  | 'get-entity-by-script-name'
  | 'get-weapon-by-class'
  | 'precache-model'
  | 'precache-weapon'
  | 'precache-impact-table'
  | 'precache-scriptdata'
  | 'globalize-function'
  | 'function-ref'
  | 'get-players-on-team'
  | 'get-living-players'
  | 'get-living-players-on-team'
  | 'get-local-player'
  | 'get-local-view-player'
  | 'get-ent-by-index'
  | 'get-player-by-index'

  // ==================== PASSIVES ====================
  | 'give-passive'
  | 'take-passive'
  | 'take-all-passives'
  | 'get-all-passives-for-player'
  | 'player-has-passive'

  // ==================== CHARACTER ABILITIES ====================
  | 'character-get-tactical-ability'
  | 'character-get-ultimate-ability'
  | 'character-get-passive-ability'

  // ==================== SURVIVAL LOOT ====================
  | 'survival-get-all-loot'
  | 'survival-pickup-item'
  | 'survival-add-to-inventory'
  | 'survival-remove-from-inventory'
  | 'survival-get-player-inventory'
  | 'survival-count-items-in-inventory'
  | 'survival-has-item-in-inventory';

export interface NodePort {
  id: string;
  label: string;
  type: 'exec' | 'data';
  dataType?: NodeDataType;
  isInput: boolean;
}

export interface ScriptNode {
  id: string;
  type: NodeType;
  category: NodeCategory;
  label: string;
  position: { x: number; y: number };
  size?: { width: number; height?: number }; // For resizable nodes like comments, width used for grid snap
  data: Record<string, any>;
  inputs: NodePort[];
  outputs: NodePort[];
}

export interface NodeConnection {
  id: string;
  from: {
    nodeId: string;
    portId: string;
  };
  to: {
    nodeId: string;
    portId: string;
  };
}

// Documentation for a node, including examples and usage diagrams
export interface NodeDocumentation {
  /** Extended description with more details */
  longDescription?: string;
  /** Example code snippet showing Squirrel output */
  codeExample?: string;
  /** Tips and best practices */
  tips?: string[];
  /** Common use cases */
  useCases?: string[];
  /** Related node types that work well together */
  relatedNodes?: NodeType[];
  /** Links to external documentation (wiki, etc) */
  externalLinks?: { label: string; url: string }[];
  /** Example diagram showing node connections */
  exampleDiagram?: {
    /** Nodes in the example diagram */
    nodes: {
      type: NodeType;
      position: { x: number; y: number };
      label?: string;
    }[];
    /** Connections between nodes (indices into nodes array) */
    connections: {
      fromNode: number;
      fromPort: string;
      toNode: number;
      toPort: string;
    }[];
    /** Description of what the diagram demonstrates */
    description: string;
  };
}

export interface NodeDefinition {
  type: NodeType;
  category: NodeCategory;
  label: string;
  description: string;
  color: string;
  inputs: Omit<NodePort, 'id'>[];
  outputs: Omit<NodePort, 'id'>[];
  defaultData: Record<string, any>;
  deprecated?: boolean;
  serverOnly?: boolean;
  clientOnly?: boolean;
  uiOnly?: boolean;
  context?: ('SERVER' | 'CLIENT' | 'UI')[];  // Which contexts this node requires
  tags?: string[];
  /** Extended documentation for in-app reference */
  documentation?: NodeDocumentation;
}

// Category metadata for UI organization
export interface CategoryInfo {
  id: NodeCategory;
  label: string;
  color: string;        // Hex color for node indicators
  textClass: string;    // Tailwind text color class
  description: string;
}

export const CATEGORY_INFO: CategoryInfo[] = [
  { id: 'init', label: 'Init', color: '#4A90E2', textClass: 'text-blue-400', description: 'Script initialization for Server, Client, and UI contexts' },
  { id: 'flow', label: 'Flow', color: '#4A90E2', textClass: 'text-purple-400', description: 'Program flow control: sequence, branch, loops, switch, delay, wait' },
  { id: 'gamemodes', label: 'Gamemodes', color: '#C0392B', textClass: 'text-red-400', description: 'Register and configure gamemodes' },
  { id: 'callbacks', label: 'Callbacks', color: '#8E44AD', textClass: 'text-amber-400', description: 'Register event callbacks' },
  { id: 'entity', label: 'Entity', color: '#27AE60', textClass: 'text-blue-400', description: 'Entity manipulation: get/set origin, health, team, etc.' },
  { id: 'entity-creation', label: 'Entity Creation', color: '#27AE60', textClass: 'text-green-400', description: 'Create entities, props, triggers, and special objects' },
  { id: 'entity-props', label: 'Entity Props', color: '#27AE60', textClass: 'text-teal-400', description: 'Script struct properties: player.p, entity.e, npc.ai, weapon.w, etc.' },
  { id: 'npc', label: 'NPC/AI', color: '#E67E22', textClass: 'text-orange-400', description: 'NPC creation, AI settings, and behavior' },
  { id: 'weapons', label: 'Weapons', color: '#E67E22', textClass: 'text-red-400', description: 'Weapon operations, modifications, and settings' },
  { id: 'status-effects', label: 'Status Effects', color: '#9B59B6', textClass: 'text-green-400', description: 'Status effects, buffs, and debuffs' },
  { id: 'vfx', label: 'VFX', color: '#F39C12', textClass: 'text-pink-400', description: 'Particle effects and visual FX' },
  { id: 'audio', label: 'Audio', color: '#1ABC9C', textClass: 'text-cyan-400', description: 'Sound effects and audio' },
  { id: 'damage', label: 'Damage', color: '#E74C3C', textClass: 'text-orange-400', description: 'Damage system, traces, and hit detection' },
  { id: 'ui', label: 'UI', color: '#3498DB', textClass: 'text-indigo-400', description: 'UI elements and RUI system' },
  { id: 'math', label: 'Math', color: '#95A5A6', textClass: 'text-emerald-400', description: 'Math, vector, and logic operations' },
  { id: 'string', label: 'String', color: '#F39C12', textClass: 'text-yellow-400', description: 'String manipulation and formatting' },
  { id: 'structures', label: 'Structures', color: '#16A085', textClass: 'text-teal-400', description: 'Structs, enums, and type definitions' },
  { id: 'variables', label: 'Variables', color: '#3498DB', textClass: 'text-blue-400', description: 'Variable operations: Get, Set, Declare, Make Global/Local' },
  { id: 'collections', label: 'Collections', color: '#2ECC71', textClass: 'text-green-400', description: 'Arrays and tables' },
  { id: 'debug', label: 'Debug', color: '#E74C3C', textClass: 'text-red-400', description: 'Debug nodes: Print, Assert, Warning' },
  { id: 'utilities', label: 'Utilities', color: '#F39C12', textClass: 'text-yellow-400', description: 'Utility functions: Time, Precache, Portals, Entity getters' },
  { id: 'survival', label: 'Survival', color: '#27AE60', textClass: 'text-green-400', description: 'Survival mode loot and inventory' },
  { id: 'passives', label: 'Passives', color: '#9B59B6', textClass: 'text-purple-400', description: 'Passive ability system' },
  { id: 'character', label: 'Character', color: '#3498DB', textClass: 'text-blue-400', description: 'Character abilities and classes' },
];

// ==================== NODE TEMPLATES ====================

/** A template category for organizing node templates */
export type TemplateCategory =
  | 'built-in'
  | 'weapon-setup'
  | 'npc-spawning'
  | 'gamemode'
  | 'callbacks'
  | 'ui-patterns'
  | 'custom';

/** Template metadata for display and organization */
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon?: string; // Optional icon name
  tags?: string[];
  createdAt: number;
  isBuiltIn?: boolean;
}

/** A saved node template containing nodes and their connections */
export interface NodeTemplate extends TemplateInfo {
  /** The nodes in this template (positions are relative to template origin) */
  nodes: {
    type: NodeType;
    label: string;
    relativePosition: { x: number; y: number };
    data: Record<string, any>;
    // Store port configurations for connection mapping
    inputs: Omit<NodePort, 'id'>[];
    outputs: Omit<NodePort, 'id'>[];
  }[];
  /** Connections between nodes (using indices into nodes array) */
  connections: {
    fromNodeIndex: number;
    fromPortIndex: number;
    toNodeIndex: number;
    toPortIndex: number;
  }[];
}

/** Category metadata for template organization */
export interface TemplateCategoryInfo {
  id: TemplateCategory;
  label: string;
  color: string;
  description: string;
}

export const TEMPLATE_CATEGORY_INFO: TemplateCategoryInfo[] = [
  { id: 'built-in', label: 'Built-in', color: '#8B5CF6', description: 'Pre-made templates included with the editor' },
  { id: 'weapon-setup', label: 'Weapons', color: '#E67E22', description: 'Weapon initialization and configuration patterns' },
  { id: 'npc-spawning', label: 'NPC Spawning', color: '#27AE60', description: 'NPC creation and AI setup patterns' },
  { id: 'gamemode', label: 'Gamemodes', color: '#C0392B', description: 'Gamemode registration and configuration' },
  { id: 'callbacks', label: 'Callbacks', color: '#8E44AD', description: 'Event callback registration patterns' },
  { id: 'ui-patterns', label: 'UI Patterns', color: '#3498DB', description: 'UI initialization and RUI patterns' },
  { id: 'custom', label: 'Custom', color: '#95A5A6', description: 'Your custom saved templates' },
];
