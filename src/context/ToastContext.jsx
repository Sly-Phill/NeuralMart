import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Heart, Info, AlertTriangle, X } from 'lucide-react';

const ToastCtx = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, cls: 'text-emerald-400' },
  info: { Icon: Info, cls: 'text-electric-400' },
  error: { Icon: AlertTriangle, cls: 'text-rose-400' },
  love: { Icon: Heart, cls: 'text-pink-400 fill-pink-400' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((message, { type = 'success', description, action } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, message, type, description, action }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-auto md:left-auto md:right-6 md:top-24 md:items-end">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { Icon, cls } = ICONS[t.type] || ICONS.info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-4 shadow-glow"
                role="status"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t.message}</p>
                  {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
                  {t.action && (
                    <button onClick={() => { t.action.onClick(); dismiss(t.id); }} className="mt-2 text-xs font-semibold text-violet-500 hover:underline dark:text-violet-400">
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
