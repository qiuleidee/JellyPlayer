// 媒体项目类型定义
export type MediaType = 'Video' | 'Audio' | 'Photo' | 'Book' | 'Unknown';
export type ItemType = 'Movie' | 'Series' | 'Episode' | 'Season' | 'BoxSet' | 'Folder' | 'MusicAlbum' | 'MusicArtist' | 'Audio' | 'Person' | 'Genre' | 'Studio';

export interface BaseItemDto {
  Name: string;
  OriginalTitle?: string;
  ServerId: string;
  Id: string;
  Etag: string;
  DateCreated: string;
  CanDelete: boolean;
  CanDownload: boolean;
  PresentationUniqueKey: string;
  Type: ItemType;
  MediaType?: MediaType;

  // 图片信息
  ImageTags: {
    Primary?: string;
    Logo?: string;
    Backdrop?: string;
    Thumb?: string;
    Banner?: string;
  };
  BackdropImageTags?: string[];
  ImageBlurHashes?: {
    Primary?: Record<string, string>;
    Logo?: Record<string, string>;
    Backdrop?: Record<string, string>;
    Thumb?: Record<string, string>;
    Banner?: Record<string, string>;
  };

  // 用户数据
  UserData?: UserItemDataDto;

  // 媒体信息
  RunTimeTicks?: number;
  ProductionYear?: number;
  PremiereDate?: string;
  EndDate?: string;
  CommunityRating?: number;
  CriticRating?: number;
  OfficialRating?: string;
  Overview?: string;
  Genres?: string[];
  Studios?: { Name: string; Id: string }[];
  People?: BaseItemPerson[];

  // 视频特定信息
  HasSubtitles?: boolean;
  Container?: string;
  VideoType?: string;
  IsoType?: string;
  Video3DFormat?: string;
  MediaSources?: MediaSourceInfo[];
  MediaStreams?: MediaStream[];

  // 剧集/季信息
  IndexNumber?: number;
  IndexNumberEnd?: number;
  ParentIndexNumber?: number;
  SeriesId?: string;
  SeriesName?: string;
  SeasonId?: string;
  SeasonName?: string;

  // 章节与时间戳标记
  Chapters?: ChapterInfo[];
}

export interface ChapterInfo {
  StartPositionTicks: number;
  Name: string;
  ImageTag?: string;
  MarkerType?: string;
}

export interface UserItemDataDto {
  Rating?: number;
  PlayedPercentage?: number;
  UnplayedItemCount?: number;
  PlaybackPositionTicks: number;
  PlayCount: number;
  IsFavorite: boolean;
  Likes?: boolean;
  LastPlayedDate?: string;
  Played: boolean;
  Key: string;
  ItemId: string;
}

export interface BaseItemPerson {
  Name: string;
  Id: string;
  Role: string;
  Type: string;
  PrimaryImageTag?: string;
  ImageBlurHashes?: Record<string, string>;
}

export interface MediaSourceInfo {
  Protocol: string;
  Id: string;
  Path: string;
  Type: string;
  Container: string;
  Size: number;
  Name: string;
  IsRemote: boolean;
  ETag: string;
  RunTimeTicks: number;
  ReadAtNativeFramerate: boolean;
  IgnoreDts: boolean;
  IgnoreIndex: boolean;
  GenPtsInput: boolean;
  SupportsTranscoding: boolean;
  SupportsDirectStream: boolean;
  SupportsDirectPlay: boolean;
  IsInfiniteStream: boolean;
  RequiresOpening: boolean;
  RequiresClosing: boolean;
  RequiresLooping: boolean;
  SupportsProbing: boolean;
  VideoType: string;
  MediaStreams: MediaStream[];
  MediaAttachments: any[];
  Formats: string[];
  Bitrate: number;
  DefaultAudioStreamIndex?: number;
  DefaultSubtitleStreamIndex?: number;
}

export interface MediaStream {
  Codec: string;
  Language?: string;
  TimeBase?: string;
  VideoRange?: string;
  VideoRangeType?: string;
  VideoDoViTitle?: string;
  DisplayTitle?: string;
  Type: 'Video' | 'Audio' | 'Subtitle' | 'EmbeddedImage';
  Index: number;
  IsInterlaced: boolean;
  IsDefault: boolean;
  IsForced: boolean;
  Height?: number;
  Width?: number;
  AverageFrameRate?: number;
  RealFrameRate?: number;
  Profile?: string;
  AspectRatio?: string;
  Title?: string;
  IsExternal: boolean;
  IsTextSubtitleStream: boolean;
  SupportsExternalStream: boolean;
  DeliveryMethod?: string;
  DeliveryUrl?: string;
  Path?: string;
}

export interface ItemsResult {
  Items: BaseItemDto[];
  TotalRecordCount: number;
  StartIndex: number;
}
