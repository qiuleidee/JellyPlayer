import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, ArrowLeft, Settings, Music, Languages, PictureInPicture, Gauge, Monitor } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';
import { getPlaybackInfo, getPlaybackUrl, reportPlaybackStart, reportPlaybackProgress, reportPlaybackStopped } from '../../api/playback';
import { getItemDetails } from '../../api/details';
import { uploadLocalSubtitle } from '../../api/subtitles';
import VideoPlayer from '../../components/player/VideoPlayer/VideoPlayer';
import SyncPlayChat from '../../components/player/SyncPlayChat/SyncPlayChat';
import { useSyncPlaySync } from '../../hooks/useSyncPlaySync';
import { Slider, Button, MediaBadges, SubtitleSearchModal } from '../../components/ui';
import Dropdown from '../../components/ui/Dropdown/Dropdown';
import OSD, { type OSDType } from '../../components/player/OSD/OSD';
import { useMouseIdle } from '../../hooks/useMouseIdle';
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
  const [item, setItem] = useState<any>(null);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
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
    currentTime,
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
    setCurrentTime,
    setSeekTarget,
    setMaxBitrate,
    reset,
    audioTracks,
    subtitleTracks,
    currentAudioTrack,
    currentSubtitleTrack,
    setCurrentAudioTrack,
    setCurrentSubtitleTrack
  } = usePlayerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const isIdle = useMouseIdle(3000);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  // 初始化或切换码率
  useEffect(() => {
    if (!id || !userId) return;

    setLoading(true);

    const targetAudio = activeAudioIndexRef.current;
    const targetSub = activeSubIndexRef.current;

    Promise.all([
      getPlaybackInfo(userId, id, maxBitrate || undefined, targetAudio, targetSub),
      getItemDetails(userId, id)
    ]).then(([info, itemDetail]) => {
      setItem(itemDetail);
      
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
        setCurrentTime(startPos);
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
            deliveryUrl: s.DeliveryUrl ? `${baseUrl}${s.DeliveryUrl}${s.DeliveryUrl.includes('?') ? '&' : '?'}api_key=${server?.accessToken}` : null
          }));
          
        if (allSubs.length > 0) {
          usePlayerStore.getState().setSubtitleTracks(allSubs);
          
          // 过滤出可以在前端渲染的文本字幕（秒切）
          const textSubs = allSubs.filter((s: any) => s.isText && s.deliveryUrl).map((s: any) => ({
            id: s.id, name: s.name, lang: s.lang, url: s.deliveryUrl
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

  // 定期进度上报 (每 10 秒)
  useEffect(() => {
    if (!isPlaying || loading) return;
    
    const interval = setInterval(() => {
      if (mediaSourceIdRef.current && playSessionIdRef.current) {
        reportPlaybackProgress({
          ItemId: id!,
          MediaSourceId: mediaSourceIdRef.current,
          PositionTicks: currentTime * 10000000,
          IsPaused: !isPlaying,
          IsMuted: isMuted,
          VolumeLevel: volume * 100,
          PlayMethod: isDirectPlay ? 'DirectPlay' : 'Transcode',
          PlaySessionId: playSessionIdRef.current,
          RepeatMode: 'RepeatNone'
        }).catch(console.error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, isMuted, volume, loading, id, isDirectPlay]);

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
    })),
    { id: 'div-1', label: '', divider: true },
    { id: 'h-audio', label: <div className="flex items-center gap-2 text-[var(--accent)] font-bold"><Music size={16} /> 音轨</div>, disabled: true },
    ...(audioTracks.length > 0 ? audioTracks.map((t) => ({
      id: `audio-${t.id}`,
      label: currentAudioTrack === t.id ? `✓ ${t.name}` : `  ${t.name}`,
      onClick: () => {
        setCurrentAudioTrack(t.id);
        triggerOSD('audio', t.name);
      }
    })) : [{ id: 'no-audio', label: '默认音轨', disabled: true }]),
    { id: 'div-2', label: '', divider: true },
    { id: 'h-sub', label: <div className="flex items-center gap-2 text-[var(--accent)] font-bold"><Languages size={16} /> 字幕</div>, disabled: true },
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
          <button className="px-2 py-1 bg-[rgba(255,255,255,0.1)] rounded hover:bg-[rgba(255,255,255,0.2)]" onClick={() => { setSubtitleOffset(subtitleOffset - 0.1); triggerOSD('subtitle', `${((subtitleOffset - 0.1) * 1000).toFixed(0)} ms`); }}>-100ms</button>
          <span className="text-xs font-mono">{subtitleOffset > 0 ? '+' : ''}{(subtitleOffset * 1000).toFixed(0)} ms</span>
          <button className="px-2 py-1 bg-[rgba(255,255,255,0.1)] rounded hover:bg-[rgba(255,255,255,0.2)]" onClick={() => { setSubtitleOffset(subtitleOffset + 0.1); triggerOSD('subtitle', `${((subtitleOffset + 0.1) * 1000).toFixed(0)} ms`); }}>+100ms</button>
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
    return item.Chapters.map((ch: any) => ({
      value: ch.StartPositionTicks / 10000000,
      label: ch.Name,
      type: ch.MarkerType?.toLowerCase().includes('intro') ? 'intro' : 'chapter'
    }));
  }, [item]);

  // 判断是否处于片头阶段
  const activeIntroMarkerIndex = useMemo(() => {
    if (markers.length === 0) return -1;
    for (let i = 0; i < markers.length - 1; i++) {
      if (markers[i].type === 'intro' && currentTime >= markers[i].value && currentTime < markers[i + 1].value) {
        return i;
      }
    }
    return -1;
  }, [currentTime, markers]);

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

  const handleSkipIntro = () => {
    if (activeIntroMarkerIndex !== -1 && markers[activeIntroMarkerIndex + 1]) {
      handleSeek(markers[activeIntroMarkerIndex + 1].value);
    }
  };

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
              {item && <MediaBadges item={item} className="hidden md:flex" />}
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

        {/* 跳过片头按钮 */}
        {activeIntroMarkerIndex !== -1 && (
          <div className={styles['skip-intro-container']}>
            <Button onClick={handleSkipIntro} variant="secondary" className={styles['skip-intro-btn']}>
              跳过片头
            </Button>
          </div>
        )}

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
          <Slider
            value={currentTime}
            max={duration || 100}
            onChange={handleSeek}
            markers={markers}
            formatTooltip={formatTime}
          />
          <div className={styles['controls-row']}>
            <div className={styles['left-controls']}>
              <button className={styles['control-btn']} onClick={togglePlay}>
                {isPlaying ? <Pause /> : <Play fill="currentColor" />}
              </button>
              <div className={styles['time-display']}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className={styles['right-controls']}>
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
                trigger={
                  <button className={styles['control-btn']}>
                    <Settings />
                  </button>
                }
                items={settingsItems}
              />
              <button className={styles['control-btn']} onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize /> : <Maximize />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
