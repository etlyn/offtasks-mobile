import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: palette.lightMuted,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.slate900,
    letterSpacing: -0.2,
  },
  summary: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate600,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: 24,
    fontSize: 15,
    color: palette.slate600,
    fontWeight: '500',
    lineHeight: 22,
  },
});
