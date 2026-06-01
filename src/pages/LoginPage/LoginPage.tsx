import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, User as UserIcon, Lock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input, Button, useToast } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { getSystemInfoPublic, authenticate } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import styles from './LoginPage.module.css';

type LoginStep = 'server-select' | 'server-add' | 'login';

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { servers, addServer, setActiveServer, login, getActiveServer } = useAuthStore();
  
  const [step, setStep] = useState<LoginStep>(servers.length > 0 ? 'server-select' : 'server-add');
  
  // 添加服务器表单状态
  const [serverUrl, setServerUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [serverName, setServerName] = useState('');
  const [serverInfoStr, setServerInfoStr] = useState('');

  // 登录表单状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 当选择已有服务器时跳转到登录步
  const handleSelectServer = (id: string) => {
    setActiveServer(id);
    setStep('login');
  };

  // 测试服务器连接
  const handleTestServer = async () => {
    if (!serverUrl) return;
    
    // 自动补全 http/https
    let urlToTest = serverUrl.trim();
    if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
      urlToTest = `http://${urlToTest}`;
      setServerUrl(urlToTest);
    }

    setIsTesting(true);
    setTestResult('checking');
    try {
      const info = await getSystemInfoPublic(urlToTest);
      setTestResult('success');
      setServerName(info.ServerName || 'Jellyfin Server');
      setServerInfoStr(`Jellyfin ${info.Version} - ${info.OperatingSystem}`);
      toast({ type: 'success', message: `成功连接到 ${info.ServerName || '服务器'}` });
    } catch (err: any) {
      setTestResult('error');
      toast({ type: 'error', message: '无法连接到服务器，请检查地址是否正确' });
    } finally {
      setIsTesting(false);
    }
  };

  // 添加服务器
  const handleAddServer = () => {
    if (testResult !== 'success') {
      toast({ type: 'warning', message: '请先成功测试服务器连接' });
      return;
    }
    
    // 检查是否已存在
    const exists = servers.find(s => 
      s.url.toLowerCase() === serverUrl.toLowerCase() || 
      (s.url + '/').toLowerCase() === serverUrl.toLowerCase()
    );
    
    if (exists) {
      toast({ type: 'info', message: '该服务器已存在，已自动选择' });
      setActiveServer(exists.id);
    } else {
      addServer({
        name: serverName,
        url: serverUrl,
      });
    }
    setStep('login');
  };

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast({ type: 'warning', message: '请输入用户名' });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await authenticate({
        Username: username,
        Pw: password || undefined,
      });

      login({
        userId: response.User.Id,
        accessToken: response.AccessToken,
        userName: response.User.Name,
        isAdmin: response.User.Policy.IsAdministrator,
        serverId: response.ServerId,
      });

      toast({ type: 'success', message: `欢迎回来，${response.User.Name}` });
      navigate(ROUTES.HOME);
    } catch (err: any) {
      toast({ type: 'error', message: err.status === 401 ? '用户名或密码错误' : '登录失败' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const currentServer = getActiveServer();

  // 动画配置
  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stopColor="#e88a2d"/>
                <stop offset="100%" stopColor="#d35f1c"/>
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="var(--bg-elevated)"/>
            <polygon points="24,16 24,48 50,32" fill="url(#g)"/>
          </svg>
          <h1 className={styles.title}>JellyPlayer</h1>
        </div>

        <div className={styles.content}>
          <AnimatePresence mode="wait">
            
            {/* 步骤一：选择服务器 */}
            {step === 'server-select' && (
              <motion.div key="server-select" variants={variants} initial="initial" animate="animate" exit="exit">
                <p className={styles.subtitle}>选择要连接的服务器</p>
                <div className={styles['server-list']}>
                  {servers.map((s) => (
                    <button key={s.id} className={styles['server-item']} onClick={() => handleSelectServer(s.id)}>
                      <div className={styles['server-icon']}>
                        <Server size={20} />
                      </div>
                      <div className={styles['server-info']}>
                        <div className={styles['server-name']}>{s.name}</div>
                        <div className={styles['server-url']}>{s.url}</div>
                      </div>
                      <ChevronRight size={20} className={styles['server-arrow']} />
                    </button>
                  ))}
                </div>
                <Button variant="ghost" fullWidth onClick={() => setStep('server-add')} className={styles['add-btn']}>
                  连接新服务器
                </Button>
              </motion.div>
            )}

            {/* 步骤二：添加服务器 */}
            {step === 'server-add' && (
              <motion.div key="server-add" variants={variants} initial="initial" animate="animate" exit="exit">
                <p className={styles.subtitle}>连接您的 Jellyfin 服务器</p>
                <div className={styles.form}>
                  <Input
                    placeholder="例如: http://192.168.1.100:8096"
                    value={serverUrl}
                    onChange={(e) => {
                      setServerUrl(e.target.value);
                      if (testResult !== 'idle') setTestResult('idle');
                    }}
                    status={testResult}
                    large
                    onKeyDown={(e) => e.key === 'Enter' && handleTestServer()}
                  />
                  
                  {testResult === 'success' && (
                    <div className={styles['server-success-card']}>
                      <CheckCircle2 size={24} color="var(--color-green)" />
                      <div>
                        <div className={styles['server-name']}>{serverName}</div>
                        <div className={styles['server-url']}>{serverInfoStr}</div>
                      </div>
                    </div>
                  )}

                  {testResult === 'error' && (
                    <div className={styles['server-error-card']}>
                      <AlertCircle size={20} color="var(--color-red)" />
                      <span>连接失败，请检查地址是否可达</span>
                    </div>
                  )}

                  <div className={styles['action-row']}>
                    {servers.length > 0 && (
                      <Button variant="ghost" onClick={() => setStep('server-select')}>
                        返回
                      </Button>
                    )}
                    <div style={{ flex: 1 }} />
                    {testResult !== 'success' ? (
                      <Button onClick={handleTestServer} loading={isTesting} disabled={!serverUrl}>
                        测试连接
                      </Button>
                    ) : (
                      <Button onClick={handleAddServer}>
                        继续
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 步骤三：登录 */}
            {step === 'login' && (
              <motion.div key="login" variants={variants} initial="initial" animate="animate" exit="exit">
                <p className={styles.subtitle}>登录到 {currentServer?.name}</p>
                <form className={styles.form} onSubmit={handleLogin}>
                  <Input
                    placeholder="用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    leftIcon={<UserIcon size={20} />}
                    large
                    autoFocus
                  />
                  <Input
                    type="password"
                    placeholder="密码（如果没有可留空）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock size={20} />}
                    large
                  />
                  
                  <Button type="submit" fullWidth size="lg" loading={isLoggingIn} className={styles['login-btn']}>
                    登录
                  </Button>

                  <Button type="button" variant="ghost" fullWidth onClick={() => setStep('server-select')}>
                    切换服务器
                  </Button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
