import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { Button, Badge, Skeleton } from '../../ui';
import { ImageUtils } from '../../../api/images';
import { getFirstEpisode } from '../../../api/details';
import { useAuthStore } from '../../../stores/authStore';
import type { BaseItemDto } from '../../../types/items';
import styles from './HeroBanner.module.css';

interface HeroBannerProps {
  items: BaseItemDto[];
  isLoading?: boolean;
}

export default function HeroBanner({ items, isLoading }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);

  // 自动轮播
  useEffect(() => {
    setCurrentIndex(0);
    if (!items || items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items]);

  if (isLoading) {
    return <Skeleton variant="custom" className={styles['hero-container']} borderRadius={0} />;
  }

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];

  const backdropUrl = ImageUtils.getBackdropUrl(currentItem.Id, currentItem.ImageTags.Backdrop);
  const logoUrl = currentItem.ImageTags.Logo ? ImageUtils.getLogoUrl(currentItem.Id, currentItem.ImageTags.Logo) : null;

  const handlePlay = async () => {
    if (currentItem.Type === 'Series' && userId) {
      try {
        const ep = await getFirstEpisode(userId, currentItem.Id);
        if (ep) {
          navigate(`/play/${ep.Id}`);
        } else {
          alert('该剧集没有可播放的集数。');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      navigate(`/play/${currentItem.Id}`);
    }
  };

  const handleInfo = () => {
    const route = currentItem.Type === 'Movie' ? `/movie/${currentItem.Id}` : `/series/${currentItem.Id}`;
    navigate(route);
  };

  const variants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className={styles['hero-container']}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className={styles['hero-slide']}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          {/* 背景图 */}
          <div className={styles['hero-background']}>
            {backdropUrl && (
              <motion.img
                src={backdropUrl}
                alt={currentItem.Name}
                className={styles['hero-image']}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1.05 }}
                transition={{ duration: 8, ease: 'linear' }}
              />
            )}
            <div className={styles['hero-overlay']} />
          </div>

          {/* 内容区 */}
          <div className={styles['hero-content']}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={currentItem.Name} className={styles['hero-logo']} />
              ) : (
                <h1 className={styles['hero-title']}>{currentItem.Name}</h1>
              )}

              <div className={styles['hero-meta']}>
                {currentItem.CommunityRating && (
                  <Badge color="yellow" variant="filled">
                    ★ {currentItem.CommunityRating.toFixed(1)}
                  </Badge>
                )}
                {currentItem.ProductionYear && <span>{currentItem.ProductionYear}</span>}
                {currentItem.RunTimeTicks && (
                  <span>{Math.round(currentItem.RunTimeTicks / 600000000)} 分钟</span>
                )}
                {currentItem.OfficialRating && <Badge>{currentItem.OfficialRating}</Badge>}
              </div>

              {currentItem.Overview && (
                <p className={`${styles['hero-overview']} line-clamp-3`}>{currentItem.Overview}</p>
              )}

              <div className={styles['hero-actions']}>
                <Button size="xl" leftIcon={<Play fill="currentColor" />} onClick={handlePlay}>
                  播放
                </Button>
                <Button size="xl" variant="glass" leftIcon={<Info />} onClick={handleInfo}>
                  详情
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 指示器 */}
      {items.length > 1 && (
        <div className={styles['hero-indicators']}>
          {items.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${index === currentIndex ? styles['indicator-active'] : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`切换到第 ${index + 1} 项`}
            >
              {index === currentIndex && (
                <motion.div
                  className={styles['indicator-progress']}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 8, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
