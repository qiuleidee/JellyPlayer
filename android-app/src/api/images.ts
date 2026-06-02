import { useAuthStore } from '../stores/authStore';
import { API_ENDPOINTS, IMAGE_DEFAULTS } from '../constants/api';

type ImageType = 'Primary' | 'Backdrop' | 'Thumb' | 'Logo' | 'Banner';

interface ImageOptions {
  type?: ImageType;
  index?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  fillWidth?: number;
  fillHeight?: number;
  tag?: string;
}

/**
 * 构建带鉴权的图片 URL
 */
export function getImageUrl(itemId: string, options: ImageOptions = {}): string {
  const {
    type = 'Primary',
    index = 0,
    maxWidth,
    maxHeight,
    quality,
    fillWidth,
    fillHeight,
    tag,
  } = options;

  const server = useAuthStore.getState().getActiveServer();
  if (!server) return '';

  const baseUrl = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;
  const imagePath = API_ENDPOINTS.ITEM_IMAGE(itemId, type, index);

  const params = new URLSearchParams();
  
  if (maxWidth) params.append('maxWidth', maxWidth.toString());
  if (maxHeight) params.append('maxHeight', maxHeight.toString());
  if (quality) params.append('quality', quality.toString());
  if (fillWidth) params.append('fillWidth', fillWidth.toString());
  if (fillHeight) params.append('fillHeight', fillHeight.toString());
  if (tag) params.append('tag', tag);
  
  if (server.accessToken) {
    params.append('api_key', server.accessToken);
  }

  const queryString = params.toString();
  return `${baseUrl}${imagePath}${queryString ? `?${queryString}` : ''}`;
}

/**
 * 快速获取常用预设尺寸图片
 */
export const ImageUtils = {
  // 海报
  getPosterUrl: (itemId: string, tag?: string) => 
    getImageUrl(itemId, { 
      type: 'Primary', 
      maxWidth: IMAGE_DEFAULTS.POSTER_WIDTH, 
      quality: IMAGE_DEFAULTS.POSTER_QUALITY,
      tag 
    }),
  
  // 背景图
  getBackdropUrl: (itemId: string, tag?: string, index = 0) =>
    getImageUrl(itemId, { 
      type: 'Backdrop', 
      index,
      maxWidth: IMAGE_DEFAULTS.BACKDROP_WIDTH, 
      quality: IMAGE_DEFAULTS.BACKDROP_QUALITY,
      tag 
    }),

  // 缩略图（通常是剧集单集封面）
  getThumbUrl: (itemId: string, tag?: string) =>
    getImageUrl(itemId, { 
      type: 'Thumb', 
      maxWidth: IMAGE_DEFAULTS.THUMB_WIDTH, 
      quality: IMAGE_DEFAULTS.THUMB_QUALITY,
      tag 
    }),

  // Logo
  getLogoUrl: (itemId: string, tag?: string) =>
    getImageUrl(itemId, { 
      type: 'Logo', 
      maxWidth: 400, 
      tag 
    }),

  // 用户头像
  getUserAvatarUrl: (userId: string) => {
    const server = useAuthStore.getState().getActiveServer();
    if (!server) return '';
    const baseUrl = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;
    return `${baseUrl}${API_ENDPOINTS.USER_IMAGE(userId)}`;
  }
};
