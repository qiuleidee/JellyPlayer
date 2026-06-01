/**
 * NativePlayerBridge.ts
 * 
 * 此模块用于 Capacitor 和 Android 宿主端之间的通讯，
 * 主要功能为：当电视/手机端点击“播放”按钮时，将视频 URL、外挂字幕流、鉴权 Token 发送给 Android 的 ExoPlayer Activity 进行原生硬件解码播放。
 */

import { registerPlugin } from '@capacitor/core';

export interface NativePlayerPlugin {
  /**
   * 启动原生 ExoPlayer
   * @param options 播放参数
   */
  startPlayer(options: { 
    url: string; 
    title?: string; 
    subtitleUrl?: string; 
    positionMs?: number; 
    token?: string; 
  }): Promise<{ positionMs: number, completed: boolean }>;
}

// 注册插件（如果 Android 端尚未实现该插件，这里调用不会崩溃，但会返回未实现错误）
export const NativePlayer = registerPlugin<NativePlayerPlugin>('NativePlayer');

/**
 * 尝试使用原生播放器播放视频
 */
export async function playWithNativePlayer(url: string, title: string, positionMs: number = 0) {
  try {
    console.log('[NativeBridge] 正在唤起原生播放器...', { url, title, positionMs });
    const result = await NativePlayer.startPlayer({
      url,
      title,
      positionMs
    });
    console.log('[NativeBridge] 原生播放器返回:', result);
    return result;
  } catch (error) {
    console.warn('[NativeBridge] 原生播放器不可用或启动失败，将回退至 Web 播放器。', error);
    throw error;
  }
}
