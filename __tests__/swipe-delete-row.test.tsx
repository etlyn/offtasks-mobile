import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import {
  SwipeDeleteRow,
  swipeRevealTarget,
} from '../src/components/SwipeDeleteRow';

test('swipes settle at a compact action, a full red row, or closed', () => {
  const gesture = {
    offset: 48,
    initial: 0,
    rowWidth: 320,
    translationX: -48,
    velocityX: 0,
  };
  expect(swipeRevealTarget(gesture)).toBe(64);
  expect(
    swipeRevealTarget({ ...gesture, offset: 180, translationX: -180 }),
  ).toBe(320);
  expect(
    swipeRevealTarget({
      ...gesture,
      offset: 270,
      initial: 320,
      translationX: 50,
    }),
  ).toBe(0);
});

async function swipe(translationX: number, state: State = State.END) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('swipe-delete-row'), [
      { state: State.BEGAN, translationX: 0, velocityX: 0 },
      { state: State.ACTIVE, translationX: 0, velocityX: 0 },
      { state: State.ACTIVE, translationX, velocityX: 0 },
      { state, translationX, velocityX: 0 },
    ]);
    await Promise.resolve();
  });
}

test('a wide swipe reveals the removal surface without deleting until tapped', async () => {
  const remove = jest.fn();
  render(
    <SwipeDeleteRow label="Delete task Example" onDelete={remove}>
      <Text>Example</Text>
    </SwipeDeleteRow>,
  );
  expect(screen.queryByLabelText('Delete task Example')).toBeNull();
  fireEvent(screen.getByTestId('swipe-delete-row-container'), 'layout', {
    nativeEvent: { layout: { width: 320, height: 60, x: 0, y: 0 } },
  });
  await swipe(-180);
  const action = screen.getByLabelText('Delete task Example');
  expect(action).toHaveStyle({ backgroundColor: '#D33B43', minHeight: 44 });
  expect(remove).not.toHaveBeenCalled();
  fireEvent.press(action);
  expect(remove).toHaveBeenCalledTimes(1);
});

test('swiping an open row back to the right closes it without deleting', async () => {
  const remove = jest.fn();
  render(
    <SwipeDeleteRow label="Delete goal Example" onDelete={remove}>
      <Text>Example</Text>
    </SwipeDeleteRow>,
  );
  fireEvent(screen.getByTestId('swipe-delete-row-container'), 'layout', {
    nativeEvent: { layout: { width: 320, height: 60, x: 0, y: 0 } },
  });
  await swipe(-180);
  expect(screen.getByLabelText('Delete goal Example')).toBeOnTheScreen();
  await swipe(50);
  expect(screen.queryByLabelText('Delete goal Example')).toBeNull();
  expect(remove).not.toHaveBeenCalled();
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
