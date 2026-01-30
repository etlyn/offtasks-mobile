import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabTodayIcon } from '@/components/icons/TabToday';
import { TabTomorrowIcon } from '@/components/icons/TabTomorrow';
import { TabUpcomingIcon } from '@/components/icons/TabUpcoming';
import { palette } from '@/theme/colors';
const labels: Record<string, string> = {
  Today: 'Today',
  Tomorrow: 'Tomorrow',
  Upcoming: 'Later',
};

const TabIcon = ({ route, focused }: { route: string; focused: boolean }) => {
  const color = focused ? palette.mintStrong : '#71717b';

  switch (route) {
    case 'Today':
      return <TabTodayIcon size={20} color={color} />;
    case 'Tomorrow':
      return <TabTomorrowIcon size={20} color={color} />;
    case 'Upcoming':
      return <TabUpcomingIcon size={20} color={color} />;
    default:
      return <TabTodayIcon size={20} color={color} />;
  }
};

export const DashboardTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 12 }]}> 
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.containerSheen} />
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const fallbackLabel = labels[route.name] ?? route.name;
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : fallbackLabel;

          const resolvedLabel =
            typeof label === 'function'
              ? label({
                  focused: isFocused,
                  color: isFocused ? palette.mintStrong : palette.slate600,
                  position: 'below-icon',
                  children: fallbackLabel,
                })
              : label;

          const labelText =
            typeof resolvedLabel === 'string'
              ? resolvedLabel
              : fallbackLabel;

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityHint={options.tabBarButtonTestID}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.tabItem,
                isFocused && styles.tabItemActive,
                pressed && styles.tabItemPressed,
              ]}
            >
              <View style={styles.tabIcon}>
                <TabIcon route={route.name} focused={isFocused} />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{labelText}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    overflow: 'hidden',
    shadowColor: 'rgba(148, 163, 184, 0.35)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 26,
    elevation: 12,
    gap: 8,
  },
  containerSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    shadowColor: 'rgba(255, 255, 255, 0.85)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 150, 137, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0, 150, 137, 0.32)',
  },
  tabItemPressed: {
    opacity: 0.88,
  },
  tabIcon: {
    marginBottom: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717b',
  },
  tabLabelActive: {
    color: palette.mintStrong,
  },
});
