import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// 将 React Native 的 AsyncStorage 适配为 Zustand 可用的同步式存储接口
const asyncStorageAdapter: StateStorage = {
  getItem: async (name: string) => {
    return (await AsyncStorage.getItem(name)) ?? null;
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};

export const zustandStorage = createJSONStorage(() => asyncStorageAdapter);
