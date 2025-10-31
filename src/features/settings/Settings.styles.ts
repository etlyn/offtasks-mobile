import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    color: palette.textPrimary,
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
    color: palette.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  rowValue: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.accent,
  },
  primaryButtonText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  versionText: {
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
