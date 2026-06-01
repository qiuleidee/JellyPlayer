import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '../../../stores/playerStore';
import type { ExternalSubtitle } from './VideoPlayer';

interface UseNativePlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string;
  isDirectPlay?: boolean;
  externalSubtitles?: ExternalSubtitle[];
}

export function useNativePlayer({ videoRef, src, isDirectPlay, externalSubtitles = [] }: UseNativePlayerProps) {
  const hlsRef = useRef<Hls | null>(null);
  const tracksRef = useRef<HTMLTrackElement[]>([]);

  const activeAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const activeSubtitleTrack = usePlayerStore((s) => s.currentSubtitleTrack);

  // 初始化播放引擎
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let isMounted = true;

    const setupNativeTracks = () => {
      // 挂载原生的纯文本字幕
      const activeTracks: HTMLTrackElement[] = [];
      externalSubtitles.forEach(sub => {
        // ASS 已经由 PlayerPage 处理（如果选中会触发服务端转码），能走到这里的前端字幕只有 srt/vtt
        const isAss = sub.codec?.toLowerCase().includes('ass') || sub.codec?.toLowerCase().includes('ssa');
        if (!isAss) {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = sub.name;
          track.srclang = sub.lang;
          track.src = sub.url;
          track.id = `track-${sub.id}`;
          video.appendChild(track);
          activeTracks.push(track);
        }
      });
      tracksRef.current = activeTracks;
      return activeTracks;
    };

    // Hls.js 分支：用于播放 m3u8 转码串流
    if (!isDirectPlay && src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        console.log('[NativeEngine] Using Hls.js');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!isMounted) return;
          setupNativeTracks();
          if (usePlayerStore.getState().isPlaying) {
            video.play().catch(console.warn);
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // 原生支持 HLS (Safari/iOS)
        console.log('[NativeEngine] Using Native Apple HLS');
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          if (!isMounted) return;
          setupNativeTracks();
          if (usePlayerStore.getState().isPlaying) {
            video.play().catch(console.warn);
          }
        });
      }
    } else {
      // DirectPlay 或原生 MP4
      console.log('[NativeEngine] Using HTML5 Native Playback');
      video.src = src;
      const handleCanPlay = () => {
        if (!isMounted) return;
        setupNativeTracks();
        if (usePlayerStore.getState().isPlaying) {
          video.play().catch(console.warn);
        }
      };
      video.addEventListener('canplay', handleCanPlay, { once: true });
    }

    return () => {
      isMounted = false;
      tracksRef.current.forEach(t => {
        if (t.parentNode === video) video.removeChild(t);
      });
      tracksRef.current = [];
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = '';
      video.load();
    };
  }, [src, isDirectPlay]); // externalSubtitles 由外部稳定

  // 监听原生轨道切换
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 字幕切换
    try {
      tracksRef.current.forEach(trackEl => {
        if (trackEl.track) {
          const isTarget = trackEl.id === `track-${activeSubtitleTrack}`;
          trackEl.track.mode = isTarget ? 'showing' : 'hidden';
        }
      });
    } catch (e) { console.warn('Subtitle switch error:', e); }

  }, [activeSubtitleTrack, activeAudioTrack]);

  return { hlsRef };
}
