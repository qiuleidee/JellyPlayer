import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { getItems, getGenres } from '../../api/items';
import { LibraryToolbar, type SortConfig, type FilterConfig } from '../../components/library/LibraryToolbar';
import { PosterGrid, ListView } from '../../components/media';
import styles from './LibraryPage.module.css';

export default function LibraryPage() {
  const { id } = useParams<{ id: string }>(); // type 可以是 movies, series 或 all
  const userId = useAuthStore((s) => s.userId);

  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem('jellyplayer_library_sortConfig');
    return saved ? JSON.parse(saved) : {
      sortBy: 'DateCreated',
      sortOrder: 'Descending',
    };
  });

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () => (localStorage.getItem('jellyplayer_library_viewMode') as any) || 'grid'
  );
  
  const [posterSize, setPosterSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(
    () => (localStorage.getItem('jellyplayer_library_posterSize') as any) || 'md'
  );

  // 持久化保存
  useEffect(() => {
    localStorage.setItem('jellyplayer_library_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('jellyplayer_library_posterSize', posterSize);
  }, [posterSize]);

  useEffect(() => {
    localStorage.setItem('jellyplayer_library_sortConfig', JSON.stringify(sortConfig));
  }, [sortConfig]);

  // 获取流派列表
  const { data: genresData } = useQuery({
    queryKey: ['genres', userId, id],
    queryFn: () => getGenres(userId!, id !== 'all' && id !== 'movies' && id !== 'series' ? id : undefined),
    enabled: !!userId,
  });

  // 构建查询参数
  const queryParams = useMemo(() => {
    let includeItemTypes: string | undefined = 'Movie,Series';
    let parentId: string | undefined = undefined;

    if (id === 'movies') {
      includeItemTypes = 'Movie';
    } else if (id === 'series') {
      includeItemTypes = 'Series';
    } else if (id !== 'all') {
      // 强制过滤，仅允许返回电影或电视剧系列，屏蔽所有散乱的单集（Episode）
      // 去除 Folder，因为在 Recursive=true 开启时，加入 Folder 会导致显示一个毫无意义的空物理文件夹外壳
      parentId = id;
      includeItemTypes = 'Movie,Series';
    }

    let filters = '';
    if (filterConfig.isPlayed === false) filters += 'IsUnplayed,';
    if (filterConfig.isFavorite === true) filters += 'IsFavorite,';
    
    // 移除末尾逗号
    if (filters.endsWith(',')) filters = filters.slice(0, -1);

    return {
      ParentId: parentId,
      IncludeItemTypes: includeItemTypes,
      Recursive: true,
      SortBy: sortConfig.sortBy,
      SortOrder: sortConfig.sortOrder,
      Filters: filters || undefined,
      GenreIds: filterConfig.genreIds || undefined,
      Years: filterConfig.years || undefined,
      NameStartsWithOrGreater: filterConfig.nameStartsWithOrGreater || undefined,
    };
  }, [id, sortConfig, filterConfig]);

  // 无限滚动请求
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['library', userId, queryParams],
    queryFn: async ({ pageParam = 0 }) => {
      return getItems(userId!, {
        ...queryParams,
        StartIndex: pageParam,
        Limit: 40,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextIndex = lastPage.StartIndex + 40;
      if (nextIndex < lastPage.TotalRecordCount) {
        return nextIndex;
      }
      return undefined;
    },
    enabled: !!userId,
  });

  // 展平所有分页的数据并去重
  const items = useMemo(() => {
    if (!data) return [];
    const allItems = data.pages.flatMap((page) => page.Items || []);
    
    // 增强去重逻辑：不仅根据 Id，还根据影片名和年份去重
    // 解决多媒体库路径重叠导致的同一部电影被 Jellyfin 扫描为多个不同 Id 的条目
    const uniqueItems = [];
    const seen = new Set();
    
    for (const item of allItems) {
      const nameYearKey = item.ProductionYear ? `${item.Name}-${item.ProductionYear}` : item.Name;
      
      if (!seen.has(item.Id) && !seen.has(nameYearKey)) {
        seen.add(item.Id);
        seen.add(nameYearKey);
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems;
  }, [data]);

  const title = id === 'movies' ? '电影' : id === 'series' ? '剧集' : '所有媒体';

  return (
    <div className={styles['library-page']}>
      <div className={styles['library-header']}>
        <h1 className={styles['library-title']}>{title}</h1>
      </div>

      <LibraryToolbar
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        filterConfig={filterConfig}
        onFilterChange={setFilterConfig}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        posterSize={posterSize}
        onSizeChange={setPosterSize}
        genres={genresData?.Items as any}
      />

      <div className="mt-6 animate-in fade-in duration-500" key={viewMode}>
        {viewMode === 'grid' ? (
          <PosterGrid
            items={items}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            posterSize={posterSize}
          />
        ) : (
          <ListView
            items={items}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
      </div>
    </div>
  );
}
