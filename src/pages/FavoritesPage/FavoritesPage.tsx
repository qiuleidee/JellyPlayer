import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getItems } from '../../api/items';
import { ImageUtils } from '../../api/images';
import type { ItemsResult, BaseItemDto } from '../../types/items';
import styles from './FavoritesPage.module.css';

const ITEMS_PER_PAGE = 48;

export default function FavoritesPage() {
  const userId = useAuthStore((s) => s.userId);
  const [activeTab, setActiveTab] = useState<'all' | 'Movie' | 'Series'>('all');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } = useInfiniteQuery<ItemsResult>({
    queryKey: ['favorites', userId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getItems(userId!, {
        StartIndex: pageParam as number,
        Limit: ITEMS_PER_PAGE,
        Filters: 'IsFavorite',
        IncludeItemTypes: 'Movie,Series',
        Fields: 'PrimaryImageAspectRatio',
        Recursive: true,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.length * ITEMS_PER_PAGE;
      return loaded < lastPage.TotalRecordCount ? loaded : undefined;
    },
    enabled: !!userId,
  });

  const allItems = data?.pages.flatMap((p) => p.Items) || [];

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return allItems;
    return allItems.filter((item) => item.Type === activeTab);
  }, [allItems, activeTab]);

  const movieCount = allItems.filter((i) => i.Type === 'Movie').length;
  const seriesCount = allItems.filter((i) => i.Type === 'Series').length;

  const tabs = [
    { key: 'all' as const, label: '全部' },
    { key: 'Movie' as const, label: '电影' },
    { key: 'Series' as const, label: '剧集' },
  ];

  if (isPending) {
    return (
      <div className={styles['favorites-page']}>
        <div className={styles['loading-state']}>
          <div className={styles.spinner} />
          <div className={styles['loading-text']}>正在加载收藏…</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles['favorites-page']}>
        <div className={styles['empty-state']}>
          <div className={styles['empty-title']}>无法加载</div>
          <div className={styles['empty-desc']}>请检查网络连接后重试</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['favorites-page']}>
      <div className={styles['page-header']}>
        <h1 className={styles['page-title']}>收藏</h1>
      </div>

      <div className={styles['tabs-bar']}>
        <div className={styles['tabs-group']}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${styles['tab-btn']} ${activeTab === tab.key ? styles['tab-btn-active'] : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className={styles['item-count']}>
          {activeTab === 'all' ? `${movieCount} 部电影 · ${seriesCount} 部剧集` : `${filteredItems.length} 项`}
        </span>
      </div>

      {allItems.length === 0 ? (
        <div className={styles['empty-state']}>
          <div className={styles['empty-icon']}><Heart size={32} /></div>
          <div className={styles['empty-title']}>还没有收藏</div>
          <div className={styles['empty-desc']}>在详情页点击心形按钮即可收藏喜爱的影视</div>
        </div>
      ) : (
        <div className={styles['grid-area']}>
          <div className={styles['poster-grid']}>
            {filteredItems.map((item) => (
              <FavoriteCard key={item.Id} item={item} />
            ))}
          </div>
          {hasNextPage && (
            <div className={styles['load-more-area']}>
              <button
                className={styles['load-more-btn']}
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FavoriteCard({ item }: { item: BaseItemDto }) {
  const linkTo = item.Type === 'Movie' ? `/movie/${item.Id}` : item.Type === 'Series' ? `/series/${item.Id}` : `/library/${item.Id}`;
  const posterUrl = ImageUtils.getPosterUrl(item.Id, item.ImageTags?.Primary);

  return (
    <Link to={linkTo} className={styles['poster-item']}>
      <div className={styles['poster-cover']}>
        <img src={posterUrl} alt={item.Name} loading="lazy" />
        {item.UserData?.Played && (
          <div className={styles['poster-badge']}>
            <Check size={14} strokeWidth={3} />
          </div>
        )}
      </div>
      <div className={styles['poster-title']}>{item.Name}</div>
      <div className={styles['poster-year']}>{item.ProductionYear}</div>
    </Link>
  );
}
