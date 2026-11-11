import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { goalColors, type GoalAppearance } from '@/lib/goalAppearance';
import { useAppTheme } from '@/theme/colors';
import { goalLogoUri, type GoalLogo } from '@/lib/goalLogo';

export function GoalAvatar({
  name,
  appearance,
  logo,
  size = 48,
}: {
  name: string;
  appearance: GoalAppearance;
  logo?: GoalLogo | null;
  size?: number;
}) {
  const theme = useAppTheme();
  const color = goalColors[appearance.color] ?? goalColors[0];
  const uri = logo ? goalLogoUri(logo) : null;
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
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
      {(!uri || loaded !== uri || failed === uri) && (
        <Text
          style={{
            fontSize: size * (appearance.emoji ? 0.5 : 0.32),
            fontWeight: '600',
            color: theme.isDark ? color.light : color.ink,
          }}
        >
          {appearance.emoji ?? initials}
        </Text>
      )}
      {uri && failed !== uri && (
        <Image
          testID="goal-avatar-logo"
          source={{ uri }}
          resizeMode="contain"
          style={s.logo}
          onLoad={() => setLoaded(uri)}
          onError={() => setFailed(uri)}
        />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { position: 'absolute', width: '84%', height: '84%' },
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
