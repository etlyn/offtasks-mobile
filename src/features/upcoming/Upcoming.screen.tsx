import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskSection } from '@/components/TaskSection';
import { useTasks } from '@/providers/TasksProvider';
import { palette } from '@/theme/colors';

import { styles } from './Upcoming.styles';

export const UpcomingScreen = () => {
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
      <View style={styles.header}>
        <Text style={styles.title}>Plan ahead</Text>
        <Text style={styles.subtitle}>Organise what is coming up next and keep momentum.</Text>
      </View>

      <TaskSection
        title="Tomorrow"
        group="tomorrow"
        tasks={tasks.tomorrow}
        highlight="#22d3ee"
        emptyMessage="Nothing scheduled for tomorrow yet."
      />

      <TaskSection
        title="Upcoming"
        group="upcoming"
        tasks={tasks.upcoming}
        highlight="#a855f7"
        emptyMessage="Your upcoming list is squeaky clean."
      />
    </ScrollView>
  );
};
