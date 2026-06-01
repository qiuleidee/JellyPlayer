import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '../../../stores/playerStore';
import { useShallow } from 'zustand/react/shallow';
import styles from './VideoPlayer.module.css';

export interface ExternalSubtitle {
  id: number;
  url: string;
  name: string;
  lang: string;
}

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  isDirectPlay?: boolean;
  externalSubtitles?: ExternalSubtitle[];
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, isDirectPlay, externalSubtitles = [], poster, onTimeUpdate, onEnded, onPlay, onPause, ...rest }, ref) => {
    const internalRef = useRef<HTMLVideoElement>(null);
    useImperativeHandle(ref, () => internalRef.current!);
    
    const hlsRef = useRef<Hls | null>(null);
    const { isPlaying, volume, isMuted, setIsBuffering, setDuration, setCurrentTime, setAudioTracks, setSubtitleTracks, currentAudioTrack, currentSubtitleTrack, subtitleOffset } = usePlayerStore(
      useShallow((state) => ({
        isPlaying: state.isPlaying,
        volume: state.volume,
        isMuted: state.isMuted,
        setIsBuffering: state.setIsBuffering,
        setDuration: state.setDuration,
        setCurrentTime: state.setCurrentTime,
        setAudioTracks: state.setAudioTracks,
        setSubtitleTracks: state.setSubtitleTracks,
        currentAudioTrack: state.currentAudioTrack,
        currentSubtitleTrack: state.currentSubtitleTrack,
        subtitleOffset: state.subtitleOffset,
      }))
    );

  useEffect(() => {
    const video = internalRef.current;
    if (!video || !src) return;

    // 清理之前的 Hls 实例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!isDirectPlay && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) video.play().catch(console.error);

        // 获取音轨和字幕
        if (hls.audioTracks) {
          const aTracks = hls.audioTracks.map((t) => ({
            id: t.id,
            name: t.name || `Audio ${t.id}`,
            lang: t.lang
          }));
          setAudioTracks(aTracks);
        }
        if (hls.subtitleTracks) {
          const sTracks = hls.subtitleTracks.map((t) => ({
            id: t.id,
            name: t.name || `Subtitle ${t.id}`,
            lang: t.lang
          }));
          setSubtitleTracks(sTracks);
        }
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        if (hls.subtitleTracks) {
          const sTracks = hls.subtitleTracks.map((t) => ({
            id: t.id,
            name: t.name || `Subtitle ${t.id}`,
            lang: t.lang
          }));
          setSubtitleTracks(sTracks);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("fatal network error encountered, try to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("fatal media error encountered, try to recover");
              hls.recoverMediaError();
              break;
            default:
              console.error("cannot recover HLS error", data);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      // 浏览器原生支持 HLS (如 Safari) 或是直接播放
      video.src = src;
      const onLoadedMetadata = () => {
        if (usePlayerStore.getState().isPlaying) video.play().catch(console.error);
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src, isDirectPlay]);

  // 同步外部状态到 Video
  useEffect(() => {
    if (!internalRef.current) return;
    if (isPlaying) {
      internalRef.current.play().catch(console.error);
    } else {
      internalRef.current.pause();
    }
  }, [isPlaying]);

  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const setSeekTarget = usePlayerStore((s) => s.setSeekTarget);

  useEffect(() => {
    if (seekTarget !== null && internalRef.current) {
      internalRef.current.currentTime = seekTarget;
      setSeekTarget(null);
    }
  }, [seekTarget, setSeekTarget]);

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.volume = volume;
      internalRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // 音轨/字幕热切换同步
  useEffect(() => {
    if (hlsRef.current) {
      if (currentAudioTrack !== -1 && hlsRef.current.audioTrack !== currentAudioTrack) {
        hlsRef.current.audioTrack = currentAudioTrack;
      }
      // HLS 内置字幕切换
      if (currentSubtitleTrack !== -1 && hlsRef.current.subtitleTrack !== currentSubtitleTrack) {
        hlsRef.current.subtitleTrack = currentSubtitleTrack;
      } else if (currentSubtitleTrack === -1) {
        hlsRef.current.subtitleTrack = -1;
      }
    }
    
    // 原生 <track> 标签字幕切换
    if (internalRef.current && internalRef.current.textTracks) {
      const tracks = internalRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        // 由于没有直接绑定的 ID，我们假设通过 externalSubtitles 的顺序或某种匹配来开启
        // 这里采用：如果匹配到了 externalSubtitles 里面等于 currentSubtitleTrack 的，就把该轨道设为 showing
        // 为了方便，我们在渲染 <track> 时给 id 赋值为 track.id 字符串
      }
      // 等待 DOM 更新后操作
      setTimeout(() => {
        if (!internalRef.current) return;
        const domTracks = internalRef.current.querySelectorAll('track');
        domTracks.forEach((t) => {
          const tId = parseInt(t.id.replace('track-', ''), 10);
          if (t.track) {
            t.track.mode = tId === currentSubtitleTrack ? 'showing' : 'hidden';
          }
        });
      }, 50);
    }
  }, [currentAudioTrack, currentSubtitleTrack]);

  // 字幕偏移同步
  useEffect(() => {
    if (hlsRef.current) {
      (hlsRef.current as any).subtitleOffset = subtitleOffset;
    }
  }, [subtitleOffset]);

  // Video 事件监听
  const handleTimeUpdate = (e: any) => {
    if (internalRef.current) {
      setCurrentTime(internalRef.current.currentTime);
      onTimeUpdate?.(e);
    }
  };

  const handleLoadedMetadata = (e: any) => {
    if (internalRef.current) {
      setDuration(internalRef.current.duration);
    }
    rest.onLoadedMetadata?.(e);
  };

  const handleWaiting = () => setIsBuffering(true);
  const handlePlaying = () => setIsBuffering(false);

  return (
    <video
      {...rest}
      ref={internalRef}
      className={styles['video-element']}
      poster={poster}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onWaiting={handleWaiting}
      onPlaying={handlePlaying}
      onEnded={onEnded}
      onPlay={onPlay}
      onPause={onPause}
      onClick={(e) => {
        // 阻止事件冒泡，方便外层包装 UI
        e.stopPropagation();
        rest.onClick?.(e);
      }}
    >
      {externalSubtitles.map((sub) => (
        <track
          key={sub.id}
          id={`track-${sub.id}`}
          kind="subtitles"
          src={sub.url}
          srcLang={sub.lang}
          label={sub.name}
          default={sub.id === currentSubtitleTrack}
        />
      ))}
    </video>
  );
});

export default VideoPlayer;
