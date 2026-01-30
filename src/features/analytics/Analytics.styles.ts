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
    gap: 20,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.lightSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.slate600,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  section: {
    backgroundColor: palette.lightSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.lightBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    color: palette.slate600,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
});
