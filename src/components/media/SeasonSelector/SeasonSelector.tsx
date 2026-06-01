import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { getSeriesSeasons, getSeasonEpisodes } from '../../../api/details';
import { ImageUtils } from '../../../api/images';
import { LazyImage, Skeleton } from '../../ui';
import type { BaseItemDto } from '../../../types/items';
import styles from './SeasonSelector.module.css';

interface SeasonSelectorProps {
  seriesId: string;
}

export default function SeasonSelector({ seriesId }: SeasonSelectorProps) {
  const userId = useAuthStore((s) => s.userId);
  const navigate = useNavigate();
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);

  // 获取所有季
  const { data: seasonsData, isLoading: loadingSeasons } = useQuery({
    queryKey: ['seasons', seriesId, userId],
    queryFn: () => getSeriesSeasons(userId!, seriesId),
    enabled: !!userId && !!seriesId,
  });

  const seasons = seasonsData?.Items || [];

  // 默认选中第一季（或特辑后的第一季）
  useEffect(() => {
    if (seasons.length > 0 && !activeSeasonId) {
      // 倾向于选择非“特辑”的季（IndexNumber > 0）
      const defaultSeason = seasons.find((s) => s.IndexNumber && s.IndexNumber > 0) || seasons[0];
      setActiveSeasonId(defaultSeason.Id);
    }
  }, [seasons, activeSeasonId]);

  // 获取当前季的剧集
  const { data: episodesData, isLoading: loadingEpisodes } = useQuery({
    queryKey: ['episodes', seriesId, activeSeasonId, userId],
    queryFn: () => getSeasonEpisodes(userId!, seriesId, activeSeasonId!),
    enabled: !!userId && !!seriesId && !!activeSeasonId,
  });

  const episodes = episodesData?.Items || [];

  if (loadingSeasons) {
    return <Skeleton variant="text" width={200} height={40} style={{ margin: '32px 0' }} />;
  }

  if (seasons.length === 0) return null;

  const seasonOptions = seasons.map((s) => ({
    label: s.Name,
    value: s.Id,
  }));

  return (
    <div className={styles['season-selector']}>
      <div className={styles['season-header']}>
        <h2 className={styles['season-title']}>剧集列表</h2>
      </div>

      <div className={styles['season-tabs']}>
        {seasonOptions.map(opt => (
          <button
            key={opt.value}
            className={`${styles['season-tab']} ${activeSeasonId === opt.value ? styles['season-tab-active'] : ''}`}
            onClick={() => setActiveSeasonId(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className={styles['episodes-grid']}>
        {loadingEpisodes
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles['episode-card']}>
                <div className={styles['episode-thumb-wrapper']}>
                  <Skeleton variant="custom" width="100%" height="100%" borderRadius={0} />
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="title" width="80%" />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>
            ))
          : episodes.map((ep) => <EpisodeCard key={ep.Id} episode={ep} onPlay={() => navigate(`/play/${ep.Id}`)} />)}
      </div>
    </div>
  );
}

// 剧集卡片子组件
function EpisodeCard({ episode, onPlay }: { episode: BaseItemDto; onPlay: () => void }) {
  const thumbUrl = episode.ImageTags.Thumb 
    ? ImageUtils.getThumbUrl(episode.Id, episode.ImageTags.Thumb)
    : ImageUtils.getPosterUrl(episode.Id, episode.ImageTags.Primary);
  const isPlayed = episode.UserData?.Played;
  
  const progressPercent =
    episode.UserData?.PlaybackPositionTicks && episode.RunTimeTicks
      ? (episode.UserData.PlaybackPositionTicks / episode.RunTimeTicks) * 100
      : 0;

  return (
    <div className={styles['episode-card']} onClick={onPlay}>
      <div className={styles['episode-thumb-wrapper']}>
        {thumbUrl ? (
          <LazyImage src={thumbUrl} alt={episode.Name} className={styles['episode-thumb']} />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
            无截图
          </div>
        )}

        {isPlayed && (
          <div className={styles['episode-status-icon']}>
            <Check size={12} strokeWidth={3} />
          </div>
        )}

        {progressPercent > 0 && progressPercent < 100 && !isPlayed && (
          <div className={styles['episode-progress']}>
            <div className={styles['episode-progress-fill']} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      <div className={styles['episode-info']}>
        <div className={styles['episode-meta']}>
          第 {episode.IndexNumber} 集
          {episode.RunTimeTicks && ` · ${Math.round(episode.RunTimeTicks / 10000 / 1000 / 60)} 分钟`}
        </div>
        <div className={`${styles['episode-name']} line-clamp-1`} title={episode.Name}>
          {episode.Name}
        </div>
        {episode.Overview && <div className={styles['episode-overview']}>{episode.Overview}</div>}
      </div>
    </div>
  );
}
