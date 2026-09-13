import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme, calendar = false) =>
  StyleSheet.create({
    planList: {
      // The Calendar layout has 24-point padding; task rows use 16-point gutters.
      marginHorizontal: -8,
    },
    centeredCard: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 180,
      paddingHorizontal: 32,
    },
    emptyIconShell: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyTitleText: {
      textAlign: 'center',
      fontSize: 15,
      color: theme.colors.textPrimary,
      fontWeight: '600',
      lineHeight: 21,
    },
    emptyState: {
      marginTop: 4,
      textAlign: 'center',
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      lineHeight: 21,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: calendar ? 0 : 4,
      gap: calendar ? 4 : 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: calendar
        ? theme.isDark
          ? 'rgba(255,255,255,0.10)'
          : 'rgba(21,45,37,0.10)'
        : theme.colors.border,
    },
    rowPriority: {
      backgroundColor: theme.colors.prioritySurface,
      borderRadius: 16,
      marginHorizontal: -4,
      paddingHorizontal: 8,
      borderBottomColor: theme.colors.priorityBorder,
    },
    lastRow: {
      borderBottomWidth: 0,
      paddingBottom: 4,
    },
    rowPressed: {
      opacity: 0.88,
    },
    checkboxTouchArea: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      borderRadius: 8,
    },
    checkboxPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.95 }],
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: theme.isDark ? '#78988A' : '#7E988B',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: calendar ? 'transparent' : theme.colors.inputBackground,
      shadowColor: theme.colors.shadow,
      shadowOpacity: calendar ? 0 : 1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    checkboxPriority: {
      borderColor: theme.colors.priorityBorder,
      backgroundColor: theme.colors.prioritySurface,
      shadowColor: theme.colors.priorityBorder,
    },
    checkboxDone: {
      backgroundColor: theme.isDark ? '#D8F3E5' : '#152D25',
      borderColor: theme.isDark ? '#D8F3E5' : '#152D25',
      shadowOpacity: 0,
    },
    contentArea: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    contentAreaPressed: {
      opacity: 0.7,
    },
    rowLabel: {
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.textPrimary,
      fontWeight: '400',
    },
    rowLabelPriority: {
      color: '#ff6467',
    },
    rowLabelDone: {
      color: theme.colors.textMuted,
      textDecorationLine: 'line-through',
    },
    rowMeta: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textSecondary,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: theme.colors.surfaceMuted,
    },
    categoryBadgeDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      marginRight: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    priorityIndicatorWrap: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      width: 14,
      height: 14,
      marginLeft: 8,
      marginTop: 4,
    },
    deleteActionContainer: {
      width: 72,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingRight: 6,
      paddingVertical: 6,
    },
    deleteAction: {
      width: 32,
      height: 32,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteActionPressed: {
      opacity: 0.85,
    },
  });
