import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FunctionSquare,
  Variable,
  Globe,
  Code,
  Braces,
} from 'lucide-react';
import type { SquirrelScriptStructure, ScriptFunction, ScriptConstant } from '../utils/squirrelParser';

interface ScriptTreeViewProps {
  structure: SquirrelScriptStructure;
  onJumpToLine?: (line: number) => void;
}

interface TreeNodeProps {
  label: string;
  icon?: React.ReactNode;
  line?: number;
  badge?: string;
  badgeColor?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  onLineClick?: (line: number) => void;
  depth?: number;
}

function TreeNode({
  label,
  icon,
  line,
  badge,
  badgeColor = 'bg-purple-600',
  children,
  defaultOpen = false,
  onLineClick,
  depth = 0,
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = !!children;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer group transition-colors`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen);
          if (line && onLineClick) onLineClick(line);
        }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
          )
        ) : (
          <div className="w-3.5" />
        )}

        {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}

        <span className="text-sm text-gray-200 flex-1 truncate font-mono">{label}</span>

        {badge && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${badgeColor} text-white font-semibold uppercase tracking-wide flex-shrink-0`}
          >
            {badge}
          </span>
        )}

        {line && (
          <span className="text-[10px] text-gray-600 group-hover:text-gray-500 flex-shrink-0">
            :{line}
          </span>
        )}
      </div>

      {hasChildren && isOpen && <div>{children}</div>}
    </div>
  );
}

function FunctionNode({ func, onLineClick, depth = 0 }: { func: ScriptFunction; onLineClick?: (line: number) => void; depth?: number }) {
  const paramsText = func.params.length > 0
    ? `(${func.params.map(p => `${p.type ? p.type + ' ' : ''}${p.name}`).join(', ')})`
    : '()';

  const returnTypeText = func.returnType ? `${func.returnType} ` : '';

  return (
    <TreeNode
      label={`${returnTypeText}${func.name}${paramsText}`}
      icon={<FunctionSquare size={14} />}
      line={func.line}
      badge={func.isGlobal ? 'global' : undefined}
      badgeColor={func.isGlobal ? 'bg-blue-600' : undefined}
      onLineClick={onLineClick}
      depth={depth}
    />
  );
}

function ConstantNode({ constant, onLineClick, depth = 0 }: { constant: ScriptConstant; onLineClick?: (line: number) => void; depth?: number }) {
  const valueDisplay = typeof constant.value === 'string' && constant.value.length > 30
    ? `"${constant.value.substring(0, 30)}..."`
    : constant.type === 'string'
    ? `"${constant.value}"`
    : String(constant.value);

  return (
    <TreeNode
      label={`${constant.name} = ${valueDisplay}`}
      icon={<Variable size={14} />}
      line={constant.line}
      badge={constant.type.toUpperCase()}
      badgeColor={
        constant.type === 'number' ? 'bg-green-600' :
        constant.type === 'string' ? 'bg-yellow-600' :
        constant.type === 'boolean' ? 'bg-red-600' :
        constant.type === 'vector' ? 'bg-cyan-600' :
        'bg-gray-600'
      }
      onLineClick={onLineClick}
      depth={depth}
    />
  );
}

export default function ScriptTreeView({ structure, onJumpToLine }: ScriptTreeViewProps) {
  // Group items by compilation block
  const itemsByBlock = new Map<string, { functions: ScriptFunction[]; constants: ScriptConstant[] }>();

  // Add "global" category for items without a block
  itemsByBlock.set('_global', { functions: [], constants: [] });

  structure.functions.forEach(func => {
    const blockKey = func.compilationBlock || '_global';
    if (!itemsByBlock.has(blockKey)) {
      itemsByBlock.set(blockKey, { functions: [], constants: [] });
    }
    itemsByBlock.get(blockKey)!.functions.push(func);
  });

  structure.constants.forEach(constant => {
    const blockKey = constant.compilationBlock || '_global';
    if (!itemsByBlock.has(blockKey)) {
      itemsByBlock.set(blockKey, { functions: [], constants: [] });
    }
    itemsByBlock.get(blockKey)!.constants.push(constant);
  });

  const globalDeclarations = structure.globalDeclarations.filter(g => !g.compilationBlock);
  const blockDeclarations = new Map<string, typeof globalDeclarations>();

  structure.globalDeclarations.forEach(decl => {
    if (decl.compilationBlock) {
      if (!blockDeclarations.has(decl.compilationBlock)) {
        blockDeclarations.set(decl.compilationBlock, []);
      }
      blockDeclarations.get(decl.compilationBlock)!.push(decl);
    }
  });

  return (
    <div className="flex flex-col h-full bg-[#0f1419] text-gray-200">
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* File Type Badge */}
        <div className="px-2 py-2 mb-3">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-purple-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {structure.fileType} Script
            </span>
          </div>
        </div>

        {/* Global Declarations (not in any block) */}
        {globalDeclarations.length > 0 && (
          <TreeNode
            label="Global Declarations"
            icon={<Globe size={14} />}
            defaultOpen={true}
          >
            {globalDeclarations.map((decl, idx) => (
              <TreeNode
                key={idx}
                label={decl.name}
                icon={decl.type === 'function' ? <FunctionSquare size={14} /> : <Variable size={14} />}
                line={decl.line}
                badge="GLOBAL"
                badgeColor="bg-blue-600"
                onLineClick={onJumpToLine}
                depth={1}
              />
            ))}
          </TreeNode>
        )}

        {/* Render items grouped by compilation block */}
        {Array.from(itemsByBlock.entries()).map(([blockKey, items]) => {
          const blockInfo = structure.compilationBlocks.find(b => b.condition === blockKey);
          const blockDecls = blockDeclarations.get(blockKey) || [];

          if (blockKey === '_global' && items.functions.length === 0 && items.constants.length === 0) {
            return null; // Skip empty global section
          }

          const content = (
            <>
              {/* Block-specific global declarations */}
              {blockDecls.length > 0 && (
                <TreeNode
                  label="Global Declarations"
                  icon={<Globe size={14} />}
                  defaultOpen={true}
                  depth={blockKey === '_global' ? 0 : 1}
                >
                  {blockDecls.map((decl, idx) => (
                    <TreeNode
                      key={idx}
                      label={decl.name}
                      icon={decl.type === 'function' ? <FunctionSquare size={14} /> : <Variable size={14} />}
                      line={decl.line}
                      badge="GLOBAL"
                      badgeColor="bg-blue-600"
                      onLineClick={onJumpToLine}
                      depth={blockKey === '_global' ? 1 : 2}
                    />
                  ))}
                </TreeNode>
              )}

              {/* Constants */}
              {items.constants.length > 0 && (
                <TreeNode
                  label="Constants"
                  icon={<Braces size={14} />}
                  defaultOpen={true}
                  depth={blockKey === '_global' ? 0 : 1}
                >
                  {items.constants.map((constant, idx) => (
                    <ConstantNode
                      key={idx}
                      constant={constant}
                      onLineClick={onJumpToLine}
                      depth={blockKey === '_global' ? 1 : 2}
                    />
                  ))}
                </TreeNode>
              )}

              {/* Functions */}
              {items.functions.length > 0 && (
                <TreeNode
                  label="Functions"
                  icon={<Code size={14} />}
                  defaultOpen={true}
                  depth={blockKey === '_global' ? 0 : 1}
                >
                  {items.functions.map((func, idx) => (
                    <FunctionNode
                      key={idx}
                      func={func}
                      onLineClick={onJumpToLine}
                      depth={blockKey === '_global' ? 1 : 2}
                    />
                  ))}
                </TreeNode>
              )}
            </>
          );

          if (blockKey === '_global') {
            return <div key={blockKey}>{content}</div>;
          }

          return (
            <TreeNode
              key={blockKey}
              label={`#if ${blockKey}`}
              icon={<Code size={14} />}
              line={blockInfo?.startLine}
              badge={blockKey}
              badgeColor={
                blockKey.includes('SERVER') ? 'bg-orange-600' :
                blockKey.includes('CLIENT') ? 'bg-cyan-600' :
                blockKey.includes('UI') ? 'bg-pink-600' :
                'bg-purple-600'
              }
              defaultOpen={true}
              onLineClick={onJumpToLine}
            >
              {content}
            </TreeNode>
          );
        })}

        {/* Show message if no content */}
        {structure.functions.length === 0 &&
         structure.constants.length === 0 &&
         structure.globalDeclarations.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>No script structure found</p>
          </div>
        )}
      </div>
    </div>
  );
}
