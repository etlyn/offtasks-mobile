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

import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import { palette } from '@/theme/colors';

import { styles } from './SideDrawerContent.styles';

const appVersion = require('../../../package.json')?.version ?? '0.0.0';

export const SideDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation } = props;
  const { session } = useAuth();
  const { totals } = useTasks();
  const {
    hideCompleted,
    advancedMode,
    themeMode,
    setHideCompleted,
    setAdvancedMode,
    autoArrange,
    setAutoArrange,
    toggleTheme,
  } = usePreferences();
  const insets = useSafeAreaInsets();

  const handleNavigate = React.useCallback(
    (routeName: string) => {
      navigation.navigate(routeName as never);
      navigation.closeDrawer();
    },
    [navigation]
  );


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
  const fullName = session?.user?.user_metadata?.full_name as string | undefined;
  const userLabel = fullName?.trim() || email.split('@')[0] || 'User';
  const initials = userLabel
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';
  const completionLabel = totals.all > 0 ? `${totals.completed}/${totals.all} completed` : 'No tasks yet';

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
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{userLabel}</Text>
            <Text style={styles.profileStats}>{completionLabel}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={() => navigation.closeDrawer()}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <Feather name="x" size={20} color={palette.slate600} />
        </Pressable>
      </View>

      <View style={styles.menuCard}>
        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => handleNavigate('Search')}
        >
          <View style={[styles.menuIcon, styles.searchIcon]}>
            <Feather name="search" size={16} color={palette.slate700} />
          </View>
          <Text style={styles.menuLabel}>Search</Text>
          <Feather name="chevron-right" size={18} color={palette.slate500} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => handleNavigate('Analytics')}
        >
          <View style={[styles.menuIcon, styles.analyticsIcon]}>
            <Feather name="pie-chart" size={16} color={palette.slate700} />
          </View>
          <Text style={styles.menuLabel}>Analytics</Text>
          <Feather name="chevron-right" size={18} color={palette.slate500} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => handleNavigate('Completed')}
        >
          <View style={[styles.menuIcon, styles.completedIcon]}>
            <Feather name="check-circle" size={16} color={palette.slate700} />
          </View>
          <Text style={styles.menuLabel}>Completed Tasks</Text>
          <Feather name="chevron-right" size={18} color={palette.slate500} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={toggleTheme}
        >
          <View style={[styles.menuIcon, styles.themeIcon]}>
            <Feather name={themeMode === 'Light' ? 'sun' : 'moon'} size={16} color={palette.slate700} />
          </View>
          <Text style={styles.menuLabel}>Theme</Text>
          <Text style={styles.menuValue}>{themeMode}</Text>
        </Pressable>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.hideIcon]}>
            <Feather name="eye-off" size={16} color={palette.slate700} />
          </View>
          <Text style={styles.menuLabel}>Hide Completed Tasks</Text>
          <Switch
            value={hideCompleted}
            onValueChange={(value: boolean) => {
              setHideCompleted(value);
            }}
            thumbColor={hideCompleted ? palette.lightSurface : palette.lightSurface}
            trackColor={{ false: '#d4d4d8', true: '#99f6e4' }}
          />
        </View>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.advancedIcon]}>
            <Feather name="cpu" size={16} color={palette.slate700} />
          </View>
          <Text style={styles.menuLabel}>Advanced Mode</Text>
          <Switch
            value={advancedMode}
            onValueChange={(value: boolean) => {
              setAdvancedMode(value);
            }}
            thumbColor={advancedMode ? palette.lightSurface : palette.lightSurface}
            trackColor={{ false: '#d4d4d8', true: '#99f6e4' }}
          />
        </View>

        <View style={[styles.menuRow, styles.menuRowLast]}>
          <View style={[styles.menuIcon, styles.autoIcon]}>
            <Feather name="refresh-cw" size={16} color={palette.slate700} />
          </View>
          <Text style={styles.menuLabel}>Auto-move due tasks</Text>
          <Switch
            value={autoArrange}
            onValueChange={(value: boolean) => {
              setAutoArrange(value);
            }}
            thumbColor={autoArrange ? palette.lightSurface : palette.lightSurface}
            trackColor={{ false: '#d4d4d8', true: '#99f6e4' }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={18} color="#e11d24" />
          <Text style={styles.logoutLabel}>Log Out</Text>
        </Pressable>
        <Text style={styles.versionLabel}>{`v${appVersion}`}</Text>
      </View>
    </DrawerContentScrollView>
  );
};
