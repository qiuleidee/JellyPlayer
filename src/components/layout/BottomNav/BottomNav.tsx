import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Film, Tv, Settings, Search } from 'lucide-react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { ROUTES } from '../../../constants/routes';
import styles from './BottomNav.module.css';
import { useUIStore } from '../../../stores/uiStore';

const MOBILE_NAV_ITEMS = [
  { id: 'home', label: '首页', icon: <Home size={22} />, path: ROUTES.HOME },
  { id: 'movies', label: '电影', icon: <Film size={22} />, path: '/library/movies' },
  { id: 'search', label: '搜索', icon: <Search size={22} />, action: 'search' },
  { id: 'series', label: '剧集', icon: <Tv size={22} />, path: '/library/series' },
  { id: 'settings', label: '设置', icon: <Settings size={22} />, path: ROUTES.SETTINGS },
];

function FocusableNavItem({ item, openSearch }: any) {
  const navigate = useNavigate();
  const { ref, focused } = useFocusable({
    onEnterPress: () => {
      if (item.action === 'search') {
        openSearch();
      } else {
        navigate(item.path);
      }
    }
  });

  if (item.action === 'search') {
    return (
      <button ref={ref as any} className={`${styles['nav-item']} ${focused ? styles.focused : ''}`} onClick={openSearch}>
        <div className={styles['nav-icon']}>{item.icon}</div>
        <div className={styles['nav-label']}>{item.label}</div>
      </button>
    );
  }

  return (
    <NavLink
      ref={ref as any}
      to={item.path!}
      className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles['nav-item-active'] : ''} ${focused ? styles.focused : ''}`}
    >
      <div className={styles['nav-icon']}>{item.icon}</div>
      <div className={styles['nav-label']}>{item.label}</div>
    </NavLink>
  );
}

export default function BottomNav() {
  const openSearch = useUIStore((s) => s.openSearch);

  return (
    <nav className={styles['bottom-nav']}>
      {MOBILE_NAV_ITEMS.map((item) => (
        <FocusableNavItem key={item.id} item={item} openSearch={openSearch} />
      ))}
    </nav>
  );
}
