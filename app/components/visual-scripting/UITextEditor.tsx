import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, Eye, Code, RotateCcw, Copy, Search, Info } from 'lucide-react';
import type { UIFile } from '../../types/project';

interface UITextEditorProps {
  uiFile: UIFile | null;
  onContentChange: (fileId: string, content: string) => void;
  isModified?: boolean;
  accentColor?: string;
}

export default function UITextEditor({
  uiFile,
  onContentChange,
  isModified = false,
  accentColor = '#a855f7',
}: UITextEditorProps) {
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);

  // Sync content with file
  useEffect(() => {
    if (uiFile) {
      setContent(uiFile.content);
    }
  }, [uiFile?.id, uiFile?.content]);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    if (uiFile) {
      onContentChange(uiFile.id, newContent);
    }
  }, [uiFile, onContentChange]);

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback(() => {
    if (lineNumberRef.current && textareaRef.current) {
      lineNumberRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Calculate line numbers
  const lines = content.split('\n');
  const lineCount = lines.length;

  // Handle Tab key for indentation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert tab at cursor
      const newContent = content.substring(0, start) + '\t' + content.substring(end);
      handleContentChange(newContent);

      // Move cursor after tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  }, [content, handleContentChange]);

  // Copy content to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
  }, [content]);

  // Reset to original
  const handleReset = useCallback(() => {
    if (uiFile) {
      setContent(uiFile.content);
    }
  }, [uiFile]);

  if (!uiFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#121212] text-center p-8">
        <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${accentColor}20` }}>
          <Layout size={48} style={{ color: `${accentColor}80` }} />
        </div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">No UI File Open</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Select a UI file from the Project panel to begin editing, or create a new .res or .menu file.
        </p>
      </div>
    );
  }

  const fileTypeLabel = uiFile.fileType === 'menu' ? 'Menu Definition' : 'VGUI Layout';
  const fileExtension = `.${uiFile.fileType}`;

  return (
    <div className="h-full flex flex-col bg-[#121212]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <Layout size={16} style={{ color: accentColor }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{uiFile.name}</span>
              <span className="text-xs text-gray-500">{fileExtension}</span>
              {isModified && (
                <span className="w-2 h-2 rounded-full bg-orange-400" title="Unsaved changes" />
              )}
            </div>
            <span className="text-[10px] text-gray-600">{fileTypeLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded transition-colors ${
              showSearch ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title="Search (Ctrl+F)"
          >
            <Search size={14} />
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
            title="Reset to saved"
          >
            <RotateCcw size={14} />
          </button>

          {/* Toggle line numbers */}
          <button
            onClick={() => setLineNumbers(!lineNumbers)}
            className={`p-1.5 rounded transition-colors ${
              lineNumbers ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title="Toggle line numbers"
          >
            <Code size={14} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-white/10 bg-[#1a1a1a]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-[#2d2d2d] border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
            autoFocus
          />
        </div>
      )}

      {/* Info banner */}
      <div className="px-4 py-2 border-b border-white/10 bg-[#1e1a25] flex items-center gap-2">
        <Info size={14} className="text-purple-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          {uiFile.fileType === 'menu' 
            ? 'Menu files define full-screen menus and dialogs. They are placed in resource/ui/menus/ when compiled.'
            : 'RES files define VGUI panel layouts for HUD elements and UI screens. They are placed in resource/ui/ when compiled.'}
        </p>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        {lineNumbers && (
          <div
            ref={lineNumberRef}
            className="w-12 flex-shrink-0 bg-[#0d0d0d] text-gray-600 text-xs font-mono py-3 overflow-hidden select-none border-r border-white/5"
            style={{ lineHeight: '1.5rem' }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="px-2 text-right">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Text editor */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-[#121212] text-gray-200 font-mono text-sm p-3 resize-none outline-none"
          style={{ 
            lineHeight: '1.5rem',
            tabSize: 4,
          }}
          spellCheck={false}
          placeholder="Start writing your UI definition..."
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-white/10 bg-[#1a1a1a] flex items-center justify-between text-[10px] text-gray-600">
        <div className="flex items-center gap-4">
          <span>{lineCount} lines</span>
          <span>{content.length} characters</span>
        </div>
        <div className="flex items-center gap-2">
          <span>VGUI KeyValue Format</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
            {uiFile.fileType.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
