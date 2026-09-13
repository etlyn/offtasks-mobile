import React from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/colors';

const emoji = ['🎉', '✨', '🥳', '⭐️', '🙌', '🎊'];
const particles = Array.from({ length: 18 }, (_, index) => ({
  emoji: emoji[index % emoji.length],
  spread: (((index * 7) % 19) - 9) / 10,
  lift: 100 + (index % 4) * 24,
  spin: (index % 2 ? 1 : -1) * (35 + index * 9),
  delay: (index % 6) * 55,
}));

/** Native emoji glyphs, with native-driven movement; never intercepts touches. */
export function EmojiCelebration({
  trigger,
  active,
  reduceMotion,
}: {
  trigger: number;
  active: boolean;
  reduceMotion: boolean;
}) {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const values = React.useRef(
    particles.map(() => new Animated.Value(0)),
  ).current;
  const [visible, setVisible] = React.useState(false);
  const lastPlayed = React.useRef(0);
  React.useEffect(() => {
    if (!active || !trigger) {
      lastPlayed.current = trigger;
      setVisible(false);
      return;
    }
    if (lastPlayed.current === trigger) return;
    lastPlayed.current = trigger;
    setVisible(true);
    if (reduceMotion) {
      const timer = setTimeout(() => setVisible(false), 1400);
      return () => clearTimeout(timer);
    }
    values.forEach(value => {
      value.stopAnimation();
      value.setValue(0);
    });
    const burst = Animated.parallel(
      values.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 1750,
          delay: particles[index].delay,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ),
    );
    burst.start(({ finished }) => {
      if (finished) setVisible(false);
    });
    return () => burst.stop();
  }, [trigger, active, reduceMotion, values]);
  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="statistics-celebration"
      style={s.layer}
    >
      {reduceMotion ? (
        <View
          testID="statistics-static-celebration"
          style={[
            s.staticBadge,
            { top: insets.top + 80, backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={{ color: theme.colors.textPrimary }}>🎉 Nice work</Text>
        </View>
      ) : (
        particles.map((particle, index) => {
          const progress = values[index];
          return (
            <Animated.Text
              key={index}
              style={[
                s.emoji,
                {
                  left: width / 2 - 14,
                  top: insets.top + 220,
                  opacity: progress.interpolate({
                    inputRange: [0, 0.08, 0.75, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: [
                          0,
                          particle.spread * width * 0.42,
                          particle.spread * width * 0.5,
                        ],
                      }),
                    },
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: [0, -particle.lift, height * 0.62],
                      }),
                    },
                    {
                      rotate: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${particle.spin}deg`],
                      }),
                    },
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0.5, 1, 0.85],
                      }),
                    },
                  ],
                },
              ]}
            >
              {particle.emoji}
            </Animated.Text>
          );
        })
      )}
    </View>
  );
}
const s = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: 5 },
  emoji: { position: 'absolute', fontSize: 25 },
  staticBadge: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
});
