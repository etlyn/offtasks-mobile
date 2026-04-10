import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { SideDrawerContent } from '@/components/navigation/SideDrawerContent';
import { TabNav } from '@/navigation/TabNav';
import { palette, useAppTheme } from '@/theme/colors';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';
import { StatisticsScreen } from '@/features/completed/Completed.screen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const iconSize = 20;

const DashboardTabs = () => (
  <Tab.Navigator
    initialRouteName="Today"
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}
    tabBar={props => <TabNav {...props} />}
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
      name="Later"
      component={DashboardScreen}
      initialParams={{ group: 'upcoming' }}
      options={{ tabBarLabel: 'Later' }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const theme = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={props => <SideDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: theme.colors.drawerBackground,
          width: 360,
        },
        drawerActiveTintColor: palette.mint,
        drawerInactiveTintColor: theme.colors.textSecondary,
        overlayColor: theme.colors.overlay,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardTabs}
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color }) => (
            <Feather name="home" size={iconSize} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Feather name="bar-chart-2" size={iconSize} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};
