import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  DockRegistration,
  SharedDockHost,
  SharedDockProvider,
} from '../src/navigation/SharedDock';

jest.mock('../src/navigation/DashboardTabBar', () => ({
  DashboardTabBar: ({ state }: BottomTabBarProps) => {
    const Label = require('react-native').Text;
    return <Label>Planner dock: {state.routes[state.index].name}</Label>;
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const insets = { top: 48, bottom: 34, left: 0, right: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaInsetsContext: R.createContext(insets),
    SafeAreaFrameContext: R.createContext(frame),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: require('react-native').View,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});

const Root = createBottomTabNavigator();
const dockProps = {
  state: { index: 0, routes: [{ name: 'Notes', key: 'notes' }] },
} as BottomTabBarProps;
const noop = () => {};
function Planner() {
  return (
    <SharedDockProvider>
      <DockRegistration {...dockProps} />
      <SharedDockHost onNavigate={noop} />
    </SharedDockProvider>
  );
}
const Standalone = () => <Text>Standalone screen</Text>;

test('covering the mounted planner removes its dock and returning restores the selected tab', async () => {
  const navigation = createNavigationContainerRef<{
    Home: undefined;
    Welcome: undefined;
    Account: undefined;
  }>();
  const view = render(
    <NavigationContainer ref={navigation}>
      <Root.Navigator
        tabBar={() => null}
        detachInactiveScreens={false}
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        <Root.Screen name="Home" component={Planner} />
        <Root.Screen name="Welcome" component={Standalone} />
        <Root.Screen name="Account" component={Standalone} />
      </Root.Navigator>
    </NavigationContainer>,
  );
  await act(async () => {});
  expect(view.getByText('Planner dock: Notes')).toBeTruthy();
  for (const destination of ['Welcome', 'Account'] as const) {
    await act(async () => navigation.navigate(destination));
    // Include hidden elements: the dock must actually unmount, even when
    // navigation retains the underlying planner for a seamless return.
    expect(
      view.queryByText('Planner dock: Notes', { includeHiddenElements: true }),
    ).toBeNull();
    await act(async () => navigation.navigate('Home'));
    expect(view.getByText('Planner dock: Notes')).toBeTruthy();
  }
});
