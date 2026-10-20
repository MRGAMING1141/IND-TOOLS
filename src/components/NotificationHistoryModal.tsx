import React, { useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Package,
  Volume2,
  VolumeX,
  Info,
} from 'lucide-react';

interface NotificationHistoryModalProps {
  onClose: () => void;
  onOpenSalesLog?: () => void;
  onOpenMyOrders?: () => void;
}

export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({
  onClose,
  onOpenSalesLog,
  onOpenMyOrders,
}) => {
  const { history, clearHistory, soundEnabled, toggleSound } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order-approved':
      case 'order-completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'order-new':
        return <Package className="w-4 h-4 text-blue-400" />;
      case 'order-rejected':
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'order-updated':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Real-Time Notifications & Activity Log</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Live stream of order updates and sales events
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 text-xs bg-white/70">
          {history.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <Bell className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No activity logged yet</p>
              <p className="text-xs text-slate-500">
                You will receive alerts here in real-time when orders are placed or updated.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all flex items-start gap-3"
              >
                <div className="mt-0.5">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                  {item.action && (
                    <button
                      onClick={() => {
                        item.action?.onClick();
                        onClose();
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-[11px] font-semibold underline underline-offset-2 cursor-pointer"
                    >
                      {item.action.label} →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">{history.length} logged events</span>
            <button
              onClick={clearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
