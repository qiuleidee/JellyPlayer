// 基础 API 响应结构
export interface ApiError {
  message: string;
  status: number;
}

// 服务器信息
export interface SystemInfo {
  Id: string;
  ServerName: string;
  Version: string;
  OperatingSystem: string;
}

// 认证请求
export interface AuthRequest {
  Username: string;
  Pw?: string;
}

// 认证响应
export interface AuthResponse {
  User: User;
  SessionInfo: SessionInfo;
  AccessToken: string;
  ServerId: string;
}

// 用户模型
export interface User {
  Name: string;
  ServerId: string;
  Id: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  HasConfiguredEasyPassword: boolean;
  EnableAutoLogin: boolean;
  LastLoginDate: string;
  LastActivityDate: string;
  Configuration: UserConfiguration;
  Policy: UserPolicy;
}

export interface UserConfiguration {
  AudioLanguagePreference?: string;
  PlayDefaultAudioTrack: boolean;
  SubtitleLanguagePreference?: string;
  DisplayMissingEpisodes: boolean;
  GroupedFolders: string[];
  DisplayCollectionsView: boolean;
  EnableLocalPassword: boolean;
  OrderedViews: string[];
  LatestItemsExcludes: string[];
  MyMediaExcludes: string[];
  HidePlayedInLatest: boolean;
  RememberAudioSelections: boolean;
  RememberSubtitleSelections: boolean;
  EnableNextEpisodeAutoPlay: boolean;
}

export interface UserPolicy {
  IsAdministrator: boolean;
  IsHidden: boolean;
  IsDisabled: boolean;
  MaxParentalRating?: number;
  EnableVideoPlaybackTranscoding: boolean;
  EnableVideoPlaybackDirectPlay: boolean;
  EnableAudioPlaybackTranscoding: boolean;
  EnableAudioPlaybackDirectPlay: boolean;
  EnablePlaybackRemuxing: boolean;
  EnableLiveTvManagement: boolean;
  EnableLiveTvAccess: boolean;
  EnableMediaPlayback: boolean;
  EnableSharedDeviceControl: boolean;
  EnableRemoteControlOfOtherUsers: boolean;
  EnableRemoteAccess: boolean;
  SyncPlayAccess: string;
}

export interface SessionInfo {
  PlayState: {
    CanSeek: boolean;
    IsPaused: boolean;
    IsMuted: boolean;
    RepeatMode: string;
  };
  AdditionalUsers: any[];
  Capabilities: {
    PlayableMediaTypes: string[];
    SupportedCommands: string[];
    SupportsMediaControl: boolean;
    SupportsContentUploading: boolean;
    SupportsSync: boolean;
    SupportsSharedControl: boolean;
  };
  RemoteEndPoint: string;
  PlayableMediaTypes: string[];
  Id: string;
  UserId: string;
  UserName: string;
  Client: string;
  LastActivityDate: string;
  LastViewingDate: string;
  DeviceName: string;
  DeviceId: string;
  ApplicationVersion: string;
  IsActive: boolean;
  SupportsMediaControl: boolean;
  SupportsRemoteControl: boolean;
}
