import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api';
import type { ItemsResult } from '../types/items';

/**
 * 全局搜索接口
 */
export async function searchItems(userId: string, searchTerm: string, limit = 24): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.USER_ITEMS(userId), {
    params: {
      SearchTerm: searchTerm,
      Limit: limit,
      Recursive: true,
      IncludeItemTypes: 'Movie,Series,Episode,Person,Studio,Genre',
      Fields: 'PrimaryImageAspectRatio,Overview',
    },
  });
  return data;
}

/**
 * 搜索提示建议 (Search Hints)
 */
export async function getSearchHints(userId: string, searchTerm: string, limit = 8): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.SEARCH_HINTS, {
    params: {
      UserId: userId,
      SearchTerm: searchTerm,
      Limit: limit,
      IncludeItemTypes: 'Movie,Series,Person',
    },
  });
  return data;
}
