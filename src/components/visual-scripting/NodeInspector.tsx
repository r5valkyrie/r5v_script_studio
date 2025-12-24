import { X } from 'lucide-react';
import type { ScriptNode } from '../../types/visual-scripting';

interface NodeInspectorProps {
  node: ScriptNode;
  onUpdate: (updates: Partial<ScriptNode>) => void;
  onClose: () => void;
}

export default function NodeInspector({ node, onUpdate, onClose }: NodeInspectorProps) {
  const handleDataChange = (key: string, value: any) => {
    onUpdate({
      data: {
        ...node.data,
        [key]: value,
      },
    });
  };

  return (
    <div className="w-full h-full bg-[#151a21] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#0f1419] flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Inspector
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
          title="Close inspector"
        >
          <X size={14} className="text-gray-500" />
        </button>
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

                  {typeof value === 'boolean' ? (
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
