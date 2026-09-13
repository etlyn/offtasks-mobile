import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useAppTheme } from '@/theme/colors';
import { OfftasksBlurNative as NativeBlur } from './OfftasksBlurNative';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export function GlassSurface({
  children,
  style,
  navigation = false,
  ...props
}: ViewProps & { navigation?: boolean }) {
  const theme = useAppTheme();
  const id = React.useId().replace(/:/g, '');
  return (
    <View
      {...props}
      style={[styles.surface, theme.isDark ? styles.dark : styles.light, style]}
    >
      {NativeBlur ? (
        <NativeBlur
          dark={theme.isDark}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            theme.isDark ? styles.fallbackDark : styles.fallbackLight,
          ]}
        />
      )}
      {children}
      {navigation ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0.6" y2="1">
                <Stop
                  offset="0"
                  stopColor="#FFFFFF"
                  stopOpacity={theme.isDark ? 0.18 : 0.55}
                />
                <Stop offset="0.42" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.06" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${id}-sheen)`} />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: 'hidden', borderWidth: 1, borderRadius: 28 },
  light: { borderColor: 'rgba(255,255,255,0.9)' },
  dark: { borderColor: 'rgba(255,255,255,0.16)' },
  fallbackLight: { backgroundColor: '#F7FAF8' },
  fallbackDark: { backgroundColor: '#1A2224' },
});
