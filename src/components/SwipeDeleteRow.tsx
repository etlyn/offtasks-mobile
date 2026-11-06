import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  type NativeGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';

const ACTION_WIDTH = 64;
const REVEAL_WIDTH = 112;
const TRANSITION_MS = 240;
let closeOpenRow: (() => void) | null = null;
const SwipeOffsetContext = React.createContext<SharedValue<number> | null>(
  null,
);

/** Keep row details readable as the surrounding card slides offscreen. */
export function SwipeRowContents({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const offset = React.useContext(SwipeOffsetContext);
  const readableStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.min(offset?.value ?? 0, REVEAL_WIDTH - 4) },
    ],
  }));
  return (
    <Animated.View style={[style, readableStyle]}>{children}</Animated.View>
  );
}

/** Choose a safe resting point without performing the removal. */
export function swipeRevealTarget({
  offset,
  initial,
  rowWidth,
  translationX,
  velocityX,
}: {
  offset: number;
  initial: number;
  rowWidth: number;
  translationX: number;
  velocityX: number;
}): number {
  'worklet';
  const projected = offset - velocityX * 0.05;
  const closing =
    initial > 0 && (translationX > ACTION_WIDTH / 2 || velocityX > 400);
  if (closing || projected <= ACTION_WIDTH / 2) return 0;
  return Math.min(REVEAL_WIDTH, rowWidth * 0.42);
}

/** Slide the item over a red removal surface; removal stays confirmed. */
export function SwipeDeleteRow({
  children,
  label,
  onDelete,
  disabled = false,
  style,
  scrollGesture,
  pressGuard,
}: {
  children: React.ReactNode;
  label: string;
  onDelete: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scrollGesture?: NativeGesture;
  pressGuard?: React.RefObject<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const offset = useSharedValue(0);
  const rowWidth = useSharedValue(ACTION_WIDTH);
  const initial = useSharedValue(0);
  const dragging = useSharedValue(false);
  const interrupted = useSharedValue(false);
  const pressGuardTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
    if (pressGuardTimer.current) clearTimeout(pressGuardTimer.current);
    if (pressGuard) pressGuard.current = true;
    if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
    closeOpenRow = close;
  }, [close, pressGuard]);
  const settle = React.useCallback(
    (next: boolean) => {
      if (pressGuard) {
        if (pressGuardTimer.current) clearTimeout(pressGuardTimer.current);
        pressGuardTimer.current = setTimeout(() => {
          pressGuard.current = false;
          pressGuardTimer.current = null;
        }, TRANSITION_MS);
      }
      setOpen(next);
      if (next) {
        if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
        closeOpenRow = close;
      } else if (closeOpenRow === close) {
        closeOpenRow = null;
      }
    },
    [close, pressGuard],
  );
  React.useEffect(
    () => () => {
      if (closeOpenRow === close) closeOpenRow = null;
      if (pressGuardTimer.current) clearTimeout(pressGuardTimer.current);
    },
    [close],
  );
  const remove = React.useCallback(() => {
    if (disabled || pressGuard?.current) return;
    close();
    onDelete();
  }, [close, disabled, onDelete, pressGuard]);
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .withTestId('swipe-delete-row')
        .enabled(!disabled)
        .blocksExternalGesture(...(scrollGesture ? [scrollGesture] : []))
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
            Math.min(rowWidth.value, initial.value - event.translationX),
          );
        })
        .onEnd((event, success) => {
          if (!success || interrupted.value) return;
          const target = swipeRevealTarget({
            offset: offset.value,
            initial: initial.value,
            rowWidth: rowWidth.value,
            translationX: event.translationX,
            velocityX: event.velocityX,
          });
          offset.value = reduceMotion
            ? target
            : withTiming(target, {
                duration: TRANSITION_MS,
                easing: Easing.inOut(Easing.cubic),
              });
          dragging.value = false;
          runOnJS(settle)(target > 0);
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
      rowWidth,
      settle,
      scrollGesture,
    ],
  );
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset.value }],
  }));
  const actionStyle = useAnimatedStyle(() => ({ width: offset.value }));

  return (
    <GestureDetector gesture={pan}>
      <View
        testID="swipe-delete-row-container"
        style={[styles.container, style]}
        onTouchStart={() => {
          if (pressGuard) pressGuard.current = false;
        }}
        onLayout={({ nativeEvent }) => {
          const width = nativeEvent.layout.width;
          if (width > 0) rowWidth.value = width;
        }}
      >
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
            <View style={styles.iconSlot}>
              <Trash2 size={20} strokeWidth={1.8} color="#FFFFFF" />
            </View>
          </Pressable>
        </Animated.View>
        <Animated.View style={contentStyle}>
          <SwipeOffsetContext.Provider value={offset}>
            {children}
          </SwipeOffsetContext.Provider>
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
  container: { overflow: 'hidden' },
  actionSlot: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  action: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    minHeight: 44,
    backgroundColor: '#D33B43',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconSlot: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.82 },
});
