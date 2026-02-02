import * as React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskQuickList } from '@/components/task-quick-list';
import { createTask, deleteTask, updateTask } from '@/lib/supabase';
import { getAdjacentDay, getToday } from '@/hooks/useDate';
import { useAuth } from '@/providers/AuthProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { palette } from '@/theme/colors';

import { styles } from './Dashboard.styles';
import type {
  DashboardGroup,
  DashboardScreenProps,
  GroupSegment,
  PriorityOption,
} from './Dashboard.types';
import { TaskComposerModal } from './components/TaskComposerModal';

const groupSegments: GroupSegment[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'upcoming', label: 'Later' },
];

const priorityOptions: PriorityOption[] = [
  {
    value: 0,
    label: 'None',
    description: 'Keep this task unprioritised.',
    icon: 'minus-circle',
    tint: '#64748b',
    background: 'rgba(100, 116, 139, 0.12)',
  },
  {
    value: 1,
    label: 'Low',
    description: 'Good to do when you have the time.',
    icon: 'arrow-down-left',
    tint: '#0891b2',
    background: 'rgba(8, 145, 178, 0.12)',
  },
  {
    value: 2,
    label: 'Medium',
    description: 'Important but not urgent.',
    icon: 'minus',
    tint: '#6366f1',
    background: 'rgba(99, 102, 241, 0.12)',
  },
  {
    value: 3,
    label: 'High',
    description: 'Handle this before everything else.',
    icon: 'alert-triangle',
    tint: '#f97316',
    background: 'rgba(249, 115, 22, 0.12)',
  },
];

const presetCategories = ['Work', 'Personal', 'Home', 'Shopping', 'Health', 'Finance'];

const normalizeCategory = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\w/g, (match) => match.toUpperCase());

const dateForGroup = (group: DashboardGroup) => {
  switch (group) {
    case 'today':
      return getToday();
    case 'tomorrow':
      return getAdjacentDay(1);
    case 'upcoming':
      return getAdjacentDay(3);
    default:
      return getToday();
  }
};

export const DashboardScreen = ({ route }: DashboardScreenProps) => {
  const { tasks, loading, refresh } = useTasks();
  const { session } = useAuth();
  const { hideCompleted, advancedMode } = usePreferences();
  const insets = useSafeAreaInsets();
  const baseHeaderOffset = insets.top + 108;
  const categoryBarHeight = 48;
  const headerOffset = baseHeaderOffset + (advancedMode ? categoryBarHeight : 0);

  const activeGroup = route?.params?.group ?? 'tomorrow';
  const activeTasks = React.useMemo(() => {
    const current = tasks[activeGroup] ?? [];
    return hideCompleted ? current.filter((task) => !task.isComplete) : current;
  }, [activeGroup, hideCompleted, tasks]);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState('All');

  const availableCategories = React.useMemo(() => {
    const current = tasks[activeGroup] ?? [];
    const labels = current
      .map((task) => task.label?.trim())
      .filter((label): label is string => Boolean(label));
    const unique = Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b));
    return ['All', ...unique];
  }, [activeGroup, tasks]);

  React.useEffect(() => {
    if (!availableCategories.includes(selectedCategoryFilter)) {
      setSelectedCategoryFilter('All');
    }
  }, [availableCategories, selectedCategoryFilter]);

  const filteredTasks = React.useMemo(() => {
    if (!advancedMode || selectedCategoryFilter === 'All') {
      return activeTasks;
    }
    const normalized = selectedCategoryFilter.toLowerCase();
    return activeTasks.filter((task) => (task.label ?? '').trim().toLowerCase() === normalized);
  }, [activeTasks, advancedMode, selectedCategoryFilter]);

  const [composerVisible, setComposerVisible] = React.useState(false);
  const [composerMode, setComposerMode] = React.useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = React.useState<Task | TaskWithOverdueFlag | null>(null);
  const [newTaskContent, setNewTaskContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [composerGroup, setComposerGroup] = React.useState<DashboardGroup>(activeGroup);
  const [selectedPriority, setSelectedPriority] = React.useState<number>(0);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);

  const categories = React.useMemo(() => {
    const merged = [...presetCategories, ...customCategories];
    return Array.from(new Set(merged.map((name) => name.trim()))).filter(Boolean);
  }, [customCategories]);

  const trimmedCategoryQuery = categoryQuery.trim();
  const normalizedCategoryQuery = trimmedCategoryQuery.toLowerCase();

  const filteredCategories = React.useMemo(() => {
    if (!normalizedCategoryQuery) {
      return categories;
    }

    return categories.filter((category) =>
      category.toLowerCase().includes(normalizedCategoryQuery)
    );
  }, [categories, normalizedCategoryQuery]);

  const canCreateCategory =
    trimmedCategoryQuery.length > 0 &&
    !categories.some((category) => category.toLowerCase() === normalizedCategoryQuery);

  const handleRefresh = React.useCallback(() => {
    refresh();
  }, [refresh]);

  const handleToggleTask = React.useCallback(
    async (task: Task | TaskWithOverdueFlag) => {
      try {
        const nextComplete = !task.isComplete;
        await updateTask(task.id, {
          isComplete: nextComplete,
          completed_at: nextComplete ? getToday() : null,
        });
        await refresh();
      } catch (error) {
        Alert.alert('Update failed', (error as Error).message);
      }
    },
    [refresh]
  );

  const handleDeleteTask = React.useCallback(
    (task: Task | TaskWithOverdueFlag) => {
      Alert.alert('Remove task', 'Are you sure you want to delete this task?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              await refresh();
            } catch (error) {
              Alert.alert('Delete failed', (error as Error).message);
            }
          },
        },
      ]);
    },
    [refresh]
  );

  const handleEditTask = React.useCallback(
    (task: Task | TaskWithOverdueFlag) => {
      if (!session?.user?.id) {
        return;
      }

      const groupOverride = groupSegments.some((segment) => segment.key === task.target_group)
        ? (task.target_group as DashboardGroup)
        : activeGroup;

      setComposerMode('edit');
      setEditingTask(task);
      setNewTaskContent(task.content);
      setComposerGroup(groupOverride);
      setSelectedPriority(task.priority ?? 0);
      setCategoryQuery('');
      setSelectedCategory(task.label ?? null);
      setComposerVisible(true);
    },
    [activeGroup, session?.user?.id]
  );

  const handleShowTaskDetails = React.useCallback(
    (task: Task | TaskWithOverdueFlag) => {
      const priorityLabel = priorityOptions.find((p) => p.value === task.priority)?.label ?? 'None';
      const groupLabel = groupSegments.find((s) => s.key === task.target_group)?.label ?? task.target_group;
      
      Alert.alert(
        'Task Details',
        [
          `📝 ${task.content}`,
          '',
          `📅 Scheduled: ${task.date}`,
          `📁 Section: ${groupLabel}`,
          `⚡ Priority: ${priorityLabel}`,
          `✓ Status: ${task.isComplete ? 'Completed' : 'Pending'}`,
        ].join('\n'),
        [{ text: 'OK', style: 'default' }]
      );
    },
    []
  );

  const openComposer = React.useCallback(() => {
    if (!session?.user?.id) {
      Alert.alert('Not signed in', 'Sign in to add tasks.');
      return;
    }
    setComposerMode('create');
    setEditingTask(null);
    setNewTaskContent('');
    setComposerGroup(activeGroup);
    setSelectedPriority(0);
    setCategoryQuery('');
    setSelectedCategory(null);
    setComposerVisible(true);
  }, [activeGroup, session?.user?.id]);

  const closeComposer = React.useCallback(() => {
    setComposerVisible(false);
    setNewTaskContent('');
    setSelectedPriority(0);
    setComposerGroup(activeGroup);
    setCategoryQuery('');
    setSelectedCategory(null);
    setComposerMode('create');
    setEditingTask(null);
  }, [activeGroup]);

  const handleSubmitTask = React.useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    const trimmed = newTaskContent.trim();
    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      if (composerMode === 'edit' && editingTask) {
        await updateTask(editingTask.id, {
          content: trimmed,
          target_group: composerGroup,
          priority: selectedPriority,
          date: dateForGroup(composerGroup),
          label: selectedCategory ?? null,
        });
      } else {
        await createTask({
          content: trimmed,
          target_group: composerGroup,
          userId: session.user.id,
          date: dateForGroup(composerGroup),
          priority: selectedPriority,
          label: selectedCategory ?? null,
        });
      }
      closeComposer();
      await refresh();
    } catch (error) {
      Alert.alert(
        composerMode === 'edit' ? 'Could not update task' : 'Could not create task',
        (error as Error).message
      );
    } finally {
      setSubmitting(false);
    }
  }, [closeComposer, composerGroup, composerMode, editingTask, newTaskContent, refresh, selectedCategory, selectedPriority, session?.user?.id, submitting]);

  const handleSelectPriority = React.useCallback((value: number) => {
    setSelectedPriority(value);
  }, []);

  const handleCategorySubmit = React.useCallback(
    (category: string) => {
      const normalised = normalizeCategory(category);
      if (!normalised) {
        return;
      }

      if (!categories.includes(normalised)) {
        setCustomCategories((prev) => (prev.includes(normalised) ? prev : [...prev, normalised]));
      }

      setSelectedCategory(normalised);
      setCategoryQuery('');
    },
    [categories]
  );

  const handleCreateCategory = React.useCallback(() => {
    handleCategorySubmit(categoryQuery);
  }, [categoryQuery, handleCategorySubmit]);

  const handleSelectCategory = React.useCallback(
    (category: string) => {
      handleCategorySubmit(category);
    },
    [handleCategorySubmit]
  );

  const handleClearCategory = React.useCallback(() => {
    setSelectedCategory(null);
    setCategoryQuery('');
  }, []);

  React.useEffect(() => {
    if (composerVisible && composerMode === 'create') {
      setComposerGroup(activeGroup);
    }
  }, [activeGroup, composerMode, composerVisible]);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
      {advancedMode ? (
        <View style={[categoryStyles.categoryBar, { top: baseHeaderOffset, height: categoryBarHeight }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={categoryStyles.categoryBarContent}
          >
            {availableCategories.map((category) => {
              const isActive = category === selectedCategoryFilter;
              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter tasks by ${category}`}
                  onPress={() =>
                    setSelectedCategoryFilter((prev) => (prev === category ? 'All' : category))
                  }
                  style={({ pressed }) => [
                    categoryStyles.categoryBadge,
                    isActive && categoryStyles.categoryBadgeActive,
                    pressed && categoryStyles.categoryBadgePressed,
                  ]}
                >
                  <Text
                    style={[
                      categoryStyles.categoryBadgeText,
                      isActive && categoryStyles.categoryBadgeTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerOffset, paddingBottom: insets.bottom + 180 },
        ]}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: headerOffset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={palette.mint}
            colors={[palette.mint]}
          />
        }
      >
        <TaskQuickList
          tasks={filteredTasks}
          onToggle={handleToggleTask}
          onPress={handleEditTask}
          onLongPress={advancedMode ? handleShowTaskDetails : undefined}
          onDelete={handleDeleteTask}
          loading={loading && activeTasks.length === 0}
        />
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add task"
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 118 },
          pressed && styles.fabPressed,
        ]}
        onPress={openComposer}
      >
        <Feather name="plus" size={24} color={palette.lightSurface} />
      </Pressable>

      <TaskComposerModal
        visible={composerVisible}
        onClose={closeComposer}
        insetBottom={insets.bottom}
        newTaskContent={newTaskContent}
        onChangeTaskContent={setNewTaskContent}
        composerGroup={composerGroup}
        onChangeGroup={setComposerGroup}
        groupSegments={groupSegments}
        priorityOptions={priorityOptions}
        onSelectPriority={handleSelectPriority}
        selectedPriority={selectedPriority}
        selectedCategory={selectedCategory}
        onClearCategory={handleClearCategory}
        submitting={submitting}
    onSubmit={handleSubmitTask}
        categoryQuery={categoryQuery}
        onCategoryQueryChange={setCategoryQuery}
        filteredCategories={filteredCategories}
        canCreateCategory={canCreateCategory}
        onCreateCategory={handleCreateCategory}
        onSelectCategory={handleSelectCategory}
        mode={composerMode}
      />
    </View>
  );
};

const categoryStyles = StyleSheet.create({
  categoryBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 18,
    backgroundColor: 'transparent',
  },
  categoryBarContent: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeActive: {
    backgroundColor: palette.mintMuted,
    borderColor: palette.mint,
  },
  categoryBadgePressed: {
    opacity: 0.9,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate600,
  },
  categoryBadgeTextActive: {
    color: palette.mintStrong,
  },
});
