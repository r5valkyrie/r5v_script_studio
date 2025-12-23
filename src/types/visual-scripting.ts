export type NodeCategory = 'core-flow' | 'game' | 'mods' | 'data' | 'actions' | 'events';

export type NodeType =
  // Core Flow
  | 'init-server'
  | 'init-client'
  | 'init-ui'
  | 'event'
  | 'sequence'
  | 'branch'
  | 'delay'
  | 'loop'
  // Weapon Callbacks
  | 'on-weapon-activate'
  | 'on-weapon-primary-attack'
  | 'on-projectile-collision'
  // Game
  | 'is-valid'
  | 'get-owner'
  | 'thread'
  | 'wait'
  | 'give-weapon'
  | 'emit-sound'
  | 'play-sound'
  | 'set-health'
  // Mods
  | 'precache-weapon'
  | 'add-callback'
  | 'weapon-has-mod'
  | 'weapon-add-mod'
  | 'register-custom-damage'
  | 'register-hopup'
  // Data
  | 'string'
  | 'float'
  | 'int'
  | 'bool'
  | 'variable'
  | 'vector'
  // Actions
  | 'give-weapon-action'
  | 'play-sound-action';

export interface NodePort {
  id: string;
  label: string;
  type: 'exec' | 'data';
  dataType?: 'string' | 'number' | 'boolean' | 'entity' | 'weapon' | 'any';
  isInput: boolean;
}

export interface ScriptNode {
  id: string;
  type: NodeType;
  category: NodeCategory;
  label: string;
  position: { x: number; y: number };
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

export interface NodeDefinition {
  type: NodeType;
  category: NodeCategory;
  label: string;
  description: string;
  color: string;
  inputs: Omit<NodePort, 'id'>[];
  outputs: Omit<NodePort, 'id'>[];
  defaultData: Record<string, any>;
}
