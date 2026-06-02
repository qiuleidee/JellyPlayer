import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions, Platform, Image, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, fontSize, borderRadius, focusStyle } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { getItems } from '../api/items';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { BaseItemDto } from '../types/items';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = Platform.isTV ? 6 : 3;
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function GridCard({ item }: { item: BaseItemDto }) {
  const { colors, primary } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const server = useAuthStore((s) => s.getActiveServer());
  const [isFocused, setIsFocused] = useState(false);

  const imageUrl = server
    ? `${server.url}/Items/${item.Id}/Images/Primary?maxWidth=300&quality=90`
    : '';

  return (
    <TouchableOpacity
      style={[
        styles.gridCard, 
        { width: CARD_WIDTH },
        isFocused && styles.focusedCard
      ]}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={() => navigation.navigate('Detail', { itemId: item.Id, itemType: item.Type })}
      activeOpacity={0.8}
    >
      <View style={[
        styles.gridCardImage, 
        { height: CARD_HEIGHT, backgroundColor: colors.surfaceCard, borderRadius: borderRadius.md },
        isFocused && { borderColor: primary.primary, borderWidth: focusStyle.borderWidth }
      ]}>
        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
              headers: server?.accessToken ? { 'X-Emby-Token': server.accessToken } : undefined,
            }}
            style={[StyleSheet.absoluteFill, { borderRadius: isFocused ? borderRadius.md - focusStyle.borderWidth : borderRadius.md }]}
            resizeMode="cover"
          />
        ) : null}
        {item.UserData?.PlayedPercentage && item.UserData.PlayedPercentage > 0 ? (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.UserData.PlayedPercentage}%`, backgroundColor: primary.primary }]} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.gridCardTitle, { color: isFocused ? primary.primary : colors.text }]} numberOfLines={1}>{item.Name}</Text>
      {item.ProductionYear ? (
        <Text style={[styles.gridCardYear, { color: isFocused ? primary.primary : colors.textTertiary }]}>{item.ProductionYear}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const { colors } = useTheme();
  const route = useRoute();
  const userId = useAuthStore((s) => s.userId);
  const type = (route.params as any)?.type || 'movies';

  const isMovies = type === 'movies';
  const title = isMovies ? '电影' : '剧集';
  const includeItemTypes = isMovies ? 'Movie' : 'Series';

  const [page, setPage] = useState(0);
  const LIMIT = 30;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['library', userId, type, page],
    queryFn: () => getItems(userId!, {
      IncludeItemTypes: includeItemTypes,
      SortBy: 'DateCreated,SortName',
      SortOrder: 'Descending',
      Recursive: true,
      StartIndex: page * LIMIT,
      Limit: LIMIT,
      Fields: 'PrimaryImageAspectRatio,Overview,DateCreated',
    }),
    enabled: !!userId,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const items = data?.Items || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {data?.TotalRecordCount ? `共 ${data.TotalRecordCount} 部` : ''}
        </Text>
      </View>
      {isLoading && items.length === 0 ? (
        <ActivityIndicator size="large" color={colors.textSecondary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={items}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.Id}
          renderItem={({ item }) => <GridCard item={item} />}
          columnWrapperStyle={{ gap: CARD_GAP }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: CARD_GAP }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>未找到任何内容</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.isTV ? spacing.xl : spacing.xxl + spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: { fontSize: fontSize.xl, fontWeight: '800' },
  count: { fontSize: fontSize.sm },
  gridCard: { marginBottom: spacing.sm },
  focusedCard: {
    transform: [{ scale: focusStyle.scale }],
    zIndex: 10,
  },
  gridCardImage: { overflow: 'hidden', position: 'relative' },
  gridCardTitle: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.xs },
  gridCardYear: { fontSize: fontSize.xs - 1, marginTop: 1 },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', borderRadius: 2 },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2 },
  emptyText: { fontSize: fontSize.md },
});
