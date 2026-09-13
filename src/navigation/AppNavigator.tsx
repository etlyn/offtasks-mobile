import React from 'react';
import { View, StyleSheet, Keyboard, useWindowDimensions } from 'react-native';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { getToday } from '@/hooks/useDate';
import {
  TaskCreationContext,
  type NoteCreationAction,
  type GoalCreationAction,
} from './TaskCreationContext';
import Feather from 'react-native-vector-icons/Feather';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  DrawerActions,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { SharedHeaderHost, SharedHeaderProvider } from './SharedHeader';
import { MainTabNavigator } from './MainTabNavigator';
import { SharedDockHost, SharedDockProvider } from './SharedDock';
import { GlobalSearchOverlay } from '@/features/search/GlobalSearchOverlay';
import { useSearchTransition } from '@/features/dashboard/components/useSearchTransition';
import type { SearchResult } from '@/utils/globalSearch';

import { SideDrawerContent } from '@/components/navigation/SideDrawerContent';
import { palette, useAppTheme } from '@/theme/colors';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';

const Drawer = createDrawerNavigator();

const iconSize = 20;

const DashboardTabs = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const openMenu = React.useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );
  const [searchVisible, setSearchVisible] = React.useState(false);
  const pendingResult = React.useRef<SearchResult | null>(null);
  const openSearch = React.useCallback(() => {
    pendingResult.current = null;
    setSearchVisible(true);
  }, []);
  const closeSearch = React.useCallback(() => {
    pendingResult.current = null;
    Keyboard.dismiss();
    setSearchVisible(false);
  }, []);
  const [goalAction, setGoalAction] = React.useState<GoalCreationAction | null>(
    null,
  );
  const [creationCategory, setCreationCategory] = React.useState<
    string | undefined
  >();
  const [noteAction, setNoteAction] = React.useState<NoteCreationAction | null>(
    null,
  );
  const { reduceMotion } = useCalendarTransition();
  const search = useSearchTransition(searchVisible, reduceMotion, () => {
    const result = pendingResult.current;
    pendingResult.current = null;
    if (!result) return;
    const requestId = Date.now();
    navigation.navigate(
      'Dashboard',
      result.kind === 'task'
        ? {
            screen: 'Calendar',
            params: { openTaskRequest: { id: result.task.id, requestId } },
          }
        : result.kind === 'note'
        ? {
            screen: 'Notes',
            params: { openNoteRequest: { id: result.note.id, requestId } },
          }
        : {
            screen: 'Goals',
            params: { openGoalRequest: { id: result.goal, requestId } },
          },
    );
  });
  const selectResult = React.useCallback((result: SearchResult) => {
    pendingResult.current = result;
    Keyboard.dismiss();
    setSearchVisible(false);
  }, []);
  const [calendarDay, setCalendarDay] = React.useState(getToday());
  const [creationDate, setCreationDate] = React.useState<string | null>(null);
  const openTask = React.useCallback((day?: string, category?: string) => {
    const today = getToday();
    setCreationCategory(category);
    setCreationDate(day && day >= today ? day : today);
  }, []);
  const closeTask = React.useCallback(() => setCreationDate(null), []);
  const creation = React.useMemo(
    () => ({
      calendarDay,
      setCalendarDay,
      openTask,
      noteAction,
      setNoteAction,
      goalAction,
      setGoalAction,
    }),
    [calendarDay, openTask, noteAction, goalAction],
  );
  return (
    <TaskCreationContext.Provider value={creation}>
      <SharedHeaderProvider>
        <SharedDockProvider>
          <View style={tabStyles.root}>
            <View
              style={tabStyles.root}
              pointerEvents={search.mounted ? 'none' : 'auto'}
              accessibilityElementsHidden={search.mounted}
              importantForAccessibility={
                search.mounted ? 'no-hide-descendants' : 'auto'
              }
            >
              <MainTabNavigator />
            </View>
            <SharedHeaderHost
              onMenu={openMenu}
              onSearch={openSearch}
              globalSearch
              covered={search.mounted}
            />
            {search.mounted ? (
              <GlobalSearchOverlay
                transition={search}
                onClose={closeSearch}
                onSelect={selectResult}
              />
            ) : null}
            <SharedDockHost onNavigate={closeSearch} />
            {creationDate ? (
              <DashboardScreen
                composerOnly
                initialDate={creationDate}
                initialCategory={creationCategory}
                onComposerClose={closeTask}
              />
            ) : null}
          </View>
        </SharedDockProvider>
      </SharedHeaderProvider>
    </TaskCreationContext.Provider>
  );
};
const tabStyles = StyleSheet.create({ root: { flex: 1 } });

export const AppNavigator = () => {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={props => <SideDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: Math.min(360, width - 48),
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
          overflow: 'hidden',
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
    </Drawer.Navigator>
  );
};
