import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
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
    gap: 8,
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
  checkboxTouchArea: {
    padding: 4,
    borderRadius: 8,
  },
  checkboxPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
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
  contentArea: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  contentAreaPressed: {
    opacity: 0.7,
  },
  rowLabel: {
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dueBadge: {
    backgroundColor: 'rgba(71, 85, 105, 0.16)',
  },
  dueBadgeText: {
    color: '#334155',
  },
  dueBadgeOverdue: {
    backgroundColor: 'rgba(255, 100, 103, 0.16)',
  },
  dueBadgeTextOverdue: {
    color: '#d93434',
  },
  deleteActionContainer: {
    width: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
    paddingVertical: 6,
  },
  deleteAction: {
    width: 32,
    height: 32,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionPressed: {
    opacity: 0.85,
  },
});
