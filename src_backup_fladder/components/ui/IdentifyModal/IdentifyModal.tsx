import { useState, useEffect } from 'react';
import { Search, Loader2, Check } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal from '../Modal/Modal';
import { Button, Input } from '../../ui';
import { searchMetadata, applyMetadata } from '../../../api/metadata';
import type { RemoteSearchResult } from '../../../api/metadata';
import styles from './IdentifyModal.module.css';

interface IdentifyModalProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemType: string;
  initialName?: string;
  initialYear?: number;
  onSuccess?: () => void;
}

export default function IdentifyModal({
  open,
  onClose,
  itemId,
  itemType,
  initialName = '',
  initialYear,
  onSuccess,
}: IdentifyModalProps) {
  const [searchName, setSearchName] = useState(initialName);
  const [searchYear, setSearchYear] = useState<string>(initialYear ? String(initialYear) : '');
  const [selectedResult, setSelectedResult] = useState<RemoteSearchResult | null>(null);

  // 初始化搜索词
  useEffect(() => {
    if (open) {
      setSearchName(initialName);
      setSearchYear(initialYear ? String(initialYear) : '');
      setSelectedResult(null);
    }
  }, [open, initialName, initialYear]);

  // 查询元数据
  const { data: results, isLoading: isSearching, refetch } = useQuery({
    queryKey: ['identify', itemId, searchName, searchYear],
    queryFn: () =>
      searchMetadata(itemType === 'Episode' ? 'Episode' : itemType === 'Series' ? 'Series' : 'Movie', {
        ItemId: itemId,
        SearchInfo: {
          Name: searchName,
          Year: searchYear ? parseInt(searchYear, 10) : undefined,
        },
      }),
    enabled: false, // 手动触发
  });

  // 自动触发初始搜索
  useEffect(() => {
    if (open && initialName) {
      refetch();
    }
  }, [open, initialName, refetch]);

  // 应用元数据
  const applyMutation = useMutation({
    mutationFn: (result: RemoteSearchResult) => applyMetadata(itemId, result),
    onSuccess: () => {
      alert('元数据更新成功，系统后台正在刷新图片...');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error(error);
      const msg = error.response?.data || error.message || '未知错误';
      alert(`应用元数据失败: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
    },
  });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchName.trim()) {
      setSelectedResult(null);
      refetch();
    }
  };

  const handleApply = () => {
    if (selectedResult) {
      applyMutation.mutate(selectedResult);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="识别元数据 (Fix Match)"
      size="lg"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} disabled={applyMutation.isPending}>
            取消
          </Button>
          <Button
            variant="primary"
            disabled={!selectedResult || applyMutation.isPending}
            onClick={handleApply}
          >
            {applyMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : '应用所选结果'}
          </Button>
        </div>
      }
    >
      <div className={styles['identify-container']}>
        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className={styles['search-form']}>
          <div className="flex-1">
            <Input
              placeholder="名称 (例如: 钢铁侠)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div className="w-24">
            <Input
              placeholder="年份"
              type="number"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isSearching || !searchName.trim()}>
            {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          </Button>
        </form>

        {/* 结果列表 */}
        <div className={styles['results-list']}>
          {isSearching ? (
            <div className={styles['loading-state']}>
              <Loader2 className="animate-spin" size={32} />
              <p>正在跨源搜索元数据...</p>
            </div>
          ) : results && results.length > 0 ? (
            results.map((result, idx) => {
              const isSelected = selectedResult === result;
              return (
                <div
                  key={idx}
                  className={`${styles['result-item']} ${isSelected ? styles['selected'] : ''}`}
                  onClick={() => setSelectedResult(result)}
                >
                  <img
                    src={result.ImageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
                    alt={result.Name}
                    className={styles['result-poster']}
                  />
                  <div className={styles['result-info']}>
                    <div className={styles['result-header']}>
                      <h3 className={styles['result-title']}>{result.Name}</h3>
                      <span className={styles['result-year']}>{result.ProductionYear}</span>
                    </div>
                    <p className={styles['result-overview']}>
                      {result.Overview || '暂无简介'}
                    </p>
                    <div className={styles['result-meta']}>
                      <span>数据源: {result.SearchProviderName || '未知'}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className={styles['check-icon']}>
                      <Check size={20} />
                    </div>
                  )}
                </div>
              );
            })
          ) : results?.length === 0 ? (
            <div className={styles['empty-state']}>没有找到匹配的元数据，请尝试修改关键词。</div>
          ) : (
            <div className={styles['empty-state']}>输入关键词以搜索元数据</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
