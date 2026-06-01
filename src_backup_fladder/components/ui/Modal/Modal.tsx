import { type ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 尺寸 */
  size?: ModalSize;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnOverlay?: boolean;
  /** 底部操作区 */
  footer?: ReactNode;
  children?: ReactNode;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 10,
    transition: { duration: 0.2 },
  },
};

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  footer,
  children,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles['modal-overlay']}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeOnOverlay ? onClose : undefined}
        >
          <motion.div
            className={`${styles.modal} ${styles[`modal-${size}`]}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {(title || showClose) && (
              <div className={styles['modal-header']}>
                {title && <h2 className={styles['modal-title']}>{title}</h2>}
                {showClose && (
                  <button
                    className={styles['modal-close']}
                    onClick={onClose}
                    aria-label="关闭"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className={styles['modal-body']}>{children}</div>
            {footer && <div className={styles['modal-footer']}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
