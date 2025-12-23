import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Save, Code2, Workflow } from 'lucide-react';
import VisualScriptingCanvas from './VisualScriptingCanvas';

interface CodeEditorProps {
  fileName: string | null;
  fileType: string;
  fileContent: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
}

export interface CodeEditorHandle {
  jumpToLine: (line: number) => void;
}

type EditorMode = 'code' | 'visual';

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ fileName, fileType, fileContent, onChange, onSave, hasUnsavedChanges }, ref) => {
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const [editorMode, setEditorMode] = useState<EditorMode>('code');

    // Check if visual scripting is supported for this file type
    const supportsVisualScripting = fileType === 'weapon' || fileType === 'script' ||
                                     fileName?.endsWith('.nut') || fileName?.endsWith('.gnut');

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      jumpToLine: (line: number) => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.focus();
        }
      },
    }));

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;

    // Add Ctrl+S / Cmd+S keyboard shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Configure editor theme
    monaco.editor.defineTheme('r5v-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#0f1419',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorCursor.foreground': '#aeafad',
        'editor.lineHighlightBackground': '#1a1f28',
      },
    });
    monaco.editor.setTheme('r5v-dark');

    // Register Squirrel language (simplified)
    monaco.languages.register({ id: 'squirrel' });
    monaco.languages.setMonarchTokensProvider('squirrel', {
      keywords: [
        'function', 'local', 'global', 'const', 'enum', 'class', 'extends',
        'if', 'else', 'switch', 'case', 'default', 'while', 'for', 'foreach',
        'do', 'break', 'continue', 'return', 'yield', 'try', 'catch', 'throw',
        'true', 'false', 'null', 'this', 'base', 'static', 'constructor',
        'typeof', 'in', 'instanceof', 'clone', 'delete', 'var', 'void'
      ],
      operators: [
        '=', '>', '<', '!', '~', '?', ':',
        '==', '<=', '>=', '!=', '&&', '||', '++', '--',
        '+', '-', '*', '/', '&', '|', '^', '%', '<<',
        '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
        '^=', '%=', '<<=', '>>=', '>>>='
      ],
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/[-+]?\d+/, 'number'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/"/, 'string', '@pop']
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
      },
    });
  };

  const getLanguage = (fileType: string, fileName: string | null): string => {
    if (fileType === 'vdf' || fileType === 'weapontxt') return 'plaintext';
    if (fileType === 'weapon' || fileType === 'script') return 'squirrel';
    if (fileType === 'json') return 'json';
    if (fileName?.endsWith('.txt')) return 'plaintext';
    if (fileName?.endsWith('.nut')) return 'squirrel';
    return 'plaintext';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f1419]">
      <div className="px-4 py-2 border-b border-white/10 bg-[#151a21]">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Editor
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#151a21]">
        <div className="flex gap-2">
          {fileName && (
            <>
              <div className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-600/30">
                {fileName.split('/').pop()}
                {hasUnsavedChanges && <span className="ml-2">●</span>}
              </div>

              {/* Tab switcher for supported file types */}
              {supportsVisualScripting && (
                <div className="flex gap-1 bg-[#0f1419] rounded-lg p-1">
                  <button
                    onClick={() => setEditorMode('code')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-all ${
                      editorMode === 'code'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <Code2 size={14} />
                    Code
                  </button>
                  <button
                    onClick={() => setEditorMode('visual')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-all ${
                      editorMode === 'visual'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <Workflow size={14} />
                    Visual
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {fileName && (
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              hasUnsavedChanges
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30'
                : 'bg-[#1a1f28] text-gray-500 cursor-not-allowed'
            }`}
            title="Save (Ctrl+S)"
          >
            <Save size={16} />
            Save
          </button>
        )}
      </div>

      <div className="flex-1">
        {fileName ? (
          editorMode === 'code' ? (
            <Editor
              height="100%"
              language={getLanguage(fileType, fileName)}
              value={fileContent}
              onChange={(value) => onChange?.(value || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: false,
                wordWrap: 'on',
                theme: 'r5v-dark',
                padding: { top: 16, bottom: 16 },
              }}
              loading={<div className="flex items-center justify-center h-full text-gray-500">Loading editor...</div>}
            />
          ) : (
            <VisualScriptingCanvas
              fileContent={fileContent}
              onChange={onChange}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p>Select a file from the project tree to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
