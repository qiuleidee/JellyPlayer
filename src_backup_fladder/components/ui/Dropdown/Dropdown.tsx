import { type ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Dropdown.module.css';

interface DropdownItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'left' | 'right';
  direction?: 'up' | 'down';
}

export default function Dropdown({ trigger, items, className = '', align = 'right', direction = 'down' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    if (item.onClick) item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`${styles['dropdown-container']} ${className}`} ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles['dropdown-menu']}
            style={{ 
              [align]: 0, 
              ...(direction === 'up' ? { bottom: 'calc(100% + 8px)', top: 'auto', transformOrigin: `bottom ${align}` } : {})
            }}
            initial={{ opacity: 0, scale: 0.95, y: direction === 'up' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: direction === 'up' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
          >
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={`div-${index}`} className={styles['dropdown-divider']} />;
              }
              return (
                <button
                  key={item.id}
                  className={`${styles['dropdown-item']} ${item.danger ? styles['dropdown-item-danger'] : ''}`}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                >
                  {item.icon && <span style={{ marginRight: '8px' }}>{item.icon}</span>}
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
