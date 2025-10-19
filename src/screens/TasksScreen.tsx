import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardHeader } from '@/components/DashboardHeader';
import { TaskSection } from '@/components/TaskSection';
import { useTasks } from '@/providers/TasksProvider';
import type { TaskGroup } from '@/types/task';
import { palette } from '@/theme/colors';

const sections: Array<{
  title: string;
  group: TaskGroup;
  highlight: string;
  allowNewTask?: boolean;
  emptyMessage?: string;
}> = [
  { title: "Today's focus", group: 'today', highlight: '#38bdf8' },
  { title: 'Tomorrow preview', group: 'tomorrow', highlight: '#22d3ee' },
  { title: 'Upcoming planning', group: 'upcoming', highlight: '#a855f7' },
  {
    title: 'Completed archive',
    group: 'close',
    highlight: '#22c55e',
    allowNewTask: false,
    emptyMessage: 'Every finished task lives here.',
  },
];

export const TasksScreen = () => {
  const { tasks, loading, refresh } = useTasks();
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
      <DashboardHeader />
      {sections.map((section) => (
        <TaskSection
          key={section.group}
          title={section.title}
          group={section.group}
          tasks={tasks[section.group]}
          highlight={section.highlight}
          allowNewTask={section.allowNewTask}
          emptyMessage={section.emptyMessage}
        />
      ))}
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
});
