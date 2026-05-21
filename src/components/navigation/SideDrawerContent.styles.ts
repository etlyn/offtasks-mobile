import { StyleSheet } from 'react-native';

import { type AppTheme } from '@/theme/colors';

export const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.drawerBackground,
    paddingHorizontal: 20,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  heroCard: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 0.628,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glass,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    elevation: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? '#134e4a' : '#d1fae5',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(110, 231, 183, 0.24)' : 'rgba(15, 118, 110, 0.18)',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 5,
  },
  avatarText: {
    color: theme.isDark ? theme.colors.textInverse : '#115e59',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  profileEmail: {
    marginTop: 2,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  profileMetaNote: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.66)' : 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  closeButtonPressed: {
    opacity: 0.88,
  },
  menuCard: {
    borderRadius: 24,
    borderWidth: 0.628,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glass,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 7,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 17,
    paddingHorizontal: 16,
    borderBottomWidth: 0.628,
    borderBottomColor: theme.colors.border,
  },
  menuTextBlock: {
    flex: 1,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuRowPressed: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.628,
  },
  statisticsIcon: {
    backgroundColor: theme.isDark ? 'rgba(96, 165, 250, 0.16)' : '#eff6ff',
    borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.3)' : '#bfdbfe',
  },
  themeIcon: {
    backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.16)' : '#fef3c6',
    borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.32)' : '#fee685',
  },
  hideIcon: {
    backgroundColor: theme.isDark ? 'rgba(56, 189, 248, 0.14)' : '#dff2fe',
    borderColor: theme.isDark ? 'rgba(56, 189, 248, 0.3)' : '#b8e6fe',
  },
  advancedIcon: {
    backgroundColor: theme.isDark ? 'rgba(20, 184, 166, 0.16)' : '#cbfbf1',
    borderColor: theme.isDark ? 'rgba(45, 212, 191, 0.3)' : '#96f7e4',
  },
  autoIcon: {
    backgroundColor: theme.isDark ? 'rgba(14, 165, 233, 0.16)' : '#e0f2fe',
    borderColor: theme.isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd',
  },
  versionIcon: {
    backgroundColor: theme.isDark ? 'rgba(148, 163, 184, 0.16)' : '#f1f5f9',
    borderColor: theme.isDark ? 'rgba(148, 163, 184, 0.28)' : '#d7e0ea',
  },
  menuLabel: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  menuValue: {
    marginTop: 3,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  glassToggle: {
    width: 52,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.26)',
    backgroundColor: theme.isDark
      ? 'rgba(15, 23, 42, 0.5)'
      : 'rgba(255, 255, 255, 0.82)',
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  glassToggleActive: {
    borderColor: theme.isDark
      ? 'rgba(110, 231, 183, 0.24)'
      : 'rgba(16, 185, 129, 0.2)',
  },
  glassTogglePressed: {
    opacity: 0.84,
  },
  glassToggleTrackFill: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 3,
    bottom: 3,
    borderRadius: 999,
    backgroundColor: theme.isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(15, 23, 42, 0.06)',
  },
  glassToggleTrackFillActive: {
    backgroundColor: theme.isDark
      ? 'rgba(16, 185, 129, 0.34)'
      : 'rgba(16, 185, 129, 0.24)',
  },
  glassToggleThumb: {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: theme.isDark
      ? 'rgba(248, 250, 252, 0.94)'
      : '#ffffff',
    borderWidth: 1,
    borderColor: theme.isDark
      ? 'rgba(255,255,255,0.18)'
      : 'rgba(226,232,240,0.95)',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  glassToggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  menuActionSlot: {
    width: 52,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuChevron: {
    marginLeft: 2,
  },
  menuActionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    minWidth: 40,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 12,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderWidth: 0.628,
    borderColor: 'transparent',
    paddingVertical: 11,
    paddingHorizontal: 18,
    minWidth: 172,
    maxWidth: 220,
    shadowOpacity: 0,
    elevation: 0,
  },
  deleteAccountButtonPressed: {
    backgroundColor: theme.colors.dangerSurface,
    opacity: 0.88,
  },
  deleteAccountIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  deleteAccountLabel: {
    color: theme.isDark ? '#f87171' : '#b91c1c',
    fontSize: 15,
    fontWeight: '600',
  },
  footerButtonDisabled: {
    opacity: 0.62,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.glass,
    borderRadius: 18,
    borderWidth: 0.628,
    borderColor: theme.colors.dangerBorder,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 172,
    maxWidth: 220,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 4,
  },
  logoutButtonPressed: {
    opacity: 0.9,
  },
  logoutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.dangerSurface,
  },
  logoutLabel: {
    color: '#e11d24',
    fontSize: 15,
    fontWeight: '600',
  },
}) as Record<string, any>;
