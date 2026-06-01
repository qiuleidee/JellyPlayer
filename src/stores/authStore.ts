import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ServerConfig {
  id: string;
  name: string;
  url: string;
  userId?: string;
  accessToken?: string;
  serverId?: string;
}

interface AuthState {
  // 服务器配置
  servers: ServerConfig[];
  activeServerId: string | null;

  // 当前认证信息
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  userName: string | null;
  isAdmin: boolean;

  // 操作
  addServer: (server: Omit<ServerConfig, 'id'>) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string) => void;
  login: (data: { userId: string; accessToken: string; userName: string; isAdmin: boolean; serverId: string }) => void;
  logout: () => void;
  getActiveServer: () => ServerConfig | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: null,
      isAuthenticated: false,
      userId: null,
      accessToken: null,
      userName: null,
      isAdmin: false,

      addServer: (server) =>
        set((state) => {
          const id = `server-${Date.now()}`;
          return {
            servers: [...state.servers, { ...server, id }],
            activeServerId: state.activeServerId || id,
          };
        }),

      removeServer: (id) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          activeServerId: state.activeServerId === id ? (state.servers[0]?.id || null) : state.activeServerId,
        })),

      setActiveServer: (id) => 
        set((state) => {
          const target = state.servers.find(s => s.id === id);
          if (target && target.accessToken && target.userId) {
            return {
              activeServerId: id,
              isAuthenticated: true,
              userId: target.userId,
              accessToken: target.accessToken,
            };
          }
          return {
            activeServerId: id,
            isAuthenticated: false,
            userId: null,
            accessToken: null,
          };
        }),

      login: ({ userId, accessToken, userName, isAdmin, serverId }) =>
        set((state) => {
          // 将 token 也保存到对应 server 配置中
          const servers = state.servers.map((s) =>
            s.id === state.activeServerId ? { ...s, userId, accessToken, serverId } : s
          );
          return {
            servers,
            isAuthenticated: true,
            userId,
            accessToken,
            userName,
            isAdmin,
          };
        }),

      logout: () =>
        set((state) => {
          const servers = state.servers.map((s) =>
            s.id === state.activeServerId ? { ...s, userId: undefined, accessToken: undefined } : s
          );
          return {
            servers,
            isAuthenticated: false,
            userId: null,
            accessToken: null,
            userName: null,
            isAdmin: false,
          };
        }),

      getActiveServer: () => {
        const { servers, activeServerId } = get();
        return servers.find((s) => s.id === activeServerId) || null;
      },
    }),
    {
      name: 'jellyplayer-auth',
      partialize: (state) => ({
        servers: state.servers,
        activeServerId: state.activeServerId,
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        accessToken: state.accessToken,
        userName: state.userName,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
