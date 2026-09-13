import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { DetachedSheet } from '../src/components/DetachedSheet';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/components/OfftasksBlurNative', () => ({
  OfftasksBlurNative: require('react-native').View,
}));

test('shared backdrop uses native blur and removes it when Reduce Transparency changes', async () => {
  let change: (enabled: boolean) => void = () => {};
  jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockResolvedValue(false);
  const remove = jest.fn();
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
    event: string,
    callback: typeof change,
  ) => {
    if (event === 'reduceTransparencyChanged') change = callback;
    return { remove };
  }) as unknown as typeof AccessibilityInfo.addEventListener);
  const view = render(
    <DetachedSheet
      visible
      onClose={jest.fn()}
      reduceMotion
      insetTop={62}
      insetBottom={34}
      dismissLabel="Dismiss note editor"
    >
      <Text>Draft</Text>
    </DetachedSheet>,
  );
  await act(async () => {});
  expect(screen.getByTestId('sheet-backdrop-blur').props.intensity).toBe(0.015);
  expect(screen.getByLabelText('Dismiss note editor')).toBeTruthy();
  act(() => change(true));
  expect(screen.queryByTestId('sheet-backdrop-blur')).toBeNull();
  expect(screen.getByText('Draft')).toBeTruthy();
  view.unmount();
  expect(remove).toHaveBeenCalled();
  jest.restoreAllMocks();
});
