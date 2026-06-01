import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchItems } from '../../../api/search';
import { ImageUtils } from '../../../api/images';
import { useAuthStore } from '../../../stores/authStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { LazyImage } from '../LazyImage';
import styles from './SearchModal.module.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = useAuthStore((s) => s.userId);
  const navigate = useNavigate();

  // 自动聚焦
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // 监听 ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // API 查询
  const { data, isLoading } = useQuery({
    queryKey: ['search', userId, debouncedSearchTerm],
    queryFn: () => searchItems(userId!, debouncedSearchTerm),
    enabled: !!userId && debouncedSearchTerm.length > 0,
  });

  const results = data?.Items || [];

  const handleResultClick = (id: string, type: string) => {
    onClose();
    if (type === 'Series') {
      navigate(`/series/${id}`);
    } else if (type === 'Movie') {
      navigate(`/movie/${id}`);
    } else if (type === 'Episode') {
      navigate(`/play/${id}`);
    } else {
      navigate(`/library/${id}`); // fallback
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles['search-modal-overlay']}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles['search-modal-content']}
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} // 防止点击内容区关闭
          >
            <div className={styles['search-header']}>
              <Search color="var(--text-secondary)" size={24} />
              <input
                ref={inputRef}
                className={styles['search-input']}
                placeholder="搜索电影、剧集..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className={styles['close-btn']} onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className={styles['search-body']}>
              {!debouncedSearchTerm ? (
                <div className={styles['empty-state']}>输入关键词开始搜索</div>
              ) : isLoading ? (
                <div className="flex justify-center py-8 text-gray-500">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : results.length === 0 ? (
                <div className={styles['empty-state']}>未找到结果</div>
              ) : (
                <>
                  <div className={styles['section-title']}>搜索结果</div>
                  <div className={styles['result-list']}>
                    {results.map((item) => {
                      const thumb = item.ImageTags.Thumb 
                        ? ImageUtils.getThumbUrl(item.Id, item.ImageTags.Thumb)
                        : ImageUtils.getPosterUrl(item.Id, item.ImageTags.Primary);
                      const poster = ImageUtils.getPosterUrl(item.Id, item.ImageTags.Primary);
                      
                      return (
                        <div
                          key={item.Id}
                          className={styles['result-item']}
                          onClick={() => handleResultClick(item.Id, item.Type)}
                        >
                          <LazyImage
                            src={poster || thumb || ''}
                            alt={item.Name}
                            className={styles['result-thumb']}
                          />
                          <div className={styles['result-info']}>
                            <div className={styles['result-title']}>{item.Name}</div>
                            <div className={styles['result-meta']}>
                              {item.Type === 'Movie' ? '电影' : item.Type === 'Series' ? '剧集' : item.Type}
                              {item.ProductionYear ? ` • ${item.ProductionYear}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
