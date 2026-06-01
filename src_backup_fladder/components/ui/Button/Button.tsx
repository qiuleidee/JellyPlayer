import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 样式变体 */
  variant?: ButtonVariant;
  /** 尺寸 */
  size?: ButtonSize;
  /** 是否为图标按钮（正方形） */
  icon?: boolean;
  /** 是否为圆形 */
  round?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 全宽 */
  fullWidth?: boolean;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标 */
  rightIcon?: ReactNode;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon = false,
      round = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.button,
      styles[`button-${variant}`],
      icon ? styles[`button-icon${size === 'sm' ? '-sm' : size === 'lg' ? '-lg' : ''}`] : styles[`button-${size}`],
      round && styles['button-round'],
      loading && styles['button-loading'],
      fullWidth && styles['button-full'],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className={styles['button-spinner']} />}
        <span className={styles['button-content']}>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
