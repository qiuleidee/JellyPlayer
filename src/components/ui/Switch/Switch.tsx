import { type ReactNode } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function Switch({ checked, onChange, label, disabled, className = '' }: SwitchProps) {
  return (
    <label className={`${styles['switch-container']} ${disabled ? styles['switch-disabled'] : ''} ${className}`}>
      <div className={`${styles['switch-track']} ${checked ? styles['switch-track-active'] : ''}`}>
        <div className={styles['switch-thumb']} />
      </div>
      {label && <span className={styles['switch-label']}>{label}</span>}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
    </label>
  );
}
