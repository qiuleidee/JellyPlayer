import { type CSSProperties } from 'react';
import styles from './Skeleton.module.css';

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'poster' | 'backdrop' | 'custom';

interface SkeletonProps {
  /** 形状变体 */
  variant?: SkeletonVariant;
  /** 自定义宽度 */
  width?: string | number;
  /** 自定义高度 */
  height?: string | number;
  /** 自定义圆角 */
  borderRadius?: string | number;
  /** 额外 className */
  className?: string;
  /** 额外样式 */
  style?: CSSProperties;
}

export default function Skeleton({
  variant = 'custom',
  width,
  height,
  borderRadius,
  className = '',
  style,
}: SkeletonProps) {
  const variantClass = variant !== 'custom' ? styles[`skeleton-${variant}`] : '';

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
