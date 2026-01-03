import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import VisualScriptEditor from './components/VisualScriptEditor';

export default function App() {
  useEffect(() => {
    const appWindow = getCurrentWindow();
    
    const minimize = () => appWindow.minimize();
    const maximize = async () => {
      if (await appWindow.isMaximized()) {
        appWindow.unmaximize();
      } else {
        appWindow.maximize();
      }
    };
    const close = () => appWindow.close();
    
    document.getElementById('btn-minimize')?.addEventListener('click', minimize);
    document.getElementById('btn-maximize')?.addEventListener('click', maximize);
    document.getElementById('btn-close')?.addEventListener('click', close);
    
    return () => {
      document.getElementById('btn-minimize')?.removeEventListener('click', minimize);
      document.getElementById('btn-maximize')?.removeEventListener('click', maximize);
      document.getElementById('btn-close')?.removeEventListener('click', close);
    };
  }, []);

  return (
    <>
      {/* Window controls header */}
      <header 
        className="drag-region h-[42px] flex items-center justify-between px-4 gap-2 bg-[#1e1e1e] border-b border-white/8"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 tracking-wide">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="title-icon">
            <line x1="6" x2="6" y1="3" y2="15"></line>
            <circle cx="18" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <path d="M18 9a9 9 0 0 1-9 9"></path>
          </svg>
          R5V Studio
        </div>
        <div className="flex gap-2 no-drag">
          <button id="btn-minimize" className="px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">_</button>
          <button id="btn-maximize" className="px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">▢</button>
          <button id="btn-close" className="px-3 py-1 hover:bg-red-500 rounded-lg transition-colors text-gray-400 hover:text-white">✕</button>
        </div>
      </header>
      <main className="h-[calc(100vh-42px)]">
        <VisualScriptEditor />
      </main>
    </>
  );
}
