import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShieldAlert, Users, HardDrive, RefreshCw, Activity } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { SystemAPI } from '../../api/system';
import { Button } from '../../components/ui';
import styles from './AdminPage.module.css';

type AdminTab = 'dashboard' | 'users' | 'library';

export default function AdminPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // 路由守卫：非管理员直接重定向到首页
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles['admin-page']}>
      <div className={styles['admin-header']}>
        <h1 className={styles['admin-title']}>
          <ShieldAlert size={32} className="text-accent" />
          控制台
        </h1>
      </div>

      <div className={styles['admin-content']}>
        {/* 左侧导航 */}
        <div className={styles['admin-nav']}>
          <button
            className={`${styles['nav-item']} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={20} /> 仪表盘
          </button>
          <button
            className={`${styles['nav-item']} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} /> 用户管理
          </button>
          <button
            className={`${styles['nav-item']} ${activeTab === 'library' ? styles.active : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <HardDrive size={20} /> 媒体库维护
          </button>
        </div>

        {/* 右侧面板 */}
        <div className={styles['admin-panel']}>
          {activeTab === 'dashboard' && <DashboardPanel />}
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'library' && <LibraryPanel />}
        </div>
      </div>
    </div>
  );
}

function DashboardPanel() {
  const { data: info, isLoading } = useQuery({
    queryKey: ['systemInfo'],
    queryFn: SystemAPI.getSystemInfo,
  });

  if (isLoading) return <div className="text-gray-500">加载系统信息中...</div>;

  return (
    <div>
      <h2 className={styles['panel-title']}>系统概览</h2>
      <div className={styles['stats-grid']}>
        <div className={styles['stat-card']}>
          <div className={styles['stat-label']}>服务器名称</div>
          <div className={styles['stat-value']}>{info?.ServerName || '-'}</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-label']}>Jellyfin 版本</div>
          <div className={styles['stat-value']}>{info?.Version || '-'}</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-label']}>操作系统</div>
          <div className={styles['stat-value']}>{info?.OperatingSystem || '-'}</div>
        </div>
      </div>
    </div>
  );
}

function UsersPanel() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: SystemAPI.getUsers,
  });

  if (isLoading) return <div className="text-gray-500">加载用户列表中...</div>;

  return (
    <div>
      <h2 className={styles['panel-title']}>用户管理</h2>
      <table className={styles['user-table']}>
        <thead>
          <tr>
            <th>用户名</th>
            <th>管理员</th>
            <th>最后活动时间</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.Id}>
              <td>{user.Name}</td>
              <td>{user.Policy?.IsAdministrator ? '是' : '否'}</td>
              <td>{user.LastActivityDate ? new Date(user.LastActivityDate).toLocaleString() : '从未'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LibraryPanel() {
  const refreshMutation = useMutation({
    mutationFn: SystemAPI.refreshLibrary,
  });

  return (
    <div>
      <h2 className={styles['panel-title']}>媒体库维护</h2>
      <div className="flex flex-col gap-4">
        <p className="text-gray-400">手动触发 Jellyfin 服务器的全局媒体库扫描。扫描过程中服务器负载可能会升高。</p>
        <div>
          <Button
            leftIcon={<RefreshCw className={refreshMutation.isPending ? 'animate-spin' : ''} />}
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? '扫描请求已发送...' : '扫描全部媒体库'}
          </Button>
        </div>
        {refreshMutation.isSuccess && <p className="text-green-500 text-sm mt-2">扫描指令已发送到服务器。</p>}
        {refreshMutation.isError && <p className="text-red-500 text-sm mt-2">发送扫描指令失败。</p>}
      </div>
    </div>
  );
}
