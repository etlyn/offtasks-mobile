import { StyleSheet } from 'react-native';

import { palette, type AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    contentWithTopSpacing: {
      paddingTop: 16,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 32,
    },
    heroTitle: {
      color: theme.colors.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginTop: 16,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardTitle: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowSpacing: {
      marginTop: 16,
    },
    rowLabel: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      marginBottom: 4,
    },
    rowValue: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    primaryButton: {
      marginTop: 20,
      backgroundColor: theme.isDark
        ? 'rgba(0, 150, 137, 0.22)'
        : 'rgba(6, 182, 212, 0.15)',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.accent,
    },
    primaryButtonText: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    versionText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
    },
  });
