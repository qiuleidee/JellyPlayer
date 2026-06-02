import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, THEME_COLORS, type ThemeColors } from './tokens';
import { useSettingsStore } from '../stores/settingsStore';

interface ThemeContextValue {
  colors: ThemeColors;
  primary: typeof THEME_COLORS.infuse;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkTheme,
  primary: THEME_COLORS.infuse,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { theme, themeColor } = useSettingsStore();

  const value = useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    return {
      colors: isDark ? darkTheme : lightTheme,
      primary: THEME_COLORS[themeColor],
      isDark,
    };
  }, [theme, themeColor, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
