import { StyleSheet } from 'react-native';
import { type AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
    tabs: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    listCount: {
      marginLeft: 'auto',
      fontSize: 12,
      color: theme.colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    tab: {
      minHeight: 44,
      justifyContent: 'center',
    },
    tabSurface: {
      minHeight: 30,
      paddingHorizontal: 12,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: { backgroundColor: theme.isDark ? '#D8F3E5' : '#152D25' },
    tabText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    tabTextActive: { color: theme.isDark ? '#101916' : '#FFFFFF' },
    resultLabel: { fontSize: 13, color: theme.colors.textSecondary },
  });
