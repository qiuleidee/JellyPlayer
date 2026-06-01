import { type ReactNode, useEffect } from 'react';
import { useUIStore } from '../../../stores/uiStore';
import { Sidebar } from '../Sidebar';
import { BottomNav } from '../BottomNav';
import { TopProgress } from '../TopProgress';
import { SearchModal } from '../../ui';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded);
  const { searchOpen, openSearch, closeSearch } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K 或 Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOpen) closeSearch();
        else openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, openSearch, closeSearch]);

  return (
    <div className={styles.layout}>
      <TopProgress />
      <Sidebar />
      <div className={styles['layout-content']}>
        <main
          className={`${styles['layout-main']} ${sidebarExpanded ? styles['sidebar-expanded'] : ''}`}
        >
          {children}
        </main>
      </div>
      <BottomNav />
      <SearchModal isOpen={searchOpen} onClose={closeSearch} />
    </div>
  );
}
