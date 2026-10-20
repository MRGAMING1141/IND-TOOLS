import React from 'react';
import { useToast } from '../context/ToastContext';
import { ToastCard } from './ToastCard';
import { Volume2, VolumeX, Bell, XCircle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const {
    toasts,
    removeToast,
    clearAll,
    soundEnabled,
    toggleSound,
    openHistory,
    unreadCount,
  } = useToast();

  if (toasts.length === 0 && unreadCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[9999] max-w-sm w-full space-y-2.5 pointer-events-none px-3 sm:px-0 transition-all">
      {/* Toast Manager Control Pill (when toasts are active) */}
      {toasts.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">LIVE ALERTS</span>
            <span className="text-slate-500">({toasts.length})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            <button
              onClick={openHistory}
              title="Open Activity History"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
              )}
            </button>

            {toasts.length > 1 && (
              <button
                onClick={clearAll}
                title="Dismiss all"
                className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Cards */}
      <div className="space-y-2.5">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </div>
  );
};
