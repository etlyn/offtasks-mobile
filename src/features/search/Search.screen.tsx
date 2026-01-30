import React from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskQuickList } from '@/components/task-quick-list';
import { updateTask } from '@/lib/supabase';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { palette } from '@/theme/colors';

type TaskType = Task | TaskWithOverdueFlag;

export const SearchScreen = () => {
  const { tasks, loading, refresh } = useTasks();
  const { hideCompleted, advancedMode } = usePreferences();
  const [query, setQuery] = React.useState('');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const allTasks = React.useMemo(() => Object.values(tasks).flat(), [tasks]);

  const filteredTasks = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return allTasks.filter((task) => {
      if (hideCompleted && task.isComplete) {
        return false;
      }
      if (!trimmed) {
        return true;
      }
      return task.content.toLowerCase().includes(trimmed);
    });
  }, [allTasks, hideCompleted, query]);

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

  const handleToggleTask = React.useCallback(
    async (task: TaskType) => {
      try {
        const nextComplete = !task.isComplete;
        await updateTask(task.id, {
          isComplete: nextComplete,
          completed_at: nextComplete ? new Date().toISOString().slice(0, 10) : null,
        });
        await refresh();
      } catch (error) {
        Alert.alert('Update failed', (error as Error).message);
      }
    },
    [refresh]
  );

  const handleShowDetails = React.useCallback((task: TaskType) => {
    Alert.alert(
      'Task Details',
      [`📝 ${task.content}`, `📅 Scheduled: ${task.date}`, `✓ Status: ${task.isComplete ? 'Completed' : 'Pending'}`].join('\n'),
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

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
          <Text style={styles.screenTitle}>Search</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            onPress={handleOpenDrawer}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name="menu" size={20} color={palette.slate900} />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={palette.slate600} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search tasks"
            placeholderTextColor={palette.slate600}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{filteredTasks.length} results</Text>
          {hideCompleted ? <Text style={styles.metaTag}>Completed hidden</Text> : null}
          {advancedMode ? <Text style={styles.metaTag}>Advanced mode</Text> : null}
        </View>

        <TaskQuickList
          tasks={filteredTasks}
          onToggle={handleToggleTask}
          onLongPress={advancedMode ? handleShowDetails : undefined}
          loading={loading && filteredTasks.length === 0}
        />
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
    gap: 16,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightSurface,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.slate900,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 13,
    color: palette.slate600,
  },
  metaTag: {
    fontSize: 12,
    color: palette.mintStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.mintMuted,
  },
});
