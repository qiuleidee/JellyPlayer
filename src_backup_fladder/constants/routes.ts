// 路由路径常量
export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  LIBRARY: '/library/:id',
  MOVIE_DETAIL: '/movie/:id',
  SERIES_DETAIL: '/series/:id',
  PERSON: '/person/:id',
  GENRE: '/genre/:name',
  STUDIO: '/studio/:id',
  PLAYER: '/play/:id',
  SEARCH: '/search',
  FAVORITES: '/favorites',
  HISTORY: '/history',
  STATS: '/stats',
  PLAYLISTS: '/playlists',
  COLLECTIONS: '/collections',
  SYNCPLAY: '/syncplay',
  STATISTICS: '/statistics',
  SETTINGS: '/settings',
  SETTINGS_PLAYBACK: '/settings/playback',
  SETTINGS_APPEARANCE: '/settings/appearance',
  SETTINGS_SUBTITLES: '/settings/subtitles',
  SETTINGS_NETWORK: '/settings/network',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_LIBRARIES: '/admin/libraries',
  ADMIN_TASKS: '/admin/tasks',
  ADMIN_LOG: '/admin/log',
} as const;

// 路由路径生成工具
export function libraryPath(id: string) { return `/library/${id}`; }
export function moviePath(id: string) { return `/movie/${id}`; }
export function seriesPath(id: string) { return `/series/${id}`; }
export function personPath(id: string) { return `/person/${id}`; }
export function genrePath(name: string) { return `/genre/${encodeURIComponent(name)}`; }
export function studioPath(id: string) { return `/studio/${id}`; }
export function playerPath(id: string) { return `/play/${id}`; }
