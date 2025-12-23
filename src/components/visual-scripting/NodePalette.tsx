import { useState } from 'react';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import { NODE_DEFINITIONS, getNodesByCategory } from '../../data/node-definitions';
import type { ScriptNode, NodePort } from '../../types/visual-scripting';

interface NodePaletteProps {
  onAddNode: (node: ScriptNode) => void;
  onClose: () => void;
}

interface CategorySectionProps {
  title: string;
  category: string;
  onAddNode: (node: ScriptNode) => void;
  defaultOpen?: boolean;
}

function CategorySection({ title, category, onAddNode, defaultOpen = false }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const nodes = getNodesByCategory(category);

  const handleNodeClick = (nodeType: string) => {
    const definition = NODE_DEFINITIONS.find(def => def.type === nodeType);
    if (!definition) return;

    // Create a new node instance
    const newNode: ScriptNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category,
      label: definition.label,
      position: { x: 300, y: 200 }, // Default position in center
      data: { ...definition.defaultData },
      inputs: definition.inputs.map((input, idx) => ({
        ...input,
        id: `input_${idx}`,
      })),
      outputs: definition.outputs.map((output, idx) => ({
        ...output,
        id: `output_${idx}`,
      })),
    };

    onAddNode(newNode);
  };

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        {isOpen ? (
          <ChevronDown size={12} className="text-gray-500" />
        ) : (
          <ChevronRight size={12} className="text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="pb-2">
          {nodes.map((node) => (
            <button
              key={node.type}
              onClick={() => handleNodeClick(node.type)}
              className="w-full px-5 py-2 text-left text-sm text-gray-300 hover:bg-purple-600/20 hover:text-white transition-colors border-l-2 border-transparent hover:border-purple-600"
              title={node.description}
            >
              {node.label.replace(/^(Event|Flow|Mod|Data|Action):\s*/, '')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NodePalette({ onAddNode, onClose }: NodePaletteProps) {
  return (
    <div className="w-[220px] bg-[#151a21] border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/10 bg-[#0f1419] flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Node Palette
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Hide palette"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <CategorySection
          title="Core Flow"
          category="core-flow"
          onAddNode={onAddNode}
          defaultOpen={true}
        />
        <CategorySection
          title="Events"
          category="events"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Entity"
          category="entity"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Weapons"
          category="weapons"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Status Effects"
          category="status-effects"
          onAddNode={onAddNode}
        />

        <CategorySection
          title="Particles"
          category="particles"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Audio"
          category="audio"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Damage"
          category="damage"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="UI"
          category="ui"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Math"
          category="math"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Callbacks"
          category="callbacks"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Data"
          category="data"
          onAddNode={onAddNode}
        />
        <CategorySection
          title="Utilities"
          category="utilities"
          onAddNode={onAddNode}
        />  
      </div>

      {/* Hints */}
      <div className="p-3 border-t border-white/10 bg-[#0f1419]">
        <div className="text-[10px] text-gray-600 leading-relaxed">
          <p className="mb-1">Game scripts live under</p>
          <p className="mb-1">R5/Platform/scripts.</p>
          <p>Drag nodes to Flow.</p>
        </div>
      </div>
    </div>
  );
}
