import { FilePlus, FolderOpen, Clock, GitBranch, ArrowRight, FileCode } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
}

type GridStyle = 'dots' | 'lines' | 'cross';

interface WelcomeScreenProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onOpenRecent: (path: string) => void;
  recentProjects: RecentProject[];
  accentColor?: string;
  gridStyle?: GridStyle;
  gridSize?: number;
  coloredGrid?: boolean;
  theme?: 'dark' | 'light';
}

// Generate grid background styles matching React Flow
function getGridStyles(
  gridStyle: GridStyle,
  gridSize: number,
  accentColor: string,
  coloredGrid: boolean,
  theme: 'dark' | 'light',
  offset: { x: number; y: number }
) {
  const gridColor = coloredGrid 
    ? (theme === 'light' ? `${accentColor}20` : `${accentColor}30`)
    : (theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)');

  let backgroundImage: string;
  const backgroundSize = `${gridSize}px ${gridSize}px`;

  switch (gridStyle) {
    case 'dots':
      backgroundImage = `radial-gradient(circle, ${gridColor} 1px, transparent 1px)`;
      break;
    case 'lines':
      backgroundImage = `linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                         linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`;
      break;
    case 'cross':
    default:
      backgroundImage = `
        linear-gradient(to right, ${gridColor} 1px, transparent 1px),
        linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
      `;
      break;
  }

  return {
    backgroundImage,
    backgroundSize,
    backgroundPosition: `${offset.x}px ${offset.y}px`,
  };
}

export default function WelcomeScreen({ 
  onNewProject, 
  onOpenProject, 
  onOpenRecent,
  recentProjects,
  accentColor = '#2196F3',
  gridStyle = 'dots',
  gridSize = 20,
  coloredGrid = false,
  theme = 'dark',
}: WelcomeScreenProps) {
  // Animate the grid offset for scrolling effect
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationId: number;
    let startTime: number | null = null;
    const speed = 10;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const offset = elapsed * speed;
      setGridOffset({
        x: offset % 200,
        y: offset % 200,
      });
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const gridStyles = getGridStyles(gridStyle, gridSize, accentColor, coloredGrid, theme, gridOffset);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins === 0 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#121212]">
      {/* Subtle gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accentColor}08 0%, transparent 50%)`
        }}
      />
      
      {/* Scrolling grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          ...gridStyles,
          opacity: 0.5,
          maskImage: 'radial-gradient(ellipse 100% 80% at 50% 50%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 50% 50%, black 0%, transparent 70%)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-auto">
        <div className="max-w-3xl w-full px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <GitBranch size={24} style={{ color: accentColor }} />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">R5V Mod Studio</h1>
            <p className="text-sm text-gray-500">Visual modding for R5Valkyrie</p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* New Project */}
            <button
              onClick={onNewProject}
              className="group relative bg-[#1e1e1e] hover:bg-[#252525] border border-white/5 hover:border-white/10 rounded-lg p-5 text-left transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <FilePlus size={20} style={{ color: accentColor }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-0.5">New Project</h3>
                  <p className="text-xs text-gray-500">Start a fresh visual script</p>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-all group-hover:translate-x-0.5" />
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-500 font-mono">Ctrl+N</kbd>
              </div>
            </button>

            {/* Open Project */}
            <button
              onClick={() => {
                console.log('[WelcomeScreen] Open Project button clicked');
                onOpenProject();
              }}
              className="group relative bg-[#1e1e1e] hover:bg-[#252525] border border-white/5 hover:border-white/10 rounded-lg p-5 text-left transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/15 transition-transform group-hover:scale-110">
                  <FolderOpen size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-0.5">Open Project</h3>
                  <p className="text-xs text-gray-500">Browse existing project</p>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-all group-hover:translate-x-0.5" />
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-500 font-mono">Ctrl+O</kbd>
              </div>
            </button>
          </div>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <div className="bg-[#1e1e1e] border border-white/5 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Clock size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent</span>
              </div>
              <div>
                {recentProjects.slice(0, 5).map((project, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('[WelcomeScreen] Recent project clicked:', project.path);
                      onOpenRecent(project.path);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 group"
                  >
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${accentColor}12` }}
                    >
                      <FileCode size={14} style={{ color: accentColor }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm text-white truncate">{project.name}</div>
                      <div className="text-[10px] text-gray-600 truncate font-mono">{project.path}</div>
                    </div>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">{formatDate(project.lastOpened)}</span>
                    <ArrowRight size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recentProjects.length === 0 && (
            <div className="bg-[#1e1e1e] border border-white/5 rounded-lg p-8 text-center">
              <Clock size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-500">No recent projects</p>
              <p className="text-xs text-gray-600 mt-1">Your projects will appear here</p>
            </div>
          )}

          {/* Keyboard hints */}
          <div className="mt-8 flex items-center justify-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#1e1e1e] border border-white/5 rounded text-[9px] font-mono">Ctrl+S</kbd>
              <span className="text-[10px]">Save</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#1e1e1e] border border-white/5 rounded text-[9px] font-mono">Ctrl+Shift+S</kbd>
              <span className="text-[10px]">Export</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#1e1e1e] border border-white/5 rounded text-[9px] font-mono">Ctrl+Space</kbd>
              <span className="text-[10px]">Spotlight</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
