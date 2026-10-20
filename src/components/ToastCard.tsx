import React, { useState, useEffect, useRef } from 'react';
import { ToastItem } from '../context/ToastContext';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Sparkles,
  Zap,
  Package,
  X,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.duration || 6500);
  const duration = toast.duration || 6500;

  useEffect(() => {
    if (duration <= 0) return;

    let animFrame: number;
    let lastTick = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastTick;
      lastTick = now;

      if (!isHovered) {
        remainingTimeRef.current -= elapsed;
        const pct = Math.max(0, (remainingTimeRef.current / duration) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          onDismiss(toast.id);
          return;
        }
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [duration, isHovered, onDismiss, toast.id]);

  const getStyle = () => {
    switch (toast.type) {
      case 'order-approved':
      case 'order-completed':
        return {
          border: 'border-emerald-200',
          bg: 'bg-white/95',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          progressColor: 'bg-emerald-600',
          badgeText: 'ORDER APPROVED',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'order-new':
        return {
          border: 'border-blue-200',
          bg: 'bg-white/95',
          icon: <Package className="w-5 h-5 text-blue-600 shrink-0" />,
          progressColor: 'bg-blue-600',
          badgeText: 'NEW ORDER',
          badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'order-rejected':
      case 'error':
        return {
          border: 'border-rose-200',
          bg: 'bg-white/95',
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          progressColor: 'bg-rose-600',
          badgeText: 'ATTENTION',
          badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'order-updated':
        return {
          border: 'border-amber-200',
          bg: 'bg-white/95',
          icon: <Zap className="w-5 h-5 text-amber-600 shrink-0" />,
          progressColor: 'bg-amber-600',
          badgeText: 'LOG UPDATED',
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'warning':
        return {
          border: 'border-amber-200',
          bg: 'bg-white/95',
          icon: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
          progressColor: 'bg-amber-600',
          badgeText: 'WARNING',
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      default:
        return {
          border: 'border-slate-200',
          bg: 'bg-white/95',
          icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
          progressColor: 'bg-blue-600',
          badgeText: 'SYSTEM NOTICE',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const style = getStyle();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto relative w-full rounded-2xl border ${style.border} 
        ${style.bg} glass-panel
        backdrop-blur-xl shadow-lg 
        p-4 overflow-hidden transition-all duration-200 transform translate-y-0 hover:-translate-y-0.5`}
      role="alert"
    >
      {/* Real-time ping marker */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${style.badgeStyle}`}>
            {style.badgeText}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Toast Content */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-xl bg-slate-50 border border-slate-200">
          {style.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
            {toast.title}
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
            {toast.message}
          </p>

          {/* Action Button */}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl 
                clay-button-primary text-white 
                text-xs font-semibold shadow-sm 
                transition-all active:scale-95 cursor-pointer"
            >
              <span>{toast.action.label}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Countdown Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all linear ${style.progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
