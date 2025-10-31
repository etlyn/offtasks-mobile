import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.lightSurface,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 16,
  },
  helper: {
    marginTop: 24,
    color: palette.slate600,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: palette.slate600,
    fontSize: 14,
  },
  profileCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    backgroundColor: palette.lightMuted,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  profileEmail: {
    marginTop: 16,
    fontSize: 13,
    color: palette.slate600,
  },
  section: {
    marginBottom: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightSurface,
    padding: 12,
    gap: 8,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  primaryRowPressed: {
    backgroundColor: palette.lightMuted,
  },
  primaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mintMuted,
    borderWidth: 1,
    borderColor: 'rgba(0, 118, 111, 0.2)',
  },
  primaryCopy: {
    flex: 1,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate900,
  },
  primaryCaption: {
    marginTop: 2,
    fontSize: 13,
    color: palette.slate600,
  },
  themeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.mintStrong,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  footer: {
    marginTop: 12,
    gap: 16,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.mint,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  logoutButtonPressed: {
    opacity: 0.9,
  },
  logoutLabel: {
    color: palette.lightSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  versionLabel: {
    fontSize: 13,
    color: palette.slate600,
  },
});
