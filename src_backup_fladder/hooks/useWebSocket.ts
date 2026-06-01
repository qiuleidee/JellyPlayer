import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/Toast';
import { getDeviceId } from '../api/client';
import { useSyncPlayStore } from '../stores/syncPlayStore';
import type { WsMessage, LibraryChangedData, UserDataChangedData } from '../api/websocket';

export function useWebSocket() {
  const activeServer = useAuthStore((s) => s.getActiveServer());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const handleMessageRef = useRef<((msg: WsMessage) => void) | undefined>(undefined);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const handleMessage = useCallback((msg: WsMessage) => {
    switch (msg.MessageType) {
      case 'LibraryChanged': {
        const data = msg.Data as LibraryChangedData;
        const totalChanges = (data.ItemsAdded?.length || 0) + (data.ItemsUpdated?.length || 0) + (data.ItemsRemoved?.length || 0);
        
        if (totalChanges > 0) {
          toast({
            title: '媒体库已更新',
            message: `服务器新增/更新了 ${totalChanges} 个媒体项`,
            type: 'info',
            duration: 5000
          });
          // 刷新所有媒体库查询缓存，重新拉取最新数据
          queryClient.invalidateQueries({ queryKey: ['library'] });
          queryClient.invalidateQueries({ queryKey: ['items'] });
        }
        break;
      }
      case 'UserDataChanged': {
        const data = msg.Data as UserDataChangedData;
        if (data.UserId === userId) {
          // 只刷新当前用户的进度/收藏数据
          queryClient.invalidateQueries({ queryKey: ['userData'] });
          // 也刷新媒体库，因为里面包含 UserData 字段
          queryClient.invalidateQueries({ queryKey: ['library'] });
        }
        break;
      }
      case 'ServerRestarting':
      case 'ServerShuttingDown':
        toast({
          title: '服务器通知',
          message: 'Jellyfin 服务器正在重启或关闭，服务可能暂时中断。',
          type: 'warning',
          duration: 10000
        });
        break;
      case 'SyncPlayGroupUpdate': {
        const updateData = msg.Data;
        if (updateData.GroupId) {
          useSyncPlayStore.getState().setGroupId(updateData.GroupId);
        }
        if (updateData.Type === 'GroupJoined' || updateData.Type === 'GroupLeft') {
          // 这里可以获取在线成员列表，Jellyfin 有时在 Users 数组里发
          if (Array.isArray(updateData.Users)) {
             useSyncPlayStore.getState().setUsers(updateData.Users.map((u: string) => ({ Id: u, Name: u })));
          }
        }
        break;
      }
      case 'SyncPlayCommand': {
        useSyncPlayStore.getState().receiveCommand(msg.Data);
        break;
      }
      default:
        // Ignore other messages for now
        break;
    }
  }, [toast, queryClient, userId]);

  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  const connect = useCallback(() => {
    if (!isAuthenticated || !activeServer || !activeServer.accessToken) return;

    // 构建 ws url
    const wsUrl = activeServer.url.replace(/^http/, 'ws') + 
      `/socket?api_key=${activeServer.accessToken}&deviceId=${getDeviceId()}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected to Jellyfin server');
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        handleMessageRef.current?.(msg);
      } catch (err) {
        console.error('[WebSocket] Failed to parse message', err);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const backoffTime = Math.min(5000 * Math.pow(1.5, reconnectAttemptsRef.current), 60000);
        console.log(`[WebSocket] Disconnected. Reconnecting in ${Math.round(backoffTime/1000)}s...`);
        reconnectTimeoutRef.current = window.setTimeout(connect, backoffTime);
        reconnectAttemptsRef.current++;
      } else {
        console.warn('[WebSocket] Max reconnect attempts reached. Stopped reconnecting.');
      }
    };

    ws.onerror = () => {
      // 不打印完整的 error 对象以防止控制台刷屏，仅在首次或偶尔提示
      if (reconnectAttemptsRef.current === 0) {
        console.warn('[WebSocket] Connection error. SyncPlay might not work.');
      }
      ws.close();
    };
  }, [activeServer, isAuthenticated]); // 修复：使用 handleMessageRef 避免依赖循环和闭包陈旧

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
}
