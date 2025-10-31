import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/theme/colors';

const labels: Record<string, string> = {
  Today: 'Today',
  Tomorrow: 'Tomorrow',
  Upcoming: 'Upcoming',
};

export const DashboardTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 12 }]}> 
      <View style={styles.container}>
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
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
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
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 12,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: palette.mintMuted,
    borderWidth: 1,
    borderColor: palette.mint,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate600,
  },
  tabLabelActive: {
    color: palette.mintStrong,
  },
});
