import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, fontSize, borderRadius } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../constants/api';
import type { AuthResponse } from '../types/api';

export default function LoginScreen() {
  const { colors, primary } = useTheme();
  const { addServer, setActiveServer, login, servers } = useAuthStore();

  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'server' | 'login'>('server');
  const [loading, setLoading] = useState(false);
  const [serverName, setServerName] = useState('');

  // 步骤 1: 连接服务器
  const connectServer = useCallback(async () => {
    if (!serverUrl.trim()) return;
    setLoading(true);
    try {
      let url = serverUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      url = url.replace(/\/+$/, '');

      const { data } = await apiClient.get(API_ENDPOINTS.SYSTEM_INFO_PUBLIC, {
        baseURL: url,
      });

      addServer({ name: data.ServerName || url, url });
      setServerName(data.ServerName || '');
      setStep('login');
    } catch (e: any) {
      Alert.alert('连接失败', `无法连接到服务器: ${e.message || '请检查地址是否正确'}`);
    } finally {
      setLoading(false);
    }
  }, [serverUrl, addServer]);

  // 步骤 2: 用户登录
  const doLogin = useCallback(async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTHENTICATE, {
        Username: username.trim(),
        Pw: password,
      });
      login({
        userId: data.User.Id,
        accessToken: data.AccessToken,
        userName: data.User.Name,
        isAdmin: data.User.Policy?.IsAdministrator ?? false,
        serverId: data.ServerId,
      });
    } catch (e: any) {
      Alert.alert('登录失败', e.message || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  }, [username, password, login]);

  return (
    <LinearGradient
      colors={['#080810', '#12121A', '#1A1028']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo 区域 */}
          <View style={styles.logoSection}>
            <Text style={[styles.logoText, { color: primary.primary }]}>🎬</Text>
            <Text style={[styles.appName, { color: colors.text }]}>JellyPlayer</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 'server' ? '连接您的 Jellyfin 服务器' : `登录到 ${serverName || '服务器'}`}
            </Text>
          </View>

          {/* 表单区域 */}
          <View style={[styles.formCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {step === 'server' ? (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>服务器地址</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="例如: 192.168.1.100:8096"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={connectServer}
                />
                <TouchableOpacity
                  style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
                  onPress={connectServer}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={primary.gradient as unknown as string[]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.buttonText}>连接服务器</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>用户名</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="请输入用户名"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.md }]}>密码</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="请输入密码（可选）"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  returnKeyType="go"
                  onSubmitEditing={doLogin}
                />

                <TouchableOpacity
                  style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
                  onPress={doLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={primary.gradient as unknown as string[]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.buttonText}>登 录</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep('server')}
                  style={styles.backButton}
                >
                  <Text style={[styles.backText, { color: colors.textSecondary }]}>← 更换服务器</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoText: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  formCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    height: 50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
  },
  button: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  backButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  backText: {
    fontSize: fontSize.md,
  },
});
