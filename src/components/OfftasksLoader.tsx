import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useAppTheme } from '@/theme/colors';

const LETTERS = Array.from('offtasks.');
const STAGGER_MS = 65;

/** Screen/fetch feedback only: never delays the arrival of real content. */
export function OfftasksLoader({
  style,
  active = true,
  compact = false,
  onSettled,
}: {
  style?: StyleProp<ViewStyle>;
  active?: boolean;
  compact?: boolean;
  onSettled?: () => void;
}) {
  const theme = useAppTheme();
  // This also works during authentication, outside NavigationContainer.
  const navigation = React.useContext(NavigationContext);
  const [focused, setFocused] = React.useState(
    () => navigation?.isFocused() ?? true,
  );
  const [foreground, setForeground] = React.useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  const [reduceMotion, setReduceMotion] = React.useState<boolean | null>(null);
  const letters = React.useRef(
    LETTERS.map(() => new Animated.Value(0)),
  ).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const requested = React.useRef(active);
  requested.current = active;
  const settled = React.useRef(onSettled);
  settled.current = onSettled;
  const [playing, setPlaying] = React.useState(active);
  React.useEffect(() => {
    if (active) setPlaying(true);
  }, [active]);
  React.useEffect(() => {
    if (
      !active &&
      playing &&
      (reduceMotion === true || !foreground || !focused)
    ) {
      setPlaying(false);
      settled.current?.();
    }
  }, [active, playing, reduceMotion, foreground, focused]);

  React.useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    AccessibilityInfo.isReduceMotionEnabled().then(
      value => {
        if (mounted && !preferenceChanged) setReduceMotion(value);
      },
      () => {
        if (mounted && !preferenceChanged) setReduceMotion(true);
      },
    );
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        preferenceChanged = true;
        setReduceMotion(value);
      },
    );
    const app = AppState.addEventListener('change', state =>
      setForeground(state === 'active'),
    );
    const focus = navigation?.addListener('focus', () => setFocused(true));
    const blur = navigation?.addListener('blur', () => setFocused(false));
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
      focus?.();
      blur?.();
    };
  }, [navigation]);

  React.useEffect(() => {
    if (reduceMotion !== false || !focused || !foreground || !playing) return;
    let stopped = false;
    let animation: Animated.CompositeAnimation;
    const play = () => {
      // Explicitly reset while invisible: native sequence loops can retain
      // the previous fade's zero opacity on subsequent iterations.
      letters.forEach(letter => letter.setValue(0));
      opacity.setValue(1);
      animation = Animated.sequence([
        Animated.stagger(
          STAGGER_MS,
          letters.map(letter =>
            Animated.timing(letter, {
              toValue: 1,
              duration: 520,
              easing: Easing.out(Easing.back(1.35)),
              useNativeDriver: true,
              isInteraction: false,
            }),
          ),
        ),
      ]);
      animation.start(({ finished }) => {
        if (!finished || stopped) return;
        // Fast refreshes still finish the tiny letter settle. Real content
        // is never held back, and the header keeps its resting wordmark.
        if (!requested.current) {
          setPlaying(false);
          settled.current?.();
          return;
        }
        animation = Animated.sequence([
          Animated.delay(600),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 240,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
            isInteraction: false,
          }),
        ]);
        animation.start(result => {
          if (result.finished && !stopped) play();
        });
      });
    };
    play();
    return () => {
      stopped = true;
      animation.stop();
    };
  }, [reduceMotion, focused, foreground, letters, opacity, playing]);

  const animated = reduceMotion === false && focused && foreground && playing;
  return (
    <View
      testID="offtasks-loader"
      accessible
      accessibilityLabel={active ? 'Loading' : 'offtasks.'}
      accessibilityState={{ busy: active }}
      style={[styles.container, compact && styles.compactContainer, style]}
    >
      <Animated.View
        testID="offtasks-loader-wordmark"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.wordmark,
          compact && styles.compactWordmark,
          {
            opacity:
              reduceMotion === null && active ? 0 : animated ? opacity : 1,
          },
        ]}
      >
        {LETTERS.map((letter, index) => (
          <Animated.Text
            key={index}
            testID={`offtasks-loader-letter-${index}`}
            style={[
              styles.letter,
              compact && styles.compactLetter,
              {
                color: compact
                  ? letter === '.'
                    ? '#009689'
                    : theme.colors.textPrimary
                  : letter === '.'
                  ? theme.isDark
                    ? '#8BD9B3'
                    : '#287456'
                  : theme.isDark
                  ? '#D8F3E5'
                  : '#152D25',
                opacity: animated
                  ? letters[index].interpolate({
                      inputRange: [0, 0.45, 1],
                      outputRange: [0, 1, 1],
                      extrapolate: 'clamp',
                    })
                  : 1,
                transform: [
                  {
                    translateY: animated
                      ? letters[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-10, 0],
                        })
                      : 0,
                  },
                ],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: { minHeight: 44 },
  compactWordmark: { paddingVertical: 0 },
  compactLetter: { fontSize: 20, lineHeight: 26, letterSpacing: -0.7 },
  container: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 12,
  },
  letter: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.65,
  },
});
