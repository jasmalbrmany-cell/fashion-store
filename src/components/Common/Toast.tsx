import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error:   (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info:    (title: string, message?: string, duration?: number) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (title: string, message?: string, duration?: number) => add('success', title, message, duration),
    error:   (title: string, message?: string, duration?: number) => add('error',   title, message, duration ?? 6000),
    warning: (title: string, message?: string, duration?: number) => add('warning', title, message, duration),
    info:    (title: string, message?: string, duration?: number) => add('info',    title, message, duration),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
};

const ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastType, { bar: string; icon: string; bg: string; border: string }> = {
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-500', bg: 'bg-white', border: 'border-emerald-200' },
  error:   { bar: 'bg-rose-500',    icon: 'text-rose-500',    bg: 'bg-white', border: 'border-rose-200' },
  warning: { bar: 'bg-amber-400',   icon: 'text-amber-500',   bg: 'bg-white', border: 'border-amber-200' },
  info:    { bar: 'bg-blue-500',    icon: 'text-blue-500',    bg: 'bg-white', border: 'border-blue-200' },
};

const ToastItem: React.FC<{ t: Toast; onDismiss: (id: string) => void }> = ({ t, onDismiss }) => {
  const Icon = ICONS[t.type];
  const s = STYLES[t.type];

  // Simply show it right away without relying on complex state transitions
  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border ${s.bg} ${s.border} overflow-hidden w-full max-w-sm`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${s.bar}`} />
      
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.icon}`} />

      <div className="flex-1 min-w-0 pr-6">
        <p className="font-bold text-gray-900 text-sm leading-snug">{t.title}</p>
        {t.message && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t.message}</p>}
      </div>

      <button
        onClick={() => onDismiss(t.id)}
        className="absolute top-3 right-3 shrink-0 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Close"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 md:bottom-6 md:right-6 md:top-auto z-[99999] flex flex-col gap-3 items-end pointer-events-none"
      style={{ direction: 'ltr' }}
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full animate-in fade-in slide-in-from-right-8 duration-300">
          <ToastItem t={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
};

export default ToastProvider;
