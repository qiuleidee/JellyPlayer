import { useState, useRef, useEffect } from 'react';
import styles from './Slider.module.css';

export interface SliderMarker {
  value: number; // 必须在 min 和 max 之间
  label?: string;
  type?: string; // 'chapter' | 'intro'
}

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  markers?: SliderMarker[];
  formatTooltip?: (val: number) => string;
}

export default function Slider({ value, min = 0, max = 100, step = 1, onChange, disabled, className = '', markers = [], formatTooltip }: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const updateValue = (clientX: number) => {
    if (!containerRef.current || disabled) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    let newValue = min + (x / rect.width) * (max - min);
    
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleTouchMove = (e: TouchEvent) => updateValue(e.touches[0].clientX);
    const handleEnd = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, min, max, step, disabled]);

  return (
    <div
      ref={containerRef}
      className={`${styles['slider-container']} ${disabled ? styles['slider-disabled'] : ''} ${className}`}
      onMouseMove={(e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        setHoverValue(min + (x / rect.width) * (max - min));
      }}
      onMouseLeave={() => setHoverValue(null)}
      onMouseDown={(e) => {
        if (disabled) return;
        setIsDragging(true);
        updateValue(e.clientX);
      }}
      onTouchStart={(e) => {
        if (disabled) return;
        setIsDragging(true);
        updateValue(e.touches[0].clientX);
      }}
    >
      <div className={styles['slider-track']}>
        {markers.map((marker, idx) => {
          const markerPercent = Math.max(0, Math.min(100, ((marker.value - min) / (max - min)) * 100));
          return (
            <div 
              key={idx} 
              className={styles['slider-marker']} 
              style={{ left: `${markerPercent}%` }} 
              title={marker.label}
            />
          );
        })}
        <div className={styles['slider-fill']} style={{ width: `${percentage}%` }} />
        {hoverValue !== null && formatTooltip && (
          <div 
            className={styles['slider-tooltip']} 
            style={{ left: `${((hoverValue - min) / (max - min)) * 100}%` }}
          >
            {formatTooltip(hoverValue)}
          </div>
        )}
      </div>
      <div className={styles['slider-thumb']} style={{ left: `${percentage}%` }} />
    </div>
  );
}
