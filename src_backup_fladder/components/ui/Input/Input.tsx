import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';
import styles from './Input.module.css';

type InputStatus = 'idle' | 'checking' | 'success' | 'error';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 标签文字 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 辅助提示文字 */
  hint?: string;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标（可点击） */
  rightIcon?: ReactNode;
  /** 右侧图标点击事件 */
  onRightIconClick?: () => void;
  /** 状态指示灯（用于服务器连接检测） */
  status?: InputStatus;
  /** 大尺寸 */
  large?: boolean;
  /** 外层容器 className */
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconClick,
      status,
      large = false,
      wrapperClassName = '',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const containerClasses = [
      styles['input-container'],
      leftIcon && styles['has-left-icon'],
      (rightIcon || status) && styles['has-right-icon'],
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClasses = [
      styles['input-wrapper'],
      error && styles['input-error'],
      large && styles['input-lg'],
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className={styles['input-label']}>
            {label}
          </label>
        )}
        <div className={containerClasses}>
          {leftIcon && (
            <span className={styles['input-icon-left']}>{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${styles.input} ${className}`}
            {...props}
          />
          {rightIcon && !status && (
            <span
              className={styles['input-icon-right']}
              onClick={onRightIconClick}
              role={onRightIconClick ? 'button' : undefined}
              tabIndex={onRightIconClick ? 0 : undefined}
            >
              {rightIcon}
            </span>
          )}
          {status && status !== 'idle' && (
            <span
              className={`${styles['input-status']} ${styles[`input-status-${status}`]}`}
              aria-label={
                status === 'checking' ? '检测中' :
                status === 'success' ? '连接成功' :
                '连接失败'
              }
            />
          )}
        </div>
        {error && (
          <span className={styles['input-error-message']}>{error}</span>
        )}
        {hint && !error && (
          <span className={styles['input-hint']}>{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
