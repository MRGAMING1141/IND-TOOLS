import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { playChime } from '../utils/audioChime';

export type ToastType =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'order-new'
  | 'order-updated'
  | 'order-approved'
  | 'order-completed'
  | 'order-rejected';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Duration in ms before auto-dismiss, defaults to 6500
  action?: ToastAction;
  metadata?: {
    orderId?: string;
    oldStatus?: string;
    newStatus?: string;
    amount?: number;
    userEmail?: string;
    approvedBy?: string;
    packs?: string[];
  };
}

export type ToastInput = Omit<ToastItem, 'id' | 'timestamp'> & {
  id?: string;
  sound?: boolean;
};

interface ToastContextType {
  toasts: ToastItem[];
  history: ToastItem[];
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  clearHistory: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  isHistoryOpen: boolean;
  openHistory: () => void;
  closeHistory: () => void;
  unreadCount: number;
  markHistoryRead: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const SOUND_STORAGE_KEY = 'ind_hub_toast_sound_enabled';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [history, setHistory] = useState<ToastItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(SOUND_STORAGE_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch (e) {
        console.error(e);
      }
      if (next) {
        playChime('notification');
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (input: ToastInput): string => {
      const id = input.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = {
        id,
        type: input.type,
        title: input.title,
        message: input.message,
        timestamp: new Date(),
        duration: input.duration ?? 6500,
        action: input.action,
        metadata: input.metadata,
      };

      // Play audio chime if sound is enabled
      if (soundEnabled && input.sound !== false) {
        if (input.type === 'order-approved' || input.type === 'order-completed' || input.type === 'success') {
          playChime('success');
        } else if (input.type === 'order-rejected' || input.type === 'error' || input.type === 'warning') {
          playChime('alert');
        } else {
          playChime('notification');
        }
      }

      setToasts((prev) => {
        // Keep at most 5 floating toasts at a time to prevent screen clutter
        const filtered = prev.filter((t) => t.id !== id);
        return [newToast, ...filtered].slice(0, 5);
      });

      setHistory((prev) => [newToast, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);

      return id;
    },
    [soundEnabled]
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setUnreadCount(0);
  }, []);

  const openHistory = useCallback(() => {
    setIsHistoryOpen(true);
    setUnreadCount(0);
  }, []);

  const closeHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const markHistoryRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        history,
        addToast,
        removeToast,
        clearAll,
        clearHistory,
        soundEnabled,
        toggleSound,
        isHistoryOpen,
        openHistory,
        closeHistory,
        unreadCount,
        markHistoryRead,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
