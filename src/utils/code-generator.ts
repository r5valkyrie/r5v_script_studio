import type { ScriptNode, NodeConnection } from '../types/visual-scripting';

interface ThreadFunction {
  name: string;
  nodeId: string;
  outputPortId: string;
}

interface CodeGenContext {
  nodes: ScriptNode[];
  connections: NodeConnection[];
  nodeMap: Map<string, ScriptNode>;
  visitedNodes: Set<string>;
  indentLevel: number;
  variables: Map<string, string>;
  varCounter: number;
  threadFunctions: ThreadFunction[];
}

function getInputConnections(ctx: CodeGenContext, nodeId: string, portId: string): NodeConnection[] {
  return ctx.connections.filter(c => c.to.nodeId === nodeId && c.to.portId === portId);
}

function getOutputConnections(ctx: CodeGenContext, nodeId: string, portId: string): NodeConnection[] {
  return ctx.connections.filter(c => c.from.nodeId === nodeId && c.from.portId === portId);
}

function indent(ctx: CodeGenContext): string {
  return '    '.repeat(ctx.indentLevel);
}

function getVarName(ctx: CodeGenContext, prefix: string = 'v'): string {
  return `${prefix}${ctx.varCounter++}`;
}

function formatLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return `[${value.map(formatLiteral).join(', ')}]`;
  }
  return String(value);
}

function getInputValue(ctx: CodeGenContext, node: ScriptNode, portId: string): string {
  const inputConns = getInputConnections(ctx, node.id, portId);

  if (inputConns.length > 0) {
    const conn = inputConns[0];
    const varKey = `${conn.from.nodeId}:${conn.from.portId}`;
    const varVal = ctx.variables.get(varKey);
    if (varVal) return varVal;

    // Try to generate the source node first if it's a data node
    const sourceNode = ctx.nodeMap.get(conn.from.nodeId);
    if (sourceNode && !ctx.visitedNodes.has(sourceNode.id)) {
      generateNodeCode(ctx, sourceNode);
      const newVal = ctx.variables.get(varKey);
      if (newVal) return newVal;
    }
    return 'null';
  }

  // Check node data for default value
  const port = node.inputs.find(p => p.id === portId);
  if (port) {
    // Try exact match with data keys
    for (const [key, val] of Object.entries(node.data)) {
      const keyLower = key.toLowerCase();
      const labelLower = port.label.toLowerCase().replace(/\s+/g, '');
      if (keyLower === labelLower || labelLower.includes(keyLower)) {
        if ((port.dataType === 'asset' || port.dataType === 'function') && typeof val === 'string') {
          return val;
        }
        return formatLiteral(val);
      }
    }
  }

  return 'null';
}

function generateNodeCode(ctx: CodeGenContext, node: ScriptNode): string {
  const lines: string[] = [];
  const ind = indent(ctx);

  // Helper to follow exec output
  const followExec = (portId: string) => {
    const conns = getOutputConnections(ctx, node.id, portId);
    for (const conn of conns) {
      const code = generateFromNode(ctx, conn.to.nodeId);
      if (code) lines.push(code);
    }
  };

  switch (node.type) {
    // ==================== CORE FLOW ====================
    case 'sequence': {
      const execOuts = node.outputs.filter(p => p.type === 'exec');
      for (const out of execOuts) {
        followExec(out.id);
      }
      break;
    }

    case 'branch': {
      const condition = getInputValue(ctx, node, 'input_1');
      lines.push(`${ind}if (${condition})`);
      lines.push(`${ind}{`);
      ctx.indentLevel++;
      followExec('output_0'); // True
      ctx.indentLevel--;
      lines.push(`${ind}}`);

      const falseConns = getOutputConnections(ctx, node.id, 'output_1');
      if (falseConns.length > 0) {
        lines.push(`${ind}else`);
        lines.push(`${ind}{`);
        ctx.indentLevel++;
        followExec('output_1'); // False
        ctx.indentLevel--;
        lines.push(`${ind}}`);
      }
      break;
    }

    case 'delay':
    case 'wait': {
      const duration = getInputValue(ctx, node, 'input_1');
      lines.push(`${ind}wait ${duration}`);
      followExec('output_0');
      break;
    }

    case 'loop-for': {
      const start = getInputValue(ctx, node, 'input_1');
      const end = getInputValue(ctx, node, 'input_2');
      const step = getInputValue(ctx, node, 'input_3');
      const indexVar = getVarName(ctx, 'i');
      ctx.variables.set(`${node.id}:output_1`, indexVar);

      lines.push(`${ind}for (local ${indexVar} = ${start}; ${indexVar} < ${end}; ${indexVar} += ${step})`);
      lines.push(`${ind}{`);
      ctx.indentLevel++;
      followExec('output_0'); // Loop body
      ctx.indentLevel--;
      lines.push(`${ind}}`);
      followExec('output_2'); // Done
      break;
    }

    case 'loop-foreach': {
      const array = getInputValue(ctx, node, 'input_1');
      const elemVar = getVarName(ctx, 'elem');
      const indexVar = getVarName(ctx, 'idx');
      ctx.variables.set(`${node.id}:output_1`, elemVar);
      ctx.variables.set(`${node.id}:output_2`, indexVar);

      lines.push(`${ind}foreach (${indexVar}, ${elemVar} in ${array})`);
      lines.push(`${ind}{`);
      ctx.indentLevel++;
      followExec('output_0'); // Loop body
      ctx.indentLevel--;
      lines.push(`${ind}}`);
      followExec('output_3'); // Done
      break;
    }

    case 'loop-while': {
      const condition = getInputValue(ctx, node, 'input_1');
      lines.push(`${ind}while (${condition})`);
      lines.push(`${ind}{`);
      ctx.indentLevel++;
      followExec('output_0'); // Loop body
      ctx.indentLevel--;
      lines.push(`${ind}}`);
      followExec('output_1'); // Done
      break;
    }

    case 'thread': {
      const funcName = `__Thread_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      // Register thread function to be generated later
      ctx.threadFunctions.push({
        name: funcName,
        nodeId: node.id,
        outputPortId: 'output_0', // Thread body output
      });
      lines.push(`${ind}thread ${funcName}()`);
      followExec('output_1'); // Continue
      break;
    }

    case 'call-function': {
      const funcName = getInputValue(ctx, node, 'input_1');
      lines.push(`${ind}${funcName}()`);
      followExec('output_0');
      break;
    }

    case 'return': {
      lines.push(`${ind}return`);
      break;
    }

    case 'reroute-exec': {
      followExec('output_0');
      break;
    }

    // ==================== DAMAGE ====================
    case 'entity-take-damage': {
      const entity = getInputValue(ctx, node, 'input_1');
      const attacker = getInputValue(ctx, node, 'input_2');
      const inflictor = getInputValue(ctx, node, 'input_3');
      const damage = getInputValue(ctx, node, 'input_4');
      const damageType = getInputValue(ctx, node, 'input_5');
      lines.push(`${ind}${entity}.TakeDamage(${damage}, ${attacker}, ${inflictor}, { damageType = ${damageType} })`);
      followExec('output_0');
      break;
    }

    case 'radius-damage': {
      const origin = getInputValue(ctx, node, 'input_1');
      const attacker = getInputValue(ctx, node, 'input_2');
      const inflictor = getInputValue(ctx, node, 'input_3');
      const damage = getInputValue(ctx, node, 'input_4');
      const radius = getInputValue(ctx, node, 'input_5');
      lines.push(`${ind}RadiusDamage(${origin}, ${attacker}, ${inflictor}, ${damage}, ${radius})`);
      followExec('output_0');
      break;
    }

    // ==================== ENTITY ====================
    case 'get-origin': {
      const entity = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'origin');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${entity}.GetOrigin()`);
      break;
    }

    case 'set-origin': {
      const entity = getInputValue(ctx, node, 'input_1');
      const origin = getInputValue(ctx, node, 'input_2');
      lines.push(`${ind}${entity}.SetOrigin(${origin})`);
      followExec('output_0');
      break;
    }

    case 'get-velocity': {
      const entity = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'velocity');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${entity}.GetVelocity()`);
      break;
    }

    case 'set-velocity': {
      const entity = getInputValue(ctx, node, 'input_1');
      const velocity = getInputValue(ctx, node, 'input_2');
      lines.push(`${ind}${entity}.SetVelocity(${velocity})`);
      followExec('output_0');
      break;
    }

    case 'get-health': {
      const entity = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'health');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${entity}.GetHealth()`);
      break;
    }

    case 'set-health': {
      const entity = getInputValue(ctx, node, 'input_1');
      const health = getInputValue(ctx, node, 'input_2');
      lines.push(`${ind}${entity}.SetHealth(${health})`);
      followExec('output_0');
      break;
    }

    case 'is-valid': {
      const entity = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'isValid');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = IsValid(${entity})`);
      break;
    }

    case 'is-alive': {
      const entity = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'isAlive');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = IsAlive(${entity})`);
      break;
    }

    case 'kill-entity': {
      const entity = getInputValue(ctx, node, 'input_1');
      lines.push(`${ind}${entity}.Kill()`);
      followExec('output_0');
      break;
    }

    case 'get-weapon-owner': {
      const weapon = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'owner');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${weapon}.GetWeaponOwner()`);
      break;
    }

    case 'register-mod-weapon': {
      const className = getInputValue(ctx, node, 'input_1');
      const name = getInputValue(ctx, node, 'input_2');
      const hudIcon = getInputValue(ctx, node, 'input_3');
      const weaponType = getInputValue(ctx, node, 'input_4');
      const pickupSound1p = getInputValue(ctx, node, 'input_5');
      const pickupSound3p = getInputValue(ctx, node, 'input_6');
      const tier = getInputValue(ctx, node, 'input_7');
      const baseMods = getInputValue(ctx, node, 'input_8');
      const supportedAttachments = getInputValue(ctx, node, 'input_9');
      const lowWeaponChance = getInputValue(ctx, node, 'input_10');
      const medWeaponChance = getInputValue(ctx, node, 'input_11');
      const highWeaponChance = getInputValue(ctx, node, 'input_12');
      const registerInLoot = getInputValue(ctx, node, 'input_13');

      const dataVar = getVarName(ctx, 'weaponData');
      lines.push(`${ind}CustomWeaponData ${dataVar}`);
      lines.push(`${ind}${dataVar}.className = ${className}`);
      lines.push(`${ind}${dataVar}.name = ${name}`);
      lines.push(`${ind}${dataVar}.hudIcon = ${hudIcon}`);
      lines.push(`${ind}${dataVar}.weaponType = ${weaponType}`);
      lines.push(`${ind}${dataVar}.pickupSound1p = ${pickupSound1p}`);
      lines.push(`${ind}${dataVar}.pickupSound3p = ${pickupSound3p}`);
      lines.push(`${ind}${dataVar}.tier = ${tier}`);
      lines.push(`${ind}${dataVar}.baseMods = ${baseMods}`);
      lines.push(`${ind}${dataVar}.supportedAttachments = ${supportedAttachments}`);
      lines.push(`${ind}${dataVar}.lowWeaponChance = ${lowWeaponChance}`);
      lines.push(`${ind}${dataVar}.medWeaponChance = ${medWeaponChance}`);
      lines.push(`${ind}${dataVar}.highWeaponChance = ${highWeaponChance}`);
      lines.push(`${ind}RegisterModWeapon(${dataVar}, ${registerInLoot})`);
      followExec('output_0');
      break;
    }

    // ==================== WEAPONS ====================
    case 'get-active-weapon': {
      const player = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'weapon');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${player}.GetActiveWeapon()`);
      break;
    }

    case 'fire-weapon-bullet': {
      const weapon = getInputValue(ctx, node, 'input_1');
      lines.push(`${ind}${weapon}.FireWeaponBullet()`);
      followExec('output_0');
      break;
    }

    // ==================== AUDIO ====================
    case 'emit-sound-on-entity': {
      const entity = getInputValue(ctx, node, 'input_1');
      const sound = getInputValue(ctx, node, 'input_2');
      lines.push(`${ind}EmitSoundOnEntity(${entity}, ${sound})`);
      followExec('output_0');
      break;
    }

    // ==================== PARTICLES ====================
    case 'start-particle-on-entity': {
      const entity = getInputValue(ctx, node, 'input_1');
      const effect = getInputValue(ctx, node, 'input_2');
      const attachment = getInputValue(ctx, node, 'input_3');
      const resultVar = getVarName(ctx, 'fxHandle');
      ctx.variables.set(`${node.id}:output_1`, resultVar);
      lines.push(`${ind}local ${resultVar} = StartParticleEffectOnEntity(${entity}, GetParticleSystemIndex(${effect}), FX_PATTACH_POINT_FOLLOW, ${attachment})`);
      followExec('output_0');
      break;
    }

    // ==================== MATH ====================
    case 'vector-create': {
      const x = getInputValue(ctx, node, 'input_0');
      const y = getInputValue(ctx, node, 'input_1');
      const z = getInputValue(ctx, node, 'input_2');
      const resultVar = getVarName(ctx, 'vec');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = Vector(${x}, ${y}, ${z})`);
      break;
    }

    case 'vector-add': {
      const a = getInputValue(ctx, node, 'input_0');
      const b = getInputValue(ctx, node, 'input_1');
      const resultVar = getVarName(ctx, 'vec');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${a} + ${b}`);
      break;
    }

    case 'vector-normalize': {
      const v = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'normalized');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = Normalize(${v})`);
      break;
    }

    case 'math-add': {
      const a = getInputValue(ctx, node, 'input_0');
      const b = getInputValue(ctx, node, 'input_1');
      const resultVar = getVarName(ctx, 'result');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${a} + ${b}`);
      break;
    }

    case 'math-multiply': {
      const a = getInputValue(ctx, node, 'input_0');
      const b = getInputValue(ctx, node, 'input_1');
      const resultVar = getVarName(ctx, 'result');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${a} * ${b}`);
      break;
    }

    case 'math-random-float': {
      const min = getInputValue(ctx, node, 'input_0');
      const max = getInputValue(ctx, node, 'input_1');
      const resultVar = getVarName(ctx, 'rand');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = RandomFloatRange(${min}, ${max})`);
      break;
    }

    // ==================== DATA ====================
    case 'const-string': {
      const value = node.data.value || '';
      ctx.variables.set(`${node.id}:output_0`, `"${value}"`);
      break;
    }

    case 'function-ref': {
      const value = node.data.functionName || 'MyFunction';
      ctx.variables.set(`${node.id}:output_0`, value);
      break;
    }

    case 'const-asset': {
      const value = node.data.value || '$""';
      ctx.variables.set(`${node.id}:output_0`, value);
      break;
    }

    case 'const-float':
    case 'const-int': {
      const value = node.data.value ?? 0;
      ctx.variables.set(`${node.id}:output_0`, String(value));
      break;
    }

    case 'const-bool': {
      const value = node.data.value ?? false;
      ctx.variables.set(`${node.id}:output_0`, value ? 'true' : 'false');
      break;
    }

    case 'const-vector': {
      const x = node.data.x ?? 0;
      const y = node.data.y ?? 0;
      const z = node.data.z ?? 0;
      ctx.variables.set(`${node.id}:output_0`, `Vector(${x}, ${y}, ${z})`);
      break;
    }

    case 'reroute': {
      const inputValue = getInputValue(ctx, node, 'input_0');
      ctx.variables.set(`${node.id}:output_0`, inputValue);
      break;
    }

    case 'array-create': {
      const resultVar = getVarName(ctx, 'arr');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = []`);
      break;
    }

    case 'array-append': {
      const array = getInputValue(ctx, node, 'input_1');
      const element = getInputValue(ctx, node, 'input_2');
      lines.push(`${ind}${array}.append(${element})`);
      ctx.variables.set(`${node.id}:output_1`, array);
      followExec('output_0');
      break;
    }

    case 'array-get': {
      const array = getInputValue(ctx, node, 'input_0');
      const index = getInputValue(ctx, node, 'input_1');
      const resultVar = getVarName(ctx, 'elem');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${array}[${index}]`);
      break;
    }

    case 'array-length': {
      const array = getInputValue(ctx, node, 'input_0');
      const resultVar = getVarName(ctx, 'len');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = ${array}.len()`);
      break;
    }

    // ==================== UTILITIES ====================
    case 'print': {
      const message = getInputValue(ctx, node, 'input_1');
      lines.push(`${ind}print(${message})`);
      followExec('output_0');
      break;
    }

    case 'get-all-players': {
      const resultVar = getVarName(ctx, 'players');
      ctx.variables.set(`${node.id}:output_0`, resultVar);
      lines.push(`${ind}local ${resultVar} = GetPlayerArray()`);
      break;
    }

    // ==================== COMPARISONS ====================
    case 'compare-equal': {
      const a = getInputValue(ctx, node, 'input_0');
      const b = getInputValue(ctx, node, 'input_1');
      ctx.variables.set(`${node.id}:output_0`, `(${a} == ${b})`);
      break;
    }

    case 'compare-greater': {
      const a = getInputValue(ctx, node, 'input_0');
      const b = getInputValue(ctx, node, 'input_1');
      ctx.variables.set(`${node.id}:output_0`, `(${a} > ${b})`);
      break;
    }

    case 'compare-less': {
      const a = getInputValue(ctx, node, 'input_0');
      const b = getInputValue(ctx, node, 'input_1');
      ctx.variables.set(`${node.id}:output_0`, `(${a} < ${b})`);
      break;
    }

    default: {
      lines.push(`${ind}// TODO: ${node.type} - ${node.label}`);
      const execOuts = node.outputs.filter(p => p.type === 'exec');
      if (execOuts.length > 0) {
        followExec(execOuts[0].id);
      }
    }
  }

  return lines.filter(l => l.trim()).join('\n');
}

function generateFromNode(ctx: CodeGenContext, nodeId: string): string {
  if (ctx.visitedNodes.has(nodeId)) return '';

  const node = ctx.nodeMap.get(nodeId);
  if (!node) return '';

  ctx.visitedNodes.add(nodeId);
  return generateNodeCode(ctx, node);
}

// Generate thread function body
function generateThreadFunction(ctx: CodeGenContext, threadFunc: ThreadFunction): string {
  const lines: string[] = [];

  lines.push(`void function ${threadFunc.name}()`);
  lines.push('{');

  ctx.indentLevel = 1;

  // Generate the thread body from the output port
  const bodyConns = getOutputConnections(ctx, threadFunc.nodeId, threadFunc.outputPortId);
  for (const conn of bodyConns) {
    // Don't skip visited - we need to regenerate for thread context
    const node = ctx.nodeMap.get(conn.to.nodeId);
    if (node) {
      const code = generateNodeCode(ctx, node);
      if (code) lines.push(code);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

export function generateCode(nodes: ScriptNode[], connections: NodeConnection[]): string {
  if (nodes.length === 0) {
    return '// No nodes in the visual script\n// Add nodes from the palette to get started';
  }

  const ctx: CodeGenContext = {
    nodes,
    connections,
    nodeMap: new Map(nodes.map(n => [n.id, n])),
    visitedNodes: new Set(),
    indentLevel: 0,
    variables: new Map(),
    varCounter: 0,
    threadFunctions: [],
  };

  const output: string[] = [];

  output.push('// Generated by R5V Mod Studio Visual Scripting');
  output.push('// https://github.com/r5valkyrie/r5v_mod_studio');
  output.push('');
  output.push('global function CodeCallback_ModInit');
  output.push('');

  const serverInit = nodes.find(n => n.type === 'init-server');
  const clientInit = nodes.find(n => n.type === 'init-client');
  const uiInit = nodes.find(n => n.type === 'init-ui');

  if (serverInit) {
    output.push('#if SERVER');
    output.push(`void function ${serverInit.data.functionName || 'CodeCallback_ModInit'}()`);
    output.push('{');
    ctx.indentLevel = 1;
    ctx.visitedNodes.clear();
    ctx.variables.clear();
    ctx.varCounter = 0;
    ctx.threadFunctions = [];
    ctx.visitedNodes.add(serverInit.id);

    const execConns = getOutputConnections(ctx, serverInit.id, 'output_0');
    for (const conn of execConns) {
      const code = generateFromNode(ctx, conn.to.nodeId);
      if (code) output.push(code);
    }

    output.push('}');

    // Generate thread functions for this context
    for (const threadFunc of ctx.threadFunctions) {
      output.push('');
      output.push(generateThreadFunction(ctx, threadFunc));
    }

    output.push('#endif');
    output.push('');
  }

  if (clientInit) {
    output.push('#if CLIENT');
    output.push(`void function ${clientInit.data.functionName || 'ClientCodeCallback_ModInit'}()`);
    output.push('{');
    ctx.indentLevel = 1;
    ctx.visitedNodes.clear();
    ctx.variables.clear();
    ctx.varCounter = 0;
    ctx.threadFunctions = [];
    ctx.visitedNodes.add(clientInit.id);

    const execConns = getOutputConnections(ctx, clientInit.id, 'output_0');
    for (const conn of execConns) {
      const code = generateFromNode(ctx, conn.to.nodeId);
      if (code) output.push(code);
    }

    output.push('}');

    for (const threadFunc of ctx.threadFunctions) {
      output.push('');
      output.push(generateThreadFunction(ctx, threadFunc));
    }

    output.push('#endif');
    output.push('');
  }

  if (uiInit) {
    output.push('#if UI');
    output.push(`void function ${uiInit.data.functionName || 'UICodeCallback_ModInit'}()`);
    output.push('{');
    ctx.indentLevel = 1;
    ctx.visitedNodes.clear();
    ctx.variables.clear();
    ctx.varCounter = 0;
    ctx.threadFunctions = [];
    ctx.visitedNodes.add(uiInit.id);

    const execConns = getOutputConnections(ctx, uiInit.id, 'output_0');
    for (const conn of execConns) {
      const code = generateFromNode(ctx, conn.to.nodeId);
      if (code) output.push(code);
    }

    output.push('}');

    for (const threadFunc of ctx.threadFunctions) {
      output.push('');
      output.push(generateThreadFunction(ctx, threadFunc));
    }

    output.push('#endif');
    output.push('');
  }

  // Handle standalone event nodes
  const eventNodes = nodes.filter(n =>
    n.category === 'events' &&
    !ctx.visitedNodes.has(n.id)
  );

  for (const eventNode of eventNodes) {
    ctx.visitedNodes.clear();
    ctx.variables.clear();
    ctx.varCounter = 0;
    ctx.threadFunctions = [];

    const eventFuncName = eventNode.data.functionName || `${eventNode.type.replace(/-/g, '_')}_handler`;
    output.push(`// Event: ${eventNode.label}`);
    output.push(`void function ${eventFuncName}()`);
    output.push('{');
    ctx.indentLevel = 1;
    ctx.visitedNodes.add(eventNode.id);

    const execConns = getOutputConnections(ctx, eventNode.id, 'output_0');
    for (const conn of execConns) {
      const code = generateFromNode(ctx, conn.to.nodeId);
      if (code) output.push(code);
    }

    output.push('}');

    for (const threadFunc of ctx.threadFunctions) {
      output.push('');
      output.push(generateThreadFunction(ctx, threadFunc));
    }

    output.push('');
  }

  return output.join('\n');
}
