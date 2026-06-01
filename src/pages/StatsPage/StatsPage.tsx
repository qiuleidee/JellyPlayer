import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { getItems } from '../../api/items';
import { BarChart3, Clock, Film, Tv, Trophy } from 'lucide-react';
import styles from './StatsPage.module.css';

export default function StatsPage() {
  const userId = useAuthStore((s) => s.userId);

  const { data, isPending, isError } = useQuery({
    queryKey: ['watch-stats', userId],
    queryFn: () =>
      getItems(userId!, {
        Filters: 'IsPlayed',
        IncludeItemTypes: 'Movie,Episode',
        Recursive: true,
        Limit: 5000,
        Fields: 'RunTimeTicks,Genres',
      }),
    enabled: !!userId,
  });

  if (isPending) {
    return (
      <div className={styles['stats-page']}>
        <div className={styles['loading-state']}>
          <div className={styles.spinner} />
          <div className={styles['loading-text']}>正在分析观影数据…</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles['stats-page']}>
        <div className={styles['empty-state']}>
          <div className={styles['empty-title']}>无法加载</div>
          <div className={styles['empty-desc']}>请检查网络连接后重试</div>
        </div>
      </div>
    );
  }

  const items = data?.Items || [];
  const movies = items.filter((i) => i.Type === 'Movie');
  const episodes = items.filter((i) => i.Type === 'Episode');
  const totalTicks = items.reduce((acc, curr) => acc + (curr.RunTimeTicks || 0), 0);
  const totalHours = Math.round(totalTicks / 36000000000);

  const genreCounts: Record<string, number> = {};
  items.forEach((item) => {
    item.Genres?.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxGenreCount = topGenres[0]?.[1] || 1;

  return (
    <div className={styles['stats-page']}>
      <div className={styles['page-header']}>
        <h1 className={styles['page-title']}>观影统计</h1>
        <p className={styles['page-subtitle']}>基于您在 Jellyfin 上的观影足迹</p>
      </div>

      <div className={styles['bento-grid']}>
        {/* Hero: 累计时长 */}
        <div className={`${styles.widget} ${styles['widget-hero']}`}>
          <div className={styles['widget-header']}>
            <span className={styles['widget-label']}>累计观影时长</span>
            <div className={`${styles['widget-icon']} ${styles['widget-icon-blue']}`}>
              <Clock size={18} />
            </div>
          </div>
          <div className={styles['widget-value-area']}>
            <span className={styles['widget-big-number']}>
              {totalHours}
              <span className={styles['widget-unit']}>小时</span>
            </span>
          </div>
        </div>

        {/* 电影 */}
        <div className={styles.widget}>
          <div className={styles['widget-header']}>
            <span className={styles['widget-label']}>已看电影</span>
            <div className={`${styles['widget-icon']} ${styles['widget-icon-green']}`}>
              <Film size={18} />
            </div>
          </div>
          <div className={styles['widget-value-area']}>
            <span className={styles['widget-number']}>
              {movies.length}
              <span className={styles['widget-number-unit']}>部</span>
            </span>
          </div>
        </div>

        {/* 剧集 */}
        <div className={styles.widget}>
          <div className={styles['widget-header']}>
            <span className={styles['widget-label']}>已看剧集</span>
            <div className={`${styles['widget-icon']} ${styles['widget-icon-purple']}`}>
              <Tv size={18} />
            </div>
          </div>
          <div className={styles['widget-value-area']}>
            <span className={styles['widget-number']}>
              {episodes.length}
              <span className={styles['widget-number-unit']}>集</span>
            </span>
          </div>
        </div>

        {/* 类型排行 */}
        <div className={`${styles.widget} ${styles['widget-wide']}`}>
          <div className={styles['widget-header']}>
            <span className={styles['widget-label']}>最爱类型 TOP 5</span>
            <div className={`${styles['widget-icon']} ${styles['widget-icon-yellow']}`}>
              <Trophy size={18} />
            </div>
          </div>
          {topGenres.length === 0 ? (
            <div className={styles['widget-coming-soon']}>
              <div className={styles['coming-soon-label']}>暂无数据</div>
              <div className={styles['coming-soon-desc']}>多看几部影片，这里会显示您最爱的类型</div>
            </div>
          ) : (
            <div className={styles['genre-list']}>
              {topGenres.map(([genre, count], idx) => {
                const pct = Math.round((count / maxGenreCount) * 100);
                return (
                  <div key={genre} className={styles['genre-row']}>
                    <span className={styles['genre-rank']}>{idx + 1}</span>
                    <div className={styles['genre-bar-wrapper']}>
                      <div
                        className={`${styles['genre-bar-fill']} ${styles[`genre-bar-fill-${idx + 1}`] || styles['genre-bar-fill-5']}`}
                        style={{ width: `${pct}%` }}
                      />
                      <span className={styles['genre-bar-label']}>{genre}</span>
                    </div>
                    <span className={styles['genre-count']}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 更多统计 */}
        <div className={`${styles.widget} ${styles['widget-coming-soon']}`}>
          <BarChart3 size={40} className={styles['coming-soon-icon']} />
          <div className={styles['coming-soon-label']}>更多统计</div>
          <div className={styles['coming-soon-desc']}>日历热力图与观影趋势正在开发中</div>
        </div>
      </div>
    </div>
  );
}
