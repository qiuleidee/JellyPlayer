import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

interface SettingsState {
  // 界面设置
  theme: 'system' | 'light' | 'dark';
  themeColor: 'infuse' | 'ocean' | 'forest' | 'royal' | 'sakura';
  language: string;
  homeLayout: string[];
  hiddenHomeModules: string[];
  
  // 播放设置
  defaultMaxBitrate: number;
  hardwareDecoding: boolean;
  autoPlayNext: boolean;
  skipIntro: boolean;
  
  // 字幕设置
  subtitleSize: 'small' | 'normal' | 'large' | 'xlarge';
  subtitleColor: string;
  subtitleBackground: string;
  subtitleOffset: number;

  // Actions
  updateSettings: (settings: Partial<Omit<SettingsState, 'updateSettings' | 'resetSettings'>>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  theme: 'dark' as const, // 安卓版默认深色主题
  themeColor: 'infuse' as const,
  language: 'zh-CN',
  homeLayout: ['views', 'resume', 'suggestions', 'nextup', 'latest'],
  hiddenHomeModules: [],
  defaultMaxBitrate: 140000000,
  hardwareDecoding: true,
  autoPlayNext: true,
  skipIntro: false,
  subtitleSize: 'normal' as const,
  subtitleColor: '#FFFFFF',
  subtitleBackground: 'rgba(0, 0, 0, 0.5)',
  subtitleOffset: 0,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'jellyplayer-settings',
      storage: zustandStorage,
    }
  )
);
