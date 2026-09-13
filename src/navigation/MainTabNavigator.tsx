import React from 'react';
import { useWindowDimensions } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';
import { NotesScreen } from '@/features/planner/Notes.screen';
import { GoalsScreen } from '@/features/planner/Goals.screen';
import { StatisticsScreen } from '@/features/completed/Completed.screen';
import { AccountScreen } from '@/screens/AccountScreen';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { DockRegistration } from './SharedDock';
import { tabMotion } from './tabMotion';

const Tab = createBottomTabNavigator();
const renderTabBar = (props: BottomTabBarProps) => (
  <DockRegistration {...props} />
);

// Keep action registration/search/composer state above the navigator from
// recreating descriptors mid-slide. BottomTabView reschedules animations when
// descriptors change, snapping any no-longer-"previous" scene to its end value.
export const MainTabNavigator = React.memo(function MainTabNavigator() {
  const { width } = useWindowDimensions();
  const { reduceMotion } = useCalendarTransition();
  const options = React.useMemo(
    () => ({
      headerShown: false,
      freezeOnBlur: false,
      tabBarHideOnKeyboard: true,
      ...tabMotion(width, reduceMotion),
    }),
    [width, reduceMotion],
  );
  return (
    <Tab.Navigator
      initialRouteName="Calendar"
      backBehavior="history"
      detachInactiveScreens={false}
      screenOptions={options}
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
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
});
