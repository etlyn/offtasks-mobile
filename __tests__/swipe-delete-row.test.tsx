import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { SwipeDeleteRow } from '../src/components/SwipeDeleteRow';

async function swipe(translationX: number, state: State = State.END) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('swipe-delete-row'), [
      { state: State.BEGAN, translationX: 0, velocityX: 0 },
      { state: State.ACTIVE, translationX, velocityX: 0 },
      { state, translationX, velocityX: 0 },
    ]);
    await Promise.resolve();
  });
}

test('a swipe reveals a red action and invokes removal', async () => {
  const remove = jest.fn();
  render(
    <SwipeDeleteRow label="Delete task Example" onDelete={remove}>
      <Text>Example</Text>
    </SwipeDeleteRow>,
  );
  expect(screen.queryByLabelText('Delete task Example')).toBeNull();
  await swipe(-60);
  const action = screen.getByLabelText('Delete task Example');
  expect(action).toHaveStyle({ backgroundColor: '#D33B43', minHeight: 44 });
  expect(screen.getByText('Example')).toBeTruthy();
  fireEvent.press(action);
  expect(remove).toHaveBeenCalledTimes(1);
});

test('a cancelled swipe leaves the removal action hidden', async () => {
  render(
    <SwipeDeleteRow label="Delete note Example" onDelete={jest.fn()}>
      <Text>Example</Text>
    </SwipeDeleteRow>,
  );
  await swipe(-60, State.CANCELLED);
  expect(screen.queryByLabelText('Delete note Example')).toBeNull();
});
