import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3500);
    },
    [removeToast]
  );

  const icons = {
    success: FiCheck,
    error: FiAlertCircle,
    info: FiInfo,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <motion.div className="fixed right-4 top-20 z-[100] flex flex-col gap-2 sm:right-6">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type] || FiInfo;
            const colors = {
              success: 'bg-emerald-600',
              error: 'bg-red-600',
              info: 'bg-brand-600',
            };
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={`flex min-w-[260px] max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-card ${colors[toast.type]}`}
              >
                <Icon className="shrink-0 text-lg" />
                <span className="flex-1">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-1 hover:bg-white/20"
                  aria-label="Dismiss"
                >
                  <FiX />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
