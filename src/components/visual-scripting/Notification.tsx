import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, FolderOpen } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 for persistent
}

interface NotificationProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

function Notification({ notification, onDismiss }: NotificationProps) {
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-400" />,
    error: <XCircle size={20} className="text-red-400" />,
    warning: <AlertCircle size={20} className="text-yellow-400" />,
    info: <AlertCircle size={20} className="text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg ${bgColors[notification.type]} animate-slide-in`}
      style={{ minWidth: 320, maxWidth: 450 }}
    >
      {icons[notification.type]}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm">{notification.title}</div>
        {notification.message && (
          <div className="text-xs text-gray-400 mt-1 whitespace-pre-wrap break-words">{notification.message}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('success', title, message, duration);
  }, [addNotification]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('error', title, message, duration ?? 8000);
  }, [addNotification]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('warning', title, message, duration);
  }, [addNotification]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification('info', title, message, duration);
  }, [addNotification]);

  return {
    notifications,
    dismissNotification,
    success,
    error,
    warning,
    info,
  };
}

// Export Path Modal
interface ExportPathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  accentColor?: string;
}

export function ExportPathModal({ isOpen, onClose, onSelect, accentColor = '#8B5CF6' }: ExportPathModalProps) {
  const [selectedPath, setSelectedPath] = useState('');

  const handleBrowse = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        setSelectedPath(dir);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedPath) {
      onSelect(selectedPath);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1a1f28] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          <FolderOpen size={24} style={{ color: accentColor }} />
          <div>
            <h2 className="text-lg font-semibold text-white">Set Export Path</h2>
            <p className="text-sm text-gray-400">Select your R5Reloaded mods folder</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-300">
            Please select the folder where your mods should be exported. This is typically located at:
          </p>
          <code className="block px-3 py-2 bg-black/30 rounded-lg text-sm text-purple-400 font-mono">
            R5VLibrary/LIVE/mods/
          </code>

          <div className="flex gap-2">
            <input
              type="text"
              value={selectedPath}
              placeholder="No folder selected..."
              className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              readOnly
            />
            <button
              onClick={handleBrowse}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FolderOpen size={16} />
              Browse
            </button>
          </div>

          <p className="text-xs text-gray-500">
            This setting will be saved and used for all future compiles.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPath}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
