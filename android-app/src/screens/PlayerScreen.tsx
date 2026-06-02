import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  BackHandler, Platform, StatusBar, Pressable,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, fontSize } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { getPlaybackInfo, getPlaybackUrl, reportPlaybackStart, reportPlaybackProgress, reportPlaybackStopped } from '../api/playback';

export default function PlayerScreen() {
  const { colors, primary } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId, startPositionTicks = 0 } = route.params as any;
  const userId = useAuthStore(s => s.userId);

  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [playSessionId, setPlaySessionId] = useState('');
  const [mediaSourceId, setMediaSourceId] = useState('');
  
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const player = useVideoPlayer(videoUrl, player => {
    player.loop = false;
    player.play();
  });

  // 获取播放信息
  useEffect(() => {
    async function initPlayback() {
      try {
        const info = await getPlaybackInfo(userId!, itemId);
        const source = info.MediaSources[0]; // 默认取第一个源
        setMediaSourceId(source.Id);
        setPlaySessionId(info.PlaySessionId);

        const isDirectPlay = source.SupportsDirectPlay || source.SupportsDirectStream;
        const url = getPlaybackUrl(itemId, source, info.PlaySessionId, isDirectPlay);
        
        setVideoUrl(url);
        setLoading(false);

        // 初始化播放时汇报
        reportPlaybackStart({
          ItemId: itemId,
          MediaSourceId: source.Id,
          PositionTicks: startPositionTicks,
          IsPaused: false,
          IsMuted: false,
          VolumeLevel: 100,
          PlayMethod: 'DirectStream',
          PlaySessionId: info.PlaySessionId,
          RepeatMode: 'RepeatNone',
        });

      } catch (e) {
        console.error('Failed to get playback info:', e);
      }
    }
    if (userId && itemId) {
      initPlayback();
    }
  }, [userId, itemId]);

  // 控制面板自动隐藏逻辑
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // 进度汇报逻辑
  const reportProgress = useCallback(async (isStopped = false) => {
    if (!playSessionId || !mediaSourceId || !player) return;
    const req = {
      ItemId: itemId,
      MediaSourceId: mediaSourceId,
      PositionTicks: player.currentTime * 10000000,
      IsPaused: !player.playing,
      IsMuted: player.muted,
      VolumeLevel: 100,
      PlayMethod: 'DirectStream' as const,
      PlaySessionId: playSessionId,
      RepeatMode: 'RepeatNone' as const,
    };
    try {
      if (isStopped) {
        await reportPlaybackStopped(req);
      } else {
        await reportPlaybackProgress(req);
      }
    } catch (e) {}
  }, [itemId, mediaSourceId, player, playSessionId]);

  useEffect(() => {
    const interval = setInterval(() => reportProgress(false), 10000); // 每 10 秒汇报一次
    return () => clearInterval(interval);
  }, [reportProgress]);

  // 物理返回键拦截汇报停止
  useEffect(() => {
    const onBackPress = () => {
      reportProgress(true);
      return false; // 允许默认返回行为
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [reportProgress]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {videoUrl ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={resetControlsTimeout}>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            allowsFullscreen={true}
            allowsPictureInPicture={true}
          />
        </Pressable>
      ) : null}

      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={primary.primary} />
        </View>
      )}

      {showControls && !loading && (
        <View style={styles.controlsOverlay}>
          {/* 顶部返回键 */}
          <View style={styles.topControls}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => {
                reportProgress(true);
                navigation.goBack();
              }}
            >
              <Text style={styles.iconText}>←</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingOverlay: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  topControls: { padding: spacing.xl, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)' },
  iconBtn: { padding: spacing.sm },
  iconText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
});
