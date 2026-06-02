import { apiClient } from './client';

export const SystemAPI = {
  /**
   * 获取系统基本信息
   */
  async getSystemInfo(): Promise<any> {
    const { data } = await apiClient.get('/System/Info');
    return data;
  },

  /**
   * 获取所有用户（需要管理员权限）
   */
  async getUsers(): Promise<any[]> {
    const { data } = await apiClient.get('/Users');
    return data;
  },

  /**
   * 触发媒体库扫描
   */
  async refreshLibrary(): Promise<void> {
    await apiClient.post('/Library/Refresh');
  },

  /**
   * 获取系统日志
   */
  async getLogs(): Promise<any[]> {
    const { data } = await apiClient.get('/System/Logs');
    return data;
  }
};
