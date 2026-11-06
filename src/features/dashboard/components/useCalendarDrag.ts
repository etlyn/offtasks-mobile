import React from 'react';
import { Gesture, type NativeGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CALENDAR_TRANSITION_MS } from './useCalendarTransition';

/** The calendar and the content below it follow the finger on the UI thread. */
export function useCalendarDrag({
  expanded,
  weeks,
  selectedWeek,
  rowHeight,
  toolbarHeight,
  reduceMotion,
  enabled,
  scrollGesture,
  onChange,
  onGestureActive,
}: {
  expanded: boolean;
  weeks: number;
  selectedWeek: number;
  rowHeight: number;
  toolbarHeight: number;
  reduceMotion: boolean;
  enabled: boolean;
  scrollGesture?: NativeGesture;
  onChange: (expanded: boolean) => void;
  onGestureActive?: (active: boolean) => void;
}) {
  const progress = useSharedValue(expanded ? 1 : 0);
  const initial = useSharedValue(expanded ? 1 : 0);
  const dragging = useSharedValue(false);
  const interrupted = useSharedValue(false);
  const distance = toolbarHeight + rowHeight * (weeks - 1) + 8;
  const settle = React.useCallback(
    (next: boolean) => onChange(next),
    [onChange],
  );
  const notifyActive = React.useCallback(
    (active: boolean) => onGestureActive?.(active),
    [onGestureActive],
  );

  React.useEffect(() => {
    const target = expanded ? 1 : 0;
    progress.value = reduceMotion
      ? target
      : withTiming(target, {
          duration: CALENDAR_TRANSITION_MS,
          easing: Easing.inOut(Easing.cubic),
        });
  }, [expanded, progress, reduceMotion]);

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .withTestId('calendar-vertical-drag')
        .enabled(enabled)
        .blocksExternalGesture(...(scrollGesture ? [scrollGesture] : []))
        .maxPointers(1)
        .failOffsetX([-16, 16])
        .activeOffsetY(expanded ? [-12, 10000] : [-10000, 12])
        .failOffsetY(expanded ? [-10000, 12] : [-12, 10000])
        .onStart(() => {
          cancelAnimation(progress);
          initial.value = progress.value;
          dragging.value = true;
          interrupted.value = false;
          runOnJS(notifyActive)(true);
        })
        .onUpdate(event => {
          if (event.numberOfPointers > 1) {
            interrupted.value = true;
            return;
          }
          progress.value = Math.max(
            0,
            Math.min(1, initial.value + event.translationY / distance),
          );
        })
        .onEnd((event, success) => {
          if (!success || interrupted.value) return;
          const released = Math.max(
            0,
            Math.min(1, initial.value + event.translationY / distance),
          );
          const next = expanded
            ? !(released < 0.78 || event.velocityY < -500)
            : released > 0.22 || event.velocityY > 500;
          progress.value = reduceMotion
            ? Number(next)
            : withTiming(Number(next), {
                duration: CALENDAR_TRANSITION_MS,
                easing: Easing.inOut(Easing.cubic),
              });
          dragging.value = false;
          if (next !== expanded) runOnJS(settle)(next);
        })
        .onFinalize(() => {
          if (dragging.value) {
            progress.value = reduceMotion
              ? initial.value
              : withTiming(initial.value, {
                  duration: CALENDAR_TRANSITION_MS,
                  easing: Easing.inOut(Easing.cubic),
                });
            dragging.value = false;
          }
          runOnJS(notifyActive)(false);
        }),
    [
      distance,
      dragging,
      enabled,
      expanded,
      initial,
      interrupted,
      notifyActive,
      progress,
      reduceMotion,
      scrollGesture,
      settle,
    ],
  );
  const toolbarStyle = useAnimatedStyle(() => ({
    height: toolbarHeight * progress.value,
    opacity: progress.value,
  }));
  const gridStyle = useAnimatedStyle(() => ({
    height: rowHeight * (1 + (weeks - 1) * progress.value),
  }));
  const rowsStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -selectedWeek * rowHeight * (1 - progress.value) },
    ],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    paddingTop: 10 - 8 * progress.value,
  }));
  return { pan, toolbarStyle, gridStyle, rowsStyle, cardStyle };
}
