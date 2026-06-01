import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Play, Film, Tv } from 'lucide-react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { LazyImage } from '../../ui';
import { ImageUtils, getImageUrl } from '../../../api/images';
import { getFirstEpisode } from '../../../api/details';
import { useAuthStore } from '../../../stores/authStore';
import type { BaseItemDto } from '../../../types/items';
import VideoPreview from './VideoPreview';
import styles from './PosterCard.module.css';

interface PosterCardProps {
  item: BaseItemDto;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'poster' | 'backdrop';
  showTitle?: boolean;
  className?: string;
}

export default function PosterCard({ item, size = 'md', variant = 'poster', showTitle = true, className = '' }: PosterCardProps) {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const [isHovered, setIsHovered] = useState(false);

  // 生成图片 URL
  const posterUrl = useMemo(() => {
    // 强制剧集单集使用自身截图（原图是16:9横向的）
    if (item.Type === 'Episode' && variant === 'backdrop') {
      return getImageUrl(item.Id, { type: 'Primary', maxWidth: 600, tag: item.ImageTags?.Primary });
    }
    
    if (variant === 'backdrop') {
      // 优先使用背景图
      if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
        return ImageUtils.getBackdropUrl(item.Id, item.BackdropImageTags[0]);
      } else {
        // 如果没有背景图，回退取 Primary 原图，但比例限制为横版
        return getImageUrl(item.Id, { type: 'Primary', maxWidth: 600, tag: item.ImageTags?.Primary });
      }
    }
    
    return ImageUtils.getPosterUrl(item.Id, item.ImageTags?.Primary);
  }, [item, variant]);

  // 生成路由链接
  const linkTo = useMemo(() => {
    if (item.Type === 'Movie') return `/movie/${item.Id}`;
    if (item.Type === 'Series') return `/series/${item.Id}`;
    if (item.Type === 'Episode') return `/series/${item.SeriesId || item.Id}`; // 返回到该集所属的剧集页面
    return `/library/${item.Id}`;
  }, [item.Id, item.Type]);

  const handlePlayClick = async (e?: React.MouseEvent | KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (item.Type === 'Series' && userId) {
      try {
        const ep = await getFirstEpisode(userId, item.Id);
        if (ep) {
          navigate(`/play/${ep.Id}`);
        } else {
          alert('该剧集没有任何集数，无法播放。');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      navigate(`/play/${item.Id}`);
    }
  };

  // 接入空间导航焦点引擎
  const { ref, focused } = useFocusable({
    onEnterPress: () => {
      // TV 遥控器按下 OK 键时，直接触发导航
      navigate(linkTo);
    }
  });

  // 计算进度条
  const progressPercent = useMemo(() => {
    if (!item.UserData || !item.RunTimeTicks) return 0;
    return (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100;
  }, [item.UserData, item.RunTimeTicks]);

  // 判断是否已观看完
  const isPlayed = item.UserData?.Played;

  // 副标题信息 (年份或集数)
  const subtitle = useMemo(() => {
    if (item.Type === 'Episode') {
      return `S${item.ParentIndexNumber || 1} : E${item.IndexNumber}`;
    }
    return item.ProductionYear?.toString();
  }, [item]);

  return (
    <Link 
      to={linkTo} 
      ref={ref as any}
      className={`${styles['poster-card']} ${styles[`poster-card-${size}`]} ${variant === 'backdrop' ? styles['variant-backdrop'] : ''} ${focused ? styles['focused'] : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles['poster-wrapper']}>
        {posterUrl ? (
          <LazyImage
            src={posterUrl}
            alt={item.Name}
            className={styles['poster-image']}
          />
        ) : (
          <div className={`${styles['poster-image']} ${styles['poster-fallback']}`}>
             <div className={styles['fallback-icon']}>
               {item.Type === 'Series' || item.Type === 'Episode' ? <Tv size={32} /> : <Film size={32} />}
             </div>
             <span className={styles['fallback-text']}>{item.Name}</span>
          </div>
        )}

        {/* 悬停微动效：延迟视频预览 */}
        {(item.Type === 'Movie' || item.Type === 'Episode') && variant === 'backdrop' && (
          <VideoPreview itemId={item.Id} isHovered={isHovered} />
        )}

        <div className={styles['poster-overlay']}>
          {/* 对于资料库文件夹等容器类型，隐藏无意义的悬停播放按钮 */}
          {item.Type !== 'CollectionFolder' && item.Type !== 'UserView' && item.Type !== 'Folder' && (
            <div className={styles['play-btn-overlay']}>
              <div className={styles['play-btn-circle']} onClick={handlePlayClick}>
                <Play size={24} fill="currentColor" />
              </div>
            </div>
          )}
        </div>

        {isPlayed && (
          <div className={styles['poster-status-icon']}>
            <Check size={14} strokeWidth={3} />
          </div>
        )}

        {progressPercent > 0 && progressPercent < 100 && !isPlayed && (
          <div className={styles['poster-progress']}>
            <div className={styles['poster-progress-fill']} style={{ width: `${progressPercent}%` }} />
            <div className={styles['poster-progress-glow']} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {showTitle && (
        <div className={styles['poster-info']}>
          <div className={`${styles['poster-title']} line-clamp-1`}>{item.Name}</div>
          <div className={styles['poster-meta']}>
            {subtitle && <span>{subtitle}</span>}
            {item.CommunityRating && (
              <span>★ {item.CommunityRating.toFixed(1)}</span>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
