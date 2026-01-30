import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
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

const FigmaImage = Image as unknown as React.ComponentType<{
  source: { uri: string };
  style?: unknown;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}>;

const iconUser = 'https://www.figma.com/api/mcp/asset/6acafae1-b82a-4ccc-b8c9-2922cd3e106e';
const iconSearch = 'https://www.figma.com/api/mcp/asset/488f936a-6eb2-43e9-b7f0-7817687a3e37';
const iconChevron = 'https://www.figma.com/api/mcp/asset/8975657f-175d-4c3c-ae83-a17071b8672a';
const iconAnalytics = 'https://www.figma.com/api/mcp/asset/09acd571-fa14-4cdc-92dc-e6b654fe6795';
const iconCompleted = 'https://www.figma.com/api/mcp/asset/fa8ebcbc-9701-4f93-bdea-50effa2955a3';
const iconTheme = 'https://www.figma.com/api/mcp/asset/b7a04e63-08bf-4448-837a-c94891de6ac2';
const iconHide = 'https://www.figma.com/api/mcp/asset/9cd4ea63-0b17-4558-b8da-daa1a9caf467';
const iconAdvanced = 'https://www.figma.com/api/mcp/asset/118a8e27-055a-4257-93e0-7324eb4a66c3';
const iconLogout = 'https://www.figma.com/api/mcp/asset/cca75eab-aed1-4f42-b25b-5db466eeae4d';
const iconClose = 'https://www.figma.com/api/mcp/asset/8be6f61d-52f6-41e3-aa4b-93dd5ea37a59';

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
  const userLabel = email.split('@')[0] || 'User';
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
            <FigmaImage source={{ uri: iconUser }} style={styles.avatarIcon} resizeMode="contain" />
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
          <FigmaImage source={{ uri: iconClose }} style={styles.closeIcon} resizeMode="contain" />
        </Pressable>
      </View>

      <View style={styles.menuCard}>
        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => handleNavigate('Search')}
        >
          <View style={[styles.menuIcon, styles.searchIcon]}>
            <FigmaImage source={{ uri: iconSearch }} style={styles.menuIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.menuLabel}>Search</Text>
          <FigmaImage source={{ uri: iconChevron }} style={styles.trailingIcon} resizeMode="contain" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => handleNavigate('Analytics')}
        >
          <View style={[styles.menuIcon, styles.analyticsIcon]}>
            <FigmaImage source={{ uri: iconAnalytics }} style={styles.menuIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.menuLabel}>Analytics</Text>
          <FigmaImage source={{ uri: iconChevron }} style={styles.trailingIcon} resizeMode="contain" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => handleNavigate('Completed')}
        >
          <View style={[styles.menuIcon, styles.completedIcon]}>
            <FigmaImage source={{ uri: iconCompleted }} style={styles.menuIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.menuLabel}>Completed Tasks</Text>
          <FigmaImage source={{ uri: iconChevron }} style={styles.trailingIcon} resizeMode="contain" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={toggleTheme}
        >
          <View style={[styles.menuIcon, styles.themeIcon]}>
            <FigmaImage source={{ uri: iconTheme }} style={styles.menuIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.menuLabel}>Theme</Text>
          <Text style={styles.menuValue}>{themeMode}</Text>
        </Pressable>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.hideIcon]}>
            <FigmaImage source={{ uri: iconHide }} style={styles.menuIconImage} resizeMode="contain" />
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

        <View style={[styles.menuRow, styles.menuRowLast]}>
          <View style={[styles.menuIcon, styles.advancedIcon]}>
            <FigmaImage source={{ uri: iconAdvanced }} style={styles.menuIconImage} resizeMode="contain" />
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
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={handleSignOut}
        >
          <FigmaImage source={{ uri: iconLogout }} style={styles.logoutIcon} resizeMode="contain" />
          <Text style={styles.logoutLabel}>Log Out</Text>
        </Pressable>
        <Text style={styles.versionLabel}>offtasks mobile v1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
};
