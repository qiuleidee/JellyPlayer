import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, ArrowLeft, Settings, Music, Languages, PictureInPicture, Gauge, Monitor, Keyboard, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';
import { getPlaybackInfo, getPlaybackUrl, reportPlaybackStart, reportPlaybackProgress, reportPlaybackStopped } from '../../api/playback';
import { getItemDetails, getNextUpEpisode } from '../../api/details';
import { uploadLocalSubtitle } from '../../api/subtitles';
import VideoPlayer from '../../components/player/VideoPlayer/VideoPlayer';
import SyncPlayChat from '../../components/player/SyncPlayChat/SyncPlayChat';
import { useSyncPlaySync } from '../../hooks/useSyncPlaySync';
import { Slider, Button, MediaBadges, SubtitleSearchModal, Modal } from '../../components/ui';
import Dropdown from '../../components/ui/Dropdown/Dropdown';
import OSD, { type OSDType } from '../../components/player/OSD/OSD';
import { ImageUtils } from '../../api/images';
import { useMouseIdle } from '../../hooks/useMouseIdle';
import { parseBifUrl, type BifData } from '../../utils/bifParser';
import styles from './PlayerPage.module.css';

// 时间格式化工具
function formatTime(seconds: number) {
  if (isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ==========================================
// 性能优化：微型时间订阅组件
// 作用：避免 currentTime 的高频更新引发整个重量级 PlayerPage 重绘
// ==========================================

const ConnectedSlider = ({ duration, onChange, markers, bifData }: any) => {
  const currentTime = usePlayerStore(s => s.currentTime);
  const bufferedTime = usePlayerStore(s => s.bufferedTime);
  return (
    <Slider
      value={currentTime}
      bufferValue={bufferedTime}
      max={duration || 100}
      onChange={onChange}
      markers={markers}
      formatTooltip={formatTime}
      bifData={bifData}
    />
  );
};

const TimeDisplay = ({ duration }: { duration: number }) => {
  const currentTime = usePlayerStore(s => s.currentTime);
  return (
    <div className={styles['time-display']}>
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  );
};

const SkipIntroButton = ({ markers, showControls, onSeek }: { markers: any[], showControls: boolean, onSeek: (val: number) => void }) => {
  const currentTime = usePlayerStore(s => s.currentTime);
  if (!markers || markers.length === 0) return null;
  const activeIntroMarkerIndex = markers.findIndex((m: any) => m.type === 'intro' && currentTime >= m.value && currentTime < (markers[markers.indexOf(m) + 1]?.value || Infinity));
  if (activeIntroMarkerIndex === -1) return null;
  return (
    <div className={`${styles['skip-intro-container']} ${showControls ? styles['show'] : ''}`}>
      <Button onClick={() => onSeek(markers[activeIntroMarkerIndex + 1].value)} variant="secondary" className={styles['skip-intro-btn']}>
        跳过片头
      </Button>
    </div>
  );
};

const NextUpPanel = ({ item, nextEpisode, duration, cancelNextUp, onCancel, onPlay }: any) => {
  const currentTime = usePlayerStore(s => s.currentTime);
  if (!item || item.Type !== 'Episode' || !nextEpisode || duration === 0 || cancelNextUp) return null;
  const creditsMarker = item.Chapters?.find((m: any) => m.MarkerType?.toLowerCase().includes('credit') || m.Name?.toLowerCase().includes('credit'));
  const creditsStart = creditsMarker ? creditsMarker.StartPositionTicks / 10000000 : duration - 15;
  const show = currentTime >= creditsStart && currentTime < duration;
  
  if (!show) return null;
  return (
    <div className={styles['next-up-container']}>
      <div className={styles['next-up-card']}>
        <div className={styles['next-up-header']}>
          <h3>接下来播放</h3>
          <span className={styles['next-up-timer']}>{Math.max(0, Math.ceil(duration - currentTime))}s</span>
        </div>
        <div className={styles['next-up-body']}>
          <div className={styles['next-up-thumb']}>
            <img src={ImageUtils.getThumbUrl(nextEpisode.Id, nextEpisode.ImageTags?.Primary)} alt={nextEpisode.Name} />
          </div>
          <div className={styles['next-up-info']}>
            <h4>{nextEpisode.Name}</h4>
            <p>S{nextEpisode.ParentIndexNumber} E{nextEpisode.IndexNumber}</p>
          </div>
        </div>
        <div className={styles['next-up-actions']}>
          <Button onClick={onPlay} leftIcon={<Play fill="currentColor" />}>
            立即播放
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProgressReporter = ({ id, isPlaying, loading, isDirectPlay, mediaSourceIdRef, playSessionIdRef }: any) => {
  useEffect(() => {
    if (!isPlaying || loading) return;
    const interval = setInterval(() => {
      if (mediaSourceIdRef.current && playSessionIdRef.current) {
        const state = usePlayerStore.getState();
        reportPlaybackProgress({
          ItemId: id,
          MediaSourceId: mediaSourceIdRef.current,
          PositionTicks: state.currentTime * 10000000,
          IsPaused: !state.isPlaying,
          IsMuted: state.isMuted,
          VolumeLevel: state.volume * 100,
          PlayMethod: isDirectPlay ? 'DirectPlay' : 'Transcode',
          PlaySessionId: playSessionIdRef.current,
          RepeatMode: 'RepeatNone'
        }).catch(console.error);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isPlaying, loading, id, isDirectPlay]);
  return null;
};

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 挂载 SyncPlay 同步逻辑
  const { isExecutingRemoteCommand } = useSyncPlaySync(videoRef);

  const subtitleOffset = usePlayerStore((s) => s.subtitleOffset);
  const setSubtitleOffset = usePlayerStore((s) => s.setSubtitleOffset);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialAudio = searchParams.get('audio') ? parseInt(searchParams.get('audio')!) : undefined;
  const initialSub = searchParams.get('sub') ? parseInt(searchParams.get('sub')!) : undefined;

  // 记录实际已送往服务器的 index，避免不必要的重载死循环
  const activeAudioIndexRef = useRef<number | undefined>(initialAudio);
  const activeSubIndexRef = useRef<number | undefined>(initialSub);

  const [src, setSrc] = useState('');
  const [isDirectPlay, setIsDirectPlay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [externalSubtitles, setExternalSubtitles] = useState<any[]>([]);
  const [bifData, setBifData] = useState<BifData | null>(null);
  const [item, setItem] = useState<any>(null);
  const [nextEpisode, setNextEpisode] = useState<any>(null);
  const [cancelNextUp, setCancelNextUp] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // OSD 状态
  const [osdType, setOsdType] = useState<OSDType>('none');
  const [osdValue, setOsdValue] = useState<string | number>();
  const [osdTriggerId, setOsdTriggerId] = useState(0);

  const triggerOSD = (type: OSDType, value?: string | number) => {
    setOsdType(type);
    setOsdValue(value);
    setOsdTriggerId((prev: number) => prev + 1);
  };
  
  const playSessionIdRef = useRef('');
  const mediaSourceIdRef = useRef<string | null>(null);
  const resumePositionRef = useRef(0);
  const isDirectPlayRef = useRef(false);

  const {
    isPlaying,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isBuffering,
    maxBitrate,
    setIsPlaying,
    setIsFullscreen,
    setVolume,
    setIsMuted,
    setSeekTarget,
    setMaxBitrate,
    reset,
    audioTracks,
    subtitleTracks,
    currentAudioTrack,
    currentSubtitleTrack,
    setCurrentAudioTrack,
    setCurrentSubtitleTrack,
  } = usePlayerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const isIdle = useMouseIdle(3000);

  const handleTimeUpdate = () => {
    if (videoRef.current) usePlayerStore.getState().setCurrentTime(videoRef.current.currentTime);
  };

  // 初始化或切换码率
  useEffect(() => {
    if (!id || !userId) return;

    setLoading(true);

    const targetAudio = activeAudioIndexRef.current;
    const targetSub = activeSubIndexRef.current;
    
    setCancelNextUp(false);
    setNextEpisode(null);

    Promise.all([
      getPlaybackInfo(userId, id, maxBitrate || undefined, targetAudio, targetSub),
      getItemDetails(userId, id)
    ]).then(([info, itemDetail]) => {
      setItem(itemDetail);
      
      if (itemDetail.Type === 'Episode' && itemDetail.SeriesId) {
        getNextUpEpisode(userId, itemDetail.SeriesId).then(setNextEpisode).catch(console.error);
      }
      
      const source = info.MediaSources[0]; // 默认取第一个
      if (!source) throw new Error('No media source found');

      mediaSourceIdRef.current = source.Id;
      playSessionIdRef.current = info.PlaySessionId;
      
      const isDirect = source.SupportsDirectPlay || source.SupportsDirectStream;
      setIsDirectPlay(isDirect);
      isDirectPlayRef.current = isDirect;
      
      // 处理断点续播，如果是首次加载且有服务器断点，则使用；否则使用当前内存里的进度（应对切画质的情况）
      const currentMemTime = usePlayerStore.getState().currentTime;
      let startPos = currentMemTime;
      
      if (currentMemTime === 0 && itemDetail.UserData?.PlaybackPositionTicks) {
        startPos = itemDetail.UserData.PlaybackPositionTicks / 10000000;
      }
      
      resumePositionRef.current = startPos;
      if (startPos > 0) {
        usePlayerStore.getState().setCurrentTime(startPos);
        setSeekTarget(startPos); // 触发 Video 组件跳转
      }
      
      const url = getPlaybackUrl(id, source, info.PlaySessionId, isDirect);
      setSrc(url);
      setIsPlaying(true);
      setLoading(false);

      const server = useAuthStore.getState().getActiveServer();
      const baseUrl = server?.url.endsWith('/') ? server.url.slice(0, -1) : server?.url;
      if (source.MediaStreams) {
        // 解析所有的音频轨并存入 store，无论是否 DirectPlay
        const allAudio = source.MediaStreams
          .filter((s: any) => s.Type === 'Audio')
          .map((s: any) => ({
            id: s.Index,
            name: s.DisplayTitle || s.Title || s.Language || `Audio ${s.Index}`,
            lang: s.Language || 'und'
          }));
        if (allAudio.length > 0) {
          usePlayerStore.getState().setAudioTracks(allAudio);
          // 初始化 currentAudioTrack
          if (targetAudio !== undefined) {
             usePlayerStore.getState().setCurrentAudioTrack(targetAudio);
          } else {
             const defaultA = allAudio.find((a: any) => a.id === source.MediaStreams.find((s:any)=>s.Index===a.id)?.IsDefault) || allAudio[0];
             usePlayerStore.getState().setCurrentAudioTrack(defaultA.id);
             activeAudioIndexRef.current = defaultA.id; // 同步当前真实播放的音轨，防止触发 reload
          }
        }

        // 解析所有的字幕轨
        const allSubs = source.MediaStreams
          .filter((s: any) => s.Type === 'Subtitle')
          .map((s: any) => ({
            id: s.Index,
            name: s.DisplayTitle || s.Title || s.Language || `Subtitle ${s.Index}`,
            lang: s.Language || 'und',
            isText: s.IsTextSubtitleStream,
            codec: s.Codec,
            url: s.DeliveryUrl ? `${baseUrl}${s.DeliveryUrl}${s.DeliveryUrl.includes('?') ? '&' : '?'}api_key=${server?.accessToken}` : null
          }));
          
        if (allSubs.length > 0) {
          usePlayerStore.getState().setSubtitleTracks(allSubs);
          
          // 过滤出可以在前端无损渲染的纯文本字幕（SRT/VTT 秒切）
          // 剔除 ASS/SSA，强制其走服务端烧录流程
          const textSubs = allSubs.filter((s: any) => {
            const isAss = s.codec?.toLowerCase().includes('ass') || s.codec?.toLowerCase().includes('ssa');
            return s.isText && s.url && !isAss;
          }).map((s: any) => ({
            id: s.id, name: s.name, lang: s.lang, url: s.url, codec: s.codec
          }));
          setExternalSubtitles(textSubs);

          // 初始化 currentSubtitleTrack
          if (targetSub !== undefined) {
             usePlayerStore.getState().setCurrentSubtitleTrack(targetSub);
          } else {
             // 默认关闭或服务器决定的默认轨
             const defaultS = source.MediaStreams.find((s:any)=>s.Type==='Subtitle' && s.IsDefault)?.Index;
             const finalSub = defaultS !== undefined ? defaultS : -1;
             usePlayerStore.getState().setCurrentSubtitleTrack(finalSub);
             activeSubIndexRef.current = finalSub; // 同步，防止 reload
          }
        }
      }

      // 拉取 BIF 缩略图（如果有生成）
      const bifUrl = `${baseUrl}/Videos/${id}/index.bif?mediaSourceId=${source.Id}&api_key=${server?.accessToken}`;
      parseBifUrl(bifUrl).then(data => {
        if (data) setBifData(data);
      });

      // 上报播放开始
      reportPlaybackStart({
        ItemId: id,
        MediaSourceId: source.Id,
        PositionTicks: startPos * 10000000,
        IsPaused: false,
        IsMuted: isMuted,
        VolumeLevel: volume * 100,
        PlayMethod: isDirect ? 'DirectPlay' : 'Transcode',
        PlaySessionId: info.PlaySessionId,
        RepeatMode: 'RepeatNone'
      }).catch(console.error);

    }).catch((err) => {
      console.error(err);
      setError('无法获取播放信息');
      setLoading(false);
    });

    return () => {
      // effect 清理
    };
  }, [id, userId, maxBitrate, refreshKey]); 

  // 监听轨道切换触发重载
  useEffect(() => {
    // 首次加载或还未加载完时跳过
    if (loading || !item || !src) return;

    let needsReload = false;
    let nextAudio = activeAudioIndexRef.current;
    let nextSub = activeSubIndexRef.current;

    // 音轨变动：必须重载（Jellyfin 很少支持在单路流里动态切所有格式音轨）
    if (currentAudioTrack !== -1 && currentAudioTrack !== activeAudioIndexRef.current) {
      needsReload = true;
      nextAudio = currentAudioTrack;
    }

    // 字幕轨变动
    if (currentSubtitleTrack !== activeSubIndexRef.current) {
      if (currentSubtitleTrack === -1) {
        // 关闭字幕，可以重载取消烧录（如果是烧录状态的话）
        needsReload = true;
        nextSub = -1;
      } else {
        // 查找目标字幕是否为文本字幕
        // 如果我们把它作为 textSub 提取并传给了 VideoPlayer，就不需要重载
        const isTextSub = externalSubtitles.some((s: any) => s.id === currentSubtitleTrack);
        
        if (!isTextSub) {
          needsReload = true;
          nextSub = currentSubtitleTrack;
        } else {
          // 是文本字幕，秒切，无需重载，只需更新 reference
          activeSubIndexRef.current = currentSubtitleTrack;
        }
      }
    }

    if (needsReload) {
      // 更新 ref
      activeAudioIndexRef.current = nextAudio;
      activeSubIndexRef.current = nextSub;
      
      const query = new URLSearchParams(searchParams);
      if (nextAudio !== undefined && nextAudio !== -1) query.set('audio', nextAudio.toString());
      if (nextSub !== undefined && nextSub !== -1) query.set('sub', nextSub.toString());
      else if (nextSub === -1) query.delete('sub');
      
      // 记录当前播放位置以便重载后无缝播放
      if (videoRef.current) {
         resumePositionRef.current = videoRef.current.currentTime;
      }
      
      setSearchParams(query, { replace: true });
      // 触发外部重新请求 getPlaybackInfo
      setRefreshKey((prev: number) => prev + 1);
    }
  }, [currentAudioTrack, currentSubtitleTrack, loading]);

  // 离开页面时汇报停止 (独立 effect)
  useEffect(() => {
    return () => {
      if (mediaSourceIdRef.current && playSessionIdRef.current) {
        reportPlaybackStopped({
          ItemId: id!,
          MediaSourceId: mediaSourceIdRef.current,
          PositionTicks: usePlayerStore.getState().currentTime * 10000000,
          IsPaused: true,
          IsMuted: usePlayerStore.getState().isMuted,
          VolumeLevel: usePlayerStore.getState().volume * 100,
          PlayMethod: isDirectPlayRef.current ? 'DirectPlay' : 'Transcode',
          PlaySessionId: playSessionIdRef.current,
          RepeatMode: 'RepeatNone'
        }).catch(console.error);
      }
      reset();
    };
  }, [id]);


  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = usePlayerStore.getState();
      if (e.code === 'Space') {
        e.preventDefault();
        const nextState = !state.isPlaying;
        setIsPlaying(nextState);
        triggerOSD(nextState ? 'play' : 'pause');
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        const nextMute = !state.isMuted;
        setIsMuted(nextMute);
        triggerOSD(nextMute ? 'mute' : 'volume', nextMute ? undefined : Math.round(state.volume * 100));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(state.currentTime + 10);
        triggerOSD('forward', '+10s');
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, state.currentTime - 10));
        triggerOSD('rewind', '-10s');
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, state.volume + 0.05);
        setVolume(newVol);
        if (state.isMuted) setIsMuted(false);
        triggerOSD('volume', Math.round(newVol * 100));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, state.volume - 0.05);
        setVolume(newVol);
        if (newVol === 0) setIsMuted(true);
        triggerOSD(newVol === 0 ? 'mute' : 'volume', Math.round(newVol * 100));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    triggerOSD(!isPlaying ? 'play' : 'pause');
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    triggerOSD(!isMuted ? 'mute' : 'volume', !isMuted ? undefined : Math.round(volume * 100));
  };

  const handleBack = () => navigate(-1);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const handleSeek = (val: number) => {
    setSeekTarget(val);
  };

  // 画中画支持
  const togglePiP = async () => {
    if (!document.pictureInPictureElement) {
      if (videoRef.current) await videoRef.current.requestPictureInPicture().catch(console.error);
    } else {
      await document.exitPictureInPicture().catch(console.error);
    }
  };

  // 双击快进/后退触控逻辑
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const state = usePlayerStore.getState();
    if (x > rect.width / 2) {
      handleSeek(state.currentTime + 10);
      triggerOSD('forward', '+10s');
    } else {
      handleSeek(Math.max(0, state.currentTime - 10));
      triggerOSD('rewind', '-10s');
    }
  };

  // 倍速控制
  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    triggerOSD('play', `${speed}x 倍速`);
  };

  // 是否显示控制栏
  const showControls = !isPlaying || !isIdle;

  // 码率选项
  const QUALITY_OPTIONS = [
    { label: '自动 (最高)', value: null },
    { label: '4K (120 Mbps)', value: 120000000 },
    { label: '1080p (20 Mbps)', value: 20000000 },
    { label: '720p (4 Mbps)', value: 4000000 },
    { label: '480p (1.5 Mbps)', value: 1500000 },
  ];

  // 倍速选项
  const SPEED_OPTIONS = [
    { label: '0.5x', value: 0.5 },
    { label: '1.0x', value: 1.0 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2.0x', value: 2.0 },
  ];

  // 构造设置菜单项
  const settingsItems = [
    { id: 'h-speed', label: <div className="flex items-center gap-2 text-[var(--accent)] font-bold"><Gauge size={16} /> 播放速度</div>, disabled: true },
    ...SPEED_OPTIONS.map((s) => ({
      id: `speed-${s.value}`,
      label: `  ${s.label}`,
      onClick: () => handleSpeedChange(s.value)
    })),
    { id: 'div-speed', label: '', divider: true },
    { id: 'h-quality', label: <div className="flex items-center gap-2 text-[var(--accent)] font-bold"><Monitor size={16} /> 画质</div>, disabled: true },
    ...QUALITY_OPTIONS.map((q) => ({
      id: `q-${q.value}`,
      label: maxBitrate === q.value ? `✓ ${q.label}` : `  ${q.label}`,
      onClick: () => {
        setMaxBitrate(q.value);
        triggerOSD('quality', q.label);
      }
    }))
  ];

  const audioItems = [
    { id: 'h-audio', label: <div className="flex items-center gap-2 text-[var(--accent)] font-bold"><Music size={16} /> 音轨</div>, disabled: true },
    ...(audioTracks.length > 0 ? audioTracks.map((t) => ({
      id: `audio-${t.id}`,
      label: currentAudioTrack === t.id ? `✓ ${t.name}` : `  ${t.name}`,
      onClick: () => {
        setCurrentAudioTrack(t.id);
        triggerOSD('audio', t.name);
      }
    })) : [{ id: 'no-audio', label: '默认音轨', disabled: true }])
  ];

  const subtitleItems = [
    { id: 'h-sub', label: <div className="flex items-center gap-2 text-[var(--accent)] font-bold"><MessageSquare size={16} /> 字幕选择</div>, disabled: true },
    {
      id: 'sub-off',
      label: currentSubtitleTrack === -1 ? '✓ 关闭字幕' : '  关闭字幕',
      onClick: () => {
        setCurrentSubtitleTrack(-1);
        triggerOSD('subtitle', '关闭字幕');
      }
    },
    ...subtitleTracks.map((t) => ({
      id: `sub-${t.id}`,
      label: currentSubtitleTrack === t.id ? `✓ ${t.name}` : `  ${t.name}`,
      onClick: () => {
        setCurrentSubtitleTrack(t.id);
        triggerOSD('subtitle', t.name);
      }
    })),
    { id: 'sub-sync-header', label: <div className="flex items-center gap-2 text-[var(--accent)] font-bold"><Languages size={16} /> 字幕同步</div>, disabled: true },
    {
      id: 'sub-sync-controls',
      label: (
        <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
          <div role="button" className="px-2 py-1 bg-[rgba(255,255,255,0.1)] rounded hover:bg-[rgba(255,255,255,0.2)] cursor-pointer" onClick={() => { setSubtitleOffset(subtitleOffset - 0.1); triggerOSD('subtitle', `${((subtitleOffset - 0.1) * 1000).toFixed(0)} ms`); }}>-100ms</div>
          <span className="text-xs font-mono">{subtitleOffset > 0 ? '+' : ''}{(subtitleOffset * 1000).toFixed(0)} ms</span>
          <div role="button" className="px-2 py-1 bg-[rgba(255,255,255,0.1)] rounded hover:bg-[rgba(255,255,255,0.2)] cursor-pointer" onClick={() => { setSubtitleOffset(subtitleOffset + 0.1); triggerOSD('subtitle', `${((subtitleOffset + 0.1) * 1000).toFixed(0)} ms`); }}>+100ms</div>
        </div>
      )
    },
    { 
      id: 'sub-local', 
      label: '载入本地字幕', 
      onClick: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.srt,.ass,.vtt,.sub';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file || !id) return;
          const ext = file.name.split('.').pop()?.toLowerCase() || 'srt';
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              await uploadLocalSubtitle(id, 'chi', ext, base64Data);
              triggerOSD('subtitle', '字幕上传成功！即将刷新');
              setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
              triggerOSD('subtitle', '字幕上传失败');
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    },
    { id: 'sub-search', label: '在线搜索字幕', onClick: () => setShowSubtitleModal(true) }
  ];

  // 提取章节标记
  const markers = useMemo(() => {
    if (!item?.Chapters) return [];
    return item.Chapters.map((ch: any) => {
      const isIntro = ch.MarkerType?.toLowerCase().includes('intro') || ch.Name?.toLowerCase().includes('intro');
      const isCredits = ch.MarkerType?.toLowerCase().includes('credit') || ch.Name?.toLowerCase().includes('credit');
      return {
        value: ch.StartPositionTicks / 10000000,
        label: ch.Name,
        type: isIntro ? 'intro' : isCredits ? 'credits' : 'chapter'
      };
    });
  }, [item]);



  if (error) {
    return (
      <div className={styles['player-page']}>
        <div className={styles['loading-overlay']}>
          <p>{error}</p>
          <Button onClick={handleBack}>返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles['player-page']} 
      ref={containerRef} 
      style={{ cursor: showControls ? 'default' : 'none' }}
      onDoubleClick={handleDoubleClick}
    >
      
      {/* 屏幕反馈 OSD */}
      <OSD type={osdType} value={osdValue} triggerId={osdTriggerId} />

      {/* 顶栏 */}
      <div className={`${styles['top-bar']} ${showControls ? styles['show'] : ''}`}>
        <div className={styles['top-controls']}>
          <button className={styles['icon-btn']} onClick={handleBack}>
            <ArrowLeft size={28} />
          </button>
          
          <div className={styles['media-info']}>
            <div className="flex items-center gap-3">
              <h2 className={styles['title']}>{item?.Name || '加载中...'}</h2>
              {item && <MediaBadges item={item} className={styles['player-badges']} />}
            </div>
            {item?.Type === 'Episode' && (
              <p className={styles['subtitle']}>
                {item.SeriesName} - S{item.ParentIndexNumber}E{item.IndexNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles['player-container']}>
        {loading || isBuffering ? (
          <div className={styles['loading-overlay']}>
            <div className={styles.spinner} />
            {isBuffering && !loading && <span>缓冲中...</span>}
          </div>
        ) : null}

        {src && (
          <VideoPlayer
            ref={videoRef}
            src={src}
            isDirectPlay={isDirectPlay}
            externalSubtitles={externalSubtitles}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              if (nextEpisode && !cancelNextUp) {
                navigate(`/play/${nextEpisode.Id}`);
              }
            }}
            onPlay={() => {
              if (!isExecutingRemoteCommand.current) {
                // 真实环境下应通过 api 发送 SyncPlay Play 命令
              }
            }}
            onPause={() => {
              if (!isExecutingRemoteCommand.current) {
                // api.post('/SyncPlay/Pause')
              }
            }}
          />
        )}

        {/* 跳过片头与即将播放（时间隔离域） */}
        <SkipIntroButton markers={markers} showControls={showControls} onSeek={handleSeek} />
        <NextUpPanel item={item} nextEpisode={nextEpisode} duration={duration} cancelNextUp={cancelNextUp} onCancel={() => setCancelNextUp(true)} onPlay={() => navigate(`/play/${nextEpisode.Id}`)} />
        <ProgressReporter id={id} isPlaying={isPlaying} loading={loading} isDirectPlay={isDirectPlay} mediaSourceIdRef={mediaSourceIdRef} playSessionIdRef={playSessionIdRef} />

        {/* 控制栏 (底部) */}

        <SyncPlayChat />

        {/* 在线字幕搜索 */}
        <SubtitleSearchModal 
          open={showSubtitleModal} 
          onClose={() => setShowSubtitleModal(false)}
          itemId={id!}
          itemName={item?.SeriesName || item?.Name}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />

        <div className={`${styles['control-bar']} ${showControls ? styles['show'] : ''}`}>
          <ConnectedSlider duration={duration} onChange={handleSeek} markers={markers} bifData={bifData} />
          
          <div className={styles['controls-row']}>
            <div className={styles['left-controls']}>
              <button className={styles['control-btn']} onClick={togglePlay}>
                {isPlaying ? <Pause /> : <Play fill="currentColor" />}
              </button>
              <TimeDisplay duration={duration} />
            </div>
            
            <div className={styles['right-controls']}>
              <button className={styles['control-btn']} onClick={() => setShowShortcutsModal(true)} title="快捷键">
                <Keyboard size={24} />
              </button>
              <button className={styles['control-btn']} onClick={togglePiP} title="画中画">
                <PictureInPicture size={24} />
              </button>
              <div className={styles['volume-container']}>
                <button className={styles['control-btn']} onClick={toggleMute}>
                  {isMuted ? <VolumeX /> : <Volume2 />}
                </button>
                <div className={styles['volume-slider-wrapper']}>
                  <Slider value={isMuted ? 0 : volume * 100} max={100} onChange={(v: number) => { setVolume(v / 100); setIsMuted(v === 0); }} />
                </div>
              </div>
              <Dropdown
                align="right"
                direction="up"
                trigger={<button className={styles['control-btn']} title="字幕设置"><MessageSquare size={20} /></button>}
                items={subtitleItems}
              />
              <Dropdown
                align="right"
                direction="up"
                trigger={<button className={styles['control-btn']} title="音轨选择"><Music size={20} /></button>}
                items={audioItems}
              />
              <Dropdown
                align="right"
                direction="up"
                trigger={<button className={styles['control-btn']} title="播放设置"><Settings size={20} /></button>}
                items={settingsItems}
              />
              <button className={styles['control-btn']} onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize /> : <Maximize />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} title="键盘快捷键" size="md">
        <div className="grid grid-cols-2 gap-4 text-gray-200">
          <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.1)]">
            <span>播放 / 暂停</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded font-mono text-xs">Space</kbd>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.1)]">
            <span>全屏切换</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded font-mono text-xs">F</kbd>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.1)]">
            <span>静音切换</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded font-mono text-xs">M</kbd>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.1)]">
            <span>快进 10秒</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded font-mono text-xs">Right Arrow</kbd>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.1)]">
            <span>后退 10秒</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded font-mono text-xs">Left Arrow</kbd>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.1)]">
            <span>音量 +</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded font-mono text-xs">Up Arrow</kbd>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.1)]">
            <span>音量 -</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded font-mono text-xs">Down Arrow</kbd>
          </div>
        </div>
      </Modal>

    </div>
  );
}
