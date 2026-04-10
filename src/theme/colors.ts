import React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import { usePreferences } from '@/providers/PreferencesProvider';

export const palette = {
  background: '#09090b',
  surface: '#18181b',
  surfaceAlt: '#111827',
  accent: '#0ea5e9',
  accentMuted: '#38bdf8',
  textPrimary: '#f4f4f5',
  textSecondary: '#a1a1aa',
  success: '#22c55e',
  danger: '#ef4444',
  lightBackground: '#f4f6fb',
  lightSurface: '#ffffff',
  lightMuted: '#f8faff',
  lightBorder: '#e4e7ee',
  lightShadow: 'rgba(15, 23, 42, 0.12)',
  mint: '#009689',
  mintMuted: '#d1f4ed',
  mintStrong: '#00786f',
  slate900: '#0f172a',
  slate700: '#334155',
  slate600: '#4b5563',
  slate500: '#64748b',
};

export type ThemeMode = 'Light' | 'Dark';

type StatusBarStyle = 'light-content' | 'dark-content';
type KeyboardAppearance = 'light' | 'dark';

export interface AppThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSubtle: string;
  border: string;
  borderStrong: string;
  shadow: string;
  overlay: string;
  glass: string;
  glassBorder: string;
  inputBackground: string;
  inputBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  iconPrimary: string;
  iconMuted: string;
  switchTrackOff: string;
  switchTrackOn: string;
  dangerSurface: string;
  dangerBorder: string;
  prioritySurface: string;
  priorityBorder: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActiveBackground: string;
  tabBarActiveBorder: string;
  drawerBackground: string;
}

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  statusBarStyle: StatusBarStyle;
  keyboardAppearance: KeyboardAppearance;
  colors: AppThemeColors;
  navigationTheme: NavigationTheme;
}

const buildThemeColors = (mode: ThemeMode): AppThemeColors => {
  if (mode === 'Dark') {
    return {
      background: palette.background,
      surface: '#111827',
      surfaceMuted: '#182132',
      surfaceSubtle: '#0f172a',
      border: 'rgba(148, 163, 184, 0.18)',
      borderStrong: 'rgba(148, 163, 184, 0.26)',
      shadow: 'rgba(2, 6, 23, 0.48)',
      overlay: 'rgba(2, 6, 23, 0.6)',
      glass: 'rgba(15, 23, 42, 0.72)',
      glassBorder: 'rgba(148, 163, 184, 0.2)',
      inputBackground: 'rgba(15, 23, 42, 0.72)',
      inputBorder: 'rgba(148, 163, 184, 0.18)',
      textPrimary: palette.textPrimary,
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      textInverse: palette.lightSurface,
      iconPrimary: palette.textPrimary,
      iconMuted: '#cbd5e1',
      switchTrackOff: 'rgba(148, 163, 184, 0.3)',
      switchTrackOn: 'rgba(0, 150, 137, 0.55)',
      dangerSurface: 'rgba(239, 68, 68, 0.16)',
      dangerBorder: 'rgba(239, 68, 68, 0.32)',
      prioritySurface: 'rgba(255, 100, 103, 0.14)',
      priorityBorder: 'rgba(255, 100, 103, 0.34)',
      tabBarBackground: 'rgba(15, 23, 42, 0.94)',
      tabBarBorder: 'rgba(148, 163, 184, 0.18)',
      tabBarActiveBackground: 'rgba(0, 150, 137, 0.24)',
      tabBarActiveBorder: 'rgba(0, 150, 137, 0.38)',
      drawerBackground: '#0f172a',
    };
  }

  return {
    background: palette.lightBackground,
    surface: palette.lightSurface,
    surfaceMuted: palette.lightMuted,
    surfaceSubtle: '#eef2f7',
    border: palette.lightBorder,
    borderStrong: 'rgba(148, 163, 184, 0.28)',
    shadow: palette.lightShadow,
    overlay: 'rgba(15, 23, 42, 0.2)',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.34)',
    inputBackground: palette.lightSurface,
    inputBorder: palette.lightBorder,
    textPrimary: palette.slate900,
    textSecondary: palette.slate600,
    textMuted: palette.slate500,
    textInverse: palette.lightSurface,
    iconPrimary: palette.slate900,
    iconMuted: palette.slate500,
    switchTrackOff: '#d4d4d8',
    switchTrackOn: '#99f6e4',
    dangerSurface: 'rgba(239, 68, 68, 0.08)',
    dangerBorder: 'rgba(239, 68, 68, 0.35)',
    prioritySurface: 'rgba(255, 100, 103, 0.08)',
    priorityBorder: 'rgba(255, 100, 103, 0.25)',
    tabBarBackground: 'rgba(255, 255, 255, 0.92)',
    tabBarBorder: 'rgba(148, 163, 184, 0.28)',
    tabBarActiveBackground: 'rgba(0, 150, 137, 0.18)',
    tabBarActiveBorder: 'rgba(0, 150, 137, 0.32)',
    drawerBackground: '#f8fafc',
  };
};

export const getAppTheme = (mode: ThemeMode): AppTheme => {
  const isDark = mode === 'Dark';
  const colors = buildThemeColors(mode);
  const baseTheme = isDark ? DarkTheme : DefaultTheme;

  return {
    mode,
    isDark,
    statusBarStyle: isDark ? 'light-content' : 'dark-content',
    keyboardAppearance: isDark ? 'dark' : 'light',
    colors,
    navigationTheme: {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        primary: palette.mint,
        notification: palette.mintStrong,
      },
    },
  };
};

export const useAppTheme = () => {
  const { themeMode } = usePreferences();

  return React.useMemo(() => getAppTheme(themeMode), [themeMode]);
};
