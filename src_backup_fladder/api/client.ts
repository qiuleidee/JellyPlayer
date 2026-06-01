import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { CLIENT_INFO } from '../constants/api';

export const getDeviceId = () => `jellyplayer-${navigator.userAgent.replace(/\W/g, '')}`;

// 生成授权头
const getAuthorizationHeader = (token?: string) => {
  const parts = [
    `Client="${CLIENT_INFO.CLIENT_NAME}"`,
    `Device="${CLIENT_INFO.DEVICE_NAME}"`,
    `DeviceId="${getDeviceId()}"`, // 简单的基于 UA 的 DeviceId
    `Version="${CLIENT_INFO.VERSION}"`,
  ];
  if (token) {
    parts.push(`Token="${token}"`);
  }
  return `MediaBrowser ${parts.join(', ')}`;
};

// 创建 Axios 实例
export const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：动态注入 baseUrl 和 token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 获取当前活跃服务器的配置
    const activeServer = useAuthStore.getState().getActiveServer();

    if (activeServer) {
      // 如果请求没有指定绝对 URL，则拼上服务器 URL
      if (config.url && !config.url.startsWith('http')) {
        // 确保 URL 拼接正确
        const baseUrl = activeServer.url.endsWith('/')
          ? activeServer.url.slice(0, -1)
          : activeServer.url;
        const reqUrl = config.url.startsWith('/') ? config.url : `/${config.url}`;
        config.url = `${baseUrl}${reqUrl}`;
      }

      // 设置授权头
      config.headers['X-Emby-Authorization'] = getAuthorizationHeader(activeServer.accessToken);
    } else {
      // 没有任何服务器配置时，提供基础的授权头（部分公开接口需要）
      config.headers['X-Emby-Authorization'] = getAuthorizationHeader();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理和 401 退出
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token 过期或无效
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 格式化错误信息
    const errMessage = (error.response?.data as any)?.message || error.message || '未知错误';
    const apiError = new Error(errMessage) as Error & { status?: number };
    apiError.status = error.response?.status;
    
    return Promise.reject(apiError);
  }
);
