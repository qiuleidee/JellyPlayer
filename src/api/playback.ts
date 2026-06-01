import { apiClient } from './client';
import { API_ENDPOINTS, CLIENT_INFO } from '../constants/api';
import { useAuthStore } from '../stores/authStore';

export interface PlaybackInfoResponse {
  MediaSources: any[];
  PlaySessionId: string;
}

export interface ProgressRequest {
  ItemId: string;
  MediaSourceId: string;
  PositionTicks: number;
  IsPaused: boolean;
  IsMuted: boolean;
  AudioStreamIndex?: number;
  SubtitleStreamIndex?: number;
  VolumeLevel: number;
  PlayMethod: 'DirectPlay' | 'DirectStream' | 'Transcode';
  PlaySessionId: string;
  RepeatMode: 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
}

/**
 * 获取播放信息（用于决定解码方式和获取播放 Session）
 */
export async function getPlaybackInfo(
  userId: string,
  itemId: string,
  maxBitrate?: number,
  audioStreamIndex?: number,
  subtitleStreamIndex?: number
): Promise<PlaybackInfoResponse> {
  const bitrateToUse = maxBitrate || 140000000;
  const { data } = await apiClient.post<PlaybackInfoResponse>(
    API_ENDPOINTS.PLAYBACK_INFO(itemId),
    {
      UserId: userId,
      IsPlayback: true,
      AutoOpenLiveStream: true,
      MaxStreamingBitrate: bitrateToUse,
      StartTimeTicks: 0,
      AudioStreamIndex: audioStreamIndex !== undefined ? audioStreamIndex : null,
      SubtitleStreamIndex: subtitleStreamIndex !== undefined ? subtitleStreamIndex : null,
      MaxAudioChannels: 6,
      MediaSourceId: null,
      LiveStreamId: null,
      DeviceProfile: {
        Name: CLIENT_INFO.CLIENT_NAME,
        MaxStreamingBitrate: bitrateToUse,
        MaxStaticBitrate: bitrateToUse,
        MusicStreamingTranscodingBitrate: 320000,
        DirectPlayProfiles: [
          { Container: 'mp4,m4v', Type: 'Video', VideoCodec: 'h264,hevc,vp9,av1', AudioCodec: 'aac,mp3,opus,flac' },
          { Container: 'mkv', Type: 'Video', VideoCodec: 'h264,hevc,vp9,av1', AudioCodec: 'aac,mp3,opus,flac' },
        ],
        TranscodingProfiles: [
          { Container: 'ts', Type: 'Video', VideoCodec: 'h264', AudioCodec: 'aac', Protocol: 'hls', Context: 'Streaming' },
        ],
        ContainerProfiles: [],
        CodecProfiles: [],
        SubtitleProfiles: [
          { Format: 'srt', Method: 'External' },
          { Format: 'vtt', Method: 'External' },
          { Format: 'sub', Method: 'External' },
        ],
      },
    }
  );
  return data;
}

/**
 * 获取媒体源播放 URL (HLS / 直接播放)
 */
export function getPlaybackUrl(itemId: string, source: any, playSessionId: string, isDirectPlay: boolean): string {
  const server = useAuthStore.getState().getActiveServer();
  if (!server) return '';
  const baseUrl = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;
  
  if (isDirectPlay) {
    if (source.DirectStreamUrl) return `${baseUrl}${source.DirectStreamUrl}`;
    return `${baseUrl}${API_ENDPOINTS.VIDEO_STREAM(itemId)}?Static=true&mediaSourceId=${source.Id}&deviceId=jellyplayer&api_key=${server.accessToken}`;
  } else {
    if (source.TranscodingUrl) return `${baseUrl}${source.TranscodingUrl}`;
    return `${baseUrl}${API_ENDPOINTS.VIDEO_HLS_MASTER(itemId)}?MediaSourceId=${source.Id}&PlaySessionId=${playSessionId}&api_key=${server.accessToken}`;
  }
}

/**
 * 报告播放开始
 */
export async function reportPlaybackStart(req: ProgressRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PLAYING, req);
}

/**
 * 报告播放进度
 */
export async function reportPlaybackProgress(req: ProgressRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PLAYING_PROGRESS, req);
}

/**
 * 报告播放停止
 */
export async function reportPlaybackStopped(req: ProgressRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PLAYING_STOPPED, req);
}
