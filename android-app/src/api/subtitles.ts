import { apiClient } from './client';

export interface RemoteSubtitleInfo {
  ThreeLetterISOLanguageName: string;
  Id: string;
  ProviderName: string;
  Name: string;
  Format: string;
  Author?: string;
  Comment?: string;
  DateCreated?: string;
  CommunityRating?: number;
  DownloadCount?: number;
  IsHashMatch?: boolean;
}

/**
 * 搜索在线字幕
 * @param itemId 媒体 ID
 * @param language 语言代码，例如 "zh", "chi", "eng"
 * @param isPerfectMatch 是否需要精确匹配 (Hash Match)
 */
export async function searchRemoteSubtitles(
  itemId: string,
  language: string,
  isPerfectMatch: boolean = false
): Promise<RemoteSubtitleInfo[]> {
  const { data } = await apiClient.get<RemoteSubtitleInfo[]>(
    `/Items/${itemId}/RemoteSearch/Subtitles/${language}`,
    {
      params: {
        IsPerfectMatch: isPerfectMatch,
      },
    }
  );
  return data;
}

/**
 * 下载并挂载在线字幕
 * @param itemId 媒体 ID
 * @param subtitleId 搜索结果中的字幕 ID
 */
export async function downloadRemoteSubtitle(itemId: string, subtitleId: string): Promise<void> {
  await apiClient.post(`/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`);
}

/**
 * 本地上传外挂字幕
 * @param itemId 媒体 ID
 * @param language 语言代码，默认 "chi"
 * @param format 字幕扩展名格式，例如 "srt", "ass", "vtt"
 * @param base64Data 字幕文件的 Base64 编码字符串
 */
export async function uploadLocalSubtitle(
  itemId: string,
  language: string,
  format: string,
  base64Data: string
): Promise<void> {
  await apiClient.post(`/Videos/${itemId}/Subtitles`, {
    Language: language,
    Format: format,
    IsForced: false,
    Data: base64Data
  });
}
