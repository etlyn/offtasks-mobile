import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 28,
    marginTop: 8,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});
