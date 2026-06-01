import { Link, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { Play, Check, Clock, FolderOpen } from 'lucide-react';
import { ImageUtils } from '../../../api/images';
import type { BaseItemDto } from '../../../types/items';
import styles from './ListView.module.css';

interface ListViewProps {
  items: BaseItemDto[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function ListView({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: ListViewProps) {
  const navigate = useNavigate();
  const { ref } = useInView({
    rootMargin: '200px',
    onChange: (inView: boolean) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage?.();
      }
    },
  });

  const getLink = (item: BaseItemDto) => {
    if (item.Type === 'Movie') return `/movie/${item.Id}`;
    if (item.Type === 'Series') return `/series/${item.Id}`;
    return `/library/${item.Id}`;
  };

  const formatTime = (ticks?: number) => {
    if (!ticks) return '';
    const mins = Math.floor(ticks / 10000 / 1000 / 60);
    return `${mins} 分钟`;
  };

  if (isLoading && items.length === 0) {
    return (
      <div className={styles['list-view']}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${styles['list-item-skeleton']} skeleton`} />
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div>
          <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center relative z-10 shadow-xl group-hover:scale-105 transition-transform duration-500">
            <FolderOpen size={40} className="text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors duration-500" />
          </div>
        </div>
        <h3 className="text-2xl font-bold font-display text-[var(--text-primary)] mb-2">未找到任何内容</h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          当前视图中没有可显示的项目，或者被过滤条件隐藏了。您可以尝试更改分类或调整过滤条件。
        </p>
      </div>
    );
  }

  return (
    <div className={styles['list-view']}>
      {items.map((item) => {
        const isPlayed = item.UserData?.Played;
        const progress = item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
          ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
          : 0;

        return (
          <Link key={item.Id} to={getLink(item)} className={styles['list-item']}>
            <div className={styles['item-poster-wrapper']}>
              <img
                src={ImageUtils.getPosterUrl(item.Id, item.ImageTags.Primary)}
                alt={item.Name}
                className={styles['item-poster']}
                loading="lazy"
              />
              {isPlayed && (
                <div className={styles['status-badge']}>
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              {progress > 0 && progress < 100 && !isPlayed && (
                <div className={styles['progress-bar']}>
                  <div className={styles['progress-fill']} style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>

            <div className={styles['item-content']}>
              <div className={styles['item-header']}>
                <h3 className={styles['item-title']}>{item.Name}</h3>
                {item.ProductionYear && (
                  <span className={styles['item-year']}>{item.ProductionYear}</span>
                )}
              </div>
              
              <div className={styles['item-meta']}>
                {item.CommunityRating && (
                  <span className={styles['meta-tag']}>★ {item.CommunityRating.toFixed(1)}</span>
                )}
                {item.OfficialRating && (
                  <span className={styles['meta-tag']}>{item.OfficialRating}</span>
                )}
                {item.RunTimeTicks && (
                  <span className={styles['meta-tag']}><Clock size={12} className="inline mr-1"/>{formatTime(item.RunTimeTicks)}</span>
                )}
              </div>

              {item.Overview && (
                <p className={styles['item-overview']}>{item.Overview}</p>
              )}

              {item.Genres && item.Genres.length > 0 && (
                <div className={styles['item-genres']}>
                  {item.Genres.slice(0, 4).map(g => (
                    <span key={g} className={styles['genre-pill']}>{g}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles['item-actions']}>
              <button className={styles['play-btn']} onClick={(e) => { e.preventDefault(); navigate(`/play/${item.Id}`); }}>
                <Play size={24} fill="currentColor" />
              </button>
            </div>
          </Link>
        );
      })}

      {hasNextPage && (
        <div ref={ref} className={styles['loading-more']}>
          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      )}
    </div>
  );
}
