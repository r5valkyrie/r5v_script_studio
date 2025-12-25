import { useMemo, useState, useRef, useEffect } from 'react';
import { Copy, Check, Download, Search, X, ChevronDown, ChevronRight, FileCode, PanelRight } from 'lucide-react';

interface CodeViewProps {
  code: string;
  onClose?: () => void;
}

// Simple token-based syntax highlighting for Squirrel code
function highlightCode(code: string): string {
  const keywords = new Set([
    'function', 'void', 'local', 'global', 'if', 'else', 'for', 'foreach',
    'while', 'return', 'thread', 'wait', 'in', 'true', 'false', 'null',
    'try', 'catch', 'throw', 'switch', 'case', 'default', 'break', 'continue',
    'class', 'extends', 'constructor', 'this', 'base', 'static', 'const',
    'entity', 'var', 'array', 'table', 'string', 'int', 'float', 'bool',
  ]);

  const types = new Set(['SERVER', 'CLIENT', 'UI', 'Vector', 'CustomWeaponData']);

  const builtins = new Set([
    'print', 'printt', 'expect', 'Assert', 'GetPlayerArray', 'GetNPCArray',
    'IsValid', 'IsAlive', 'Time', 'RandomInt', 'RandomFloat',
  ]);

  const lines = code.split('\n');

  return lines.map(line => {
    const result: string[] = [];
    let i = 0;

    while (i < line.length) {
      // Comments
      if (line[i] === '/' && line[i + 1] === '/') {
        const comment = line.substring(i).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        result.push(`<span class="text-gray-500 italic">${comment}</span>`);
        break;
      }

      // Strings
      if (line[i] === '"') {
        let j = i + 1;
        while (j < line.length && (line[j] !== '"' || line[j - 1] === '\\')) j++;
        const str = line.substring(i, j + 1).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        result.push(`<span class="text-emerald-400">${str}</span>`);
        i = j + 1;
        continue;
      }

      // Preprocessor directives
      if (line[i] === '#') {
        let j = i + 1;
        while (j < line.length && /[a-zA-Z]/.test(line[j])) j++;
        const directive = line.substring(i, j);
        result.push(`<span class="text-pink-400 font-bold">${directive}</span>`);
        i = j;
        continue;
      }

      // Operators like ||
      if (line[i] === '|' && line[i + 1] === '|') {
        result.push(`<span class="text-pink-400 font-bold">||</span>`);
        i += 2;
        continue;
      }

      // Vector notation <x, y, z>
      if (line[i] === '<' && /[0-9\-]/.test(line[i + 1] || '')) {
        let j = i + 1;
        while (j < line.length && line[j] !== '>') j++;
        if (line[j] === '>') {
          const vec = line.substring(i, j + 1);
          result.push(`<span class="text-cyan-400">${vec}</span>`);
          i = j + 1;
          continue;
        }
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
        const word = line.substring(i, j);

        // Check if it's followed by ( for function call
        let k = j;
        while (k < line.length && line[k] === ' ') k++;
        const isCall = line[k] === '(';

        // Check if preceded by . for method call
        const isMethod = i > 0 && line[i - 1] === '.';

        if (keywords.has(word)) {
          result.push(`<span class="text-purple-400 font-semibold">${word}</span>`);
        } else if (types.has(word)) {
          result.push(`<span class="text-sky-400 font-medium">${word}</span>`);
        } else if (builtins.has(word)) {
          result.push(`<span class="text-amber-400">${word}</span>`);
        } else if (isCall || isMethod) {
          result.push(`<span class="text-yellow-300">${word}</span>`);
        } else if (word.startsWith('e') && word[1] && word[1] === word[1].toUpperCase()) {
          // Likely an enum like eLootTier
          result.push(`<span class="text-teal-400">${word}</span>`);
        } else {
          result.push(`<span class="text-gray-200">${word}</span>`);
        }
        i = j;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(line[i]) || (line[i] === '-' && /[0-9]/.test(line[i + 1] || ''))) {
        let j = i;
        if (line[j] === '-') j++;
        while (j < line.length && /[0-9.]/.test(line[j])) j++;
        const num = line.substring(i, j);
        result.push(`<span class="text-orange-400">${num}</span>`);
        i = j;
        continue;
      }

      // Brackets and braces
      if (line[i] === '{' || line[i] === '}') {
        result.push(`<span class="text-gray-400">${line[i]}</span>`);
        i++;
        continue;
      }

      if (line[i] === '(' || line[i] === ')') {
        result.push(`<span class="text-gray-400">${line[i]}</span>`);
        i++;
        continue;
      }

      if (line[i] === '[' || line[i] === ']') {
        result.push(`<span class="text-gray-400">${line[i]}</span>`);
        i++;
        continue;
      }

      // Other characters (escape HTML)
      const char = line[i];
      if (char === '<') result.push('&lt;');
      else if (char === '>') result.push('&gt;');
      else if (char === '&') result.push('&amp;');
      else result.push(char);
      i++;
    }

    return result.join('');
  }).join('\n');
}

export default function CodeView({ code, onClose }: CodeViewProps) {
  const [copied, setCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResult, setCurrentResult] = useState(0);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const codeRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const highlightedCode = useMemo(() => highlightCode(code), [code]);
  const codeLines = useMemo(() => code.split('\n'), [code]);
  const highlightedLines = useMemo(() => highlightedCode.split('\n'), [highlightedCode]);

  // Find collapsible blocks (#if ... #endif)
  const collapsibleBlocks = useMemo(() => {
    const blocks: { start: number; end: number; label: string }[] = [];
    const stack: { line: number; label: string }[] = [];
    
    codeLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#if ')) {
        stack.push({ line: idx, label: trimmed.substring(4) });
      } else if (trimmed === '#endif' && stack.length > 0) {
        const start = stack.pop()!;
        blocks.push({ start: start.line, end: idx, label: start.label });
      }
    });
    
    return blocks;
  }, [codeLines]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results: number[] = [];
      codeLines.forEach((line, idx) => {
        if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push(idx);
        }
      });
      setSearchResults(results);
      setCurrentResult(0);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, codeLines]);

  // Scroll to current search result
  useEffect(() => {
    if (searchResults.length > 0 && codeRef.current) {
      const lineElement = codeRef.current.querySelector(`[data-line="${searchResults[currentResult]}"]`);
      lineElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentResult, searchResults]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mod_script.nut';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleBlock = (startLine: number) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(startLine)) {
        next.delete(startLine);
      } else {
        next.add(startLine);
      }
      return next;
    });
  };

  const isLineVisible = (lineIdx: number): boolean => {
    for (const block of collapsibleBlocks) {
      if (collapsedBlocks.has(block.start) && lineIdx > block.start && lineIdx < block.end) {
        return false;
      }
    }
    return true;
  };

  const getBlockForLine = (lineIdx: number) => {
    return collapsibleBlocks.find(b => b.start === lineIdx);
  };

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    if (direction === 'next') {
      setCurrentResult(prev => (prev + 1) % searchResults.length);
    } else {
      setCurrentResult(prev => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#161b22] to-[#1c222b] border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileCode size={16} style={{ color: 'var(--accent-color)' }} />
          <span className="text-sm font-medium text-gray-200">Generated Code</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-color-bg)', color: 'var(--accent-color)' }}>.nut</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 0);
            }}
            className={`p-1.5 rounded transition-colors ${searchOpen ? '' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            style={searchOpen ? { backgroundColor: 'var(--accent-color-bg)', color: 'var(--accent-color)' } : undefined}
            title="Search (Ctrl+F)"
          >
            <Search size={14} />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors font-medium text-white"
            style={{ backgroundColor: 'var(--accent-color)' }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            title="Download as .nut file"
          >
            <Download size={12} />
            <span>Export</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors ml-1"
              title="Close Code Panel"
            >
              <PanelRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1c222b] border-b border-white/10">
          <Search size={14} className="text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigateSearch(e.shiftKey ? 'prev' : 'next');
            }}
            placeholder="Search in code..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
          {searchResults.length > 0 && (
            <span className="text-xs text-gray-400">
              {currentResult + 1} of {searchResults.length}
            </span>
          )}
          {searchQuery && searchResults.length === 0 && (
            <span className="text-xs text-red-400">No results</span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateSearch('prev')}
              disabled={searchResults.length === 0}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              title="Previous (Shift+Enter)"
            >
              <ChevronDown size={14} className="rotate-180" />
            </button>
            <button
              onClick={() => navigateSearch('next')}
              disabled={searchResults.length === 0}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              title="Next (Enter)"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <button
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Code Area */}
      <div ref={codeRef} className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* Line Numbers & Fold Indicators */}
          <div className="flex-shrink-0 py-3 bg-[#0d1117] border-r border-white/5 select-none sticky left-0 z-10">
            {codeLines.map((_, idx) => {
              if (!isLineVisible(idx)) return null;
              const block = getBlockForLine(idx);
              const isCollapsed = block && collapsedBlocks.has(block.start);
              const isSearchResult = searchResults.includes(idx);
              const isCurrentSearchResult = searchResults[currentResult] === idx;
              
              return (
                <div key={idx}>
                  <div 
                    data-line={idx}
                    className={`flex items-center h-6 text-xs font-mono transition-colors ${
                      isCurrentSearchResult 
                        ? 'bg-yellow-500/30' 
                        : isSearchResult 
                          ? 'bg-yellow-500/10' 
                          : hoveredLine === idx 
                            ? 'bg-white/5' 
                            : ''
                    }`}
                    onMouseEnter={() => setHoveredLine(idx)}
                    onMouseLeave={() => setHoveredLine(null)}
                  >
                    {/* Fold indicator */}
                    <div className="w-5 flex items-center justify-center">
                      {block && (
                        <button
                          onClick={() => toggleBlock(block.start)}
                          className="p-0.5 text-gray-500 transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                        >
                          {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>
                    {/* Line number */}
                    <div className="w-8 pr-2 text-right text-gray-600">
                      {idx + 1}
                    </div>
                  </div>
                  {/* Collapsed block indicator row */}
                  {isCollapsed && (
                    <div className="flex items-center h-8 border-y" style={{ background: 'linear-gradient(to right, var(--accent-color-bg), transparent)', borderColor: 'var(--accent-color-dim)' }}>
                      <div className="w-5" />
                      <div className="w-8 pr-2 text-right text-xs font-mono" style={{ color: 'var(--accent-color-dim)' }}>⋮</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Code Content */}
          <pre className="flex-1 py-3 overflow-x-auto">
            {codeLines.map((_, idx) => {
              if (!isLineVisible(idx)) return null;
              const block = getBlockForLine(idx);
              const isCollapsed = block && collapsedBlocks.has(block.start);
              const isSearchResult = searchResults.includes(idx);
              const isCurrentSearchResult = searchResults[currentResult] === idx;
              
              return (
                <div key={idx}>
                  <div 
                    className={`h-6 px-4 flex items-center transition-colors ${
                      isCurrentSearchResult 
                        ? 'bg-yellow-500/30' 
                        : isSearchResult 
                          ? 'bg-yellow-500/10' 
                          : hoveredLine === idx 
                            ? 'bg-white/5' 
                            : ''
                    }`}
                    onMouseEnter={() => setHoveredLine(idx)}
                    onMouseLeave={() => setHoveredLine(null)}
                  >
                    <code
                      className="text-sm font-mono whitespace-pre"
                      dangerouslySetInnerHTML={{ __html: highlightedLines[idx] || '' }}
                    />
                  </div>
                  {/* Collapsed block indicator - full width styled row */}
                  {isCollapsed && (
                    <div 
                      className="h-8 px-4 flex items-center gap-3 border-y cursor-pointer transition-all group"
                      style={{ background: 'linear-gradient(to right, var(--accent-color-bg), transparent)', borderColor: 'var(--accent-color-dim)' }}
                      onClick={() => toggleBlock(block!.start)}
                    >
                      <div className="flex items-center gap-2" style={{ color: 'var(--accent-color-dim)' }}>
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-color-dim)' }} />
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-color-dim)' }} />
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-color-dim)' }} />
                        </div>
                        <span className="text-xs font-medium">
                          {block!.end - block!.start - 1} hidden lines
                        </span>
                        <span className="text-xs" style={{ color: 'var(--accent-color-dim)' }}>
                          ({block!.label})
                        </span>
                      </div>
                      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--accent-color-dim), transparent)' }} />
                      <span className="text-xs group-hover:opacity-80 transition-colors" style={{ color: 'var(--accent-color-dim)' }}>
                        click to expand
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#161b22] to-[#1c222b] border-t border-white/10 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-500">{codeLines.length} lines</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-500">{code.length} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--accent-color)' }}>Squirrel</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500">R5Valkyrie</span>
        </div>
      </div>
    </div>
  );
}
