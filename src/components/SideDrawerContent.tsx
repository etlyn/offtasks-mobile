import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoWordmark } from '@/components/branding/LogoWordmark';
import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { palette } from '@/theme/colors';


export const SideDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation } = props;
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const [hideCompleted, setHideCompleted] = React.useState(false);
  const [advancedMode, setAdvancedMode] = React.useState(false);
  const [themeMode, setThemeMode] = React.useState<'Light' | 'Dark'>('Light');


  const handleNavigate = React.useCallback(
    (routeName: string) => {
      navigation.navigate(routeName as never);
      navigation.closeDrawer();
    },
    [navigation]
  );

  const handleComingSoon = React.useCallback((feature: string) => {
    Alert.alert(feature, 'This area is being crafted next. Stay tuned!');
  }, []);

  const handleToggleTheme = React.useCallback(() => {
    setThemeMode((prev) => (prev === 'Light' ? 'Dark' : 'Light'));
    handleComingSoon('Theme switching');
  }, [handleComingSoon]);

  const handleSignOut = React.useCallback(async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert('Sign out failed', (error as Error).message);
      return;
    }
    navigation.closeDrawer();
  }, [navigation]);


  const email = session?.user?.email ?? 'Offline';
  const userLabel = email.split('@')[0] || 'User';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <View style={styles.header}>
        <LogoWordmark width={156} height={40} />
        <Text style={styles.helper}>Menu</Text>
        <Text style={styles.subtitle}>Access profile, search, filters, and settings</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{userLabel}</Text>
          </View>
        </View>
        <Text style={styles.profileEmail}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.primaryRow, pressed && styles.primaryRowPressed]}
          onPress={() => handleComingSoon('Search & Filter')}
        >
          <View style={styles.primaryIcon}>
            <Feather name="search" size={18} color={palette.mint} />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryLabel}>Search &amp; Filter</Text>
            <Text style={styles.primaryCaption}>Slice tasks with keywords and chips</Text>
          </View>
          <Feather name="chevron-right" size={18} color={palette.slate600} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.primaryRow, pressed && styles.primaryRowPressed]}
          onPress={() => handleComingSoon('Analytics')}
        >
          <View style={styles.primaryIcon}>
            <Feather name="pie-chart" size={18} color={palette.mint} />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryLabel}>Analytics</Text>
            <Text style={styles.primaryCaption}>See trends across focus areas</Text>
          </View>
          <Feather name="chevron-right" size={18} color={palette.slate600} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.primaryRow, pressed && styles.primaryRowPressed]}
          onPress={() => handleNavigate('Completed')}
        >
          <View style={styles.primaryIcon}>
            <Feather name="check-circle" size={18} color={palette.mint} />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryLabel}>Completed Tasks</Text>
            <Text style={styles.primaryCaption}>Review what you shipped recently</Text>
          </View>
          <Feather name="chevron-right" size={18} color={palette.slate600} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.primaryRow, pressed && styles.primaryRowPressed]}
          onPress={handleToggleTheme}
        >
          <View style={styles.primaryIcon}>
            <Feather name={themeMode === 'Light' ? 'sun' : 'moon'} size={18} color={palette.mint} />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryLabel}>Theme</Text>
            <Text style={styles.primaryCaption}>Switch between light and dark</Text>
          </View>
          <Text style={styles.themeValue}>{themeMode}</Text>
        </Pressable>

        <View style={styles.toggleRow}>
          <View style={styles.primaryIcon}>
            <Feather name="eye-off" size={18} color={palette.mint} />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryLabel}>Hide Completed Tasks</Text>
            <Text style={styles.primaryCaption}>Only show what still needs energy</Text>
          </View>
          <Switch
            value={hideCompleted}
            onValueChange={(value: boolean) => {
              setHideCompleted(value);
              handleComingSoon('Hide completed tasks');
            }}
            thumbColor={hideCompleted ? palette.mint : '#f1f5f9'}
            trackColor={{ false: '#cbd5f5', true: palette.mintMuted }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.primaryIcon}>
            <Feather name="cpu" size={18} color={palette.mint} />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryLabel}>Advanced Mode</Text>
            <Text style={styles.primaryCaption}>Unlock power workflows</Text>
          </View>
          <Switch
            value={advancedMode}
            onValueChange={(value: boolean) => {
              setAdvancedMode(value);
              handleComingSoon('Advanced mode');
            }}
            thumbColor={advancedMode ? palette.mint : '#f1f5f9'}
            trackColor={{ false: '#cbd5f5', true: palette.mintMuted }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={18} color={palette.lightSurface} />
          <Text style={styles.logoutLabel}>Log Out</Text>
        </Pressable>
        <Text style={styles.versionLabel}>offtasks mobile v1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.lightSurface,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 16,
  },
  helper: {
    marginTop: 24,
    color: palette.slate600,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: palette.slate600,
    fontSize: 14,
  },
  profileCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    backgroundColor: palette.lightMuted,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  profileStats: {
    marginTop: 4,
    fontSize: 13,
    color: palette.slate600,
  },
  profileEmail: {
    marginTop: 16,
    fontSize: 13,
    color: palette.slate600,
  },
  quickViewSection: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    marginBottom: 28,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 12,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate900,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: palette.slate600,
  },
  sectionAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mintMuted,
  },
  sectionActionPressed: {
    opacity: 0.85,
  },
  quickTaskList: {
    gap: 12,
  },
  quickTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickTaskIndicator: {
    width: 24,
    alignItems: 'center',
  },
  quickTaskLabel: {
    flex: 1,
    fontSize: 14,
    color: palette.slate900,
  },
  emptyQuickView: {
    fontSize: 14,
    color: palette.slate600,
  },
  section: {
    marginBottom: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightSurface,
    padding: 12,
    gap: 8,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  primaryRowPressed: {
    backgroundColor: palette.lightMuted,
  },
  primaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mintMuted,
    borderWidth: 1,
    borderColor: 'rgba(0, 118, 111, 0.2)',
  },
  primaryCopy: {
    flex: 1,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate900,
  },
  primaryCaption: {
    marginTop: 2,
    fontSize: 13,
    color: palette.slate600,
  },
  themeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.mintStrong,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  footer: {
    marginTop: 12,
    gap: 16,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.mint,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  logoutButtonPressed: {
    opacity: 0.9,
  },
  logoutLabel: {
    color: palette.lightSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  versionLabel: {
    fontSize: 13,
    color: palette.slate600,
  },
});
