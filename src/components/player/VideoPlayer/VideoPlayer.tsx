import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { usePlayerStore } from '../../../stores/playerStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';
import { useNativePlayer } from './useNativePlayer';
import styles from './VideoPlayer.module.css';

export interface ExternalSubtitle {
  id: number;
  url: string;
  name: string;
  lang: string;
  codec?: string;
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
    
    // 接入原生播放内核 (Native + HLS.js)
    useNativePlayer({
      videoRef: internalRef as React.RefObject<HTMLVideoElement>,
      src,
      isDirectPlay,
      externalSubtitles,
    });

    const { isPlaying, volume, isMuted, setCurrentTime, setBufferedTime, setDuration } = usePlayerStore(
      useShallow((state) => ({
        isPlaying: state.isPlaying,
        volume: state.volume,
        isMuted: state.isMuted,
        setCurrentTime: state.setCurrentTime,
        setBufferedTime: state.setBufferedTime,
        setDuration: state.setDuration,
      }))
    );

    const { subtitleSize, subtitleColor, subtitleBackground } = useSettingsStore(
      useShallow((state) => ({
        subtitleSize: state.subtitleSize,
        subtitleColor: state.subtitleColor,
        subtitleBackground: state.subtitleBackground,
      }))
    );

    // 同步外部播放状态到 Video
    useEffect(() => {
      if (!internalRef.current) return;
      if (isPlaying) {
        internalRef.current.play().catch(console.warn);
      } else {
        internalRef.current.pause();
      }
    }, [isPlaying]);

    // 跳转进度
    const seekTarget = usePlayerStore((s) => s.seekTarget);
    const setSeekTarget = usePlayerStore((s) => s.setSeekTarget);

    useEffect(() => {
      if (seekTarget !== null && internalRef.current) {
        internalRef.current.currentTime = seekTarget;
        setSeekTarget(null);
      }
    }, [seekTarget, setSeekTarget]);

    // 音量与静音
    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.volume = volume;
        internalRef.current.muted = isMuted;
      }
    }, [volume, isMuted]);

    // Video 事件监听
    const handleTimeUpdate = (e: any) => {
      if (internalRef.current) {
        setCurrentTime(internalRef.current.currentTime);
        onTimeUpdate?.(e);
      }
    };

    const handleProgress = () => {
      if (internalRef.current && internalRef.current.buffered.length > 0) {
        const bufferedEnd = internalRef.current.buffered.end(internalRef.current.buffered.length - 1);
        setBufferedTime(bufferedEnd);
      }
    };

    const handleLoadedMetadata = (e: any) => {
      if (internalRef.current) {
        setDuration(internalRef.current.duration);
      }
      rest.onLoadedMetadata?.(e);
    };

    const sizeMap: Record<string, string> = { small: '16px', normal: '24px', large: '32px', xlarge: '48px' };
    const fontSize = sizeMap[subtitleSize] || '24px';

    return (
      <>
        <style>{`
          video::cue {
            font-size: ${fontSize};
            color: ${subtitleColor};
            background-color: ${subtitleBackground};
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            font-family: var(--font-body);
          }
        `}</style>
        <video
          {...rest}
          ref={internalRef}
          className={styles['video-element']}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEnded}
          onPlay={onPlay}
          onPause={onPause}
          crossOrigin="anonymous"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </>
    );
  }
);

export default VideoPlayer;
