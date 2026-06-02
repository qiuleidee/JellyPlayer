import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api';
import type { ItemsResult, BaseItemDto } from '../types/items';

// 查询参数通用接口
export interface ItemQuery {
  StartIndex?: number;
  Limit?: number;
  IncludeItemTypes?: string;
  SortBy?: string;
  SortOrder?: 'Ascending' | 'Descending';
  Filters?: string;
  Fields?: string;
  ParentId?: string;
  Recursive?: boolean;
}

// 默认请求的附加字段，以获取更丰富的数据
const DEFAULT_FIELDS = 'PrimaryImageAspectRatio,CanDelete,Overview,Studios,Genres,MediaSources,DateCreated';

/**
 * 获取用户的最新入库媒体
 */
export async function getLatestItems(userId: string, limit = 16, parentId?: string): Promise<BaseItemDto[]> {
  const { data } = await apiClient.get<BaseItemDto[]>(API_ENDPOINTS.USER_ITEMS(userId) + '/Latest', {
    params: {
      Limit: limit * 2, // 请求更多数据以便去重后仍能满足数量要求
      Fields: DEFAULT_FIELDS,
      IncludeItemTypes: 'Movie,Series',
      ParentId: parentId,
      IsFolder: false,
    },
  });
  
  // 基于 Id 和 名称年份 的增强去重
  const uniqueItems: BaseItemDto[] = [];
  const seen = new Set();
  
  for (const item of data) {
    const nameYearKey = item.ProductionYear ? `${item.Name}-${item.ProductionYear}` : item.Name;
    if (!seen.has(item.Id) && !seen.has(nameYearKey)) {
      seen.add(item.Id);
      seen.add(nameYearKey);
      uniqueItems.push(item);
    }
  }
  
  return uniqueItems.slice(0, limit);
}

/**
 * 获取用户的"继续观看"列表 (Resume)
 */
export async function getResumeItems(userId: string, limit = 12): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.USER_ITEMS_RESUME(userId), {
    params: {
      Limit: limit,
      Fields: DEFAULT_FIELDS,
      MediaTypes: 'Video',
    },
  });
  return data;
}

/**
 * 获取剧集的"下一集" (Next Up)
 */
export async function getNextUpShows(userId: string, limit = 16): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.SHOWS_NEXT_UP, {
    params: {
      UserId: userId,
      Limit: limit,
      Fields: DEFAULT_FIELDS,
    },
  });
  return data;
}

/**
 * 查询媒体库项目 (通用)
 */
export async function getItems(userId: string, query: ItemQuery): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.USER_ITEMS(userId), {
    params: {
      Fields: DEFAULT_FIELDS,
      ...query,
    },
  });
  return data;
}

/**
 * 获取流派 (Genres)
 */
export async function getGenres(userId: string, parentId?: string): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>('/Genres', {
    params: {
      UserId: userId,
      ParentId: parentId,
      IncludeItemTypes: 'Movie,Series',
      SortBy: 'SortName',
    },
  });
  return data;
}
/**
 * 获取猜你喜欢 (Suggestions)
 */
export async function getSuggestions(userId: string, limit = 16): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(`/Users/${userId}/Suggestions`, {
    params: {
      Limit: limit,
      Fields: DEFAULT_FIELDS,
      IncludeItemTypes: 'Movie,Series',
    },
  });
  return data;
}

/**
 * 获取用户媒体库 (Views)
 */
export async function getUserViews(userId: string): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(`/Users/${userId}/Views`);
  return data;
}

/**
 * 获取用户的收藏列表
 */
export async function getFavorites(userId: string, limit = 50): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.USER_ITEMS(userId), {
    params: {
      Limit: limit,
      Filters: 'IsFavorite',
      IncludeItemTypes: 'Movie,Series',
      Fields: DEFAULT_FIELDS,
      SortBy: 'SortName',
    },
  });
  return data;
}

/**
 * 获取用户的播放历史记录
 */
export async function getHistory(userId: string, limit = 50): Promise<ItemsResult> {
  const { data } = await apiClient.get<ItemsResult>(API_ENDPOINTS.USER_ITEMS(userId), {
    params: {
      Limit: limit,
      Filters: 'IsPlayed',
      IncludeItemTypes: 'Movie,Series,Episode',
      Fields: DEFAULT_FIELDS,
      SortBy: 'DatePlayed',
      SortOrder: 'Descending',
    },
  });
  return data;
}

