import axios from 'axios';
import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api';
import type { SystemInfo, AuthRequest, AuthResponse } from '../types/api';

/**
 * 探测服务器信息（用于连接测试）
 * 注意：这里使用原生 axios 且指定完整 URL，以绕过拦截器，方便连接测试
 */
export async function getSystemInfoPublic(serverUrl: string): Promise<SystemInfo> {
  const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  const { data } = await axios.get<SystemInfo>(`${baseUrl}${API_ENDPOINTS.SYSTEM_INFO_PUBLIC}`, {
    timeout: 5000,
  });
  return data;
}

/**
 * 用户名密码登录
 */
export async function authenticate(credentials: AuthRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTHENTICATE, credentials);
  return data;
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.LOGOUT);
}
