import * as React from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const headerOffset = baseHeaderOffset;

  const activeGroup = route?.params?.group ?? 'tomorrow';
  const baseTasks = React.useMemo(() => tasks[activeGroup] ?? [], [activeGroup, tasks]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLabels, setSelectedLabels] = React.useState<string[]>([]);
  const [prioritySortDirection, setPrioritySortDirection] = React.useState<'asc' | 'desc' | null>(null);
  const [showCompleted, setShowCompleted] = React.useState(true);

  const effectiveShowCompleted = hideCompleted ? false : showCompleted;
  const applyFilters = advancedMode || hideCompleted;

  const availableLabels = React.useMemo(() => {
    const labels = baseTasks
      .map((task) => task.label?.trim())
      .filter((label): label is string => Boolean(label));
    return Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b));
  }, [baseTasks]);

  React.useEffect(() => {
    if (selectedLabels.length === 0) {
      return;
    }
    setSelectedLabels((prev) => prev.filter((label) => availableLabels.includes(label)));
  }, [availableLabels, selectedLabels.length]);

  const filteredTasks = React.useMemo(() => {
    if (!applyFilters) {
      return baseTasks;
    }

    return baseTasks.filter((task) => {
      if (advancedMode) {
        if (searchQuery && !task.content.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        if (selectedLabels.length > 0) {
          if (!task.label || !selectedLabels.includes(task.label)) {
            return false;
          }
        }
      }

      if (!effectiveShowCompleted && task.isComplete) {
        return false;
      }

      return true;
    });
  }, [advancedMode, applyFilters, baseTasks, effectiveShowCompleted, searchQuery, selectedLabels]);

  const sortedTasks = React.useMemo(() => {
    if (!advancedMode || !prioritySortDirection) {
      return filteredTasks;
    }

    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      const aPriority = typeof a.priority === 'number' ? a.priority : 0;
      const bPriority = typeof b.priority === 'number' ? b.priority : 0;
      const comparison = bPriority - aPriority;
      return prioritySortDirection === 'desc' ? comparison : -comparison;
    });

    return sorted;
  }, [advancedMode, filteredTasks, prioritySortDirection]);

  const displayTasks = advancedMode ? sortedTasks : filteredTasks;

  const activeFilterCount =
    (searchQuery ? 1 : 0) + selectedLabels.length + (!effectiveShowCompleted ? 1 : 0);

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

  const toggleLabel = React.useCallback((label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  }, []);

  const togglePrioritySort = React.useCallback(() => {
    setPrioritySortDirection((prev) => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
  }, []);

  const clearAllFilters = React.useCallback(() => {
    setSearchQuery('');
    setSelectedLabels([]);
    setPrioritySortDirection(null);
    setShowCompleted(true);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
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
        {advancedMode ? (
          <View style={styles.advancedFilters}>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color={palette.slate600} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search tasks"
                placeholderTextColor={palette.slate600}
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>

            {availableLabels.length > 0 && (
              <View style={styles.chipRow}>
                {availableLabels.map((label) => {
                  const isActive = selectedLabels.includes(label);
                  return (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${label}`}
                      onPress={() => toggleLabel(label)}
                      style={({ pressed }) => [
                        styles.filterChip,
                        isActive && styles.filterChipActive,
                        pressed && styles.filterChipPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.filterActionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sort by priority"
                onPress={togglePrioritySort}
                style={({ pressed }) => [
                  styles.filterAction,
                  prioritySortDirection && styles.filterActionActive,
                  pressed && styles.filterActionPressed,
                ]}
              >
                <Feather name="arrow-up-down" size={14} color={palette.slate600} />
                <Text style={styles.filterActionText}>Priority</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle completed tasks"
                onPress={() => setShowCompleted((prev) => !prev)}
                style={({ pressed }) => [
                  styles.filterAction,
                  !showCompleted && styles.filterActionActive,
                  pressed && styles.filterActionPressed,
                ]}
              >
                <Text style={styles.filterActionText}>
                  {showCompleted ? 'Hide' : 'Show'} Completed
                </Text>
              </Pressable>

              {activeFilterCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear filters"
                  onPress={clearAllFilters}
                  style={({ pressed }) => [
                    styles.clearFiltersButton,
                    pressed && styles.filterActionPressed,
                  ]}
                >
                  <Feather name="x" size={14} color={palette.danger} />
                  <Text style={styles.clearFiltersText}>Clear ({activeFilterCount})</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : null}
        <TaskQuickList
          tasks={displayTasks}
          onToggle={handleToggleTask}
          onPress={handleEditTask}
          onLongPress={advancedMode ? handleShowTaskDetails : undefined}
          onDelete={handleDeleteTask}
          loading={loading && baseTasks.length === 0}
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

