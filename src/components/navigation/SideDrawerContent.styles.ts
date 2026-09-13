import { StyleSheet } from 'react-native';
import { type AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) => {
  const divider = theme.isDark
    ? 'rgba(255,255,255,0.09)'
    : 'rgba(21,45,37,0.08)';
  return StyleSheet.create({
    shell: { flex: 1, backgroundColor: theme.colors.background },
    backdrop: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
    header: {
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 8,
    },
    closeTarget: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -4,
    },
    content: { flexGrow: 1 },
    controlsSurface: {},
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: divider,
      marginLeft: 32,
    },
    statisticsTarget: { minHeight: 48 },
    accountSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: divider,
      paddingTop: 14,
    },
    appearanceControl: { width: 88, height: 44, flexDirection: 'row' },
    appearanceSurface: {
      position: 'absolute',
      top: 6,
      left: 0,
      width: 88,
      height: 32,
      borderRadius: 16,
      borderColor: divider,
    },
    themeTarget: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeSelected: {
      position: 'absolute',
      top: 8,
      left: 2,
      width: 40,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.isDark
        ? 'rgba(216,243,229,0.13)'
        : 'rgba(21,45,37,0.085)',
    },
    statisticsSurface: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 48,
      paddingVertical: 10,
    },
    statisticsLabel: { flex: 1 },
    progress: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textMuted,
      marginBottom: 6,
    },
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 2,
    },
    rowIcon: { width: 20, alignItems: 'center', justifyContent: 'center' },
    rowBody: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 52,
      paddingVertical: 7,
    },
    rowText: { flex: 1 },
    rowLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    rowDetail: {
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
      color: theme.colors.textSecondary,
    },
    switchTarget: {
      width: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: { marginTop: 'auto', paddingTop: 32 },
    accountChevron: { marginLeft: 'auto' },
    accountActions: { gap: 2 },
    accountAction: {
      minHeight: 44,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    deleteLabel: { fontSize: 13, fontWeight: '500' },
    version: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 18,
      textAlign: 'left',
      marginLeft: 32,
    },
  });
};
