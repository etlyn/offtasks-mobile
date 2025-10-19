import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {
  createDrawerNavigator,
  DrawerItem,
  DrawerItemList,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/branding/Logo';
import { LogoWordmark } from '@/components/branding/LogoWordmark';
import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { palette } from '@/theme/colors';
import { TasksScreen } from '@/screens/TasksScreen';
import { UpcomingScreen } from '@/screens/UpcomingScreen';
import { CompletedScreen } from '@/screens/CompletedScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const iconSize = 20;

const HomeTabs = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 6);

  return (
    <Tab.Navigator
      initialRouteName="Focus"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: '#1f2937',
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: bottomInset,
          paddingTop: 8,
          height: 52 + bottomInset,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Focus"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="target" size={iconSize} color={color} />,
        }}
      />
      <Tab.Screen
        name="Upcoming"
        component={UpcomingScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="calendar" size={iconSize} color={color} />,
        }}
      />
      <Tab.Screen
        name="Completed"
        component={CompletedScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="check-circle" size={iconSize} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert('Sign out failed', (error as Error).message);
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.drawerContent,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.drawerHeader}>
        <LogoWordmark width={150} height={36} />
        <View style={styles.userRow}>
          <Logo size={40} />
          <View style={styles.userMeta}>
            <Text style={styles.userLabel}>Signed in as</Text>
            <Text style={styles.userEmail}>{session?.user?.email ?? 'offline'}</Text>
          </View>
        </View>
      </View>
      <DrawerItemList {...props} />
      <View style={styles.drawerFooter}>
        <DrawerItem
          label="Sign out"
          labelStyle={styles.drawerItemLabel}
          icon={({ color }) => <Feather name="log-out" size={18} color={color} />}
          onPress={handleSignOut}
        />
        <Text style={styles.helperText}>Version 0.1.0</Text>
      </View>
    </DrawerContentScrollView>
  );
};

export const AppNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerPosition: 'right',
      drawerType: 'slide',
      drawerStyle: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        width: 300,
      },
      drawerContentStyle: {
        backgroundColor: 'transparent',
      },
      drawerActiveTintColor: palette.accent,
      drawerInactiveTintColor: palette.textSecondary,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
    }}
  >
    <Drawer.Screen
      name="Overview"
      component={HomeTabs}
      options={{
        drawerIcon: ({ color }) => <Feather name="home" size={iconSize} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        drawerIcon: ({ color }) => <Feather name="settings" size={iconSize} color={color} />,
      }}
    />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  drawerHeader: {
    marginBottom: 28,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userMeta: {
    marginLeft: 14,
  },
  userLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userEmail: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  helperText: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
});
