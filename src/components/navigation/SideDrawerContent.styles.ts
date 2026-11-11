import { StyleSheet } from 'react-native';
import { type AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) => {
  const soft = theme.isDark ? 'rgba(216,243,229,0.06)' : 'rgba(21,45,37,0.04)';
  const divider = theme.isDark ? 'rgba(216,243,229,0.1)' : 'rgba(21,45,37,0.1)';
  return StyleSheet.create({
    shell: {
      flex: 1,
      backgroundColor: theme.isDark ? '#101916' : theme.colors.surface,
    },
    header: {
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    identityName: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    identityDetail: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    closeTarget: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 36 },
    controlsSurface: { marginRight: 32, gap: 4 },
    utilityRow: {
      minHeight: 52,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    preferenceRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    rowText: { flex: 1 },
    rowLabel: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    rowDetail: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textSecondary,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: divider,
    },
    switchTarget: {
      width: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactSwitch: { width: 51, height: 31, transform: [{ scale: 0.78 }] },
    appearanceControl: { width: 88, height: 44, flexDirection: 'row' },
    appearanceSurface: {
      position: 'absolute',
      top: 6,
      left: 0,
      width: 88,
      height: 32,
      borderRadius: 16,
      backgroundColor: soft,
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
        : 'rgba(255,255,255,0.65)',
    },
    noticeSpace: { minHeight: 374 },
    feedback: { gap: 8 },
    cleanupRetry: {
      width: 280,
      maxWidth: '100%',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cleanupRetryLabel: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    footer: { marginTop: 'auto', paddingTop: 32 },
    accountSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: divider,
      paddingTop: 12,
    },
    accountAction: { minHeight: 44 },
    versionTarget: { minHeight: 44, paddingVertical: 14, alignItems: 'center' },
    version: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });
};
