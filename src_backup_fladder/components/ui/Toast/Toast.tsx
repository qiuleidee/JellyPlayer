import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (data: Omit<ToastData, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast 必须在 ToastProvider 内使用');
  return context;
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const toastVariants = {
  initial: { opacity: 0, x: 60, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit: { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (data: Omit<ToastData, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = data.duration ?? 4000;

      setToasts((prev) => [...prev, { ...data, id }]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {createPortal(
        <div className={styles['toast-container']}>
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                className={`${styles.toast} ${styles[`toast-${t.type}`]}`}
                variants={toastVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                role="alert"
              >
                <span className={styles['toast-icon']}>{icons[t.type]}</span>
                <div className={styles['toast-content']}>
                  {t.title && <div className={styles['toast-title']}>{t.title}</div>}
                  <div className={styles['toast-message']}>{t.message}</div>
                  {t.action && (
                    <button className={styles['toast-action']} onClick={t.action.onClick}>
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button className={styles['toast-close']} onClick={() => dismiss(t.id)} aria-label="关闭">
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
