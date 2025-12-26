import type { NodeTemplate, ScriptNode, NodeConnection, NodeType } from '../types/visual-scripting';
import { getNodeDefinition } from '../data/node-definitions';

const TEMPLATES_STORAGE_KEY = 'r5v_mod_studio_templates';

/**
 * Load all saved templates from localStorage
 */
export function loadTemplates(): NodeTemplate[] {
  try {
    const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as NodeTemplate[];
    }
  } catch (e) {
    console.error('Failed to load templates:', e);
  }
  return [];
}

/**
 * Save templates to localStorage
 */
export function saveTemplates(templates: NodeTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates:', e);
  }
}

/**
 * Add a new template
 */
export function addTemplate(template: NodeTemplate): NodeTemplate[] {
  const templates = loadTemplates();
  templates.push(template);
  saveTemplates(templates);
  return templates;
}

/**
 * Delete a template by ID
 */
export function deleteTemplate(templateId: string): NodeTemplate[] {
  const templates = loadTemplates().filter(t => t.id !== templateId);
  saveTemplates(templates);
  return templates;
}

/**
 * Create a template from selected nodes and connections
 */
export function createTemplateFromSelection(
  name: string,
  description: string,
  category: NodeTemplate['category'],
  selectedNodes: ScriptNode[],
  connections: NodeConnection[],
  tags: string[] = []
): NodeTemplate {
  if (selectedNodes.length === 0) {
    throw new Error('No nodes selected');
  }

  // Find the top-left corner to use as origin
  const minX = Math.min(...selectedNodes.map(n => n.position.x));
  const minY = Math.min(...selectedNodes.map(n => n.position.y));

  // Create node index map for connection mapping
  const nodeIdToIndex = new Map<string, number>();
  selectedNodes.forEach((node, index) => {
    nodeIdToIndex.set(node.id, index);
  });

  // Filter connections to only include those between selected nodes
  const relevantConnections = connections.filter(
    conn =>
      nodeIdToIndex.has(conn.from.nodeId) &&
      nodeIdToIndex.has(conn.to.nodeId)
  );

  // Create template nodes with relative positions
  const templateNodes = selectedNodes.map(node => ({
    type: node.type,
    label: node.label,
    relativePosition: {
      x: node.position.x - minX,
      y: node.position.y - minY,
    },
    data: { ...node.data },
    inputs: node.inputs.map(({ id, ...rest }) => rest),
    outputs: node.outputs.map(({ id, ...rest }) => rest),
  }));

  // Create template connections using indices
  const templateConnections = relevantConnections.map(conn => {
    const fromNode = selectedNodes.find(n => n.id === conn.from.nodeId);
    const toNode = selectedNodes.find(n => n.id === conn.to.nodeId);
    
    const fromPortIndex = fromNode?.outputs.findIndex(o => o.id === conn.from.portId) ?? 0;
    const toPortIndex = toNode?.inputs.findIndex(i => i.id === conn.to.portId) ?? 0;

    return {
      fromNodeIndex: nodeIdToIndex.get(conn.from.nodeId)!,
      fromPortIndex,
      toNodeIndex: nodeIdToIndex.get(conn.to.nodeId)!,
      toPortIndex,
    };
  });

  return {
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    category,
    tags,
    createdAt: Date.now(),
    isBuiltIn: false,
    nodes: templateNodes,
    connections: templateConnections,
  };
}

/**
 * Instantiate a template at a given position, returning new nodes and connections
 */
export function instantiateTemplate(
  template: NodeTemplate,
  position: { x: number; y: number }
): { nodes: ScriptNode[]; connections: NodeConnection[] } {
  const timestamp = Date.now();
  const newNodes: ScriptNode[] = [];
  const nodeIdMap = new Map<number, string>();

  // Create new node instances
  template.nodes.forEach((templateNode, index) => {
    const definition = getNodeDefinition(templateNode.type);
    const nodeId = `node_${timestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`;
    nodeIdMap.set(index, nodeId);

    // Create inputs with proper IDs
    const inputs = templateNode.inputs.map((input, idx) => ({
      ...input,
      id: `input_${idx}`,
    }));

    // Create outputs with proper IDs
    const outputs = templateNode.outputs.map((output, idx) => ({
      ...output,
      id: `output_${idx}`,
    }));

    newNodes.push({
      id: nodeId,
      type: templateNode.type,
      category: definition?.category || 'flow',
      label: templateNode.label,
      position: {
        x: position.x + templateNode.relativePosition.x,
        y: position.y + templateNode.relativePosition.y,
      },
      data: { ...templateNode.data },
      inputs,
      outputs,
    });
  });

  // Create new connections
  const newConnections: NodeConnection[] = template.connections.map((conn, index) => {
    const fromNodeId = nodeIdMap.get(conn.fromNodeIndex)!;
    const toNodeId = nodeIdMap.get(conn.toNodeIndex)!;
    const fromNode = newNodes.find(n => n.id === fromNodeId);
    const toNode = newNodes.find(n => n.id === toNodeId);

    return {
      id: `conn_${timestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      from: {
        nodeId: fromNodeId,
        portId: fromNode?.outputs[conn.fromPortIndex]?.id || `output_${conn.fromPortIndex}`,
      },
      to: {
        nodeId: toNodeId,
        portId: toNode?.inputs[conn.toPortIndex]?.id || `input_${conn.toPortIndex}`,
      },
    };
  });

  return { nodes: newNodes, connections: newConnections };
}
