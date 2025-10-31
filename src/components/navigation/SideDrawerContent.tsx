import React from 'react';
import {
  Alert,
  Pressable,
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

import { styles } from './SideDrawerContent.styles';

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
