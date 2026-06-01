import { useState, useRef, useEffect, type CSSProperties, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import styles from './LazyImage.module.css';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'placeholder'> {
  /** 图片 URL */
  src: string;
  /** 替代文字 */
  alt: string;
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 长宽比（如 '2/3' 或 '16/9'） */
  aspectRatio?: string;
  /** 圆角 */
  borderRadius?: string | number;
  /** Blurhash 值（来自 Jellyfin API） */
  blurhash?: string;
  /** 容器 className */
  className?: string;
  /** 容器样式 */
  containerStyle?: CSSProperties;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  borderRadius,
  blurhash,
  className = '',
  containerStyle,
  ...imgProps
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 重置加载状态
    setLoaded(false);
    setError(false);

    if (!src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src;
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const style: CSSProperties = {
    width,
    height,
    aspectRatio,
    borderRadius,
    ...containerStyle,
  };

  return (
    <div
      ref={containerRef}
      className={`${styles['lazy-image-container']} ${className}`}
      style={style}
    >
      {/* 占位层 */}
      <div className={`${styles['lazy-image-placeholder']} ${loaded ? styles.loaded : ''}`}>
        {error ? (
          <span className={styles['lazy-image-fallback']}>
            <ImageOff size={32} />
          </span>
        ) : (
          <span className={styles['lazy-image-fallback']}>
            <ImageOff size={24} strokeWidth={1} />
          </span>
        )}
      </div>

      {/* 实际图片 */}
      {!error && (
        <img
          ref={imgRef}
          className={`${styles['lazy-image']} ${loaded ? styles.loaded : ''}`}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          decoding="async"
          {...imgProps}
        />
      )}
    </div>
  );
}
