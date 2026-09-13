import React from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Text,
  Dimensions,
} from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DetachedTaskSheet } from '../src/features/dashboard/components/DetachedTaskSheet';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));

const fixture = () => ({
  visible: true,
  onClose: jest.fn(),
  onDismiss: jest.fn(),
  onShow: jest.fn(),
  reduceMotion: true,
  insetTop: 62,
  insetBottom: 34,
  children: <Text>Task draft</Text>,
});

afterEach(() => jest.restoreAllMocks());

test('detached sheet overlays retained content with compact corners and safe-area spacing', () => {
  const props = fixture();
  render(<DetachedTaskSheet {...props} />);
  const modal = screen.UNSAFE_getByType(Modal);
  expect(modal.props.transparent).toBe(true);
  expect(modal.props.presentationStyle).toBe('overFullScreen');
  expect(modal.props.animationType).toBe('none');
  expect(screen.getByTestId('detached-task-sheet')).toHaveStyle({
    borderRadius: 28,
    maxHeight: '100%',
    flexShrink: 1,
  });
  expect(screen.getByTestId('detached-sheet-position')).toHaveStyle({
    paddingHorizontal: 12,
    paddingTop: 74,
    paddingBottom: 46,
  });
  fireEvent(modal, 'show');
  expect(props.onShow).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByLabelText('Dismiss task composer'));
  expect(props.onClose).toHaveBeenCalledTimes(1);
  expect(props.onDismiss).not.toHaveBeenCalled();
});

test('task sheet coordinates keyboard position without a second keyboard animation', () => {
  const callbacks: Record<string, (event: any) => void> = {};
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((
    name: string,
    callback: (event: any) => void,
  ) => {
    callbacks[name] = callback;
    return { remove: jest.fn() };
  }) as any);
  const timing = jest
    .spyOn(Animated, 'timing')
    .mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    }));
  render(<DetachedTaskSheet {...fixture()} reduceMotion={false} />);
  expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.enabled).toBe(
    false,
  );
  const height = Dimensions.get('window').height;
  act(() =>
    callbacks.keyboardWillChangeFrame({
      duration: 250,
      endCoordinates: { screenY: height - 300 },
    }),
  );
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({
      toValue: 312,
      duration: 320,
      useNativeDriver: false,
      isInteraction: false,
    }),
  );
  act(() =>
    callbacks.keyboardWillChangeFrame({
      duration: 250,
      endCoordinates: { screenY: height },
    }),
  );
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ toValue: 46, duration: 320 }),
  );
});

test('Reduce Motion changes the keyboard gap without composer layout animation', () => {
  let frame: (event: any) => void = () => {};
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((
    name: string,
    callback: typeof frame,
  ) => {
    if (name === 'keyboardWillChangeFrame') frame = callback;
    return { remove: jest.fn() };
  }) as any);
  const layout = jest.spyOn(LayoutAnimation, 'configureNext');
  render(<DetachedTaskSheet {...fixture()} />);
  act(() =>
    frame({
      duration: 250,
      endCoordinates: { screenY: Dimensions.get('window').height - 300 },
    }),
  );
  expect(layout).not.toHaveBeenCalled();
  expect(screen.getByTestId('detached-sheet-position')).toHaveStyle({
    paddingBottom: 312,
  });
});

test('draft remains mounted throughout exit, cleanup runs only after the eased animation', () => {
  const completions: Array<(result: { finished: boolean }) => void> = [];
  const timing = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
    start: callback => {
      if (callback) completions.push(callback);
    },
    stop: jest.fn(),
    reset: jest.fn(),
  }));
  const props = { ...fixture(), reduceMotion: false };
  const view = render(<DetachedTaskSheet {...props} />);
  fireEvent(screen.UNSAFE_getByType(Modal), 'show');
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }),
  );
  view.rerender(<DetachedTaskSheet {...props} visible={false} />);
  expect(screen.getByText('Task draft')).toBeOnTheScreen();
  expect(props.onDismiss).not.toHaveBeenCalled();
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ toValue: 0, duration: 280 }),
  );
  act(() => completions[completions.length - 1]({ finished: true }));
  expect(props.onDismiss).toHaveBeenCalledTimes(1);
});

test('Reduce Motion ends an in-flight exit immediately and safely', () => {
  jest.spyOn(Animated, 'timing').mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  }));
  const props = { ...fixture(), reduceMotion: false };
  const view = render(<DetachedTaskSheet {...props} />);
  fireEvent(screen.UNSAFE_getByType(Modal), 'show');
  view.rerender(<DetachedTaskSheet {...props} visible={false} />);
  view.rerender(<DetachedTaskSheet {...props} visible={false} reduceMotion />);
  expect(props.onDismiss).toHaveBeenCalledTimes(1);
});
