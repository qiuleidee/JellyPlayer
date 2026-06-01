import { useEffect, useRef } from 'react';
import { useSyncPlayStore } from '../stores/syncPlayStore';
import { useToast } from '../components/ui/Toast';

export function useSyncPlaySync(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const { pendingCommand, clearPendingCommand, groupId } = useSyncPlayStore();
  const { toast } = useToast();
  
  // 防止本地播放事件触发循环死锁
  const isExecutingRemoteCommand = useRef(false);

  useEffect(() => {
    if (!groupId || !pendingCommand || !videoRef.current) return;

    const video = videoRef.current;
    isExecutingRemoteCommand.current = true;

    try {
      switch (pendingCommand.Command) {
        case 'Play':
        case 'Unpause':
          if (pendingCommand.PositionTicks) {
            const targetTime = pendingCommand.PositionTicks / 10000000;
            // 延迟补偿：如果误差大于 2 秒，才做 seek，防止反复横跳
            if (Math.abs(video.currentTime - targetTime) > 2) {
              video.currentTime = targetTime;
            }
          }
          video.play().catch(console.error);
          toast({ title: '同步', message: '房主已继续播放', type: 'info' });
          break;

        case 'Pause':
          video.pause();
          toast({ title: '同步', message: '房主已暂停', type: 'info' });
          break;

        case 'Seek':
          if (pendingCommand.PositionTicks) {
            const seekTime = pendingCommand.PositionTicks / 10000000;
            video.currentTime = seekTime;
            toast({ title: '同步', message: '房主调整了进度', type: 'info' });
          }
          break;
          
        case 'Stop':
          video.pause();
          toast({ title: '同步', message: '观影结束', type: 'info' });
          break;
      }
    } finally {
      // 执行完毕后清除命令
      clearPendingCommand();
      setTimeout(() => {
        isExecutingRemoteCommand.current = false;
      }, 500); // 防抖
    }
  }, [pendingCommand, groupId, clearPendingCommand, videoRef, toast]);

  return { isExecutingRemoteCommand };
}
