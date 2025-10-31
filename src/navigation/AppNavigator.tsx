import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { SideDrawerContent } from '@/components/navigation/SideDrawerContent';
import { TabNav } from '@/navigation/TabNav';
import { NavBar } from '@/navigation/NavBar';
import { palette } from '@/theme/colors';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';
import { SettingsScreen } from '@/features/settings/Settings.screen';
import { CompletedScreen } from '@/features/completed/Completed.screen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const iconSize = 20;

const HomeTabs = () => (
  <Tab.Navigator
    initialRouteName="Today"
    screenOptions={{
      header: (props) => <NavBar {...props} />, // custom header bar
      tabBarHideOnKeyboard: true,
    }}
    tabBar={(props) => <TabNav {...props} />}
  >
    <Tab.Screen
      name="Today"
      component={DashboardScreen}
      initialParams={{ group: 'today' }}
      options={{ tabBarLabel: 'Today' }}
    />
    <Tab.Screen
      name="Tomorrow"
      component={DashboardScreen}
      initialParams={{ group: 'tomorrow' }}
      options={{ tabBarLabel: 'Tomorrow' }}
    />
    <Tab.Screen
      name="Upcoming"
      component={DashboardScreen}
      initialParams={{ group: 'upcoming' }}
      options={{ tabBarLabel: 'Upcoming' }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <SideDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerPosition: 'right',
      drawerType: 'front',
      drawerStyle: {
        backgroundColor: palette.lightSurface,
        width: 360,
      },
      drawerActiveTintColor: palette.mint,
      drawerInactiveTintColor: palette.slate600,
      overlayColor: 'rgba(15, 23, 42, 0.2)',
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
      name="Completed"
      component={CompletedScreen}
      options={{
        drawerIcon: ({ color }) => <Feather name="check-circle" size={iconSize} color={color} />,
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
