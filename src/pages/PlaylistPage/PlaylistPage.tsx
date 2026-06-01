import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ListVideo, Play } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getItems } from '../../api/items';
import { ImageUtils } from '../../api/images';
import type { ItemsResult, BaseItemDto } from '../../types/items';
import styles from './PlaylistPage.module.css';

const ITEMS_PER_PAGE = 48;

export function PlaylistPage() {
  const userId = useAuthStore((s) => s.userId);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } = useInfiniteQuery<ItemsResult>({
    queryKey: ['playlists', userId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getItems(userId!, {
        StartIndex: pageParam as number,
        Limit: ITEMS_PER_PAGE,
        IncludeItemTypes: 'Playlist',
        Recursive: true,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.length * ITEMS_PER_PAGE;
      return loaded < lastPage.TotalRecordCount ? loaded : undefined;
    },
    enabled: !!userId,
  });

  const allItems = data?.pages.flatMap((p) => p.Items) || [];

  if (isPending) {
    return (
      <div className={styles['playlist-page']}>
        <div className={styles['loading-state']}>
          <div className={styles.spinner} />
          <div className={styles['loading-text']}>正在加载播放列表…</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles['playlist-page']}>
        <div className={styles['empty-state']}>
          <div className={styles['empty-title']}>无法加载</div>
          <div className={styles['empty-desc']}>请检查网络连接后重试</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['playlist-page']}>
      <div className={styles['page-header']}>
        <h1 className={styles['page-title']}>播放列表</h1>
        {allItems.length > 0 && (
          <p className={styles['page-subtitle']}>{allItems.length} 个列表</p>
        )}
      </div>

      {allItems.length === 0 ? (
        <div className={styles['empty-state']}>
          <div className={styles['empty-icon']}><ListVideo size={32} /></div>
          <div className={styles['empty-title']}>还没有播放列表</div>
          <div className={styles['empty-desc']}>在媒体库中创建播放列表来组织您的影视内容</div>
        </div>
      ) : (
        <div className={styles['grid-area']}>
          <div className={styles['album-grid']}>
            {allItems.map((item) => (
              <AlbumCard key={item.Id} item={item} />
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

function AlbumCard({ item }: { item: BaseItemDto }) {
  const posterUrl = item.ImageTags?.Primary ? ImageUtils.getPosterUrl(item.Id, item.ImageTags.Primary) : null;

  return (
    <Link to={`/library/${item.Id}`} className={styles['album-card']}>
      <div className={styles['album-cover']}>
        {posterUrl ? (
          <img src={posterUrl} alt={item.Name} loading="lazy" />
        ) : (
          <div className={styles['album-placeholder']}>
            <ListVideo size={40} className={styles['album-placeholder-icon']} />
            <span className={styles['album-placeholder-text']}>{item.Name}</span>
          </div>
        )}
        <div className={styles['album-hover-overlay']}>
          <div className={styles['album-play-icon']}>
            <Play size={22} fill="currentColor" />
          </div>
        </div>
      </div>
      <div className={styles['album-title']}>{item.Name}</div>
      <div className={styles['album-meta']}>播放列表</div>
    </Link>
  );
}
