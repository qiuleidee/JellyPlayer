import { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { init } from '@noriginmedia/norigin-spatial-navigation';
import { App as CapacitorApp } from '@capacitor/app';
import { ToastProvider } from './components/ui/Toast';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { PageLayout } from './components/layout/PageLayout';
import { ROUTES } from './constants/routes';

// 初始化 TV 焦点空间导航引擎
init({
  debug: false,
  visualDebug: false,
});

// 懒加载页面组件 (Route-level Code Splitting)
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LibraryPage = lazy(() => import('./pages/LibraryPage').then((m) => ({ default: m.LibraryPage })));
const DetailPage = lazy(() => import('./pages/DetailPage').then((m) => ({ default: m.DetailPage })));
const PlayerPage = lazy(() => import('./pages/PlayerPage').then((m) => ({ default: m.PlayerPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const PlaylistPage = lazy(() => import('./pages/PlaylistPage').then((m) => ({ default: m.PlaylistPage })));
const CollectionPage = lazy(() => import('./pages/CollectionPage').then((m) => ({ default: m.CollectionPage })));
const SyncPlayPage = lazy(() => import('./pages/SyncPlayPage').then((m) => ({ default: m.SyncPlayPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

// TanStack Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 分钟后数据过期
      gcTime: 1000 * 60 * 60 * 24,    // 持久化需要更长的垃圾回收时间 (24小时)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// localStorage 同步持久化器
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

import { useWebSocket } from './hooks/useWebSocket';

function AppContent({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const themeColor = useSettingsStore((s) => s.themeColor);
  const navigate = useNavigate();
  const location = useLocation();

  // 监听并接管安卓电视硬件返回键
  useEffect(() => {
    const handleBackButton = async ({ canGoBack }: any) => {
      if (!canGoBack || location.pathname === ROUTES.HOME || location.pathname === '/login') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    };
    CapacitorApp.addListener('backButton', handleBackButton);
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [location.pathname, navigate]);

  // 初始化全局 WebSocket 连接（自带重连与认证检查）
  useWebSocket();

  // 应用主题
  useEffect(() => {
    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
      document.documentElement.setAttribute('data-color-scheme', themeColor);
    };

    applyTheme();

    // 监听系统主题变化
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, themeColor]);

  return <>{children}</>;
}

// 路由守卫：未登录重定向到登录页
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
}

// 登录页守卫：已登录重定向到首页
function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return <>{children}</>;
}

function AnimatedMainRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ flex: 1, width: '100%', minHeight: '100%' }}
      >
        <Routes location={location}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
          <Route path={ROUTES.MOVIE_DETAIL} element={<DetailPage />} />
          <Route path={ROUTES.SERIES_DETAIL} element={<DetailPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.FAVORITES} element={<FavoritesPage />} />
          <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
          <Route path={ROUTES.STATS} element={<StatsPage />} />
          <Route path={ROUTES.PLAYLISTS} element={<PlaylistPage />} />
          <Route path={ROUTES.COLLECTIONS} element={<CollectionPage />} />
          <Route path={ROUTES.SYNCPLAY} element={<SyncPlayPage />} />
          <Route path={ROUTES.ADMIN} element={<AdminPage />} />
          <Route path="*" element={<div className="flex h-[80vh] items-center justify-center text-[var(--text-secondary)] text-xl font-medium">页面不存在或已被移除</div>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function RootRoutes() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/play/');
  const isLogin = location.pathname === '/login';
  const rootKey = isPlayer ? 'player' : isLogin ? 'login' : 'main';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={rootKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Routes location={location}>
          <Route path={ROUTES.LOGIN} element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path={ROUTES.PLAYER} element={<ProtectedRoute><PlayerPage /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><PageLayout><AnimatedMainRoutes /></PageLayout></ProtectedRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }} // 缓存有效期 24 小时
    >
      <ToastProvider>
        <HashRouter>
          <AppContent>
            <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">加载中...</div>}>
              <RootRoutes />
            </Suspense>
          </AppContent>
        </HashRouter>
      </ToastProvider>
    </PersistQueryClientProvider>
  );
}
