import React from 'react';
import { Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateTask } from '@/lib/supabase';
import { getAdjacentDay, getToday } from '@/hooks/useDate';
import { TaskQuickList } from '@/components/TaskQuickList';
import { useTasks } from '@/providers/TasksProvider';
import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

import { styles } from './Completed.styles';
import type { DashboardGroup, GroupSegment, PriorityOption } from '@/features/dashboard/Dashboard.types';
import { TaskComposerModal } from '@/features/dashboard/components/TaskComposerModal';

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

export const CompletedScreen = () => {
  const { tasks, totals, loading, refresh } = useTasks();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [composerVisible, setComposerVisible] = React.useState(false);
  const [composerMode, setComposerMode] = React.useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [newTaskContent, setNewTaskContent] = React.useState('');
  const [composerGroup, setComposerGroup] = React.useState<DashboardGroup>('today');
  const [selectedPriority, setSelectedPriority] = React.useState(0);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);

  const allTasks = React.useMemo(() => Object.values(tasks).flat(), [tasks]);
  const completedTasks = React.useMemo(
    () =>
      allTasks
        .filter((task) => task.isComplete)
        .sort((a, b) => {
          const aDate = a.completed_at ?? a.date;
          const bDate = b.completed_at ?? b.date;
          return aDate < bDate ? 1 : -1;
        }),
    [allTasks]
  );

  const categories = React.useMemo(
    () => Array.from(new Set([...presetCategories, ...customCategories])).sort(),
    [customCategories]
  );

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

  const handleRestore = React.useCallback(
    async (task: Task) => {
      await updateTask(task.id, { isComplete: false, completed_at: null });
      await refresh();
    },
    [refresh]
  );

  const handleEditTask = React.useCallback((task: Task) => {
    const groupOverride = groupSegments.some((segment) => segment.key === task.target_group)
      ? (task.target_group as DashboardGroup)
      : 'today';

    setComposerMode('edit');
    setEditingTask(task);
    setNewTaskContent(task.content);
    setComposerGroup(groupOverride);
    setSelectedPriority(task.priority ?? 0);
    setCategoryQuery('');
    setSelectedCategory(task.label ?? null);
    setComposerVisible(true);
  }, []);

  const handleCloseComposer = React.useCallback(() => {
    setComposerVisible(false);
    setNewTaskContent('');
    setSelectedPriority(0);
    setComposerGroup('today');
    setCategoryQuery('');
    setSelectedCategory(null);
    setComposerMode('create');
    setEditingTask(null);
  }, []);

  const handleSubmitTask = React.useCallback(async () => {
    if (!editingTask || submitting) {
      return;
    }

    const trimmed = newTaskContent.trim();
    if (!trimmed) {
      return;
    }

    setSubmitting(true);
    try {
      await updateTask(editingTask.id, {
        content: trimmed,
        target_group: composerGroup,
        priority: selectedPriority,
        date: dateForGroup(composerGroup),
        label: selectedCategory ?? null,
      });
      handleCloseComposer();
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }, [composerGroup, editingTask, handleCloseComposer, newTaskContent, refresh, selectedCategory, selectedPriority, submitting]);

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
          <Text style={styles.screenTitle}>Completed</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            onPress={handleOpenDrawer}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name="menu" size={20} color={palette.slate900} />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>{totals.completed} tasks completed</Text>

        <TaskQuickList
          tasks={completedTasks}
          onToggle={handleRestore}
          onPress={handleEditTask}
          loading={loading && completedTasks.length === 0}
        />
      </ScrollView>

      <TaskComposerModal
        visible={composerVisible}
        onClose={handleCloseComposer}
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
