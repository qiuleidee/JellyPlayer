// Jellyfin API 相关常量
export const API_ENDPOINTS = {
  // 认证
  SYSTEM_INFO_PUBLIC: '/System/Info/Public',
  AUTHENTICATE: '/Users/AuthenticateByName',
  QUICK_CONNECT_INITIATE: '/QuickConnect/Initiate',
  QUICK_CONNECT_CONNECT: '/QuickConnect/Connect',
  LOGOUT: '/Sessions/Logout',
  SESSION_CAPABILITIES: '/Sessions/Capabilities/Full',

  // 媒体库
  USER_VIEWS: (userId: string) => `/Users/${userId}/Views`,
  USER_ITEMS: (userId: string) => `/Users/${userId}/Items`,
  ITEMS_LATEST: '/Items/Latest',
  USER_ITEMS_RESUME: (userId: string) => `/Users/${userId}/Items/Resume`,
  SHOWS_NEXT_UP: '/Shows/NextUp',
  ITEM_SIMILAR: (itemId: string) => `/Items/${itemId}/Similar`,
  USER_ITEM: (userId: string, itemId: string) => `/Users/${userId}/Items/${itemId}`,
  SHOWS_SEASONS: (seriesId: string) => `/Shows/${seriesId}/Seasons`,
  SHOWS_EPISODES: (seriesId: string) => `/Shows/${seriesId}/Episodes`,
  SPECIAL_FEATURES: (itemId: string) => `/Items/${itemId}/SpecialFeatures`,
  PLAYED_ITEMS: (userId: string, itemId: string) => `/Users/${userId}/PlayedItems/${itemId}`,
  FAVORITE_ITEMS: (userId: string, itemId: string) => `/Users/${userId}/FavoriteItems/${itemId}`,

  // 播放
  PLAYBACK_INFO: (itemId: string) => `/Items/${itemId}/PlaybackInfo`,
  PLAYING: '/Sessions/Playing',
  PLAYING_PROGRESS: '/Sessions/Playing/Progress',
  PLAYING_STOPPED: '/Sessions/Playing/Stopped',
  VIDEO_HLS_MASTER: (itemId: string) => `/Videos/${itemId}/master.m3u8`,
  VIDEO_HLS_MAIN: (itemId: string) => `/Videos/${itemId}/main.m3u8`,
  VIDEO_STREAM: (itemId: string) => `/Videos/${itemId}/stream`,
  AUDIO_UNIVERSAL: (itemId: string) => `/Audio/${itemId}/universal`,
  LIVE_STREAM_OPEN: '/LiveStreams/Open',
  LIVE_STREAM_CLOSE: '/LiveStreams/Close',

  // 图片
  ITEM_IMAGE: (itemId: string, imageType: string, index = 0) =>
    `/Items/${itemId}/Images/${imageType}${index > 0 ? `/${index}` : ''}`,
  USER_IMAGE: (userId: string) => `/Users/${userId}/Images/Primary`,

  // 搜索
  SEARCH_HINTS: '/Search/Hints',
  GENRES: '/Genres',
  PERSONS: '/Persons',
  STUDIOS: '/Studios',

  // 用户
  USERS: '/Users',
  USERS_ME: '/Users/Me',
  USER: (userId: string) => `/Users/${userId}`,
  USER_PASSWORD: (userId: string) => `/Users/${userId}/Password`,
  USER_CONFIGURATION: (userId: string) => `/Users/${userId}/Configuration`,
  USERS_NEW: '/Users/New',

  // 管理
  SYSTEM_INFO: '/System/Info',
  ACTIVITY_LOG: '/System/ActivityLog/Entries',
  SCHEDULED_TASKS: '/ScheduledTasks',
  SCHEDULED_TASK_RUN: (taskId: string) => `/ScheduledTasks/Running/${taskId}`,
  LIBRARY_REFRESH: '/Library/Refresh',
  ITEM_REFRESH: (itemId: string) => `/Items/${itemId}/Refresh`,
  SYSTEM_RESTART: '/System/Restart',
  SYSTEM_SHUTDOWN: '/System/Shutdown',
} as const;

// 客户端标识
export const CLIENT_INFO = {
  CLIENT_NAME: 'JellyPlayer',
  DEVICE_NAME: 'Web Browser',
  VERSION: '1.0.0',
} as const;

// 默认图片参数
export const IMAGE_DEFAULTS = {
  POSTER_WIDTH: 300,
  POSTER_QUALITY: 90,
  BACKDROP_WIDTH: 1920,
  BACKDROP_QUALITY: 85,
  THUMB_WIDTH: 400,
  THUMB_QUALITY: 85,
  AVATAR_SIZE: 80,
} as const;
