import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getToday } from '@/hooks/useDate';
import { TaskCreationContext } from './TaskCreationContext';
import Feather from 'react-native-vector-icons/Feather';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { SideDrawerContent } from '@/components/navigation/SideDrawerContent';
import { TabNav } from '@/navigation/TabNav';
import { palette, useAppTheme } from '@/theme/colors';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';
import { StatisticsScreen } from '@/features/completed/Completed.screen';
import { NotesScreen } from '@/features/planner/Notes.screen';
import { GoalsScreen } from '@/features/planner/Goals.screen';
import { AccountScreen } from '@/screens/AccountScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const iconSize = 20;
const renderTabBar = (props: React.ComponentProps<typeof TabNav>) => (
  <TabNav {...props} />
);

const DashboardTabs = () => {
  const [calendarDay, setCalendarDay] = React.useState(getToday());
  const [creationDate, setCreationDate] = React.useState<string | null>(null);
  const openTask = React.useCallback((day?: string) => {
    const today = getToday();
    setCreationDate(day && day >= today ? day : today);
  }, []);
  const closeTask = React.useCallback(() => setCreationDate(null), []);
  const creation = React.useMemo(
    () => ({ calendarDay, setCalendarDay, openTask }),
    [calendarDay, openTask],
  );
  return (
    <TaskCreationContext.Provider value={creation}>
      <View style={tabStyles.root}>
        <Tab.Navigator
          initialRouteName="Calendar"
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}
          tabBar={renderTabBar}
        >
          <Tab.Screen
            name="Calendar"
            component={DashboardScreen}
            initialParams={{ group: 'today', view: 'calendar' }}
            options={{ tabBarLabel: 'Calendar' }}
          />
          <Tab.Screen
            name="Notes"
            component={NotesScreen}
            options={{ tabBarLabel: 'Notes' }}
          />
          <Tab.Screen
            name="Goals"
            component={GoalsScreen}
            options={{ tabBarLabel: 'Goals' }}
          />
          <Tab.Screen
            name="Later"
            component={DashboardScreen}
            initialParams={{ group: 'upcoming' }}
            options={{ tabBarLabel: 'Later' }}
          />
        </Tab.Navigator>
        {creationDate ? (
          <DashboardScreen
            composerOnly
            initialDate={creationDate}
            onComposerClose={closeTask}
          />
        ) : null}
      </View>
    </TaskCreationContext.Provider>
  );
};
const tabStyles = StyleSheet.create({ root: { flex: 1 } });

export const AppNavigator = () => {
  const theme = useAppTheme();

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
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
        name="Account"
        component={AccountScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
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
