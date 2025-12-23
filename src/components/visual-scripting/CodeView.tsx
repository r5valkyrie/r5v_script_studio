import { useMemo, useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface CodeViewProps {
  code: string;
}

// Simple token-based syntax highlighting for Squirrel code
function highlightCode(code: string): string {
  const keywords = new Set([
    'function', 'void', 'local', 'global', 'if', 'else', 'for', 'foreach',
    'while', 'return', 'thread', 'wait', 'in', 'true', 'false', 'null',
    'try', 'catch', 'throw', 'switch', 'case', 'default', 'break', 'continue',
    'class', 'extends', 'constructor', 'this', 'base', 'static', 'const',
  ]);

  const types = new Set(['SERVER', 'CLIENT', 'UI', 'Vector']);

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
        result.push(`<span class="text-green-400">${str}</span>`);
        i = j + 1;
        continue;
      }

      // Preprocessor
      if (line[i] === '#') {
        let j = i + 1;
        while (j < line.length && /[a-zA-Z]/.test(line[j])) j++;
        const directive = line.substring(i, j);
        result.push(`<span class="text-pink-400 font-semibold">${directive}</span>`);
        i = j;
        continue;
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

        if (keywords.has(word)) {
          result.push(`<span class="text-purple-400 font-semibold">${word}</span>`);
        } else if (types.has(word)) {
          result.push(`<span class="text-cyan-400">${word}</span>`);
        } else if (isCall) {
          result.push(`<span class="text-yellow-300">${word}</span>`);
        } else {
          result.push(word);
        }
        i = j;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[0-9.]/.test(line[j])) j++;
        const num = line.substring(i, j);
        result.push(`<span class="text-orange-400">${num}</span>`);
        i = j;
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

export default function CodeView({ code }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  const highlightedCode = useMemo(() => highlightCode(code), [code]);

  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

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

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Generated Squirrel Code</span>
          <span className="text-xs text-gray-600">(.nut)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* Line Numbers */}
          <div className="flex-shrink-0 py-4 px-2 bg-[#0d1117] border-r border-white/5 text-right select-none">
            {lines.map(line => (
              <div key={line} className="text-xs text-gray-600 leading-6 font-mono">
                {line}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <pre className="flex-1 py-4 px-4 overflow-x-auto">
            <code
              className="text-sm text-gray-300 font-mono leading-6"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-t border-white/10 text-xs text-gray-500">
        <span>{lineCount} lines</span>
        <span>Squirrel</span>
      </div>
    </div>
  );
}
