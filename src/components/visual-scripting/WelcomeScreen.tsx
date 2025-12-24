import { FilePlus, FolderOpen, Clock, Sparkles } from 'lucide-react';

interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
}

interface WelcomeScreenProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onOpenRecent: (path: string) => void;
  recentProjects: RecentProject[];
}

export default function WelcomeScreen({ 
  onNewProject, 
  onOpenProject, 
  onOpenRecent,
  recentProjects 
}: WelcomeScreenProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins === 0 ? 'Just now' : `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0f1419] via-[#151a21] to-[#1a1f26] flex items-center justify-center overflow-auto">
      <div className="max-w-4xl w-full px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="text-purple-500" size={40} />
            <h1 className="text-5xl font-bold text-white">R5V Script Studio</h1>
          </div>
          <p className="text-xl text-gray-400">Visual scripting for R5Valkyrie</p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <button
            onClick={onNewProject}
            className="group relative bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border-2 border-purple-500/30 hover:border-purple-500/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
                <FilePlus size={32} className="text-purple-400 group-hover:text-purple-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">New Project</h3>
                <p className="text-sm text-gray-400">Start with a fresh visual script</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Ctrl+N
            </div>
          </button>

          <button
            onClick={onOpenProject}
            className="group relative bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border-2 border-blue-500/30 hover:border-blue-500/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-colors">
                <FolderOpen size={32} className="text-blue-400 group-hover:text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Open Project</h3>
                <p className="text-sm text-gray-400">Browse for an existing project</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Ctrl+O
            </div>
          </button>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="bg-[#1a1f26]/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
            </div>
            <div className="space-y-2">
              {recentProjects.slice(0, 5).map((project, index) => (
                <button
                  key={index}
                  onClick={() => onOpenRecent(project.path)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded group-hover:bg-purple-500/30 transition-colors">
                      <FileText size={16} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{project.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-md">{project.path}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(project.lastOpened)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Tips */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Tip: Use <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Ctrl+S</kbd> to save and{' '}
            <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Ctrl+Shift+S</kbd> to export
          </p>
        </div>
      </div>
    </div>
  );
}

function FileText({ size, className }: { size: number; className?: string }) {
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
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
