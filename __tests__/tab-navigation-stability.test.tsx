import React from 'react';
import { Animated } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { MainTabNavigator } from '../src/navigation/MainTabNavigator';
import { TaskCreationContext } from '../src/navigation/TaskCreationContext';

jest.mock('../src/navigation/SharedDock', () => ({
  DockRegistration: () => null,
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({ reduceMotion: false }),
}));
jest.mock('../src/features/dashboard/Dashboard.screen', () => ({
  DashboardScreen: () => null,
}));
jest.mock('../src/features/planner/Notes.screen', () => ({
  NotesScreen: () => {
    const { Text } = require('react-native');
    const value =
      require('../src/navigation/TaskCreationContext').useTaskCreation();
    return <Text>Notes {value.calendarDay}</Text>;
  },
}));
jest.mock('../src/features/planner/Goals.screen', () => ({
  GoalsScreen: () => null,
}));
jest.mock('../src/features/completed/Completed.screen', () => ({
  StatisticsScreen: () => null,
}));
jest.mock('../src/screens/AccountScreen', () => ({
  AccountScreen: () => null,
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

test.each([true, false])(
  'navigator isolation=%s controls mid-slide restarts in the real tab navigator',
  async isolated => {
    const timing = jest
      .spyOn(Animated, 'timing')
      .mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      }));
    const navigation = createNavigationContainerRef<{
      Calendar: undefined;
      Notes: undefined;
      Goals: undefined;
      Later: undefined;
    }>();
    let updateShell: (value: string) => void = () => {};
    // The unwrapped component reproduces the old parent-render behavior as a
    // negative control: its descriptor changes restart the outgoing animation.
    const Navigator = isolated
      ? MainTabNavigator
      : (MainTabNavigator as unknown as { type: React.ComponentType }).type;
    function Harness() {
      const [value, setValue] = React.useState('before');
      updateShell = setValue;
      return (
        <NavigationContainer ref={navigation}>
          <TaskCreationContext.Provider
            value={{
              calendarDay: value,
              setCalendarDay: setValue,
              openTask: jest.fn(),
            }}
          >
            <Navigator />
          </TaskCreationContext.Provider>
        </NavigationContainer>
      );
    }
    const view = render(<Harness />);
    await act(async () => {});
    for (const route of [
      'Notes',
      'Goals',
      'Later',
      'Goals',
      'Notes',
    ] as const) {
      await act(async () => navigation.navigate(route));
      const callsAtSlideStart = timing.mock.calls.length;
      expect(callsAtSlideStart).toBeGreaterThan(0);
      await act(async () => updateShell(`after-${route}`));
      if (isolated) expect(timing).toHaveBeenCalledTimes(callsAtSlideStart);
      else expect(timing.mock.calls.length).toBeGreaterThan(callsAtSlideStart);
    }
    expect(screen.getByText('Notes after-Notes')).toBeOnTheScreen();
    view.unmount();
    timing.mockRestore();
  },
);
