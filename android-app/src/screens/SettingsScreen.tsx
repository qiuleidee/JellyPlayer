import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, fontSize, borderRadius, focusStyle } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { colors, primary } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userName, logout, getActiveServer } = useAuthStore();
  const server = getActiveServer();
  const [isFocused, setIsFocused] = useState(false);
  const [isFavFocused, setIsFavFocused] = useState(false);
  const [isHistFocused, setIsHistFocused] = useState(false);

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>设置</Text>
      </View>

      {/* 用户信息 */}
      <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: primary.primary }]}>
            <Text style={styles.avatarText}>{(userName || '?')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{userName || '未知用户'}</Text>
            <Text style={[styles.serverUrl, { color: colors.textSecondary }]}>{server?.url || ''}</Text>
          </View>
        </View>
      </View>

      {/* 关于 */}
      <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>版本</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>1.0.0 (React Native)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>设备类型</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{Platform.isTV ? 'Android TV' : 'Android 手机'}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>服务器</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{server?.name || '未连接'}</Text>
        </View>
      </View>

      {/* 快捷菜单 */}
      <View style={styles.menuSection}>
        <Text style={[styles.rowLabel, { color: colors.textSecondary, marginBottom: spacing.sm }]}>我的库</Text>
        <TouchableOpacity
          style={[
            styles.menuItem,
            { backgroundColor: colors.surfaceElevated, borderColor: isFavFocused ? primary.primary : colors.border },
            isFavFocused && styles.focusedMenuItem
          ]}
          onFocus={() => setIsFavFocused(true)}
          onBlur={() => setIsFavFocused(false)}
          onPress={() => navigation.navigate('Favorites')}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuItemText, { color: isFavFocused ? primary.primary : colors.text }]}>我的收藏</Text>
          <Text style={[styles.menuItemArrow, { color: colors.textTertiary }]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            { backgroundColor: colors.surfaceElevated, borderColor: isHistFocused ? primary.primary : colors.border, marginTop: spacing.md },
            isHistFocused && styles.focusedMenuItem
          ]}
          onFocus={() => setIsHistFocused(true)}
          onBlur={() => setIsHistFocused(false)}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuItemText, { color: isHistFocused ? primary.primary : colors.text }]}>播放历史</Text>
          <Text style={[styles.menuItemArrow, { color: colors.textTertiary }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 退出按钮 */}
      <TouchableOpacity
        style={[
          styles.logoutButton, 
          { backgroundColor: colors.surfaceElevated, borderColor: isFocused ? primary.primary : colors.border },
          isFocused && styles.focusedLogoutButton
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={[styles.logoutText, { color: '#E84A4A' }]}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.isTV ? spacing.xl : spacing.xxl + spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800' },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  userInfo: { marginLeft: spacing.md, flex: 1 },
  userName: { fontSize: fontSize.lg, fontWeight: '700' },
  serverUrl: { fontSize: fontSize.sm, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowLabel: { fontSize: fontSize.md, fontWeight: '500' },
  rowValue: { fontSize: fontSize.md },
  infoValue: { fontSize: fontSize.sm },
  menuSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  focusedMenuItem: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  menuItemText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  menuItemArrow: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  divider: { height: 1, marginHorizontal: spacing.lg },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xxl * 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  focusedLogoutButton: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '600' },
});
