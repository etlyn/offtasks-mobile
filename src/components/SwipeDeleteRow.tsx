import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';

const ACTION_WIDTH = 64;
const TRANSITION_MS = 240;
let closeOpenRow: (() => void) | null = null;

/** Reveal an action while keeping the item legible and its removal confirmed. */
export function SwipeDeleteRow({
  children,
  label,
  onDelete,
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  label: string;
  onDelete: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = React.useState(false);
  const offset = useSharedValue(0);
  const initial = useSharedValue(0);
  const dragging = useSharedValue(false);
  const interrupted = useSharedValue(false);
  const reduceMotion = useReducedMotion();
  const close = React.useCallback(() => {
    offset.value = reduceMotion
      ? 0
      : withTiming(0, {
          duration: TRANSITION_MS,
          easing: Easing.inOut(Easing.cubic),
        });
    setOpen(false);
    if (closeOpenRow === close) closeOpenRow = null;
  }, [offset, reduceMotion]);
  const begin = React.useCallback(() => {
    if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
    closeOpenRow = close;
  }, [close]);
  const settle = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
        closeOpenRow = close;
      } else if (closeOpenRow === close) {
        closeOpenRow = null;
      }
    },
    [close],
  );
  React.useEffect(
    () => () => {
      if (closeOpenRow === close) closeOpenRow = null;
    },
    [close],
  );
  const remove = React.useCallback(() => {
    if (disabled) return;
    close();
    onDelete();
  }, [close, disabled, onDelete]);
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .withTestId('swipe-delete-row')
        .enabled(!disabled)
        .maxPointers(1)
        .activeOffsetX(open ? [-12, 12] : [-12, 10000])
        .failOffsetY([-12, 12])
        .onStart(() => {
          cancelAnimation(offset);
          initial.value = offset.value;
          dragging.value = true;
          interrupted.value = false;
          runOnJS(begin)();
        })
        .onUpdate(event => {
          if (event.numberOfPointers > 1) {
            interrupted.value = true;
            return;
          }
          offset.value = Math.max(
            0,
            Math.min(ACTION_WIDTH, initial.value - event.translationX),
          );
        })
        .onEnd((event, success) => {
          if (!success || interrupted.value) return;
          const released = Math.max(
            0,
            Math.min(ACTION_WIDTH, initial.value - event.translationX),
          );
          const projected = released - event.velocityX * 0.05;
          const next = projected > ACTION_WIDTH / 2;
          offset.value = reduceMotion
            ? next
              ? ACTION_WIDTH
              : 0
            : withTiming(next ? ACTION_WIDTH : 0, {
                duration: TRANSITION_MS,
                easing: Easing.inOut(Easing.cubic),
              });
          dragging.value = false;
          runOnJS(settle)(next);
        })
        .onFinalize(() => {
          if (!dragging.value) return;
          offset.value = reduceMotion
            ? initial.value
            : withTiming(initial.value, {
                duration: TRANSITION_MS,
                easing: Easing.inOut(Easing.cubic),
              });
          dragging.value = false;
          runOnJS(settle)(initial.value > ACTION_WIDTH / 2);
        }),
    [
      begin,
      disabled,
      dragging,
      initial,
      interrupted,
      offset,
      open,
      reduceMotion,
      settle,
    ],
  );
  const contentStyle = useAnimatedStyle(() => ({ marginRight: offset.value }));
  const actionStyle = useAnimatedStyle(() => ({ width: offset.value }));

  return (
    <GestureDetector gesture={pan}>
      <View style={style}>
        <Animated.View
          style={[styles.actionSlot, actionStyle]}
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
          pointerEvents={open ? 'auto' : 'none'}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={disabled}
            onPress={remove}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Trash2 size={20} strokeWidth={1.8} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
        <Animated.View style={contentStyle}>
          {children}
          {open ? (
            <Pressable
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              onPress={close}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  actionSlot: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  action: {
    position: 'absolute',
    width: ACTION_WIDTH - 6,
    right: 0,
    top: 0,
    bottom: 0,
    minHeight: 44,
    backgroundColor: '#D33B43',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.82 },
});
