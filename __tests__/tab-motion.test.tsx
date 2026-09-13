import React from 'react';
import { Animated } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { tabMotion, TAB_SLIDE_MS } from '../src/navigation/tabMotion';

test.each([-1, -0.5, 0, 0.5, 1])(
  'slides the scene at progress %s without fading',
  progress => {
    const options = tabMotion(400, false);
    const { sceneStyle } = options.sceneStyleInterpolator!({
      current: { progress: new Animated.Value(progress) },
    });
    render(<Animated.View testID="scene" style={sceneStyle} />);
    expect(screen.getByTestId('scene')).toHaveStyle({
      opacity: 1,
      transform: [{ translateX: progress * 400 }],
    });
  },
);

test('uses viewport width for non-adjacent navigation and rotation', () => {
  const progress = new Animated.Value(1);
  const style = (width: number) =>
    tabMotion(width, false).sceneStyleInterpolator!({ current: { progress } })
      .sceneStyle;
  const view = render(<Animated.View testID="scene" style={style(390)} />);
  expect(screen.getByTestId('scene')).toHaveStyle({
    transform: [{ translateX: 390 }],
  });
  view.rerender(<Animated.View testID="scene" style={style(844)} />);
  expect(screen.getByTestId('scene')).toHaveStyle({
    transform: [{ translateX: 844 }],
  });
});

test('uses gentle ease-in/out and disables spatial motion for Reduce Motion', () => {
  const options = tabMotion(400, false);
  expect(options.animation).toBe('shift');
  expect(options.transitionSpec?.animation).toBe('timing');
  if (options.transitionSpec?.animation !== 'timing')
    throw new Error('Expected timing');
  const { duration, easing } = options.transitionSpec.config;
  expect(duration).toBe(TAB_SLIDE_MS);
  expect(easing!(0.1)).toBeLessThan(0.1);
  expect(easing!(0.9)).toBeGreaterThan(0.9);
  expect(tabMotion(400, true)).toEqual({ animation: 'none' });
});
