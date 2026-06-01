import { type ReactNode, useState } from 'react';
import styles from './Tabs.module.css';

interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export default function Tabs({ items, defaultActiveId, onChange, className = '' }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultActiveId || items[0]?.id);

  const handleTabClick = (id: string) => {
    setActiveId(id);
    if (onChange) onChange(id);
  };

  return (
    <div className={`${styles['tabs-container']} ${className}`}>
      <div className={styles['tabs-list']} role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeId === item.id}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            className={`${styles.tab} ${activeId === item.id ? styles['tab-active'] : ''}`}
            onClick={() => handleTabClick(item.id)}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          className={`${styles['tabs-panel']} ${activeId === item.id ? styles['tabs-panel-active'] : ''}`}
        >
          {activeId === item.id && item.content}
        </div>
      ))}
    </div>
  );
}
