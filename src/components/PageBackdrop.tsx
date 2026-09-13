import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '@/theme/colors';

export function CalendarBackdrop() {
  const { isDark } = useAppTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="calendarMint" cx="95%" cy="12%" rx="90%" ry="55%">
            <Stop
              offset="0"
              stopColor={isDark ? '#17473D' : '#CBE7D9'}
              stopOpacity={isDark ? 0.7 : 0.85}
            />
            <Stop
              offset="1"
              stopColor={isDark ? '#09090B' : '#F4F6FB'}
              stopOpacity="0"
            />
          </RadialGradient>
          <RadialGradient id="calendarWarm" cx="0%" cy="48%" rx="80%" ry="48%">
            <Stop
              offset="0"
              stopColor={isDark ? '#38301D' : '#F0E8D6'}
              stopOpacity="0.45"
            />
            <Stop
              offset="1"
              stopColor={isDark ? '#09090B' : '#F4F6FB'}
              stopOpacity="0"
            />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#calendarMint)" />
        <Rect width="100%" height="100%" fill="url(#calendarWarm)" />
      </Svg>
    </View>
  );
}
