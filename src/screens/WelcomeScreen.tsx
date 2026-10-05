import React from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  useNavigation,
  StackActions,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GentlePressable as Pressable,
  PageBackdrop,
} from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAppTheme } from '@/theme/colors';
import { useAuth } from '@/providers/AuthProvider';
import { completeWelcome } from '@/lib/onboarding';

const steps = [
  {
    image: require('../assets/onboarding/capture.png'),
    title: 'A little less on your mind.',
    detail: 'Catch a thought, add a task. Keep it in Later until you’re ready.',
  },
  {
    image: require('../assets/onboarding/calendar.png'),
    title: 'Make room for your day.',
    detail: 'See your day in Calendar. Check things off at your own pace.',
  },
  {
    image: require('../assets/onboarding/grow.png'),
    title: 'Space for what matters.',
    detail:
      'Keep ideas in Notes and move toward your Goals. No account needed.',
  },
];

export function WelcomeScreen() {
  React.useEffect(() => {
    // Warm the next illustrations in development too, so a network image
    // doesn't pop into place halfway through the gentle page transition.
    for (const step of steps) {
      const uri = Image.resolveAssetSource(step.image)?.uri;
      if (uri?.startsWith('http')) {
        void Promise.resolve(Image.prefetch(uri)).catch(() => {});
      }
    }
  }, []);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { session } = useAuth();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { reduceMotion, animateLayout } = useCalendarTransition();
  const [index, setIndex] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const lock = React.useRef(false);
  const progress = React.useRef(new Animated.Value(1)).current;
  const animation = React.useRef<Animated.CompositeAnimation | null>(null);
  React.useEffect(() => () => animation.current?.stop(), []);
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const step = steps[index];
  const last = index === steps.length - 1;

  const move = (next: number) => {
    if (lock.current || next < 0 || next >= steps.length || next === index)
      return;
    if (reduceMotion) {
      setIndex(next);
      return;
    }
    lock.current = true;
    const fade = Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion ? 0 : 150,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.current = fade;
    fade.start(({ finished }) => {
      if (!finished) return;
      animateLayout();
      setIndex(next);
      animation.current = Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? 0 : 330,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
      animation.current.start(() => {
        lock.current = false;
      });
    });
  };
  const finish = async (mode?: 'signIn' | 'signUp') => {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await completeWelcome();
    } catch {
      /* Keep the app usable if persistence fails. */
    }
    if (navigation.canGoBack() && (!mode || session)) {
      navigation.goBack();
    } else if (navigation.canGoBack() && mode && !session) {
      // Replaying welcome must not reset the guest's current tab or date.
      navigation.dispatch(
        StackActions.replace('Account', { initialMode: mode }),
      );
    } else {
      navigation.reset({
        index: mode && !session ? 1 : 0,
        routes: [
          { name: 'Home' },
          ...(mode && !session
            ? [{ name: 'Account', params: { initialMode: mode } }]
            : []),
        ],
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <PageBackdrop />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.wordmark, { color: theme.colors.textPrimary }]}>
          offtasks<Text style={{ color: '#009689' }}>.</Text>
        </Text>
        {!session ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => finish('signIn')}
            style={styles.textButton}
          >
            <Text style={[styles.link, { color: brand }]}>Sign in</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [reduceMotion ? 0 : 10, 0],
                }),
              },
            ],
          }}
        >
          <Image
            accessible={false}
            source={step.image}
            resizeMode="contain"
            style={[styles.art, { height: Math.min(320, height * 0.35) }]}
          />
          <Text
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            style={[styles.title, { color: theme.colors.textPrimary }]}
          >
            {step.title}
          </Text>
          <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>
            {step.detail}
          </Text>
        </Animated.View>
      </ScrollView>
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={styles.progressRow}>
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Welcome step ${i + 1} of 3`}
                accessibilityState={{ selected: i === index }}
                disabled={busy}
                onPress={() => move(i)}
                style={styles.dotTarget}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: index === i ? 20 : 5,
                      backgroundColor: brand,
                      opacity: index === i ? 1 : 0.23,
                    },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={
            last && !session ? 'Opens your space without an account' : undefined
          }
          disabled={busy}
          onPress={() => (last ? finish() : move(index + 1))}
          style={[styles.primary, { backgroundColor: brand }]}
        >
          <Text
            style={[
              styles.primaryText,
              { color: theme.isDark ? '#152D25' : '#FFFFFF' },
            ]}
          >
            {last ? (session ? 'Back to my space' : 'Get started') : 'Continue'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            navigation.canGoBack() ? 'Close welcome' : 'Skip welcome'
          }
          disabled={busy}
          style={[styles.textButton, styles.skip]}
          onPress={() => finish()}
        >
          <Text style={[styles.link, { color: brand }]}>
            {navigation.canGoBack() ? 'Close' : 'Skip'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { fontSize: 20, fontWeight: '700', letterSpacing: -0.7 },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  art: { width: '100%' },
  title: {
    fontSize: 27,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 33,
    maxWidth: 330,
  },
  detail: { fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 350 },
  footer: { paddingHorizontal: 24 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dots: { flexDirection: 'row' },
  dotTarget: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { height: 5, borderRadius: 3 },
  primary: {
    minHeight: 50,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryText: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  textButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: { fontSize: 13, fontWeight: '600' },
  skip: { marginTop: 8 },
});
