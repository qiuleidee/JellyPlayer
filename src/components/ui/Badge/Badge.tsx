import { type ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeColor = 'default' | 'accent' | 'green' | 'red' | 'blue' | 'yellow' | 'purple';
type BadgeVariant = 'filled' | 'subtle' | 'outline';
type BadgeSize = 'xs' | 'sm' | 'md';
type MediaBadgeType = '4k' | 'hdr' | 'dv' | 'atmos';

interface BadgeProps {
  /** 颜色 */
  color?: BadgeColor;
  /** 样式变体 */
  variant?: BadgeVariant;
  /** 尺寸 */
  size?: BadgeSize;
  /** 特殊媒体类型（4K/HDR/DV/Atmos），使用时 color 和 variant 无效 */
  media?: MediaBadgeType;
  /** 左侧图标 */
  icon?: ReactNode;
  /** 额外 className */
  className?: string;
  children: ReactNode;
}

export default function Badge({
  color = 'default',
  variant = 'subtle',
  size = 'sm',
  media,
  icon,
  className = '',
  children,
}: BadgeProps) {
  if (media) {
    return (
      <span className={`${styles.badge} ${styles[`badge-${size}`]} ${styles[`badge-${media}`]} ${className}`}>
        {icon && <span>{icon}</span>}
        {children}
      </span>
    );
  }

  return (
    <span
      className={`${styles.badge} ${styles[`badge-${size}`]} ${styles[`badge-${variant}`]} ${styles[`badge-${color}`]} ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
