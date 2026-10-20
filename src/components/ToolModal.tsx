import React, { useEffect } from 'react';
import { Tool, PackId } from '../types';
import { ToolRunner } from './ToolRunner';
import { X, Lock, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ToolModalProps {
  tool: Tool;
  onClose: () => void;
  onOpenCheckout: (packId: PackId) => void;
}

export const ToolModal: React.FC<ToolModalProps> = ({
  tool,
  onClose,
  onOpenCheckout,
}) => {
  const { hasAccessToPack } = useAuth();
  const isUnlocked = hasAccessToPack(tool.pack);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tool-modal-title"
    >
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/90 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h2 id="tool-modal-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {tool.name}
              </h2>
              {tool.pack ? (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 ${
                    isUnlocked
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isUnlocked ? `${tool.pack.toUpperCase()} ACTIVE` : `${tool.pack.toUpperCase()} PACK`}
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  FREE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{tool.description}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
            aria-label="Close tool dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Workspace Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white/70">
          <ToolRunner tool={tool} onOpenCheckout={onOpenCheckout} />
        </div>
      </div>
    </div>
  );
};
