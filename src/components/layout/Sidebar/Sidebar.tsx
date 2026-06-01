import { NavLink } from 'react-router-dom';
import { Home, Film, Tv, PlaySquare, Settings, Heart, Clock, Menu, Search, ShieldAlert, BarChart3 } from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useAuthStore } from '../../../stores/authStore';
import { ROUTES } from '../../../constants/routes';
import styles from './Sidebar.module.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

export default function Sidebar() {
  const { sidebarExpanded, toggleSidebar, sidebarHovered, setSidebarHovered, openSearch } = useUIStore();
  const isAdmin = useAuthStore(s => s.isAdmin);
  const isExpanded = sidebarExpanded || sidebarHovered;

  const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: '首页', icon: <Home size={22} />, path: ROUTES.HOME },
    { id: 'search', label: '搜索', icon: <Search size={22} />, onClick: openSearch },
    { id: 'movies', label: '电影', icon: <Film size={22} />, path: '/library/movies' },
    { id: 'series', label: '剧集', icon: <Tv size={22} />, path: '/library/series' },
    { id: 'playlists', label: '播放列表', icon: <PlaySquare size={22} />, path: ROUTES.PLAYLISTS },
    { id: 'favorites', label: '收藏', icon: <Heart size={22} />, path: ROUTES.FAVORITES },
    { id: 'history', label: '观看历史', icon: <Clock size={22} />, path: ROUTES.HISTORY },
    { id: 'stats', label: '观看统计', icon: <BarChart3 size={22} />, path: ROUTES.STATS },
  ];

  if (isAdmin) {
    NAV_ITEMS.push({ id: 'admin', label: '控制台', icon: <ShieldAlert size={22} />, path: ROUTES.ADMIN });
  }

  return (
    <aside
      className={`${styles.sidebar} ${isExpanded ? styles['sidebar-expanded'] : ''}`}
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
    >
      <div className={styles['sidebar-header']} onClick={toggleSidebar}>
        <div className={styles['logo-icon']}>
          {isExpanded ? (
            <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
              <polygon points="24,16 24,48 50,32" fill="var(--accent)" />
            </svg>
          ) : (
            <Menu size={20} color="var(--text-primary)" />
          )}
        </div>
        <div className={styles['logo-text']}>JellyPlayer</div>
      </div>

      <nav className={styles['sidebar-content']}>
        {NAV_ITEMS.map((item) => {
          if (item.onClick) {
            return (
              <button
                key={item.id}
                className={`${styles['nav-item']} ${styles['nav-btn']}`}
                onClick={item.onClick}
                title={!isExpanded ? item.label : undefined}
              >
                <div className={styles['nav-icon']}>{item.icon}</div>
                <div className={styles['nav-label']}>{item.label}</div>
              </button>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path!}
              className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles['nav-item-active'] : ''}`}
              title={!isExpanded ? item.label : undefined}
            >
              <div className={styles['nav-icon']}>{item.icon}</div>
              <div className={styles['nav-label']}>{item.label}</div>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles['sidebar-footer']}>
        <NavLink to={ROUTES.SETTINGS} className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles['nav-item-active'] : ''}`}>
          <div className={styles['nav-icon']}><Settings size={22} /></div>
          <div className={styles['nav-label']}>设置</div>
        </NavLink>
        <button
          className={`${styles['nav-item']} ${styles['nav-btn']} ${styles['logout-btn']}`}
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = ROUTES.LOGIN;
          }}
          title={!isExpanded ? '切换用户' : undefined}
        >
          <div className={styles['nav-icon']}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </div>
          <div className={styles['nav-label']}>切换用户</div>
        </button>
      </div>
    </aside>
  );
}
