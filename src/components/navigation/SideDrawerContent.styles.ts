import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#115e59',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: {
    color: palette.lightSurface,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#18181b',
  },
  profileStats: {
    marginTop: 2,
    fontSize: 12,
    color: '#71717b',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  closeButtonPressed: {
    backgroundColor: '#f4f4f5',
  },
  closeIcon: {
    width: 36,
    height: 36,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 0.628,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 32,
    elevation: 6,
    marginBottom: 32,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.628,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.628,
  },
  searchIcon: {
    backgroundColor: '#dbeafe',
    borderColor: '#bedbff',
  },
  analyticsIcon: {
    backgroundColor: '#f3e8ff',
    borderColor: '#e9d4ff',
  },
  completedIcon: {
    backgroundColor: '#dcfce7',
    borderColor: '#b9f8cf',
  },
  themeIcon: {
    backgroundColor: '#fef3c6',
    borderColor: '#fee685',
  },
  hideIcon: {
    backgroundColor: '#dff2fe',
    borderColor: '#b8e6fe',
  },
  advancedIcon: {
    backgroundColor: '#cbfbf1',
    borderColor: '#96f7e4',
  },
  autoIcon: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#18181b',
    fontWeight: '400',
  },
  menuValue: {
    fontSize: 13,
    color: '#71717b',
  },
  footer: {
    marginTop: 'auto',
    gap: 14,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 0.628,
    borderColor: '#ffc9c9',
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutIcon: {
    width: 20,
    height: 20,
  },
  logoutLabel: {
    color: '#e11d24',
    fontSize: 15,
    fontWeight: '600',
  },
  versionLabel: {
    fontSize: 11,
    color: '#9f9fa9',
  },
}) as Record<string, any>;
