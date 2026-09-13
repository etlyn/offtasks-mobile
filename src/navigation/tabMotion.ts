import { Easing } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

export const TAB_SLIDE_MS = 360;

export function tabMotion(
  width: number,
  reduceMotion: boolean,
): BottomTabNavigationOptions {
  if (reduceMotion) return { animation: 'none' };
  const config = {
    duration: TAB_SLIDE_MS,
    easing: Easing.inOut(Easing.cubic),
    isInteraction: false,
  };
  return {
    // The built-in shift preset also fades and moves only 50 points. Override
    // its scene style for an opaque, full-width slide in tab-index order.
    animation: 'shift',
    transitionSpec: {
      animation: 'timing',
      config,
    },
    sceneStyleInterpolator: ({ current }) => ({
      sceneStyle: {
        opacity: 1,
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-width, 0, width],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
    }),
  };
}
