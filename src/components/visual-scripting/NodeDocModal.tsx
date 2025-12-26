import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  X, 
  Code, 
  Lightbulb, 
  Link2, 
  GitBranch,
  ExternalLink,
  Zap,
  Copy,
  Check,
  Info,
  Target,
  Workflow,
  BookOpen
} from 'lucide-react';
import { NODE_DEFINITIONS } from '../../data/node-definitions';
import type { NodeDefinition, NodeType, NodeDocumentation } from '../../types/visual-scripting';

interface NodeDocModalProps {
  nodeType: NodeType | null;
  onClose: () => void;
  onAddNode?: (nodeType: NodeType) => void;
}

// Mini node preview for diagrams
function MiniNode({ 
  node, 
  isHighlighted = false 
}: { 
  node: { type: NodeType; position: { x: number; y: number }; label?: string };
  isHighlighted?: boolean;
}) {
  const definition = NODE_DEFINITIONS.find(d => d.type === node.type);
  if (!definition) return null;
  
  return (
    <div 
      className={`absolute bg-[#1a1f28] border rounded-lg px-3 py-2 text-xs shadow-lg transition-all ${
        isHighlighted 
          ? 'border-blue-400 ring-2 ring-blue-400/30' 
          : 'border-white/20'
      }`}
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        minWidth: 100
      }}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: definition.color }}
      />
      <div className="font-medium text-white pl-2 text-[10px]">
        {node.label || definition.label}
      </div>
    </div>
  );
}

// Example diagram visualization
function ExampleDiagram({ 
  diagram 
}: { 
  diagram: NonNullable<NodeDocumentation['exampleDiagram']> 
}) {
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    diagram.nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 120);
      maxY = Math.max(maxY, node.position.y + 50);
    });
    return { minX: minX - 10, minY: minY - 10, width: maxX - minX + 20, height: maxY - minY + 20 };
  }, [diagram]);

  return (
    <div className="bg-[#0a0d10] rounded-lg border border-white/10 p-3">
      <div className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
        <GitBranch size={10} className="text-purple-400" />
        <span>{diagram.description}</span>
      </div>
      <div 
        className="relative bg-[#0f1419] rounded overflow-hidden"
        style={{ height: Math.min(bounds.height, 200) }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {diagram.connections.map((conn, idx) => {
            const fromNode = diagram.nodes[conn.fromNode];
            const toNode = diagram.nodes[conn.toNode];
            if (!fromNode || !toNode) return null;
            
            const fromX = fromNode.position.x - bounds.minX + 110;
            const fromY = fromNode.position.y - bounds.minY + 20;
            const toX = toNode.position.x - bounds.minX + 5;
            const toY = toNode.position.y - bounds.minY + 20;
            
            const midX = (fromX + toX) / 2;
            const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
            
            return (
              <g key={idx}>
                <path d={path} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="4 2" />
                <circle cx={toX} cy={toY} r={3} fill="rgba(255,255,255,0.5)" />
              </g>
            );
          })}
        </svg>
        
        <div className="relative" style={{ transform: `translate(${-bounds.minX}px, ${-bounds.minY}px)` }}>
          {diagram.nodes.map((node, idx) => (
            <MiniNode key={idx} node={node} isHighlighted={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NodeDocModal({ nodeType, onClose, onAddNode }: NodeDocModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  
  const definition = useMemo(() => {
    if (!nodeType) return null;
    return NODE_DEFINITIONS.find(d => d.type === nodeType) || null;
  }, [nodeType]);

  const doc = definition?.documentation;

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCopyCode = useCallback(() => {
    if (doc?.codeExample) {
      navigator.clipboard.writeText(doc.codeExample);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [doc?.codeExample]);

  const handleAddToCanvas = useCallback(() => {
    if (definition) {
      onAddNode?.(definition.type);
      onClose();
    }
  }, [definition, onAddNode, onClose]);

  // Get related node definitions
  const relatedNodes = useMemo(() => {
    if (!doc?.relatedNodes) return [];
    return doc.relatedNodes
      .map(type => NODE_DEFINITIONS.find(d => d.type === type))
      .filter((d): d is NodeDefinition => d !== undefined)
      .slice(0, 5);
  }, [doc?.relatedNodes]);

  if (!definition) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-[#0f1419] rounded-xl border border-white/10 shadow-2xl w-full max-w-[40vh] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-[#0a0d10]">
          <div className="flex items-start gap-3">
            <div 
              className="w-1 self-stretch rounded-full"
              style={{ backgroundColor: definition.color }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-purple-400" />
                <h2 className="text-lg font-bold text-white">{definition.label}</h2>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span 
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${definition.color}20`, color: definition.color }}
                >
                  {definition.category.toUpperCase()}
                </span>
                {definition.serverOnly && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">SERVER</span>
                )}
                {definition.clientOnly && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">CLIENT</span>
                )}
                {definition.uiOnly && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">UI</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {/* Description */}
          <div className="bg-[#1a1f28] rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-medium text-white mb-1">
              <Info size={12} className="text-blue-400" />
              Description
            </div>
            <p className="text-xs text-gray-300">{definition.description}</p>
            {doc?.longDescription && (
              <p className="text-xs text-gray-400 mt-1">{doc.longDescription}</p>
            )}
          </div>

          {/* Inputs & Outputs - Compact */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1a1f28] rounded-lg p-3 border border-white/10">
              <div className="text-xs font-medium text-white mb-2">Inputs</div>
              {definition.inputs.length === 0 ? (
                <div className="text-[10px] text-gray-500 italic">No inputs</div>
              ) : (
                <div className="space-y-1">
                  {definition.inputs.slice(0, 5).map((input, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${input.type === 'exec' ? 'bg-white/50' : 'bg-blue-500/50'}`} />
                      <span className="text-[10px] text-gray-300">{input.label}</span>
                      {input.dataType && <span className="text-[9px] text-gray-500 ml-auto">{input.dataType}</span>}
                    </div>
                  ))}
                  {definition.inputs.length > 5 && (
                    <div className="text-[10px] text-gray-500">+{definition.inputs.length - 5} more</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-[#1a1f28] rounded-lg p-3 border border-white/10">
              <div className="text-xs font-medium text-white mb-2">Outputs</div>
              {definition.outputs.length === 0 ? (
                <div className="text-[10px] text-gray-500 italic">No outputs</div>
              ) : (
                <div className="space-y-1">
                  {definition.outputs.slice(0, 5).map((output, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-300">{output.label}</span>
                      {output.dataType && <span className="text-[9px] text-gray-500">{output.dataType}</span>}
                      <div className={`w-2 h-2 rounded-full ml-auto ${output.type === 'exec' ? 'bg-white/50' : 'bg-green-500/50'}`} />
                    </div>
                  ))}
                  {definition.outputs.length > 5 && (
                    <div className="text-[10px] text-gray-500 text-right">+{definition.outputs.length - 5} more</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Code Example */}
          {doc?.codeExample && (
            <div className="bg-[#1a1f28] rounded-lg border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[#0a0d10] border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                  <Code size={12} className="text-green-400" />
                  Code Example
                </div>
                <button onClick={handleCopyCode} className="p-1 hover:bg-white/10 rounded transition-colors">
                  {copiedCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
                </button>
              </div>
              <pre className="p-3 text-[10px] text-gray-300 font-mono overflow-x-auto max-h-32">
                <code>{doc.codeExample}</code>
              </pre>
            </div>
          )}

          {/* Example Diagram */}
          {doc?.exampleDiagram && <ExampleDiagram diagram={doc.exampleDiagram} />}

          {/* Tips */}
          {doc?.tips && doc.tips.length > 0 && (
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 mb-2">
                <Lightbulb size={12} />
                Tips
              </div>
              <ul className="space-y-1">
                {doc.tips.slice(0, 4).map((tip, idx) => (
                  <li key={idx} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use Cases */}
          {doc?.useCases && doc.useCases.length > 0 && (
            <div className="bg-[#1a1f28] rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white mb-2">
                <Target size={12} className="text-cyan-400" />
                Use Cases
              </div>
              <ul className="space-y-1">
                {doc.useCases.slice(0, 4).map((useCase, idx) => (
                  <li key={idx} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                    <span className="text-cyan-400">→</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Nodes */}
          {relatedNodes.length > 0 && (
            <div className="bg-[#1a1f28] rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white mb-2">
                <Link2 size={12} className="text-blue-400" />
                Related Nodes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {relatedNodes.map((node) => (
                  <span
                    key={node.type}
                    className="px-2 py-1 text-[10px] rounded border"
                    style={{
                      backgroundColor: `${node.color}10`,
                      borderColor: `${node.color}40`,
                      color: node.color
                    }}
                  >
                    {node.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t border-white/10 bg-[#0a0d10] flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Press Esc to close</span>
          {onAddNode && (
            <button
              onClick={handleAddToCanvas}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1.5"
            >
              <Zap size={12} />
              Add to Canvas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
