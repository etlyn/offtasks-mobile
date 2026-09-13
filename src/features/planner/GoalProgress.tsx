import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAppTheme } from '@/theme/colors';

export function GoalProgress({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color?: string;
}) {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const ratio = total > 0 ? Math.max(0, Math.min(1, completed / total)) : 0;
  const progress = React.useRef(new Animated.Value(ratio)).current;
  React.useEffect(() => {
    progress.stopAnimation();
    if (reduceMotion) {
      progress.setValue(ratio);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: ratio,
      duration: 360,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, ratio, reduceMotion]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Goal progress"
      accessibilityValue={{
        min: 0,
        max: total || 1,
        now: completed,
        text: total
          ? `${completed} of ${total} tasks completed`
          : 'No tasks yet',
      }}
      style={[
        s.track,
        {
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.09)'
            : 'rgba(21,45,37,0.07)',
        },
      ]}
    >
      <Animated.View
        style={[
          s.fill,
          {
            backgroundColor: color ?? (theme.isDark ? '#D8F3E5' : '#152D25'),
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}
const s = StyleSheet.create({
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
});
