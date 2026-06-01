import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getItems } from '../../api/items';
import type { ItemsResult } from '../../types/items';
import { PosterGrid } from '../../components/media';
import { Button } from '../../components/ui';

const ITEMS_PER_PAGE = 24;

export function CollectionPage() {
  const userId = useAuthStore((s) => s.userId);
  const [posterSize, setPosterSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } = useInfiniteQuery<ItemsResult>({
    queryKey: ['collections', userId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getItems(userId!, {
        StartIndex: pageParam as number,
        Limit: ITEMS_PER_PAGE,
        IncludeItemTypes: 'BoxSet',
        Recursive: true,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const currentLoaded = allPages.length * ITEMS_PER_PAGE;
      if (currentLoaded < lastPage.TotalRecordCount) {
        return currentLoaded;
      }
      return undefined;
    },
    enabled: !!userId,
  });

  const allItems = data?.pages.flatMap((p) => p.Items) || [];

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-700">
      {/* 头部区域 */}
      <div className="relative mb-10 p-8 rounded-2xl overflow-hidden glass border border-[var(--border-subtle)]">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Layers size={32} className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--text-primary)] tracking-tight">合集</h1>
            </div>
            <p className="text-[var(--text-secondary)] text-lg ml-1">Jellyfin 自动生成的系列影片与宇宙合集</p>
          </div>
          
          <div className="flex gap-2 bg-[var(--bg-elevated)] p-1.5 rounded-xl backdrop-blur-md border border-[var(--border-default)]">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <Button
                key={size}
                variant={posterSize === size ? 'primary' : 'ghost'}
                onClick={() => setPosterSize(size)}
                size="sm"
                className={posterSize === size ? 'shadow-glow' : ''}
              >
                {size === 'sm' && '小'}
                {size === 'md' && '中'}
                {size === 'lg' && '大'}
                {size === 'xl' && '超大'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-4">
           <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
           <p className="text-[var(--text-secondary)] animate-pulse">正在加载您的合集...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col justify-center items-center py-32 text-red-500 glass rounded-2xl border border-[var(--border-subtle)]">
          <p className="text-xl font-bold">无法加载合集内容</p>
          <p className="text-sm opacity-70 mt-2 text-[var(--text-secondary)]">请检查您的网络或重新登录重试</p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 glass rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <Layers size={80} className="mb-6 opacity-20 text-[var(--text-tertiary)] group-hover:scale-110 group-hover:opacity-40 group-hover:text-purple-500 transition-all duration-500" />
          <p className="text-2xl font-display font-bold text-[var(--text-primary)] mb-2">未发现合集</p>
          <p className="text-[var(--text-secondary)] text-lg">您需要在 Jellyfin 服务器的媒体库设置中启用自动合并为合集功能</p>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both" style={{ animationDelay: '100ms' }}>
          <PosterGrid
            items={allItems}
            posterSize={posterSize}
            hasNextPage={hasNextPage}
            fetchNextPage={() => fetchNextPage()}
            isFetchingNextPage={isFetchingNextPage}
            // 覆盖 onClick，跳转到 /library/:id 显示列表内容
          />
        </div>
      )}
    </div>
  );
}
