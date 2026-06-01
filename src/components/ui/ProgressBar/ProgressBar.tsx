import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0-100
  buffer?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({ value, buffer = 0, size = 'md', className = '' }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  const safeBuffer = Math.max(0, Math.min(100, buffer));

  return (
    <div className={`${styles['progress-container']} ${styles[`progress-${size}`]} ${className}`}>
      <div className={styles['progress-track']}>
        {buffer > 0 && (
          <div className={styles['progress-buffer']} style={{ width: `${safeBuffer}%` }} />
        )}
        <div className={styles['progress-fill']} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
