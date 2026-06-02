import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform, Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, fontSize, borderRadius, cardSize, focusStyle } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { searchItems } from '../api/search';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { BaseItemDto } from '../types/items';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = Platform.isTV ? 6 : 3;
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 搜索结果卡片，自带 TV 焦点动画支持
function SearchCard({ item }: { item: BaseItemDto }) {
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
      </View>
      <Text style={[styles.gridCardTitle, { color: isFocused ? primary.primary : colors.text }]} numberOfLines={1}>
        {item.Name}
      </Text>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.userId);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // 防抖逻辑
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', userId, debouncedTerm],
    queryFn: () => searchItems(userId!, debouncedTerm, 30),
    enabled: !!userId && debouncedTerm.length > 0,
  });

  const items = data?.Items || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.surfaceElevated, 
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="搜索电影、剧集、演员..."
          placeholderTextColor={colors.textTertiary}
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoFocus={!Platform.isTV}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.textSecondary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={items}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.Id}
          renderItem={({ item }) => <SearchCard item={item} />}
          columnWrapperStyle={{ gap: CARD_GAP }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: CARD_GAP }}
          ListEmptyComponent={
            debouncedTerm ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>没有找到匹配的结果</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>输入关键词开始搜索</Text>
              </View>
            )
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
  },
  searchInput: {
    height: Platform.isTV ? 60 : 50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontSize: Platform.isTV ? fontSize.lg : fontSize.md,
  },
  gridCard: { marginBottom: spacing.sm },
  focusedCard: {
    transform: [{ scale: focusStyle.scale }],
    zIndex: 10,
  },
  gridCardImage: { overflow: 'hidden', position: 'relative' },
  gridCardTitle: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.xs, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2 },
  emptyText: { fontSize: fontSize.md },
});
