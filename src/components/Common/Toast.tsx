import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

// ─── Provider ────────────────────────────────────────────────────────────────
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

// ─── Single Toast Item ────────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastType, { bar: string; icon: string; bg: string; border: string }> = {
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-500', bg: 'bg-white dark:bg-zinc-900', border: 'border-emerald-100 dark:border-emerald-900/40' },
  error:   { bar: 'bg-rose-500',    icon: 'text-rose-500',    bg: 'bg-white dark:bg-zinc-900', border: 'border-rose-100 dark:border-rose-900/40' },
  warning: { bar: 'bg-amber-400',   icon: 'text-amber-500',   bg: 'bg-white dark:bg-zinc-900', border: 'border-amber-100 dark:border-amber-900/40' },
  info:    { bar: 'bg-primary',     icon: 'text-primary',     bg: 'bg-white dark:bg-zinc-900', border: 'border-primary/20' },
};

const ToastItem: React.FC<{ t: Toast; onDismiss: (id: string) => void }> = ({ t, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[t.type];
  const s = STYLES[t.type];

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(show);
  }, []);

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-4 px-5 py-4 rounded-2xl shadow-2xl border ${s.bg} ${s.border} overflow-hidden
        transition-all duration-500 ease-out w-full max-w-sm
        ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-r-full ${s.bar}`} />

      {/* Icon */}
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.icon}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-zinc-900 dark:text-white text-sm leading-snug">{t.title}</p>
        {t.message && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t.message}</p>}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="إغلاق"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      {(t.duration ?? 4000) > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-[2px] ${s.bar} opacity-40 rounded-full`}
          style={{
            animation: `shrink ${t.duration ?? 4000}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
};

// ─── Toast Container ──────────────────────────────────────────────────────────
export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <>
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
        style={{ direction: 'ltr' }}
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem t={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastProvider;
