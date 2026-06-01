import { useRef, useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getItems } from '../../api/items';
import { getImageUrl } from '../../api/images';
import type { ItemsResult, BaseItemDto } from '../../types/items';
import styles from './HistoryPage.module.css';

const ITEMS_PER_PAGE = 100;

export default function HistoryPage() {
  const userId = useAuthStore((s) => s.userId);

  const { data, isPending, isError } = useInfiniteQuery<ItemsResult>({
    queryKey: ['history', userId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getItems(userId!, {
        StartIndex: pageParam as number,
        Limit: ITEMS_PER_PAGE,
        Filters: 'IsPlayed',
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
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

  const grouped = useMemo(() => {
    const today: BaseItemDto[] = [];
    const thisWeek: BaseItemDto[] = [];
    const thisMonth: BaseItemDto[] = [];
    const earlier: BaseItemDto[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 86400000;
    const monthStart = todayStart - 30 * 86400000;

    allItems.forEach((item) => {
      const d = item.UserData?.LastPlayedDate;
      if (!d) { earlier.push(item); return; }
      const t = new Date(d).getTime();
      if (t >= todayStart) today.push(item);
      else if (t >= weekStart) thisWeek.push(item);
      else if (t >= monthStart) thisMonth.push(item);
      else earlier.push(item);
    });
    return { today, thisWeek, thisMonth, earlier };
  }, [allItems]);

  if (isPending) {
    return (
      <div className={styles['history-page']}>
        <div className={styles['loading-state']}>
          <div className={styles.spinner} />
          <div className={styles['loading-text']}>正在加载观看历史…</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles['history-page']}>
        <div className={styles['empty-state']}>
          <div className={styles['empty-title']}>无法加载</div>
          <div className={styles['empty-desc']}>请检查网络连接后重试</div>
        </div>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className={styles['history-page']}>
        <div className={styles['page-header']}>
          <h1 className={styles['page-title']}>观看历史</h1>
        </div>
        <div className={styles['empty-state']}>
          <div className={styles['empty-icon']}><Clock size={32} /></div>
          <div className={styles['empty-title']}>还没有观看记录</div>
          <div className={styles['empty-desc']}>开始观看电影或剧集后，它们会出现在这里</div>
        </div>
      </div>
    );
  }

  const shelves = [
    { label: '今天', items: grouped.today },
    { label: '本周', items: grouped.thisWeek },
    { label: '本月', items: grouped.thisMonth },
    { label: '更早', items: grouped.earlier },
  ].filter((s) => s.items.length > 0);

  return (
    <div className={styles['history-page']}>
      <div className={styles['page-header']}>
        <h1 className={styles['page-title']}>观看历史</h1>
        <p className={styles['page-subtitle']}>{allItems.length} 部影视</p>
      </div>

      {shelves.map((shelf) => (
        <Shelf key={shelf.label} label={shelf.label} items={shelf.items} />
      ))}
    </div>
  );
}

function Shelf({ label, items }: { label: string; items: BaseItemDto[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => { check(); }, [items]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -scrollRef.current.clientWidth * 0.75 : scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className={styles['shelf-section']}>
      <div className={styles['shelf-label']}>{label}</div>
      <div className={styles['shelf-scroll-wrapper']}>
        {canLeft && (
          <button className={`${styles['scroll-btn']} ${styles['scroll-btn-left']}`} onClick={() => scroll('left')}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div className={styles['shelf-scroll']} ref={scrollRef} onScroll={check}>
          {items.map((item) => (
            <HistoryCard key={item.Id} item={item} />
          ))}
        </div>
        {canRight && (
          <button className={`${styles['scroll-btn']} ${styles['scroll-btn-right']}`} onClick={() => scroll('right')}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ item }: { item: BaseItemDto }) {
  const linkTo = item.Type === 'Movie' ? `/movie/${item.Id}` : item.Type === 'Series' ? `/series/${item.Id}` : `/library/${item.Id}`;
  const thumbUrl = getImageUrl(item.Id, {
    type: item.BackdropImageTags?.length ? 'Backdrop' : 'Primary',
    maxWidth: 640,
    tag: item.BackdropImageTags?.[0] || item.ImageTags?.Primary,
  });
  const progress = item.UserData && item.RunTimeTicks ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100 : 0;

  return (
    <Link to={linkTo} className={styles['history-card']}>
      <div className={styles['card-thumb']}>
        <img src={thumbUrl} alt={item.Name} loading="lazy" />
        <div className={styles['card-thumb-overlay']} />
        {progress > 0 && progress < 100 && (
          <div className={styles['card-progress-bar']}>
            <div className={styles['card-progress-fill']} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className={styles['card-info']}>
        <div className={styles['card-title']}>{item.Name}</div>
        <div className={styles['card-meta']}>
          {item.ProductionYear && <span>{item.ProductionYear}</span>}
          {item.CommunityRating && <span>★ {item.CommunityRating.toFixed(1)}</span>}
        </div>
      </div>
    </Link>
  );
}
