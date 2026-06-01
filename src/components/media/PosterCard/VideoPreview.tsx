import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import styles from './VideoPreview.module.css';

interface VideoPreviewProps {
  itemId: string;
  isHovered: boolean;
}

export default function VideoPreview({ itemId, isHovered }: VideoPreviewProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const server = useAuthStore((s) => s.getActiveServer());
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isHovered) {
      // 悬停 800ms 后才开始加载视频，避免快速滑动时频繁请求
      timer = setTimeout(() => {
        setShouldLoad(true);
      }, 800);
    } else {
      setShouldLoad(false);
    }
    return () => clearTimeout(timer);
  }, [isHovered]);

  if (!shouldLoad || !server) return null;

  // 请求最低码率转码流作为预览，避免拉爆服务器
  const streamUrl = `${server.url}/Videos/${itemId}/stream.mp4?Static=false&VideoCodec=h264&AudioCodec=aac&VideoBitrate=400000&AudioBitrate=64000&MaxWidth=400&api_key=${server.accessToken}`;

  return (
    <video
      ref={videoRef}
      className={styles['video-preview']}
      src={streamUrl}
      autoPlay
      muted
      loop
      playsInline
      onLoadedData={() => {
        if (videoRef.current) {
          videoRef.current.style.opacity = '1';
        }
      }}
    />
  );
}
