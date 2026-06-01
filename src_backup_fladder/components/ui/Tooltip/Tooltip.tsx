import { type ReactNode } from 'react';
import styles from './Tooltip.module.css';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  placement?: Placement;
  children: ReactNode;
  className?: string;
}

export default function Tooltip({ content, placement = 'top', children, className = '' }: TooltipProps) {
  if (!content) return <>{children}</>;

  return (
    <div className={`${styles['tooltip-wrapper']} ${className}`}>
      {children}
      <div className={`${styles['tooltip-content']} ${styles[`tooltip-${placement}`]}`}>
        {content}
      </div>
    </div>
  );
}
