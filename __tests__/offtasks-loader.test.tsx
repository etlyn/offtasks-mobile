import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, AppState } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { OfftasksLoader } from '../src/components/OfftasksLoader';
import { BrandedRefreshControl } from '../src/components/BrandedRefreshControl';
import { Platform, RefreshControl, StyleSheet } from 'react-native';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));

afterEach(() => jest.restoreAllMocks());

test('native pull-to-refresh has no system spinner and preserves the refresh callback', () => {
  const onRefresh = jest.fn();
  render(<BrandedRefreshControl refreshing onRefresh={onRefresh} />);
  const control = screen.UNSAFE_getByType(RefreshControl);
  expect(control.props).toMatchObject({
    refreshing: true,
    tintColor: 'transparent',
    colors: ['transparent'],
    progressBackgroundColor: 'transparent',
  });
  expect(StyleSheet.flatten(control.props.style)).toEqual({ opacity: 0 });
  control.props.onRefresh();
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

test('Android refresh keeps the scroll-content wrapper visible', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  render(<BrandedRefreshControl refreshing={false} style={{ flex: 1 }} />);
  expect(
    StyleSheet.flatten(screen.UNSAFE_getByType(RefreshControl).props.style),
  ).toEqual({ flex: 1 });
});

test('a quick refresh finishes the letter settle, then rests and can animate again', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  jest.spyOn(Animated, 'sequence').mockReturnValue(animation);
  const view = render(<OfftasksLoader active={false} compact />);
  await act(async () => {});
  expect(animation.start).not.toHaveBeenCalled();
  view.rerender(<OfftasksLoader active compact />);
  expect(animation.start).toHaveBeenCalledTimes(1);
  view.rerender(<OfftasksLoader active={false} compact />);
  expect(animation.stop).not.toHaveBeenCalled();
  act(() => animation.start.mock.calls[0][0]({ finished: true }));
  expect(screen.getByLabelText('offtasks.').props.accessibilityState.busy).toBe(
    false,
  );
  expect(
    screen.getByTestId('offtasks-loader-letter-0', {
      includeHiddenElements: true,
    }),
  ).toHaveStyle({ transform: [{ translateY: 0 }], fontSize: 20 });
  view.rerender(<OfftasksLoader active compact />);
  expect(animation.start).toHaveBeenCalledTimes(2);
});

test('Reduce Motion shows a static wordmark with one accessible loading status', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const loop = jest.spyOn(Animated, 'loop');
  render(<OfftasksLoader />);
  await act(async () => {});
  expect(screen.getByLabelText('Loading').props.accessibilityState).toEqual({
    busy: true,
  });
  expect(
    screen
      .getAllByTestId(/offtasks-loader-letter-/, {
        includeHiddenElements: true,
      })
      .map(letter => letter.props.children)
      .join(''),
  ).toBe('offtasks.');
  expect(
    screen.getByTestId('offtasks-loader-letter-0', {
      includeHiddenElements: true,
    }),
  ).toHaveStyle({
    transform: [{ translateY: 0 }],
  });
  expect(
    screen.getByTestId('offtasks-loader-wordmark', {
      includeHiddenElements: true,
    }),
  ).toHaveStyle({
    opacity: 1,
  });
  expect(loop).not.toHaveBeenCalled();
});

test('letters stagger, run natively without blocking interactions, and stop on unmount', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  jest.spyOn(Animated, 'sequence').mockReturnValue(animation);
  const stagger = jest.spyOn(Animated, 'stagger');
  const timing = jest.spyOn(Animated, 'timing');
  const view = render(<OfftasksLoader />);
  await act(async () => {});
  expect(stagger).toHaveBeenCalledWith(65, expect.any(Array));
  expect(stagger.mock.calls[0][1]).toHaveLength(9);
  expect(
    timing.mock.calls.filter(([, config]) => config.duration === 520),
  ).toHaveLength(9);
  for (const [, config] of timing.mock.calls) {
    expect(config).toMatchObject({
      useNativeDriver: true,
      isInteraction: false,
    });
  }
  expect(animation.start).toHaveBeenCalledTimes(1);
  const finishCycle = animation.start.mock.calls[0][0] as (result: {
    finished: boolean;
  }) => void;
  act(() => finishCycle({ finished: true }));
  expect(animation.start).toHaveBeenCalledTimes(2);
  view.unmount();
  expect(animation.stop).toHaveBeenCalledTimes(1);
  finishCycle({ finished: true });
  expect(animation.start).toHaveBeenCalledTimes(2);
});

test('backgrounding, leaving the screen, and Reduce Motion changes stop the loop', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  jest.spyOn(Animated, 'sequence').mockReturnValue(animation);
  let changeMotion!: (value: boolean) => void;
  let changeApp!: (value: string) => void;
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_, listener) => {
      changeMotion = listener as unknown as typeof changeMotion;
      return { remove: jest.fn() } as unknown as ReturnType<
        typeof AccessibilityInfo.addEventListener
      >;
    });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    changeApp = listener as typeof changeApp;
    return { remove: jest.fn() };
  });
  const events: Record<string, () => void> = {};
  const navigation = {
    isFocused: () => true,
    addListener: (name: string, handler: () => void) => {
      events[name] = handler;
      return jest.fn();
    },
  } as unknown as React.ContextType<typeof NavigationContext>;
  render(
    <NavigationContext.Provider value={navigation}>
      <OfftasksLoader />
    </NavigationContext.Provider>,
  );
  await act(async () => {});
  act(() => changeApp('background'));
  expect(animation.stop).toHaveBeenCalledTimes(1);
  act(() => changeApp('active'));
  expect(animation.start).toHaveBeenCalledTimes(2);
  act(() => events.blur());
  expect(animation.stop).toHaveBeenCalledTimes(2);
  act(() => events.focus());
  expect(animation.start).toHaveBeenCalledTimes(3);
  act(() => changeMotion(true));
  expect(animation.stop).toHaveBeenCalledTimes(3);
  expect(
    screen.getByTestId('offtasks-loader-letter-0', {
      includeHiddenElements: true,
    }),
  ).toHaveStyle({
    transform: [{ translateY: 0 }],
  });
});
