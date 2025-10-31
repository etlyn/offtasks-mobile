import React from 'react';
import { DrawerActions } from '@react-navigation/native';
import type { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardHeader } from '@/components/dashboard-header';
import { useTasks } from '@/providers/TasksProvider';
import { palette } from '@/theme/colors';

type DashboardGroupKey = 'today' | 'tomorrow' | 'upcoming';

const dashboardRouteToGroup: Record<string, DashboardGroupKey | undefined> = {
  Today: 'today',
  Tomorrow: 'tomorrow',
  Upcoming: 'upcoming',
};

const groupLabels: Record<DashboardGroupKey, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming',
};


export const NavBar: React.FC<BottomTabHeaderProps> = ({ navigation, route, options }) => {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();

  const title =
    typeof options.headerTitle === 'string'
      ? options.headerTitle
      : typeof options.title === 'string'
      ? options.title
      : route.name;

  const dashboardGroup = dashboardRouteToGroup[route.name];
  const dashboardTasks = dashboardGroup ? tasks?.[dashboardGroup] ?? [] : [];
  const totalCount = dashboardTasks.length;
  const completedCount = dashboardTasks.filter((task) => task.isComplete).length;
  const summary = totalCount > 0 ? `${completedCount} of ${totalCount}` : 'Nothing scheduled';

  const handleMenuPress = React.useCallback(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.dispatch(DrawerActions.openDrawer());
      return;
    }
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleBackPress = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    handleMenuPress();
  }, [handleMenuPress, navigation]);

  const showBack = false; //disable back button in NavBar.

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingTop: insets.top + 12, paddingBottom: insets.bottom > 0 ? 8 : 12 }]}
    >
      {dashboardGroup ? (
        <DashboardHeader
          dayLabel={groupLabels[dashboardGroup]}
          summary={summary}
          buttonIcon={showBack ? 'arrow-left' : 'menu'}
          onButtonPress={showBack ? handleBackPress : handleMenuPress}
        />
      ) : (
        <View style={styles.fallbackCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showBack ? 'Go back' : 'Open navigation menu'}
            onPress={showBack ? handleBackPress : handleMenuPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name={showBack ? 'arrow-left' : 'menu'} size={18} color={palette.slate900} />
          </Pressable>

          <Text style={styles.fallbackTitle} numberOfLines={1}>
            {title}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
            onPress={handleMenuPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name="menu" size={18} color={palette.slate900} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: 'rgba(15, 23, 42, 0.12)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  iconButtonPressed: {
    opacity: 0.85,
  },
  fallbackCard: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: 'rgba(15, 23, 42, 0.25)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 14,
  },
  fallbackTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate900,
  },
});
