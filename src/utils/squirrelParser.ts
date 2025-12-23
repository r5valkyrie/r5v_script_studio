export interface WeaponProperty {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
  line?: number;
}

export interface SquirrelWeaponData {
  properties: WeaponProperty[];
  functions: string[];
  isWeaponFile: boolean;
}

export function parseSquirrelWeapon(content: string): SquirrelWeaponData {
  const data: SquirrelWeaponData = {
    properties: [],
    functions: [],
    isWeaponFile: false,
  };

  const lines = content.split('\n');

  // Common weapon property patterns
  const weaponPropertyPatterns = [
    // weapon.SetWeaponPrimaryClipCount( 8 )
    /weapon\.Set(\w+)\s*\(\s*([^)]+)\s*\)/i,
    // weapon.damage_near_value <- 100
    /weapon\.(\w+)\s*<-\s*(.+)/i,
    // const WEAPON_DAMAGE = 100
    /const\s+WEAPON_(\w+)\s*=\s*(.+)/i,
  ];

  const weaponKeywords = [
    'weapon', 'damage', 'ammo', 'fire', 'reload', 'projectile',
    'clip', 'spread', 'recoil', 'attack', 'primary', 'secondary'
  ];

  // Check if it's a weapon file
  const contentLower = content.toLowerCase();
  data.isWeaponFile = weaponKeywords.some(keyword => contentLower.includes(keyword));

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }

    // Extract weapon properties
    for (const pattern of weaponPropertyPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const propName = match[1];
        let propValue = match[2].trim();

        // Remove trailing semicolon or comments
        propValue = propValue.replace(/[;,].*$/, '').trim();
        propValue = propValue.replace(/\/\/.*$/, '').trim();

        // Determine type and parse value
        let value: string | number | boolean = propValue;
        let type: 'string' | 'number' | 'boolean' = 'string';

        if (propValue === 'true' || propValue === 'false') {
          value = propValue === 'true';
          type = 'boolean';
        } else if (!isNaN(Number(propValue)) && propValue !== '') {
          value = Number(propValue);
          type = 'number';
        } else if (propValue.startsWith('"') && propValue.endsWith('"')) {
          value = propValue.slice(1, -1);
          type = 'string';
        }

        data.properties.push({
          name: propName,
          value,
          type,
          line: index + 1,
        });
      }
    }

    // Extract function names
    const funcMatch = trimmed.match(/function\s+(\w+)/);
    if (funcMatch) {
      data.functions.push(funcMatch[1]);
    }
  });

  return data;
}

// Parse generic Squirrel properties for non-weapon files
export interface SquirrelData {
  functions: Array<{ name: string; params: string[]; line: number }>;
  constants: Record<string, any>;
  variables: Record<string, any>;
}

export function parseSquirrel(content: string): SquirrelData {
  const data: SquirrelData = {
    functions: [],
    constants: {},
    variables: {},
  };

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//')) return;

    // Parse functions
    const funcMatch = trimmed.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (funcMatch) {
      const params = funcMatch[2]
        .split(',')
        .map(p => p.trim())
        .filter(p => p);

      data.functions.push({
        name: funcMatch[1],
        params,
        line: index + 1,
      });
    }

    // Parse constants
    const constMatch = trimmed.match(/const\s+(\w+)\s*=\s*(.+)/);
    if (constMatch) {
      let value = constMatch[2].replace(/[;,].*$/, '').trim();

      if (value === 'true' || value === 'false') {
        data.constants[constMatch[1]] = value === 'true';
      } else if (!isNaN(Number(value))) {
        data.constants[constMatch[1]] = Number(value);
      } else {
        data.constants[constMatch[1]] = value;
      }
    }

    // Parse global variables
    const varMatch = trimmed.match(/global\s+(\w+)\s*(?:<-|=)\s*(.+)/);
    if (varMatch) {
      let value = varMatch[2].replace(/[;,].*$/, '').trim();
      data.variables[varMatch[1]] = value;
    }
  });

  return data;
}

// Enhanced script structure parser for visual tree view
export interface ScriptFunction {
  name: string;
  params: Array<{ name: string; type?: string }>;
  returnType?: string;
  line: number;
  isGlobal: boolean;
  compilationBlock?: string;
}

export interface ScriptConstant {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'vector' | 'other';
  line: number;
  compilationBlock?: string;
}

export interface ScriptGlobalDeclaration {
  name: string;
  type: 'function' | 'variable';
  line: number;
  compilationBlock?: string;
}

export interface CompilationBlock {
  condition: string; // e.g., "SERVER", "CLIENT", "UI"
  startLine: number;
  endLine: number;
  children: CompilationBlock[];
}

export interface SquirrelScriptStructure {
  functions: ScriptFunction[];
  constants: ScriptConstant[];
  globalDeclarations: ScriptGlobalDeclaration[];
  compilationBlocks: CompilationBlock[];
  fileType: 'weapon' | 'ability' | 'ui' | 'shared' | 'other';
}

export function parseSquirrelScript(content: string): SquirrelScriptStructure {
  const structure: SquirrelScriptStructure = {
    functions: [],
    constants: [],
    globalDeclarations: [],
    compilationBlocks: [],
    fileType: 'other',
  };

  const lines = content.split('\n');
  let currentCompilationBlock: string | undefined;
  const blockStack: Array<{ condition: string; startLine: number }> = [];

  // Determine file type from content
  const contentLower = content.toLowerCase();
  if (contentLower.includes('weapon')) structure.fileType = 'weapon';
  else if (contentLower.includes('ability')) structure.fileType = 'ability';
  else if (contentLower.includes('#if ui')) structure.fileType = 'ui';
  else if (contentLower.includes('#if server') && contentLower.includes('#if client')) structure.fileType = 'shared';

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNumber = index + 1;

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) return;

    // Parse compilation blocks (#if, #endif)
    const ifMatch = trimmed.match(/^#if\s+(\w+(?:\s*\|\|\s*\w+)?)/);
    if (ifMatch) {
      const condition = ifMatch[1].trim();
      blockStack.push({ condition, startLine: lineNumber });
      currentCompilationBlock = condition;
      return;
    }

    if (trimmed === '#endif') {
      const block = blockStack.pop();
      if (block && blockStack.length === 0) {
        structure.compilationBlocks.push({
          condition: block.condition,
          startLine: block.startLine,
          endLine: lineNumber,
          children: [],
        });
        currentCompilationBlock = undefined;
      } else if (block && blockStack.length > 0) {
        currentCompilationBlock = blockStack[blockStack.length - 1].condition;
      }
      return;
    }

    // Parse global declarations
    const globalFuncMatch = trimmed.match(/^global\s+function\s+(\w+)/);
    if (globalFuncMatch) {
      structure.globalDeclarations.push({
        name: globalFuncMatch[1],
        type: 'function',
        line: lineNumber,
        compilationBlock: currentCompilationBlock,
      });
      return;
    }

    // Parse function definitions
    const funcMatch = trimmed.match(/^(?:void|var|bool|int|float|string|entity|array|table)?\s*function\s+(\w+)\s*\(([^)]*)\)/);
    if (funcMatch) {
      const returnTypeMatch = trimmed.match(/^(void|var|bool|int|float|string|entity|array|table)\s+function/);
      const params = funcMatch[2]
        .split(',')
        .map(p => {
          const paramTrimmed = p.trim();
          if (!paramTrimmed) return null;

          const paramMatch = paramTrimmed.match(/(?:(entity|int|float|bool|string|array|table|var)\s+)?(\w+)/);
          if (paramMatch) {
            return {
              name: paramMatch[2],
              type: paramMatch[1] || undefined,
            };
          }
          return { name: paramTrimmed };
        })
        .filter(p => p !== null) as Array<{ name: string; type?: string }>;

      structure.functions.push({
        name: funcMatch[1],
        params,
        returnType: returnTypeMatch ? returnTypeMatch[1] : undefined,
        line: lineNumber,
        isGlobal: structure.globalDeclarations.some(g => g.name === funcMatch[1]),
        compilationBlock: currentCompilationBlock,
      });
      return;
    }

    // Parse constants
    const constMatch = trimmed.match(/^(?:global\s+)?const\s+(?:string|int|float|bool|vector)?\s*(\w+)\s*=\s*(.+)/);
    if (constMatch) {
      let value = constMatch[2].replace(/\/\/.*$/, '').trim();
      let type: ScriptConstant['type'] = 'other';

      if (value === 'true' || value === 'false') {
        type = 'boolean';
        value = value === 'true';
      } else if (value.startsWith('"') && value.endsWith('"')) {
        type = 'string';
        value = value.slice(1, -1);
      } else if (value.startsWith('<') && value.includes(',')) {
        type = 'vector';
      } else if (!isNaN(Number(value)) && value !== '') {
        type = 'number';
        value = Number(value);
      }

      structure.constants.push({
        name: constMatch[1],
        value,
        type,
        line: lineNumber,
        compilationBlock: currentCompilationBlock,
      });
    }
  });

  return structure;
}
