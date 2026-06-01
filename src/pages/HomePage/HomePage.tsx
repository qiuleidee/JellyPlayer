import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getLatestItems, getResumeItems, getNextUpShows, getSuggestions, getUserViews } from '../../api/items';
import { HeroBanner, MediaRow } from '../../components/media';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { userId } = useAuthStore();
  const { homeLayout, hiddenHomeModules = [] } = useSettingsStore();

  // 获取数据
  const { data: latestMovies, isLoading: loadingMovies } = useQuery({
    queryKey: ['latest', userId, 'movies'],
    queryFn: () => getLatestItems(userId!, 16),
    enabled: !!userId,
  });

  const { data: resumeItems, isLoading: loadingResume } = useQuery({
    queryKey: ['resume', userId],
    queryFn: () => getResumeItems(userId!, 12),
    enabled: !!userId,
  });

  const { data: nextUpShows, isLoading: loadingNextUp } = useQuery({
    queryKey: ['nextup', userId],
    queryFn: () => getNextUpShows(userId!, 16),
    enabled: !!userId,
  });

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['suggestions', userId],
    queryFn: () => getSuggestions(userId!, 16),
    enabled: !!userId,
  });

  const { data: userViews, isLoading: loadingViews } = useQuery({
    queryKey: ['views', userId],
    queryFn: () => getUserViews(userId!),
    enabled: !!userId,
  });

  // 提取用于 HeroBanner 的海报池，合并“最新加入”和“猜你喜欢”
  const [heroItems, setHeroItems] = useState<any[]>([]);

  useEffect(() => {
    // 只在每次挂载且拿到数据时执行一次随机抽取，确保每次刷新都有不同的初始海报和轮播列表
    if (heroItems.length === 0) {
      let pool: any[] = [];
      if (latestMovies && latestMovies.length > 0) {
        pool = [...pool, ...latestMovies];
      }
      if (suggestions?.Items && suggestions.Items.length > 0) {
        pool = [...pool, ...suggestions.Items];
      }
      
      if (pool.length > 0) {
        // 核心过滤：剔除所有单集（Episode），只允许电影（Movie）或整部剧集（Series）登上海报轮播
        const filteredPool = pool.filter((item) => item.Type === 'Movie' || item.Type === 'Series');
        
        // 利用 Map 去重，然后随机洗牌
        const uniquePool = Array.from(new Map(filteredPool.map(item => [item.Id, item])).values());
        const shuffled = uniquePool.sort(() => 0.5 - Math.random());
        setHeroItems(shuffled.slice(0, 5));
      }
    }
  }, [latestMovies, suggestions, heroItems.length]);

  const isHeroLoading = loadingMovies && loadingSuggestions && heroItems.length === 0;

  const renderRow = (sectionId: string) => {
    switch (sectionId) {
      case 'views':
        if (!userViews?.Items || userViews.Items.length === 0) return null;
        return (
          <MediaRow
            key="views"
            title="我的资料库"
            items={userViews.Items}
            isLoading={loadingViews}
            cardVariant="backdrop"
          />
        );
      case 'resume':
        if (!resumeItems?.Items || resumeItems.Items.length === 0) return null;
        return (
          <MediaRow
            key="resume"
            title="继续观看"
            items={resumeItems.Items}
            isLoading={loadingResume}
            cardVariant="backdrop"
          />
        );
      case 'suggestions':
        if (!suggestions?.Items || suggestions.Items.length === 0) return null;
        return (
          <MediaRow
            key="suggestions"
            title="猜你喜欢"
            items={suggestions.Items}
            isLoading={loadingSuggestions}
          />
        );
      case 'nextup':
        if (!nextUpShows?.Items || nextUpShows.Items.length === 0) return null;
        return (
          <MediaRow
            key="nextup"
            title="接下来播放"
            items={nextUpShows.Items}
            isLoading={loadingNextUp}
            cardVariant="backdrop"
          />
        );
      case 'latest':
        return (
          <MediaRow
            key="latest"
            title="最新加入"
            items={latestMovies || []}
            isLoading={loadingMovies}
            moreLink="/library/all"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles['home-page']}>
      {/* 顶部 Hero 轮播 */}
      <HeroBanner items={heroItems} isLoading={isHeroLoading} />

      <div className={styles['home-content']}>
        {homeLayout
          .filter((sectionId) => !hiddenHomeModules.includes(sectionId))
          .map((sectionId) => renderRow(sectionId))}
      </div>
    </div>
  );
}
