import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../stores/authStore';
import { fontSize, spacing } from '../theme/tokens';

// 导入页面
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DetailScreen from '../screens/DetailScreen';
import PlayerScreen from '../screens/PlayerScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import HistoryScreen from '../screens/HistoryScreen';

// 导航类型定义
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Detail: { itemId: string; itemType?: string };
  Player: { itemId: string; mediaSourceId?: string; startPositionTicks?: number };
  Favorites: undefined;
  History: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Movies: undefined;
  Shows: undefined;
  Search: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 简易图标组件（后续可替换为 vector-icons）
function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    '首页': '🏠',
    '电影': '🎬',
    '搜索': '🔍',
    '剧集': '📺',
    '设置': '⚙️',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.5 }]}>{icons[label] || '•'}</Text>
    </View>
  );
}

function MainTabs() {
  const { colors, primary } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.isTV ? 80 : 60,
          paddingBottom: Platform.isTV ? 8 : 4,
        },
        tabBarActiveTintColor: primary.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: Platform.isTV ? fontSize.sm : fontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ focused, color }) => <TabIcon label="首页" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Movies"
        component={LibraryScreen}
        initialParams={{ type: 'movies' } as any}
        options={{
          tabBarLabel: '电影',
          tabBarIcon: ({ focused, color }) => <TabIcon label="电影" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: '搜索',
          tabBarIcon: ({ focused, color }) => <TabIcon label="搜索" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Shows"
        component={LibraryScreen}
        initialParams={{ type: 'shows' } as any}
        options={{
          tabBarLabel: '剧集',
          tabBarIcon: ({ focused, color }) => <TabIcon label="剧集" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ focused, color }) => <TabIcon label="设置" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#E8784A',
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: '#E84A4A',
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' as const },
          medium: { fontFamily: 'System', fontWeight: '500' as const },
          bold: { fontFamily: 'System', fontWeight: '700' as const },
          heavy: { fontFamily: 'System', fontWeight: '900' as const },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Player"
              component={PlayerScreen}
              options={{
                animation: 'fade',
                orientation: 'landscape',
              }}
            />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: Platform.isTV ? 28 : 22,
  },
});
