// JellyPlayer 安卓版设计令牌 — 与网页版视觉风格高度一致
import { Platform } from 'react-native';

const isTV = Platform.isTV;

// 主题色板
export const THEME_COLORS = {
  infuse: {
    primary: '#E8784A',
    primaryLight: '#F09B76',
    primaryDark: '#C45A2E',
    gradient: ['#E8784A', '#D45B2F'],
  },
  ocean: {
    primary: '#4A90E8',
    primaryLight: '#76B0F0',
    primaryDark: '#2E6EC4',
    gradient: ['#4A90E8', '#2F5BD4'],
  },
  forest: {
    primary: '#4AE87C',
    primaryLight: '#76F09B',
    primaryDark: '#2EC45A',
    gradient: ['#4AE87C', '#2FD45B'],
  },
  royal: {
    primary: '#8A4AE8',
    primaryLight: '#A876F0',
    primaryDark: '#6E2EC4',
    gradient: ['#8A4AE8', '#5B2FD4'],
  },
  sakura: {
    primary: '#E84A8A',
    primaryLight: '#F076A8',
    primaryDark: '#C42E6E',
    gradient: ['#E84A8A', '#D42F5B'],
  },
} as const;

// 深色主题
export const darkTheme = {
  background: '#080810',
  surface: '#12121A',
  surfaceElevated: '#1A1A28',
  surfaceCard: '#16161F',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',

  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  textInverse: '#080810',

  success: '#4AE87C',
  warning: '#E8C84A',
  error: '#E84A4A',
  info: '#4A90E8',

  // 播放器
  playerBackground: '#000000',
  playerOverlay: 'rgba(0, 0, 0, 0.6)',
  playerProgress: '#E8784A',
  playerBuffer: 'rgba(255, 255, 255, 0.3)',
};

// 浅色主题
export const lightTheme = {
  background: '#F5F5F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.04)',

  text: '#1A1A2E',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
  textTertiary: 'rgba(0, 0, 0, 0.35)',
  textInverse: '#FFFFFF',

  success: '#2EC45A',
  warning: '#C4A02E',
  error: '#C42E2E',
  info: '#2E6EC4',

  playerBackground: '#000000',
  playerOverlay: 'rgba(0, 0, 0, 0.6)',
  playerProgress: '#E8784A',
  playerBuffer: 'rgba(255, 255, 255, 0.3)',
};

// 通用间距 — TV 版使用更大的间距以适应遥控器和远距离观看
export const spacing = {
  xs: isTV ? 6 : 4,
  sm: isTV ? 10 : 8,
  md: isTV ? 18 : 12,
  lg: isTV ? 24 : 16,
  xl: isTV ? 32 : 24,
  xxl: isTV ? 48 : 32,
};

// 字体大小 — TV 版使用更大的字体
export const fontSize = {
  xs: isTV ? 16 : 11,
  sm: isTV ? 18 : 13,
  md: isTV ? 20 : 15,
  lg: isTV ? 24 : 18,
  xl: isTV ? 30 : 22,
  xxl: isTV ? 38 : 28,
  hero: isTV ? 48 : 34,
};

// 圆角
export const borderRadius = {
  sm: isTV ? 8 : 6,
  md: isTV ? 14 : 10,
  lg: isTV ? 20 : 16,
  xl: isTV ? 28 : 20,
  full: 9999,
};

// 卡片尺寸
export const cardSize = {
  poster: {
    width: isTV ? 200 : 130,
    height: isTV ? 300 : 195,
  },
  backdrop: {
    width: isTV ? 360 : 240,
    height: isTV ? 200 : 135,
  },
};

// 焦点样式 — 仅 TV 版使用
export const focusStyle = {
  scale: 1.08,
  borderWidth: 3,
  borderColor: '#E8784A',
  shadowColor: '#E8784A',
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 8,
};

export type ThemeColors = typeof darkTheme;
