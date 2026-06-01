import { useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Filter, Grid2X2, Grid3X3, Grid } from 'lucide-react';
import { Dropdown, Switch } from '../../ui';
import styles from './LibraryToolbar.module.css';

export interface SortConfig {
  sortBy: string;
  sortOrder: 'Ascending' | 'Descending';
}

export interface FilterConfig {
  isPlayed?: boolean;
  isFavorite?: boolean;
  genreIds?: string;
  years?: string;
  nameStartsWithOrGreater?: string;
}

interface LibraryToolbarProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  posterSize: 'sm' | 'md' | 'lg' | 'xl';
  onSizeChange: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  genres?: { Id: string; Name: string }[];
}

const SORT_OPTIONS = [
  { label: '添加日期', value: 'DateCreated' },
  { label: '名称', value: 'SortName' },
  { label: '评分', value: 'CommunityRating' },
  { label: '首播日期', value: 'PremiereDate' },
];

export default function LibraryToolbar({
  sortConfig,
  onSortChange,
  filterConfig,
  onFilterChange,
  viewMode,
  onViewModeChange,
  posterSize,
  onSizeChange,
  genres = [],
}: LibraryToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }).map((_, i) => (currentYear - i).toString());

  const toggleSortOrder = () => {
    onSortChange({
      ...sortConfig,
      sortOrder: sortConfig.sortOrder === 'Ascending' ? 'Descending' : 'Ascending',
    });
  };

  const handleSortByChange = (value: string | number) => {
    onSortChange({ ...sortConfig, sortBy: value as string });
  };

  // 尺寸与模式切换
  const cycleSize = () => {
    if (viewMode === 'list') {
      // 如果当前是列表模式，切回网格模式，并强制设为 sm（重新开始循环）
      onViewModeChange('grid');
      onSizeChange('sm');
    } else {
      const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
      const nextIndex = (sizes.indexOf(posterSize) + 1) % sizes.length;
      if (nextIndex === 0) {
        // 当超过最大尺寸 xl 时，切到列表模式
        onViewModeChange('list');
      } else {
        // 否则只是放大一层
        onSizeChange(sizes[nextIndex]);
      }
    }
  };

  const SizeIcon = viewMode === 'list' ? Grid2X2 : posterSize === 'sm' || posterSize === 'md' ? Grid3X3 : Grid;

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles['left-group']}>
          <button
            className={styles['icon-btn']}
            onClick={() => setShowFilters(!showFilters)}
            title="筛选"
            style={showFilters ? { background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
          >
            <Filter size={20} />
          </button>
        </div>

        <div className={styles['right-group']}>
          <div className={styles['sort-group']}>
            <Dropdown
              trigger={<button className={styles['icon-btn']} style={{ width: 'auto', padding: '0 12px' }}>{SORT_OPTIONS.find(o => o.value === sortConfig.sortBy)?.label}</button>}
              items={SORT_OPTIONS.map(opt => ({
                id: opt.value,
                label: opt.label,
                onClick: () => handleSortByChange(opt.value)
              }))}
              align="right"
            />
            <button className={styles['icon-btn']} onClick={toggleSortOrder} title="切换升降序">
              {sortConfig.sortOrder === 'Ascending' ? <ArrowUpAZ size={20} /> : <ArrowDownAZ size={20} />}
            </button>
          </div>

          <button className={styles['icon-btn']} onClick={cycleSize} title="切换海报大小">
            <SizeIcon size={20} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles['filter-panel']}>
          <div className="flex gap-4 mb-4 flex-wrap">
            <Switch
              label="只看未播放"
              checked={filterConfig.isPlayed === false}
              onChange={(checked) =>
                onFilterChange({ ...filterConfig, isPlayed: checked ? false : undefined })
              }
            />
            <Switch
              label="只看收藏"
              checked={filterConfig.isFavorite === true}
              onChange={(checked) =>
                onFilterChange({ ...filterConfig, isFavorite: checked ? true : undefined })
              }
            />
            {/* 年份筛选 */}
            <Dropdown
              trigger={<button className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors text-sm">{filterConfig.years || '所有年份'}</button>}
              items={[
                { id: '', label: '所有年份', onClick: () => onFilterChange({ ...filterConfig, years: undefined }) },
                ...yearOptions.map(y => ({ id: y, label: y, onClick: () => onFilterChange({ ...filterConfig, years: y }) }))
              ]}
            />
            {/* 流派筛选 */}
            {genres.length > 0 && (
              <Dropdown
                trigger={<button className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors text-sm">{genres.find(g => g.Id === filterConfig.genreIds)?.Name || '所有流派'}</button>}
                items={[
                  { id: '', label: '所有流派', onClick: () => onFilterChange({ ...filterConfig, genreIds: undefined }) },
                  ...genres.map(g => ({ id: g.Id, label: g.Name, onClick: () => onFilterChange({ ...filterConfig, genreIds: g.Id }) }))
                ]}
              />
            )}
          </div>
          
          {/* 字母表快速跳转 */}
          <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <button 
              onClick={() => {
                onFilterChange({ ...filterConfig, nameStartsWithOrGreater: undefined });
                onSortChange({ ...sortConfig, sortBy: 'SortName' });
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${!filterConfig.nameStartsWithOrGreater ? 'bg-blue-500 text-white' : 'bg-[var(--bg-base)] hover:bg-[var(--bg-hover)]'}`}
            >
              #
            </button>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
              <button
                key={letter}
                onClick={() => {
                  onFilterChange({ ...filterConfig, nameStartsWithOrGreater: letter });
                  onSortChange({ ...sortConfig, sortBy: 'SortName' }); // 必须按名称排序才有效
                }}
                className={`px-2 py-1 text-xs rounded transition-colors ${filterConfig.nameStartsWithOrGreater === letter ? 'bg-blue-500 text-white' : 'bg-[var(--bg-base)] hover:bg-[var(--bg-hover)]'}`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
