import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, fontSize, borderRadius, focusStyle } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { getItemDetails, getNextUpEpisode, getFirstEpisode } from '../api/details';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DetailScreen() {
  const { colors, primary } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { itemId, itemType } = route.params as any;
  const userId = useAuthStore((s) => s.userId);
  const server = useAuthStore((s) => s.getActiveServer());
  const [isFocused, setIsFocused] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['details', userId, itemId],
    queryFn: () => getItemDetails(userId!, itemId),
    enabled: !!userId && !!itemId,
  });

  const isSeries = item?.Type === 'Series';

  // 播放按钮逻辑：电影直接播，剧集播下一集或第一集
  const handlePlay = async () => {
    if (!item) return;
    if (!isSeries) {
      navigation.navigate('Player', { itemId: item.Id });
    } else {
      try {
        const nextEpisode = await getNextUpEpisode(userId!, item.Id);
        if (nextEpisode) {
          navigation.navigate('Player', { itemId: nextEpisode.Id });
        } else {
          const firstEpisode = await getFirstEpisode(userId!, item.Id);
          if (firstEpisode) {
            navigation.navigate('Player', { itemId: firstEpisode.Id });
          }
        }
      } catch (e) {
        console.error('Failed to get playable episode:', e);
      }
    }
  };

  if (isLoading || !item) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primary.primary} />
      </View>
    );
  }

  const backdropUrl = server?.url && item.ImageTags?.Backdrop
    ? `${server.url}/Items/${item.Id}/Images/Backdrop?maxWidth=1920&quality=85`
    : '';

  const posterUrl = server?.url && item.ImageTags?.Primary
    ? `${server.url}/Items/${item.Id}/Images/Primary?maxWidth=600&quality=90`
    : '';

  const runTimeStr = item.RunTimeTicks
    ? `${Math.round(item.RunTimeTicks / 600000000)} 分钟`
    : '';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} bounces={false}>
      {/* 背景海报 & 渐变遮罩 */}
      <View style={styles.backdropContainer}>
        {backdropUrl || posterUrl ? (
          <Image
            source={{
              uri: backdropUrl || posterUrl,
              headers: server?.accessToken ? { 'X-Emby-Token': server.accessToken } : undefined,
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceCard }]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        {/* 顶部返回键 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 标题区 */}
        <Text style={[styles.title, { color: colors.text }]}>{item.Name}</Text>
        {item.OriginalTitle && item.OriginalTitle !== item.Name ? (
          <Text style={[styles.originalTitle, { color: colors.textSecondary }]}>{item.OriginalTitle}</Text>
        ) : null}

        {/* 元数据行 */}
        <View style={styles.metaRow}>
          {item.ProductionYear ? <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.ProductionYear}</Text> : null}
          {runTimeStr ? <Text style={[styles.metaText, { color: colors.textTertiary }]}> • {runTimeStr}</Text> : null}
          {item.OfficialRating ? (
            <View style={[styles.ratingBadge, { borderColor: colors.border }]}>
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{item.OfficialRating}</Text>
            </View>
          ) : null}
        </View>

        {/* 播放按钮 */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.playButton, isFocused && styles.focusedPlayButton]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPress={handlePlay}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={primary.gradient as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playButtonGradient}
            >
              <Text style={styles.playButtonText}>▶ 播 放</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 简介 */}
        {item.Overview ? (
          <View style={styles.section}>
            <Text style={[styles.overview, { color: colors.textSecondary }]}>{item.Overview}</Text>
          </View>
        ) : null}
        
        {/* 类型标签 */}
        {item.Genres && item.Genres.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.Genres.map(g => (
              <View key={g} style={[styles.tag, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{g}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdropContainer: {
    width: SCREEN_WIDTH,
    height: Platform.isTV ? SCREEN_WIDTH * 0.4 : SCREEN_WIDTH * 0.7,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.isTV ? spacing.xl : spacing.xxl + spacing.md,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl * 2,
    marginTop: -spacing.xxl * 2,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', marginBottom: 4 },
  originalTitle: { fontSize: fontSize.md, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, flexWrap: 'wrap' },
  metaText: { fontSize: fontSize.sm },
  ratingBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  ratingText: { fontSize: fontSize.xs, fontWeight: '600' },
  actionRow: { marginBottom: spacing.xl },
  playButton: { borderRadius: borderRadius.full, overflow: 'hidden', alignSelf: 'flex-start' },
  focusedPlayButton: {
    transform: [{ scale: 1.05 }],
    borderColor: '#FFF',
    borderWidth: 2,
    shadowColor: '#E8784A',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  playButtonGradient: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: { color: '#FFF', fontSize: fontSize.lg, fontWeight: '700' },
  section: { marginBottom: spacing.lg },
  overview: { fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full },
  tagText: { fontSize: fontSize.xs },
});
