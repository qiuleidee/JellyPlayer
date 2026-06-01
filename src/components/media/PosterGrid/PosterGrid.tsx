import { useRef, useEffect, useState, useMemo } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { FolderOpen } from 'lucide-react';
import { PosterCard } from '../PosterCard';
import { Skeleton } from '../../ui';
import type { BaseItemDto } from '../../../types/items';
import styles from './PosterGrid.module.css';

interface PosterGridProps {
  items: BaseItemDto[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  posterSize?: 'sm' | 'md' | 'lg' | 'xl';
}

// 基于不同 size 定义海报基础宽度
const POSTER_WIDTH_MAP = {
  sm: 120,
  md: 160,
  lg: 220,
  xl: 300,
};

const GAP = 16; // 1rem = 16px (var(--space-4))
const POSTER_RATIO = 2 / 3;

export default function PosterGrid({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  posterSize = 'md',
}: PosterGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  // 监听容器宽度，计算列数
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidth(width);
        const baseWidth = POSTER_WIDTH_MAP[posterSize];
        // 粗略计算列数，至少为 2
        const cols = Math.max(2, Math.floor((width + GAP) / (baseWidth + GAP)));
        setColumns(cols);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [posterSize]);

  // 计算行数
  const rowsCount = Math.ceil(items.length / columns);
  
  // 动态计算海报在当前列数下的实际高度
  const rowHeight = useMemo(() => {
    if (columns <= 1 || containerWidth === 0) return POSTER_WIDTH_MAP[posterSize] / POSTER_RATIO + 80;
    const itemWidth = (containerWidth - (columns - 1) * GAP) / columns;
    const itemHeight = itemWidth / POSTER_RATIO;
    return itemHeight + 70; // +70px 用于文字和间距
  }, [columns, containerWidth, posterSize]);

  // 虚拟滚动
  const virtualizer = useWindowVirtualizer({
    count: rowsCount,
    estimateSize: () => rowHeight,
    overscan: 3,
  });

  // 无限滚动检测
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    if (!virtualItems.length || !hasNextPage || isFetchingNextPage) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem.index >= rowsCount - 2) {
      fetchNextPage?.();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, rowsCount, fetchNextPage]);

  if (isLoading && items.length === 0) {
    return (
      <div className={styles['grid-container']} ref={containerRef}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${POSTER_WIDTH_MAP[posterSize]}px, 1fr))`, gap: GAP }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <Skeleton variant="poster" />
              <div style={{ marginTop: 8 }}><Skeleton variant="text" width="80%" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div>
          <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center relative z-10 shadow-xl group-hover:scale-105 transition-transform duration-500">
            <FolderOpen size={40} className="text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors duration-500" />
          </div>
        </div>
        <h3 className="text-2xl font-bold font-display text-[var(--text-primary)] mb-2">未找到任何内容</h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          当前视图中没有可显示的项目，或者被过滤条件隐藏了。您可以尝试更改分类或调整过滤条件。
        </p>
      </div>
    );
  }

  return (
    <div className={styles['grid-container']} ref={containerRef}>
      <div
        className={styles['grid-virtual-container']}
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.index}
              className={styles['grid-row']}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowItems.map((item) => (
                <div
                  key={item.Id}
                  className={styles['grid-item']}
                  style={{ width: `calc((100% - ${(columns - 1) * GAP}px) / ${columns})` }}
                >
                  <PosterCard item={item} size={posterSize} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isFetchingNextPage && (
        <div className={styles['loading-more']}>
          <Skeleton variant="text" width={100} />
        </div>
      )}
    </div>
  );
}
