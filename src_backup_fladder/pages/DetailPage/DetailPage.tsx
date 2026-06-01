import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, Check, Film, Search, Languages, Calendar, Clock, Music } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getItemDetails, getSimilarItems, getFirstEpisode } from '../../api/details';
import { UserDataAPI } from '../../api/userData';
import { ImageUtils } from '../../api/images';
import { Button, Badge, Skeleton, MediaBadges, IdentifyModal, SubtitleSearchModal, Dropdown } from '../../components/ui';
import { CastRow, MediaRow, SeasonSelector } from '../../components/media';
import styles from './DetailPage.module.css';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const [item, setItem] = useState<any>(null);
  const [similar, setSimilar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);
  const [showIdentifyModal, setShowIdentifyModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const [selectedAudio, setSelectedAudio] = useState<number | undefined>();
  const [selectedSubtitle, setSelectedSubtitle] = useState<number | undefined>();

  useEffect(() => {
    if (!id || !userId) return;

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

  const backdropTag = item.BackdropImageTags && item.BackdropImageTags.length > 0 ? item.BackdropImageTags[0] : item.ImageTags?.Backdrop;
  const backdropUrl = backdropTag ? ImageUtils.getBackdropUrl(item.Id, backdropTag) : null;
  const posterUrl = item.ImageTags?.Primary ? ImageUtils.getPosterUrl(item.Id, item.ImageTags.Primary) : undefined;
  const logoUrl = item.ImageTags?.Logo ? ImageUtils.getLogoUrl(item.Id, item.ImageTags.Logo) : null;

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

  return (
    <div className={styles['detail-page']}>
      {/* 沉浸式背景 */}
      <div className={styles['backdrop-container']}>
        {backdropUrl && <img src={backdropUrl} alt="" className={styles['backdrop-image']} />}
        <div className={styles['backdrop-overlay']} />
      </div>

      <div className={styles['content-layer']}>
        {/* 顶部信息区 */}
        <div className={styles['meta-section']}>
          <div className={styles['poster-container']}>
            {posterUrl ? (
              <img src={posterUrl} alt={item.Name} className={styles['poster-image']} />
            ) : (
              <div className={`${styles['poster-image']} flex items-center justify-center bg-gray-800 text-gray-500 min-h-[360px]`}>
                暂无图片
              </div>
            )}
          </div>

          <div className={styles['info-container']}>
            {logoUrl ? (
              <img src={logoUrl} alt={item.Name} className={styles['logo-image']} />
            ) : (
              <h1 className={styles['title']}>{item.Name}</h1>
            )}

            {item.OriginalTitle && item.OriginalTitle !== item.Name && (
              <div className={styles['tagline']}>{item.OriginalTitle}</div>
            )}

            <div className={styles['badges']}>
              {item.CommunityRating && (
                <Badge color="yellow" variant="filled">★ {item.CommunityRating.toFixed(1)}</Badge>
              )}
            </div>
            
            {/* 高级音视频徽章 */}
            <div className="mt-2 mb-3">
              <MediaBadges item={item} />
            </div>

             <div className={styles['meta-row']}>
              <span className={styles['meta-item']}><Calendar size={16} /> {item.ProductionYear}</span>
              {item.OfficialRating && <Badge>{item.OfficialRating}</Badge>}
              {item.RunTimeTicks && (
                <span className={styles['meta-item']}><Clock size={16} /> {Math.round(item.RunTimeTicks / 600000000)} 分钟</span>
              )}
            </div>

            <div className={styles['genres']}>
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

            <div className={styles.actions}>
              <div className={styles['tooltip-wrap']} data-tooltip="立即播放">
                <Button size="lg" leftIcon={<Play fill="currentColor" />} onClick={handlePlayClick}>
                  播放
                </Button>
              </div>
              {audioStreams.length > 1 && (
                <div className={styles['tooltip-wrap']} data-tooltip="选择音轨">
                  <Dropdown
                    trigger={
                      <Button size="lg" variant="secondary" icon round>
                        <Music size={20} />
                      </Button>
                    }
                    items={audioItems}
                    align="left"
                  />
                </div>
              )}
              {subtitleStreams.length > 0 && (
                <div className={styles['tooltip-wrap']} data-tooltip="选择字幕">
                  <Dropdown
                    trigger={
                      <Button size="lg" variant="secondary" icon round>
                        <Languages size={20} />
                      </Button>
                    }
                    items={subtitleItems}
                    align="left"
                  />
                </div>
              )}
              <div className={styles['tooltip-wrap']} data-tooltip="观看预告片">
                <Button size="lg" variant="secondary" leftIcon={<Film />}>
                  预告片
                </Button>
              </div>
              <div className={styles['tooltip-wrap']} data-tooltip={isFavorite ? '取消收藏' : '加入收藏'}>
                <Button size="lg" variant="secondary" icon round onClick={handleToggleFavorite}>
                  <Heart fill={isFavorite ? "var(--color-red)" : "none"} color={isFavorite ? "var(--color-red)" : "currentColor"} />
                </Button>
              </div>
              <div className={styles['tooltip-wrap']} data-tooltip={isPlayed ? '标记为未观看' : '标记为已观看'}>
                <Button size="lg" variant="secondary" icon round onClick={handleTogglePlayed}>
                  <Check color={isPlayed ? "var(--color-green)" : "currentColor"} strokeWidth={isPlayed ? 3 : 2} />
                </Button>
              </div>
              <div className={styles['tooltip-wrap']} data-tooltip="在线搜索字幕">
                <Button size="lg" variant="secondary" icon round onClick={() => setShowSubtitleModal(true)}>
                  <Languages size={20} />
                </Button>
              </div>
              <div className={styles['tooltip-wrap']} data-tooltip="识别/修正匹配">
                <Button size="lg" variant="secondary" icon round onClick={() => setShowIdentifyModal(true)}>
                  <Search size={20} />
                </Button>
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

      <SubtitleSearchModal
        open={showSubtitleModal}
        onClose={() => setShowSubtitleModal(false)}
        itemId={item.Id}
        itemName={item.SeriesName || item.Name}
      />
    </div>
  );
}
