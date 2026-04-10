import * as React from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/theme/colors';

interface PrioritySliderProps {
  value: number; // 0-3 (None, Low, Medium, High)
  onChange: (value: number) => void;
  disabled?: boolean;
}

const PRIORITY_LABELS = ['None', 'Low', 'Medium', 'High'];
const PRIORITY_COLORS = ['#d4d4d8', '#fbc86f', '#f59e0b', '#f97316'];
const THUMB_SIZE = 28;
const STEP_DOT_SIZE = 6;
const STEP_TAP_TARGET_WIDTH = 36;

export const PrioritySlider: React.FC<PrioritySliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [dragPosition, setDragPosition] = React.useState<number | null>(null);
  const valueRef = React.useRef(value);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTrackWidth(width);
  }, []);

  const getCenterForValue = React.useCallback(
    (nextValue: number) => {
      if (trackWidth <= 0) {
        return 14;
      }

      const segmentWidth = trackWidth / 4;
      return nextValue * segmentWidth + segmentWidth / 2;
    },
    [trackWidth],
  );

  const updateValueFromPosition = React.useCallback(
    (positionX: number) => {
      if (disabled || trackWidth <= 0) {
        return;
      }

      const segmentWidth = trackWidth / 4;
      const clampedPosition = Math.min(trackWidth, Math.max(0, positionX));
      setDragPosition(clampedPosition);
      const nextValue = Math.min(
        3,
        Math.max(
          0,
          Math.round((clampedPosition - segmentWidth / 2) / segmentWidth),
        ),
      );

      if (nextValue !== valueRef.current) {
        valueRef.current = nextValue;
        onChange(nextValue);
      }
    },
    [disabled, onChange, trackWidth],
  );

  const handleGesturePosition = React.useCallback(
    (event: GestureResponderEvent) => {
      updateValueFromPosition(event.nativeEvent.locationX);
    },
    [updateValueFromPosition],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !disabled && Math.abs(gestureState.dx) > 1,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          !disabled && Math.abs(gestureState.dx) > 2,
        onPanResponderGrant: event => {
          handleGesturePosition(event);
        },
        onPanResponderMove: event => {
          handleGesturePosition(event);
        },
        onPanResponderRelease: event => {
          handleGesturePosition(event);
          setDragPosition(null);
        },
        onPanResponderTerminate: () => {
          setDragPosition(null);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [disabled, handleGesturePosition],
  );

  const handlePress = React.useCallback(
    (index: number) => {
      if (!disabled) {
        setDragPosition(null);
        valueRef.current = index;
        onChange(index);
      }
    },
    [disabled, onChange],
  );

  const handleTrackPress = React.useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      updateValueFromPosition(event.nativeEvent.locationX);
      setDragPosition(null);
    },
    [updateValueFromPosition],
  );

  const segmentWidth = trackWidth > 0 ? trackWidth / 4 : 0;
  const thumbCenter =
    dragPosition ??
    (segmentWidth > 0 ? getCenterForValue(value) : THUMB_SIZE / 2);
  const thumbPosition = Math.max(0, thumbCenter - THUMB_SIZE / 2);
  const activeTrackWidth =
    trackWidth > 0 ? Math.max(thumbCenter, THUMB_SIZE / 2) : 0;
  const activeColor = PRIORITY_COLORS[value];

  return (
    <View style={styles.container}>
      <View
        style={styles.trackContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={handleTrackPress}
          style={styles.trackPressable}
          disabled={disabled}
        >
          <View style={styles.track}>
            <View
              style={[
                styles.activeTrack,
                {
                  width: activeTrackWidth,
                  backgroundColor: activeColor,
                },
              ]}
            />
            <View
              style={[
                styles.thumb,
                {
                  left: thumbPosition,
                  borderColor: activeColor,
                  shadowColor: activeColor,
                },
              ]}
            />
          </View>
        </Pressable>

        <View style={styles.stepContainer} pointerEvents="none">
          {[...Array(4)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.step,
                {
                  left:
                    segmentWidth > 0
                      ? getCenterForValue(index) - STEP_DOT_SIZE / 2
                      : 0,
                },
              ]}
            >
              <View
                style={[
                  styles.stepDot,
                  index === value && {
                    backgroundColor: activeColor,
                    transform: [{ scale: 1.25 }],
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.tapTargets} pointerEvents="box-none">
          {[...Array(4)].map((_, index) => (
            <Pressable
              key={`tap-${index}`}
              style={[
                styles.stepTapTarget,
                {
                  left:
                    segmentWidth > 0
                      ? getCenterForValue(index) - STEP_TAP_TARGET_WIDTH / 2
                      : 0,
                },
              ]}
              onPress={() => handlePress(index)}
              disabled={disabled}
            />
          ))}
        </View>
      </View>

      <View style={styles.labelRow}>
        {PRIORITY_LABELS.map((label, index) => (
          <Text
            key={label}
            style={[
              styles.label,
              index === value && styles.labelActive,
              index === value && { color: activeColor },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    trackContainer: {
      width: '100%',
      paddingTop: 10,
      paddingBottom: 16,
      position: 'relative',
      height: 48,
      justifyContent: 'center',
    },
    trackPressable: {
      width: '100%',
      height: 40,
      justifyContent: 'center',
    },
    track: {
      height: 10,
      borderRadius: 999,
      position: 'relative',
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      width: '100%',
      overflow: 'visible',
    },
    activeTrack: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 999,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
      position: 'absolute',
      top: -10,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    stepContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    step: {
      position: 'absolute',
      top: '50%',
      marginTop: -(STEP_DOT_SIZE / 2),
      width: STEP_DOT_SIZE,
      height: STEP_DOT_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tapTargets: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    stepTapTarget: {
      position: 'absolute',
      top: 0,
      width: STEP_TAP_TARGET_WIDTH,
      height: 48,
    },
    stepDot: {
      width: STEP_DOT_SIZE,
      height: STEP_DOT_SIZE,
      borderRadius: 3,
      backgroundColor: theme.colors.borderStrong,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    label: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
    labelActive: {
      fontWeight: '600',
    },
  });
