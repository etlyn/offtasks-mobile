import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 100,
    paddingBottom: 48,
    backgroundColor: palette.background,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: palette.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  secondaryButtonText: {
    color: palette.accentMuted,
    fontSize: 15,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkButtonText: {
    color: palette.textSecondary,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
