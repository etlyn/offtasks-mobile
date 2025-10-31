import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.lightBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  iconButtonPressed: {
    opacity: 0.85,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  subtitle: {
    fontSize: 14,
    color: palette.slate600,
    marginBottom: 8,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: palette.lightSurface,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
    gap: 14,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 150, 137, 0.1)',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate600,
    textDecorationLine: 'line-through',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 12,
    color: palette.slate600,
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: palette.lightSurface,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  emptyStateLabel: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slate600,
    textAlign: 'center',
  },
});
