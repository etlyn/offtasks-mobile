import * as React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useAppTheme } from '@/theme/colors';
import { GlassSurface } from '@/components/GlassSurface';
import { useTaskCreation } from './TaskCreationContext';
import { TabBarIcon } from './TabBarIcon';

const DOCK_HEIGHT = 56;
const DOCK_INSET = 4;
const DOCK_RADIUS = DOCK_HEIGHT / 2;
const SELECTION_RADIUS = DOCK_RADIUS - DOCK_INSET;

export const DashboardTabBar: React.FC<
  BottomTabBarProps & { onNavigate?: () => void }
> = ({ state, descriptors, navigation, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const creation = useTaskCreation();
  const mainRoutes = state.routes.filter(route =>
    ['Calendar', 'Notes', 'Goals', 'Later'].includes(route.name),
  );
  const mainIndex = mainRoutes.findIndex(
    route => route.key === state.routes[state.index]?.key,
  );
  const lastMainIndex = React.useRef(Math.max(0, mainIndex));
  React.useEffect(() => {
    if (mainIndex >= 0) lastMainIndex.current = mainIndex;
  }, [mainIndex]);
  const lensIndex = mainIndex >= 0 ? mainIndex : lastMainIndex.current;
  const isNotes = state.routes[state.index]?.name === 'Notes';
  const isGoals = state.routes[state.index]?.name === 'Goals';
  const contextualAction = isNotes
    ? creation?.noteAction
    : isGoals
    ? creation?.goalAction
    : null;
  const addLabel = isNotes
    ? 'Add note'
    : isGoals
    ? creation?.goalAction?.label ?? 'Add goal'
    : 'Add task';
  const addDisabled =
    (isNotes || isGoals) && (!contextualAction || contextualAction.disabled);
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [width, setWidth] = React.useState(0);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(true);
  const position = React.useRef(new Animated.Value(0)).current;
  const stretch = React.useRef(new Animated.Value(1)).current;
  const lensOpacity = React.useRef(
    new Animated.Value(mainIndex < 0 ? 0 : 1),
  ).current;
  const laidOut = React.useRef(false);
  // Calendar's longer label needs more room at the capsule's curved edges.
  const totalWeight = mainRoutes.reduce(
    (sum, route) => sum + (route.name === 'Calendar' ? 1.2 : 1),
    0,
  );
  const tabWidths = mainRoutes.map(
    route =>
      (Math.max(0, width - DOCK_INSET * 2) *
        (route.name === 'Calendar' ? 1.2 : 1)) /
      totalWeight,
  );
  const selectionWidth = tabWidths[lensIndex] ?? 0;
  const target = tabWidths
    .slice(0, lensIndex)
    .reduce((sum, value) => sum + value, 0);
  const activeColor = theme.isDark ? '#F5F5F7' : '#292B30';
  const inactiveColor = theme.isDark ? '#B9BBC2' : '#63666D';

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    });
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      mounted = false;
      motion.remove();
      show.remove();
      hide.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!width) return;
    if (reduceMotion || !laidOut.current) {
      stretch.stopAnimation();
      stretch.setValue(1);
      position.setValue(target);
      laidOut.current = true;
      return;
    }
    // Position and spring deformation stay on the native animation driver.
    const movement = Animated.spring(position, {
      toValue: target,
      damping: 22,
      stiffness: 240,
      mass: 0.85,
      useNativeDriver: true,
    });
    movement.start();
    return () => movement.stop();
  }, [target, width, reduceMotion, position, stretch]);

  React.useEffect(() => {
    const toValue = mainIndex < 0 ? 0 : 1;
    if (reduceMotion) {
      lensOpacity.setValue(toValue);
      return;
    }
    const animation = Animated.timing(lensOpacity, {
      toValue,
      duration: 260,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [mainIndex, lensOpacity, reduceMotion]);

  const pressLens = (pressed: boolean) => {
    if (reduceMotion) return;
    Animated.spring(stretch, {
      toValue: pressed ? 0.98 : 1,
      damping: 16,
      stiffness: 300,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  };

  if (keyboardVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 12) + 4 },
      ]}
    >
      <View pointerEvents="box-none" style={styles.row}>
        <View testID="tab-dock-shadow" style={styles.shadow}>
          <GlassSurface
            testID="main-tab-dock"
            style={styles.dock}
            onLayout={event => setWidth(event.nativeEvent.layout.width)}
          >
            {!theme.isDark ? (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, styles.dockTint]}
              />
            ) : null}
            {width > 0 ? (
              <Animated.View
                testID="tab-selection-lens"
                pointerEvents="none"
                style={[
                  styles.lens,
                  {
                    width: selectionWidth,
                    opacity: lensOpacity,
                    transform: [{ translateX: position }, { scaleY: stretch }],
                  },
                ]}
              >
                <GlassSurface
                  navigation
                  testID="tab-selection-glass"
                  style={styles.selectionGlass}
                >
                  <View
                    style={[StyleSheet.absoluteFill, styles.selectionTint]}
                  />
                </GlassSurface>
              </Animated.View>
            ) : null}
            {mainRoutes.map((route, index) => {
              const focused = mainIndex === index;
              const options = descriptors[route.key].options;
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : options.title ?? route.name;
              const color = focused ? activeColor : inactiveColor;
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={options.tabBarAccessibilityLabel || label}
                  testID={options.tabBarButtonTestID}
                  onPressIn={() => pressLens(true)}
                  onPressOut={() => pressLens(false)}
                  onLongPress={() =>
                    navigation.emit({ type: 'tabLongPress', target: route.key })
                  }
                  onPress={() => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!event.defaultPrevented) onNavigate?.();
                    if (!focused && !event.defaultPrevented)
                      navigation.navigate(route.name, route.params);
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    { flex: route.name === 'Calendar' ? 1.2 : 1 },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <TabBarIcon
                      route={route.name}
                      selected={focused}
                      color={color}
                      cutout={theme.isDark ? '#414249' : '#F0F1F4'}
                    />
                  </View>
                  {typeof options.tabBarLabel === 'function' ? (
                    options.tabBarLabel({
                      focused,
                      color,
                      position: 'below-icon',
                      children: route.name,
                    })
                  ) : (
                    <Text
                      style={[
                        styles.label,
                        { color },
                        focused && styles.selectedLabel,
                      ]}
                    >
                      {label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
            {!theme.isDark ? (
              <View
                testID="tab-dock-edge"
                pointerEvents="none"
                style={styles.dockEdge}
              />
            ) : null}
          </GlassSurface>
        </View>
        {creation ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={addLabel}
            accessibilityHint={
              isNotes
                ? 'Opens a new note without leaving Notes'
                : addLabel === 'Add goal'
                ? 'Opens a new goal without leaving Goals'
                : 'Opens task creation without leaving this page'
            }
            disabled={addDisabled}
            accessibilityState={{ disabled: addDisabled }}
            onPress={() => {
              onNavigate?.();
              if (isNotes || isGoals) {
                contextualAction?.onPress();
                return;
              }
              creation.openTask(
                state.routes[state.index]?.name === 'Calendar'
                  ? creation.calendarDay
                  : state.routes[state.index]?.name === 'Later'
                  ? null
                  : undefined,
              );
            }}
            style={({ pressed }) => [
              styles.addShadow,
              addDisabled && styles.addDisabled,
              pressed && styles.addPressed,
            ]}
          >
            <GlassSurface testID="global-add-surface" style={styles.add}>
              <View
                testID="global-add-tint"
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, styles.addTint]}
              />
              <Plus
                size={23}
                strokeWidth={1.9}
                color={theme.isDark ? '#101916' : '#FFFFFF'}
              />
            </GlassSurface>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    row: {
      width: '100%',
      maxWidth: 600,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    shadow: {
      flex: 1,
      borderRadius: DOCK_RADIUS,
      shadowColor: '#101116',
      shadowOpacity: theme.isDark ? 0.16 : 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    dock: {
      flexDirection: 'row',
      minHeight: DOCK_HEIGHT,
      padding: DOCK_INSET,
      borderRadius: DOCK_RADIUS,
      borderWidth: 0,
    },
    dockTint: { backgroundColor: 'rgba(255,255,255,0.24)' },
    // Overlay the edge so the compact layout and selection geometry stay intact.
    dockEdge: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: DOCK_RADIUS,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(67,78,73,0.22)',
      borderTopColor: 'rgba(255,255,255,0.9)',
    },
    lens: {
      position: 'absolute',
      top: DOCK_INSET,
      bottom: DOCK_INSET,
      left: DOCK_INSET,
      // Concentric curves keep the inset even around both ends of the dock.
      borderRadius: SELECTION_RADIUS,
    },
    selectionGlass: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: SELECTION_RADIUS,
      borderWidth: 0,
    },
    selectionTint: {
      backgroundColor: theme.isDark
        ? 'rgba(230,232,231,0.10)'
        : 'rgba(136,145,140,0.09)',
    },
    tab: {
      flex: 1,
      minHeight: DOCK_HEIGHT - DOCK_INSET * 2,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRadius: SELECTION_RADIUS,
    },
    label: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500',
      letterSpacing: 0.05,
    },
    selectedLabel: { fontWeight: '600' },
    pressed: { opacity: 0.65 },
    addShadow: {
      width: 46,
      height: 46,
      borderRadius: 23,
      shadowColor: '#152D25',
      shadowOffset: { width: 0, height: 5 },
      shadowRadius: 10,
      shadowOpacity: 0.2,
      elevation: 6,
    },
    add: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
    },
    addTint: {
      // Match the selected day in MonthCalendar in both themes.
      backgroundColor: theme.isDark ? '#D8F3E5' : '#152D25',
    },
    addPressed: { opacity: 0.7 },
    addDisabled: { opacity: 0.4 },
  });
