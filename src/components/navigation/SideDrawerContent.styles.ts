import { StyleSheet } from 'react-native';
import { type AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) => {
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const divider = theme.isDark
    ? 'rgba(255,255,255,0.09)'
    : 'rgba(21,45,37,0.08)';
  return StyleSheet.create({
    shell: { flex: 1, backgroundColor: theme.colors.background },
    backdrop: { ...StyleSheet.absoluteFillObject, opacity: 0.65 },
    header: {
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 8,
    },
    wordmark: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.7,
      color: theme.colors.textPrimary,
    },
    brandDot: { color: '#009689' },
    closeTarget: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -4,
    },
    closeSurface: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.16)'
        : 'rgba(21,45,37,0.10)',
    },
    content: { flexGrow: 1 },
    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 64,
      paddingVertical: 8,
      marginBottom: 20,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: theme.isDark
        ? 'rgba(216,243,229,0.10)'
        : 'rgba(21,45,37,0.07)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 15, fontWeight: '600', color: brand },
    profileMeta: { flex: 1 },
    profileName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    profileDetail: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    statisticsTarget: { marginBottom: 30 },
    statisticsSurface: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.16)'
        : 'rgba(21,45,37,0.12)',
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
    preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowIcon: { width: 20, alignItems: 'center', justifyContent: 'center' },
    rowBody: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 58,
      paddingVertical: 7,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: divider,
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
      minWidth: 51,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: { marginTop: 'auto', paddingTop: 32 },
    signIn: {
      minHeight: 44,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: brand,
    },
    signInLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.isDark ? '#101916' : '#FFFFFF',
    },
    accountActions: { gap: 2 },
    accountAction: {
      minHeight: 44,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    deleteLabel: { fontSize: 13, fontWeight: '500' },
    version: {
      fontSize: 11,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: 18,
    },
  });
};
