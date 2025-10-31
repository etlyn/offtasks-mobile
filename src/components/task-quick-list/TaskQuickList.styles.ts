import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: palette.lightShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 18,
  },
  centeredCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: 32,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 15,
    color: palette.slate600,
    fontWeight: '500',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e7e8ef',
  },
  rowPriority: {
    backgroundColor: 'rgba(255, 100, 103, 0.08)',
    borderRadius: 16,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderBottomColor: 'rgba(255, 100, 103, 0.25)',
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  rowPressed: {
    opacity: 0.88,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 212, 216, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  checkboxPriority: {
    borderColor: 'rgba(255, 100, 103, 0.7)',
    backgroundColor: 'rgba(255, 214, 214, 0.4)',
    shadowColor: 'rgba(255, 100, 103, 0.3)',
  },
  checkboxDone: {
    backgroundColor: palette.mint,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(0, 118, 111, 0.28)',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: palette.slate900,
    fontWeight: '600',
  },
  rowLabelPriority: {
    color: '#ff6467',
  },
  rowLabelDone: {
    color: '#9f9fa9',
    textDecorationLine: 'line-through',
  },
});
