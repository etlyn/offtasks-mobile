import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  newTaskContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingRight: 56,
    borderRadius: 20,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    fontSize: 15,
    fontWeight: '500',
  },
  addButtonInline: {
    position: 'absolute',
    right: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  addButtonDisabled: {
    opacity: 0.3,
  },
  list: {
    marginTop: 4,
  },
  emptyState: {
    color: palette.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
