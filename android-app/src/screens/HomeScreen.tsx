import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions, Platform, Image, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, fontSize, borderRadius, cardSize, focusStyle } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getLatestItems, getResumeItems, getNextUpShows, getSuggestions, getUserViews } from '../api/items';
import { getImageUrl } from '../api/images';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { BaseItemDto } from '../types/items';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 媒体卡片组件
function MediaCard({ item, variant = 'poster' }: { item: BaseItemDto; variant?: 'poster' | 'backdrop' }) {
  const { colors, primary } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const server = useAuthStore((s) => s.getActiveServer());
  const [isFocused, setIsFocused] = useState(false);

  const imageUrl = server
    ? `${server.url}/Items/${item.Id}/Images/${variant === 'backdrop' ? 'Backdrop' : 'Primary'}?maxWidth=${variant === 'backdrop' ? 480 : 300}&quality=90`
    : '';

  const size = variant === 'backdrop' ? cardSize.backdrop : cardSize.poster;

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { width: size.width, marginRight: spacing.md },
        isFocused && styles.focusedCard
      ]}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={() => navigation.navigate('Detail', { itemId: item.Id, itemType: item.Type })}
      activeOpacity={0.8}
    >
      <View style={[
        styles.cardImage, 
        { height: size.height, borderRadius: borderRadius.md, backgroundColor: colors.surfaceCard },
        isFocused && { borderColor: primary.primary, borderWidth: focusStyle.borderWidth }
      ]}>
        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
              headers: server?.accessToken
                ? { 'X-Emby-Token': server.accessToken }
                : undefined,
            }}
            style={[StyleSheet.absoluteFill, { borderRadius: isFocused ? borderRadius.md - focusStyle.borderWidth : borderRadius.md }]}
            resizeMode="cover"
          />
        ) : null}
        {/* 播放进度条 */}
        {item.UserData?.PlayedPercentage && item.UserData.PlayedPercentage > 0 ? (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.UserData.PlayedPercentage}%`, backgroundColor: primary.primary },
              ]}
            />
          </View>
        ) : null}
      </View>
      <Text style={[styles.cardTitle, { color: isFocused ? primary.primary : colors.text }]} numberOfLines={1}>
        {item.Name}
      </Text>
      {item.ProductionYear ? (
        <Text style={[styles.cardYear, { color: colors.textTertiary }]}>{item.ProductionYear}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// 媒体横向滚动行组件
function MediaRow({ title, items, isLoading, variant = 'poster' }: {
  title: string;
  items: BaseItemDto[];
  isLoading: boolean;
  variant?: 'poster' | 'backdrop';
}) {
  const { colors } = useTheme();

  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <View style={styles.rowContainer}>
      <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginVertical: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.Id}
          renderItem={({ item }) => <MediaCard item={item} variant={variant} />}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        />
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.userId);
  const { homeLayout, hiddenHomeModules = [] } = useSettingsStore();

  const { data: latestMovies, isLoading: loadingMovies, refetch: refetchMovies } = useQuery({
    queryKey: ['latest', userId, 'movies'],
    queryFn: () => getLatestItems(userId!, 16),
    enabled: !!userId,
  });

  const { data: resumeItems, isLoading: loadingResume, refetch: refetchResume } = useQuery({
    queryKey: ['resume', userId],
    queryFn: () => getResumeItems(userId!, 12),
    enabled: !!userId,
  });

  const { data: nextUpShows, isLoading: loadingNextUp, refetch: refetchNextUp } = useQuery({
    queryKey: ['nextup', userId],
    queryFn: () => getNextUpShows(userId!, 16),
    enabled: !!userId,
  });

  const { data: suggestions, isLoading: loadingSuggestions, refetch: refetchSuggestions } = useQuery({
    queryKey: ['suggestions', userId],
    queryFn: () => getSuggestions(userId!, 16),
    enabled: !!userId,
  });

  const { data: userViews, isLoading: loadingViews, refetch: refetchViews } = useQuery({
    queryKey: ['views', userId],
    queryFn: () => getUserViews(userId!),
    enabled: !!userId,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchMovies(),
      refetchResume(),
      refetchNextUp(),
      refetchSuggestions(),
      refetchViews(),
    ]);
    setRefreshing(false);
  }, [refetchMovies, refetchResume, refetchNextUp, refetchSuggestions, refetchViews]);

  // 构建板块列表
  const sections = homeLayout
    .filter((id) => !hiddenHomeModules.includes(id))
    .map((sectionId) => {
      switch (sectionId) {
        case 'views':
          return { id: sectionId, title: '我的资料库', items: userViews?.Items || [], loading: loadingViews, variant: 'backdrop' as const };
        case 'resume':
          return { id: sectionId, title: '继续观看', items: resumeItems?.Items || [], loading: loadingResume, variant: 'backdrop' as const };
        case 'suggestions':
          return { id: sectionId, title: '猜你喜欢', items: suggestions?.Items || [], loading: loadingSuggestions, variant: 'poster' as const };
        case 'nextup':
          return { id: sectionId, title: '接下来播放', items: nextUpShows?.Items || [], loading: loadingNextUp, variant: 'backdrop' as const };
        case 'latest':
          return { id: sectionId, title: '最新加入', items: latestMovies || [], loading: loadingMovies, variant: 'poster' as const };
        default:
          return null;
      }
    })
    .filter(Boolean) as { id: string; title: string; items: BaseItemDto[]; loading: boolean; variant: 'poster' | 'backdrop' }[];

  return (
    <FlatList
      data={sections}
      keyExtractor={(item) => item.id}
      style={[styles.container, { backgroundColor: colors.background }]}
      renderItem={({ item }) => (
        <MediaRow
          title={item.title}
          items={item.items}
          isLoading={item.loading}
          variant={item.variant}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>JellyPlayer</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.textSecondary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.isTV ? spacing.xl : spacing.xxl + spacing.lg,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  rowContainer: {
    marginBottom: spacing.xl,
  },
  rowTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: { paddingBottom: spacing.sm },
  focusedCard: {
    transform: [{ scale: focusStyle.scale }],
    zIndex: 10,
  },
  cardImage: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  cardYear: {
    fontSize: fontSize.xs,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
