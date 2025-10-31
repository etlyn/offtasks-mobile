import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(9, 9, 11, 0.35)',
  },
  containerPriority: {
    backgroundColor: 'rgba(255, 100, 103, 0.08)',
    borderColor: 'rgba(255, 100, 103, 0.25)',
  },
  disabled: {
    opacity: 0.6,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 212, 216, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 14,
    shadowColor: 'rgba(255, 255, 255, 0.4)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  checkPressed: {
    transform: [{ scale: 0.96 }],
  },
  checkPriority: {
    borderColor: 'rgba(255, 100, 103, 0.7)',
    backgroundColor: 'rgba(255, 214, 214, 0.25)',
    shadowColor: 'rgba(255, 100, 103, 0.3)',
  },
  checkActive: {
    backgroundColor: palette.mint,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(0, 118, 111, 0.28)',
  },
  content: {
    flex: 1,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9f9fa9',
  },
  titleOverdue: {
    color: '#ff6467',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(244, 244, 245, 0.6)',
    fontWeight: '500',
  },
  metaDone: {
    color: '#9f9fa9',
  },
  delete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1f1f24',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteText: {
    color: 'rgba(244, 244, 245, 0.65)',
    fontSize: 20,
    lineHeight: 20,
  },
});
