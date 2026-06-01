import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api';
import type { BaseItemDto, ItemsResult } from '../types/items';

const DEFAULT_FIELDS = 'PrimaryImageAspectRatio,CanDelete,Overview,Studios,Genres,MediaSources,DateCreated,People,ProviderIds,SpecialEpisodeNumbers,Chapters';

/**
 * 获取单个媒体详情
 */
export async function getItemDetails(userId: string, itemId: string): Promise<BaseItemDto> {
  const { data } = await apiClient.get<BaseItemDto>(API_ENDPOINTS.USER_ITEM(userId, itemId), {
    params: {
      Fields: DEFAULT_FIELDS,
    },
  });
  return data;
}

/**
 * 获取相似内容
 */
export async function getSimilarItems(userId: string, itemId: string, limit = 12): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.ITEM_SIMILAR(itemId), {
    params: {
      UserId: userId,
      Limit: limit,
      Fields: 'PrimaryImageAspectRatio,Overview',
    },
  });
  return data;
}

/**
 * 获取剧集的所有季
 */
export async function getSeriesSeasons(userId: string, seriesId: string): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.SHOWS_SEASONS(seriesId), {
    params: {
      UserId: userId,
      Fields: 'PrimaryImageAspectRatio,Overview',
    },
  });
  return data;
}

/**
 * 获取某一季的剧集
 */
export async function getSeasonEpisodes(userId: string, seriesId: string, seasonId: string): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.SHOWS_EPISODES(seriesId), {
    params: {
      UserId: userId,
      SeasonId: seasonId,
      Fields: 'PrimaryImageAspectRatio,Overview,DateCreated',
    },
  });
  return data;
}

/**
 * 获取剧集的第一集
 */
export async function getFirstEpisode(userId: string, seriesId: string): Promise<BaseItemDto | null> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.USER_ITEMS(userId), {
    params: {
      ParentId: seriesId,
      IncludeItemTypes: 'Episode',
      Recursive: true,
      Limit: 1,
      SortBy: 'ParentIndexNumber,IndexNumber',
      SortOrder: 'Ascending',
    },
  });
  return data.Items && data.Items.length > 0 ? data.Items[0] : null;
}
