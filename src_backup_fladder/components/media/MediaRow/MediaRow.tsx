import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PosterCard } from '../PosterCard';
import { Skeleton } from '../../ui';
import type { BaseItemDto } from '../../../types/items';
import styles from './MediaRow.module.css';

interface MediaRowProps {
  title: string;
  items: BaseItemDto[];
  isLoading?: boolean;
  moreLink?: string;
  cardVariant?: 'poster' | 'backdrop';
}

export default function MediaRow({ title, items, isLoading, moreLink, cardVariant = 'poster' }: MediaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className={styles['media-row-container']}>
        <div className={styles['row-header']}>
          <Skeleton variant="title" width={150} />
        </div>
        <div className={styles['row-scroll-area']}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles['row-item']}>
              <Skeleton variant="poster" />
              <div style={{ marginTop: '8px' }}>
                <Skeleton variant="text" width="80%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className={styles['media-row-container']}>
      <div className={styles['row-header']}>
        <h2 className={styles['row-title']}>{title}</h2>
        {moreLink && (
          <Link to={moreLink} className={styles['row-more']}>
            查看更多 <ChevronRight size={16} />
          </Link>
        )}
      </div>

      <div className={styles['row-scroll-container']}>
        <div className={styles['scroll-mask-left']} style={{ opacity: canScrollLeft ? 1 : 0 }} />
        
        {canScrollLeft && (
          <button className={`${styles['scroll-btn']} ${styles['scroll-btn-left']}`} onClick={() => scroll('left')}>
            <ChevronLeft size={24} />
          </button>
        )}

        <div className={styles['row-scroll-area']} ref={scrollRef} onScroll={checkScroll}>
          {items.map((item) => (
            <div key={item.Id} className={`${styles['row-item']} ${cardVariant === 'backdrop' ? styles['row-item-backdrop'] : ''}`}>
              <PosterCard item={item} variant={cardVariant} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button className={`${styles['scroll-btn']} ${styles['scroll-btn-right']}`} onClick={() => scroll('right')}>
            <ChevronRight size={24} />
          </button>
        )}

        <div className={styles['scroll-mask-right']} style={{ opacity: canScrollRight ? 1 : 0 }} />
      </div>
    </div>
  );
}
