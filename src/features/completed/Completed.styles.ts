import { StyleSheet } from 'react-native';
import { type AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: {
      flex: 1,
      borderRadius: 18,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark
        ? 'rgba(216,243,229,0.14)'
        : 'rgba(21,45,37,0.10)',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.035)'
        : 'rgba(255,255,255,0.60)',
    },
    metricLabel: { fontSize: 11, color: theme.colors.textSecondary },
    summaryValue: {
      marginTop: 8,
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    tabs: { flexDirection: 'row', gap: 8 },
    tab: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: { backgroundColor: theme.isDark ? '#D8F3E5' : '#152D25' },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    tabTextActive: { color: theme.isDark ? '#101916' : '#FFFFFF' },
    resultLabel: { fontSize: 13, color: theme.colors.textSecondary },
  });
