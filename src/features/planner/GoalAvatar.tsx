import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { goalColors, type GoalAppearance } from '@/lib/goalAppearance';
import { useAppTheme } from '@/theme/colors';

export function GoalAvatar({
  name,
  appearance,
  size = 48,
}: {
  name: string;
  appearance: GoalAppearance;
  size?: number;
}) {
  const theme = useAppTheme();
  const color = goalColors[appearance.color] ?? goalColors[0];
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => Array.from(word)[0])
      .join('')
      .toLocaleUpperCase() || 'G';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        s.avatar,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: theme.isDark ? color.dark : color.light,
        },
      ]}
    >
      <View style={s.light} />
      <Text
        style={{
          fontSize: size * (appearance.emoji ? 0.5 : 0.32),
          fontWeight: '600',
          color: theme.isDark ? color.light : color.ink,
        }}
      >
        {appearance.emoji ?? initials}
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  light: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.16)',
    left: '-36%',
    top: '-40%',
  },
});
