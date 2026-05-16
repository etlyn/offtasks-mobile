import React from 'react';
import { CommonActions, DrawerActions } from '@react-navigation/native';
import type { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardHeader } from '@/components/dashboard-header';
import { useTasks } from '@/providers/TasksProvider';
import { useAppTheme } from '@/theme/colors';

type DashboardGroupKey = 'today' | 'tomorrow' | 'upcoming';

const dashboardRouteToGroup: Record<string, DashboardGroupKey | undefined> = {
  Today: 'today',
  Tomorrow: 'tomorrow',
  Later: 'upcoming',
};

const groupLabels: Record<DashboardGroupKey, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Later',
};

export const NavBar: React.FC<BottomTabHeaderProps> = ({
  navigation,
  route,
  options,
}) => {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const title =
    typeof options.headerTitle === 'string'
      ? options.headerTitle
      : typeof options.title === 'string'
      ? options.title
      : route.name;

  const dashboardGroup = dashboardRouteToGroup[route.name];
  const dashboardTasks = dashboardGroup ? tasks?.[dashboardGroup] ?? [] : [];
  const totalCount = dashboardTasks.length;
  const completedCount = dashboardTasks.filter(task => task.isComplete).length;
  const summary = `${completedCount} / ${totalCount}`;

  const handleMenuPress = React.useCallback(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.dispatch(DrawerActions.openDrawer());
      return;
    }
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleSearchPress = React.useCallback(() => {
    if (dashboardGroup) {
      navigation.setParams({ searchToggleRequestId: Date.now() } as never);
      return;
    }

    const parent = navigation.getParent();
    if (parent) {
      parent.dispatch(
        CommonActions.navigate({
          name: 'Dashboard',
          params: {
            screen: 'Today',
            params: { searchToggleRequestId: Date.now() },
          },
        }),
      );
      return;
    }

    navigation.dispatch(
      CommonActions.navigate({
        name: 'Today',
        params: { searchToggleRequestId: Date.now() },
      }),
    );
  }, [dashboardGroup, navigation]);

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
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom > 0 ? 8 : 12,
        },
      ]}
    >
      {dashboardGroup ? (
        <DashboardHeader
          dayLabel={groupLabels[dashboardGroup]}
          summary={summary}
          buttonIcon={showBack ? 'arrow-left' : 'menu'}
          onButtonPress={showBack ? handleBackPress : handleMenuPress}
          onSearchPress={handleSearchPress}
        />
      ) : (
        <View style={styles.fallbackRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showBack ? 'Go back' : 'Open navigation menu'}
            onPress={showBack ? handleBackPress : handleMenuPress}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Feather
              name={showBack ? 'arrow-left' : 'menu'}
              size={18}
              color={theme.colors.iconPrimary}
            />
          </Pressable>

          <Text style={styles.fallbackTitle} numberOfLines={1}>
            {title}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open task search"
            onPress={handleSearchPress}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Feather name="search" size={18} color={theme.colors.iconPrimary} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
      paddingHorizontal: 18,
      zIndex: 20,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 16,
      elevation: 8,
    },
    iconButtonPressed: {
      opacity: 0.85,
    },
    fallbackRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.glass,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 32,
      elevation: 10,
    },
    fallbackTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
  });
