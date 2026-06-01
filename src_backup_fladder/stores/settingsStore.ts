import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  // 界面设置
  theme: 'system' | 'light' | 'dark';
  themeColor: 'infuse' | 'ocean' | 'forest' | 'royal' | 'sakura';
  language: string;
  homeLayout: string[]; // 首页板块顺序
  hiddenHomeModules: string[]; // 被隐藏的首页板块
  
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
  theme: 'light' as const,
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
      storage: createJSONStorage(() => localStorage),
    }
  )
);
