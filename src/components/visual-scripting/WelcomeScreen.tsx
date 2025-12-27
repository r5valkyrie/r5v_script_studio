import { FilePlus, FolderOpen, Clock, GitBranch, ArrowRight } from 'lucide-react';
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

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper to lighten a color
function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
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
    ? (theme === 'light' ? `${accentColor}25` : `${accentColor}40`)
    : (theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)');
  const dotColor = coloredGrid
    ? (theme === 'light' ? `${accentColor}40` : `${accentColor}60`)
    : (theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)');

  let backgroundImage: string;
  let backgroundSize: string;

  switch (gridStyle) {
    case 'dots':
      backgroundImage = `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`;
      backgroundSize = `${gridSize}px ${gridSize}px`;
      break;
    case 'lines':
      backgroundImage = `linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                         linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`;
      backgroundSize = `${gridSize}px ${gridSize}px`;
      break;
    case 'cross':
    default:
      // Cross pattern - small + marks at grid intersections
      const crossSize = 4;
      backgroundImage = `
        linear-gradient(to right, ${gridColor} 1px, transparent 1px),
        linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
      `;
      backgroundSize = `${gridSize}px ${gridSize}px`;
      break;
  }

  const bgTint = coloredGrid
    ? (theme === 'light' ? `${accentColor}08` : `${accentColor}10`)
    : undefined;

  return {
    backgroundColor: bgTint,
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
    const speed = 15; // pixels per second

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      
      // Diagonal scrolling - move down-right
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
    <div className="w-full h-full relative overflow-hidden">
      {/* Base animated gradient background */}
      <div className="absolute inset-0 bg-animated" />
      
      {/* Scrolling grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          ...gridStyles,
          opacity: 0.6,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%)',
        }}
      />
      
      {/* Content layer */}
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-auto">
      <div className="max-w-5xl w-full px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div 
              className="p-3 rounded"
              style={{ 
                backgroundColor: hexToRgba(accentColor, 0.15),
                boxShadow: `0 0 30px ${hexToRgba(accentColor, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.1)`
              }}
            >
              <GitBranch style={{ color: accentColor }} size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">R5V Studio</h1>
              <p className="text-gray-400 mt-1">Visual modding for R5Valkyrie</p>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <button
            onClick={onNewProject}
            className="group glass relative overflow-hidden rounded p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{
              borderColor: hexToRgba(accentColor, 0.2),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.4);
              e.currentTarget.style.boxShadow = `0 14px 28px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.25), 0 0 40px ${hexToRgba(accentColor, 0.15)}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.2);
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Subtle gradient overlay */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.08)} 0%, transparent 60%)`
              }}
            />
            <div className="relative flex items-center gap-5">
              <div 
                className="p-4 rounded transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: hexToRgba(accentColor, 0.15),
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`
                }}
              >
                <FilePlus size={28} style={{ color: lightenColor(accentColor, 30) }} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">New Project</h3>
                <p className="text-sm text-gray-400">Start with a fresh visual script</p>
              </div>
              <ArrowRight 
                size={20} 
                className="text-gray-600 group-hover:text-gray-400 transition-all duration-300 group-hover:translate-x-1"
              />
            </div>
            <div 
              className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ 
                backgroundColor: hexToRgba(accentColor, 0.2),
                color: lightenColor(accentColor, 40)
              }}
            >
              Ctrl+N
            </div>
          </button>

          <button
            onClick={onOpenProject}
            className="group glass relative overflow-hidden rounded p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{
              borderColor: 'rgba(59, 130, 246, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.boxShadow = '0 14px 28px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.25), 0 0 40px rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Subtle gradient overlay */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 60%)'
              }}
            />
            <div className="relative flex items-center gap-5">
              <div 
                className="p-4 rounded transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <FolderOpen size={28} className="text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">Open Project</h3>
                <p className="text-sm text-gray-400">Browse for an existing project</p>
              </div>
              <ArrowRight 
                size={20} 
                className="text-gray-600 group-hover:text-gray-400 transition-all duration-300 group-hover:translate-x-1"
              />
            </div>
            <div 
              className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: 'rgb(147, 197, 253)'
              }}
            >
              Ctrl+O
            </div>
          </button>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="glass rounded overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8">
              <Clock size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recent Projects</h2>
            </div>
            <div className="divide-y divide-white/5">
              {recentProjects.slice(0, 5).map((project, index) => (
                <button
                  key={index}
                  onClick={() => onOpenRecent(project.path)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-all group"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRgba(accentColor, 0.05);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110"
                      style={{ backgroundColor: hexToRgba(accentColor, 0.12) }}
                    >
                      <FileText size={16} style={{ color: lightenColor(accentColor, 30) }} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white group-hover:text-white/90">{project.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-lg font-mono">{project.path}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{formatDate(project.lastOpened)}</span>
                    <ArrowRight 
                      size={14} 
                      className="text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state if no recent projects */}
        {recentProjects.length === 0 && (
          <div className="glass rounded p-8 text-center">
            <div className="text-gray-500 mb-2">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No recent projects</p>
            </div>
            <p className="text-xs text-gray-600">Your recently opened projects will appear here</p>
          </div>
        )}

        {/* Footer Tips */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-600">
            <kbd className="px-2 py-1 bg-white/5 border border-white/8 rounded text-[10px] text-gray-400 font-mono">Ctrl+S</kbd>
            <span className="mx-2 text-gray-700">save</span>
            <kbd className="px-2 py-1 bg-white/5 border border-white/8 rounded text-[10px] text-gray-400 font-mono">Ctrl+Shift+S</kbd>
            <span className="mx-2 text-gray-700">export</span>
            <kbd className="px-2 py-1 bg-white/5 border border-white/8 rounded text-[10px] text-gray-400 font-mono">Ctrl+Space</kbd>
            <span className="mx-2 text-gray-700">spotlight</span>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

function FileText({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
