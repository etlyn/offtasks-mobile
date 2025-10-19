import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskSection } from '@/components/TaskSection';
import { useTasks } from '@/providers/TasksProvider';
import { palette } from '@/theme/colors';

export const CompletedScreen = () => {
  const { tasks, totals, loading, refresh } = useTasks();
  const insets = useSafeAreaInsets();

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: 36 + insets.bottom }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          tintColor={palette.accent}
          progressBackgroundColor={palette.surface}
        />
      }
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Wins archive</Text>
        <Text style={styles.subtitle}>
          {totals.completed} tasks completed so far. Celebrate the progress and keep going.
        </Text>
      </View>

      <TaskSection
        title="Completed"
        group="close"
        tasks={tasks.close}
        highlight="#22c55e"
        allowNewTask={false}
        emptyMessage="No completed tasks yet. Check back after you wrap something up."
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 28,
    marginTop: 8,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});
