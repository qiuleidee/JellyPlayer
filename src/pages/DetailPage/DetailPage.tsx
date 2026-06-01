import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, Check, Film, Search, Languages, Calendar, Clock, Music, Edit3 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getItemDetails, getSimilarItems, getFirstEpisode } from '../../api/details';
import { UserDataAPI } from '../../api/userData';
import { ImageUtils } from '../../api/images';
import { Button, Badge, Skeleton, MediaBadges, IdentifyModal, SubtitleSearchModal, Dropdown, Modal, EditMetadataModal } from '../../components/ui';
import { CastRow, MediaRow, SeasonSelector } from '../../components/media';
import { useImageColor } from '../../hooks/useImageColor';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import styles from './DetailPage.module.css';

// 电视端焦点引擎包装器
function FocusableButton({ children, onClick, onEnterPress, className, ...props }: any) {
  const { ref, focused } = useFocusable({
    onEnterPress: onEnterPress || onClick
  });
  return (
    <Button 
      ref={ref as any} 
      onClick={onClick} 
      className={`${className || ''} ${focused ? styles.focused : ''}`} 
      {...props}
    >
      {children}
    </Button>
  );
}

function FocusableCircle({ icon, label, onClick, isActive, activeColor }: any) {
  const { ref, focused } = useFocusable({
    onEnterPress: onClick
  });
  return (
    <div ref={ref as any} className={`${styles['action-circle-wrap']} ${focused ? styles.focused : ''}`} onClick={onClick}>
      <div className={styles['action-circle-btn']} style={isActive && activeColor ? { borderColor: activeColor, boxShadow: `0 0 10px ${activeColor}40` } : {}}>
        {icon}
      </div>
      <span className={styles['action-circle-label']} style={isActive && activeColor ? { color: activeColor } : {}}>{label}</span>
    </div>
  );
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [item, setItem] = useState<any>(null);
  const [similar, setSimilar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);
  const [showIdentifyModal, setShowIdentifyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const [selectedAudio, setSelectedAudio] = useState<number | undefined>();
  const [selectedSubtitle, setSelectedSubtitle] = useState<number | undefined>();

  const backdropTag = item?.BackdropImageTags && item.BackdropImageTags.length > 0 ? item.BackdropImageTags[0] : item?.ImageTags?.Backdrop;
  const backdropUrl = backdropTag ? ImageUtils.getBackdropUrl(item.Id, backdropTag) : null;
  const posterUrl = item?.ImageTags?.Primary ? ImageUtils.getPosterUrl(item.Id, item.ImageTags.Primary) : undefined;
  const logoUrl = item?.ImageTags?.Logo ? ImageUtils.getLogoUrl(item.Id, item.ImageTags.Logo) : null;

  // 提取主题色 (优先取海报色)，必须放在 early return 之前保证 Hook 执行顺序
  const themeColorRgb = useImageColor(posterUrl || backdropUrl);

  useEffect(() => {
    if (!id || !userId) return;
    window.scrollTo(0, 0);

    setLoading(true);
    getItemDetails(userId, id)
      .then((data) => {
        setItem(data);
        setIsFavorite(data.UserData?.IsFavorite || false);
        setIsPlayed(data.UserData?.Played || false);
        
        // 解析默认音轨和字幕
        if (data.MediaSources?.[0]?.MediaStreams) {
          const streams = data.MediaSources[0].MediaStreams;
          const defaultAudio = streams.find((s: any) => s.Type === 'Audio' && s.IsDefault)?.Index;
          if (defaultAudio !== undefined) setSelectedAudio(defaultAudio);
          
          const defaultSub = streams.find((s: any) => s.Type === 'Subtitle' && s.IsDefault)?.Index;
          if (defaultSub !== undefined) setSelectedSubtitle(defaultSub);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    getSimilarItems(userId, id).then(setSimilar).catch(console.error);
  }, [id, userId]);

  const handleToggleFavorite = async () => {
    if (!item || !userId) return;
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    try {
      await UserDataAPI.toggleFavorite(userId, item.Id, newValue);
    } catch (error) {
      console.error(error);
      setIsFavorite(!newValue); // 回退
    }
  };

  const handleTogglePlayed = async () => {
    if (!item || !userId) return;
    const newValue = !isPlayed;
    setIsPlayed(newValue);
    try {
      await UserDataAPI.togglePlayed(userId, item.Id, newValue);
    } catch (error) {
      console.error(error);
      setIsPlayed(!newValue); // 回退
    }
  };

  const handleIdentifySuccess = () => {
    if (userId && id) {
      getItemDetails(userId, id).then((data) => {
        setItem(data);
        setIsFavorite(data.UserData?.IsFavorite || false);
        setIsPlayed(data.UserData?.Played || false);
      }).catch(console.error);
    }
  };

  const handlePlayClick = async () => {
    if (!item || !userId) return;
    const query = new URLSearchParams();
    if (selectedAudio !== undefined) query.set('audio', selectedAudio.toString());
    if (selectedSubtitle !== undefined) query.set('sub', selectedSubtitle.toString());
    const queryStr = query.toString() ? `?${query.toString()}` : '';

    if (item.Type === 'Series') {
      try {
        const ep = await getFirstEpisode(userId, item.Id);
        if (ep) {
          navigate(`/play/${ep.Id}${queryStr}`);
        } else {
          alert('该剧集没有任何集数，无法播放。');
        }
      } catch (err) {
        console.error('Failed to fetch first episode:', err);
        alert('无法获取播放信息。');
      }
    } else {
      navigate(`/play/${item.Id}${queryStr}`);
    }
  };

  if (loading || !item) {
    return (
      <div className={styles['detail-page']}>
        <div className={styles['backdrop-container']}>
          <Skeleton variant="backdrop" width="100%" height="100%" borderRadius={0} />
          <div className={styles['backdrop-overlay']} />
        </div>
        <div className={styles['content-layer']}>
          <div className={styles['meta-section']}>
            <div className={styles['poster-container']}>
              <Skeleton variant="poster" width="100%" height="100%" />
            </div>
            <div className={styles['info-container']}>
              <Skeleton variant="title" width="60%" height={48} />
              <Skeleton variant="text" width="40%" height={24} />
              <div className={styles['badges']} style={{ marginTop: '1rem' }}>
                <Skeleton variant="text" width={60} height={24} borderRadius={12} />
                <Skeleton variant="text" width={80} height={24} borderRadius={12} />
              </div>
              <Skeleton variant="text" width="90%" height={16} style={{ marginTop: '2rem' }} />
              <Skeleton variant="text" width="85%" height={16} style={{ marginTop: '0.5rem' }} />
              <Skeleton variant="text" width="70%" height={16} style={{ marginTop: '0.5rem' }} />
              <div className={styles['actions']} style={{ marginTop: '2rem' }}>
                <Skeleton variant="text" width={120} height={48} borderRadius={24} />
                <Skeleton variant="text" width={120} height={48} borderRadius={24} />
                <Skeleton variant="text" width={48} height={48} borderRadius={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        加载失败: {error}
      </div>
    );
  }

  // 提取音视频轨列表
  const audioStreams = item.MediaSources?.[0]?.MediaStreams?.filter((s: any) => s.Type === 'Audio') || [];
  const subtitleStreams = item.MediaSources?.[0]?.MediaStreams?.filter((s: any) => s.Type === 'Subtitle') || [];

  const audioItems = audioStreams.map((s: any) => ({
    id: `audio-${s.Index}`,
    label: selectedAudio === s.Index ? `✓ ${s.DisplayTitle || s.Language}` : `  ${s.DisplayTitle || s.Language}`,
    onClick: () => setSelectedAudio(s.Index)
  }));

  const subtitleItems = [
    { id: 'sub-off', label: selectedSubtitle === -1 || selectedSubtitle === undefined ? '✓ 关闭字幕' : '  关闭字幕', onClick: () => setSelectedSubtitle(-1) },
    ...(subtitleStreams.map((s: any) => ({
      id: `sub-${s.Index}`,
      label: selectedSubtitle === s.Index ? `✓ ${s.DisplayTitle || s.Language}` : `  ${s.DisplayTitle || s.Language}`,
      onClick: () => setSelectedSubtitle(s.Index)
    })))
  ];

  const trailerUrl = item?.RemoteTrailers?.[0]?.Url;
  const embedTrailerUrl = trailerUrl ? (
    trailerUrl.includes('youtube.com/watch?v=') ? trailerUrl.replace('watch?v=', 'embed/') 
    : trailerUrl.includes('youtu.be/') ? trailerUrl.replace('youtu.be/', 'youtube.com/embed/') 
    : trailerUrl
  ) : null;
  
  const hasTrailer = !!embedTrailerUrl || (item?.LocalTrailers && item.LocalTrailers.length > 0);

  return (
    <div 
      className={styles['detail-page']}
      style={themeColorRgb ? { '--poster-glow': `rgb(${themeColorRgb})` } as React.CSSProperties : undefined}
    >
      {/* 沉浸式背景：响应式加载（竖屏使用海报，横屏使用背景） */}
      <div className={styles['backdrop-container']}>
        <picture>
          {posterUrl && <source media="(max-aspect-ratio: 1/1)" srcSet={posterUrl} />}
          {(backdropUrl || posterUrl) && <img src={backdropUrl || posterUrl} alt="" className={styles['backdrop-image']} />}
        </picture>
        <div className={styles['backdrop-overlay']} />
      </div>

      <div className={styles['content-layer']}>
        {/* 顶部信息区：完全无界，仅展示 Logo/Title 及数据 */}
        <div className={styles['meta-section']}>

          <div className={styles['info-container']}>
            {logoUrl && (
              <img src={logoUrl} alt={item.Name} className={styles['logo-image']} />
            )}
            
            {/* 始终展示刮削后的元数据标题（无论是否有 Logo），确保中文名绝不丢失 */}
            <h1 className={styles['title']} style={logoUrl ? { fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.5rem', letterSpacing: 'normal' } : {}}>
              {item.Name}
            </h1>

            {item.OriginalTitle && item.OriginalTitle !== item.Name && (
              <div className={styles['tagline']}>{item.OriginalTitle}</div>
            )}

            {/* 将所有元数据、徽章、类型合并到一个弹性行内，响应用户要求 */}
            <div className={styles['meta-row']} style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
              {item.CommunityRating && (
                <Badge color="yellow" variant="filled">★ {item.CommunityRating.toFixed(1)}</Badge>
              )}
              
              <MediaBadges item={item} />

              {item.ProductionYear && (
                <span className={styles['meta-item']}><Calendar size={16} /> {item.ProductionYear}</span>
              )}

              {item.OfficialRating && <Badge>{item.OfficialRating}</Badge>}

              {item.RunTimeTicks && (
                <span className={styles['meta-item']}><Clock size={16} /> {Math.round(item.RunTimeTicks / 600000000)} 分钟</span>
              )}

              {item.Genres?.map((g: string) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>

            <div className={styles['overview-container']}>
              <div 
                className={`${styles['overview']} ${isOverviewExpanded ? '' : 'line-clamp-3'}`}
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
              >
                {item.Overview}
              </div>
              {item.Overview && item.Overview.length > 150 && (
                <button 
                  className={styles['overview-toggle']}
                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                >
                  {isOverviewExpanded ? '收起详情' : '展开阅读更多'}
                </button>
              )}
            </div>

            <div className={styles.actions} style={{ zIndex: 50 }}>
              {/* Primary Actions: 大尺寸的播放与预告片 */}
              <div className={styles['actions-primary']}>
                <FocusableButton 
                  size="lg" variant="primary" round leftIcon={<Play fill="currentColor" />} 
                  onClick={handlePlayClick} className={styles['btn-play-huge']}
                  onEnterPress={() => handlePlayClick()}
                >
                  播放
                </FocusableButton>
                {hasTrailer && (
                  <FocusableButton 
                    size="lg" variant="glass" round leftIcon={<Film />} 
                    onClick={() => setShowTrailerModal(true)}
                    onEnterPress={() => setShowTrailerModal(true)}
                  >
                    预告片
                  </FocusableButton>
                )}
              </div>

              {/* Secondary Actions: 细致的横向滑动小圆圈 */}
              <div className={styles['actions-secondary']}>
                <FocusableCircle 
                  isActive={isFavorite} 
                  activeColor="var(--color-red)"
                  label={isFavorite ? '已收藏' : '收藏'}
                  icon={<Heart fill={isFavorite ? "var(--color-red)" : "none"} color={isFavorite ? "var(--color-red)" : "currentColor"} size={20} />}
                  onClick={handleToggleFavorite}
                />

                <FocusableCircle 
                  isActive={isPlayed} 
                  activeColor="var(--color-green)"
                  label={isPlayed ? '已观看' : '标记已看'}
                  icon={<Check color={isPlayed ? "var(--color-green)" : "currentColor"} strokeWidth={isPlayed ? 3 : 2} size={20} />}
                  onClick={handleTogglePlayed}
                />

                {audioStreams.length > 1 && (
                  <Dropdown
                    trigger={
                      <div className={styles['action-circle-wrap']}>
                        <div className={styles['action-circle-btn']}>
                          <Music size={20} />
                        </div>
                        <span className={styles['action-circle-label']}>音轨</span>
                      </div>
                    }
                    items={audioItems}
                    align="center"
                    direction="up"
                  />
                )}

                {subtitleStreams.length > 0 && (
                  <Dropdown
                    trigger={
                      <div className={styles['action-circle-wrap']}>
                        <div className={styles['action-circle-btn']}>
                          <Languages size={20} />
                        </div>
                        <span className={styles['action-circle-label']}>字幕</span>
                      </div>
                    }
                    items={subtitleItems}
                    align="center"
                    direction="up"
                  />
                )}

                <FocusableCircle 
                  label="找字幕"
                  icon={<Search size={20} />}
                  onClick={() => setShowSubtitleModal(true)}
                />

                <FocusableCircle 
                  label="修正匹配"
                  icon={<Edit3 size={20} />}
                  onClick={() => setShowIdentifyModal(true)}
                />

                {isAdmin && (
                  <FocusableCircle 
                    label="编辑信息"
                    icon={<Edit3 size={20} />}
                    onClick={() => setShowEditModal(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 剧集专属季集选择器 */}
        {item.Type === 'Series' && (
          <SeasonSelector seriesId={item.Id} />
        )}

        {/* 演职人员 */}
        {item.People && item.People.length > 0 && (
          <CastRow people={item.People} />
        )}

        {/* 类似内容 */}
        {similar?.Items && similar.Items.length > 0 && (
          <MediaRow title="类似内容" items={similar.Items} />
        )}
      </div>

      <IdentifyModal
        open={showIdentifyModal}
        onClose={() => setShowIdentifyModal(false)}
        itemId={item.Id}
        itemType={item.Type}
        initialName={item.Name}
        initialYear={item.ProductionYear}
        onSuccess={handleIdentifySuccess}
      />

      <EditMetadataModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        item={item}
        onSuccess={handleIdentifySuccess}
      />

      <SubtitleSearchModal
        open={showSubtitleModal}
        onClose={() => setShowSubtitleModal(false)}
        itemId={item.Id}
        itemName={item.SeriesName || item.Name}
      />

      <Modal
        open={showTrailerModal}
        onClose={() => setShowTrailerModal(false)}
        size="lg"
        title={`${item.Name} - 预告片`}
      >
        <div style={{ aspectRatio: '16/9', width: '100%', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
          {embedTrailerUrl ? (
            <iframe 
              src={embedTrailerUrl} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
            />
          ) : item?.LocalTrailers?.length > 0 ? (
            <video 
              src={`${useAuthStore.getState().getActiveServer()?.url}/Videos/${item.LocalTrailers[0].Id}/stream?api_key=${useAuthStore.getState().getActiveServer()?.accessToken}`} 
              controls 
              autoPlay 
              style={{ width: '100%', height: '100%' }} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">暂无预告片</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
