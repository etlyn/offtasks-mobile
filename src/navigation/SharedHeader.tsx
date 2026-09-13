import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Menu, Search } from 'lucide-react-native';
import { GlassSurface } from '@/components/GlassSurface';
import { CalendarBackdrop } from '@/components/PageBackdrop';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAppTheme } from '@/theme/colors';

type HeaderEntry = {
  priority: number;
  onMenu?: () => void;
  onBack?: () => void;
  onSearch?: () => void;
  searchLabel?: string;
  searching?: boolean;
};

export function createHeaderRegistry() {
  const entries = new Map<string, HeaderEntry>();
  const listeners = new Set<() => void>();
  let snapshot: HeaderEntry | null = null;
  const publish = () => {
    snapshot =
      [...entries.values()].sort((a, b) => b.priority - a.priority)[0] ?? null;
    listeners.forEach(listener => listener());
  };
  return {
    set: (id: string, entry: HeaderEntry) => {
      entries.set(id, entry);
      publish();
    },
    remove: (id: string) => {
      entries.delete(id);
      publish();
    },
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
const HeaderContext = React.createContext<ReturnType<
  typeof createHeaderRegistry
> | null>(null);
export const HeaderLayer = React.createContext(0);
export const useSharedHeader = () => React.useContext(HeaderContext);

export function SharedHeaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const registry = React.useMemo(createHeaderRegistry, []);
  return (
    <HeaderContext.Provider value={registry}>{children}</HeaderContext.Provider>
  );
}

/** Screens publish behavior; only the persistent host renders the header. */
export function HeaderSlot({
  onMenu,
  onBack,
  onSearch,
  searchLabel,
  searching,
}: Omit<HeaderEntry, 'priority'>) {
  const registry = useSharedHeader();
  const layer = React.useContext(HeaderLayer);
  const id = React.useId();
  const entry = React.useRef<HeaderEntry>({ priority: layer });
  const focused = React.useRef(false);
  entry.current = {
    priority: layer + (searching ? 1 : 0),
    onMenu,
    onBack,
    onSearch,
    searchLabel,
    searching,
  };
  React.useLayoutEffect(() => {
    if (focused.current) registry?.set(id, entry.current);
  }, [registry, id, layer, onMenu, onBack, onSearch, searchLabel, searching]);
  useFocusEffect(
    React.useCallback(() => {
      focused.current = true;
      registry?.set(id, entry.current);
      return () => {
        focused.current = false;
        registry?.remove(id);
      };
    }, [registry, id]),
  );
  return null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
function HeaderButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const opacity = React.useRef(new Animated.Value(1)).current;
  const { reduceMotion } = useCalendarTransition();
  React.useEffect(() => () => opacity.stopAnimation(), [opacity]);
  const feedback = (pressed: boolean) => {
    opacity.stopAnimation();
    if (reduceMotion) {
      opacity.setValue(pressed ? 0.65 : 1);
      return;
    }
    Animated.timing(opacity, {
      toValue: pressed ? 0.65 : 1,
      duration: 160,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => feedback(true)}
      onPressOut={() => feedback(false)}
      style={[s.touch, { opacity }]}
    >
      <GlassSurface style={s.surface}>{children}</GlassSurface>
    </AnimatedPressable>
  );
}

function NavigationIcon({ back }: { back: boolean }) {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const progress = React.useRef(new Animated.Value(back ? 1 : 0)).current;
  React.useEffect(() => {
    progress.stopAnimation();
    if (reduceMotion) {
      progress.setValue(back ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: back ? 1 : 0,
      duration: 180,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [back, progress, reduceMotion]);
  return (
    <View
      style={s.navigationIcon}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <Menu size={18} strokeWidth={1.8} color={theme.colors.textPrimary} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <ArrowLeft
          size={18}
          strokeWidth={1.8}
          color={theme.colors.textPrimary}
        />
      </Animated.View>
    </View>
  );
}

export function SharedHeaderHost({
  onMenu,
  onSearch,
  globalSearch = false,
  covered = false,
}: {
  onMenu: () => void;
  onSearch: () => void;
  globalSearch?: boolean;
  covered?: boolean;
}) {
  const registry = useSharedHeader()!;
  const entry = React.useSyncExternalStore(
    registry.subscribe,
    registry.getSnapshot,
    registry.getSnapshot,
  );
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const overlay = covered || entry?.searching;
  return (
    <View
      testID="persistent-header-host"
      pointerEvents="box-none"
      style={s.host}
    >
      <View
        testID="persistent-main-header"
        pointerEvents={overlay ? 'none' : 'auto'}
        accessibilityElementsHidden={!!overlay}
        importantForAccessibility={overlay ? 'no-hide-descendants' : 'auto'}
        style={[
          s.header,
          { paddingTop: insets.top + 4, opacity: overlay ? 0 : 1 },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            s.background,
            {
              height: insets.top + 58,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <View style={{ height }}>
            <CalendarBackdrop />
          </View>
        </View>
        <HeaderButton
          label={entry?.onBack ? 'Back to goals' : 'Open navigation menu'}
          onPress={entry?.onBack ?? entry?.onMenu ?? onMenu}
        >
          <NavigationIcon back={!!entry?.onBack} />
        </HeaderButton>
        <Text style={[s.wordmark, { color: theme.colors.textPrimary }]}>
          offtasks<Text style={s.dot}>.</Text>
        </Text>
        <HeaderButton
          label={globalSearch ? 'Search' : entry?.searchLabel ?? 'Search tasks'}
          onPress={globalSearch ? onSearch : entry?.onSearch ?? onSearch}
        >
          <Search
            size={18}
            strokeWidth={1.8}
            color={theme.isDark ? '#D8F3E5' : '#152D25'}
          />
        </HeaderButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  navigationIcon: { width: 18, height: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  touch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontSize: 20, fontWeight: '700', letterSpacing: -0.7 },
  dot: { color: '#009689' },
});
