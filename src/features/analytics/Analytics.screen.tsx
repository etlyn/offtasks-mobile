import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  View,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTasks } from '@/providers/TasksProvider';
import { palette } from '@/theme/colors';

export const AnalyticsScreen = () => {
  const { tasks, totals, loading, refresh } = useTasks();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const groupCounts = React.useMemo(() => ({
    today: tasks.today.length,
    tomorrow: tasks.tomorrow.length,
    upcoming: tasks.upcoming.length,
    close: tasks.close.length,
  }), [tasks]);

  const handleRefresh = React.useCallback(() => {
    refresh();
  }, [refresh]);

  const handleBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(DrawerActions.closeDrawer());
  }, [navigation]);

  const handleOpenDrawer = React.useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={palette.mint} colors={[palette.mint]} />
        }
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name="arrow-left" size={20} color={palette.slate900} />
          </Pressable>
          <Text style={styles.screenTitle}>Analytics</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            onPress={handleOpenDrawer}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name="menu" size={20} color={palette.slate900} />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total tasks</Text>
            <Text style={styles.summaryValue}>{totals.all}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryValue}>{totals.completed}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{totals.pending}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By section</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Today</Text>
            <Text style={styles.rowValue}>{groupCounts.today}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tomorrow</Text>
            <Text style={styles.rowValue}>{groupCounts.tomorrow}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Later</Text>
            <Text style={styles.rowValue}>{groupCounts.upcoming}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Close</Text>
            <Text style={styles.rowValue}>{groupCounts.close}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.lightBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  iconButtonPressed: {
    opacity: 0.85,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.lightSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.slate600,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  section: {
    backgroundColor: palette.lightSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.lightBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    color: palette.slate600,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
});
