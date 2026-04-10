import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.glass,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 32,
      elevation: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    centerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summary: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      letterSpacing: -0.1,
      color: theme.colors.textPrimary,
    },
    summaryValue: {
      color: theme.colors.textPrimary,
    },
    summaryMuted: {
      color: theme.colors.textMuted,
    },
    caption: {
      marginTop: 1,
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 16,
      elevation: 8,
    },
    iconButtonPressed: {
      opacity: 0.84,
    },
    iconButtonDisabled: {
      opacity: 0.4,
    },
    iconButtonPlaceholder: {
      width: 36,
      height: 36,
    },
  });
