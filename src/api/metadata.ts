import { apiClient } from './client';

export interface RemoteSearchResult {
  Name: string;
  ProviderIds: Record<string, string>;
  ProductionYear?: number;
  IndexNumber?: number;
  IndexNumberEnd?: number;
  ParentIndexNumber?: number;
  PremiereDate?: string;
  ImageUrl?: string;
  SearchProviderName?: string;
  Overview?: string;
}

export interface RemoteSearchQuery {
  SearchInfo: {
    Name?: string;
    Year?: number;
    IndexNumber?: number;
    ParentIndexNumber?: number;
    ProviderIds?: Record<string, string>;
  };
  ItemId: string;
}

/**
 * 远程搜索元数据 (刮削)
 * @param type 媒体类型，如 Movie, Series, Episode
 * @param query 查询参数
 */
export async function searchMetadata(type: string, query: RemoteSearchQuery): Promise<RemoteSearchResult[]> {
  const { data } = await apiClient.post<RemoteSearchResult[]>(`/Items/RemoteSearch/${type}`, query);
  return data;
}

/**
 * 应用元数据到本地项目
 * @param itemId 媒体ID
 * @param result 选择的搜索结果
 * @param replaceAllImages 是否替换所有图片
 */
export async function applyMetadata(itemId: string, result: RemoteSearchResult, replaceAllImages = true): Promise<void> {
  await apiClient.post(`/Items/RemoteSearch/Apply/${itemId}`, result, {
    params: { ReplaceAllImages: replaceAllImages }
  });
}

/**
 * 手动更新项目元数据
 * @param itemId 媒体ID
 * @param data 修改后的项目完整 DTO 或部分必须字段
 */
export async function updateItemMetadata(itemId: string, data: any): Promise<void> {
  await apiClient.post(`/Items/${itemId}`, data);
}
