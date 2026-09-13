import React from 'react';
import {
  Alert,
  Keyboard,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CheckCheck } from 'lucide-react-native';
import {
  GentlePressable as Pressable,
  PageBackdrop,
  QuietSearch,
  QuietEmpty,
} from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  normalizeCategory,
  useTaskCategories,
} from '@/hooks/useTaskCategories';
import { PlannerHeader } from '@/components/navigation/PlannerHeader';
import { useSharedHeader } from '@/navigation/SharedHeader';
import { useTaskRepository } from '@/lib/taskRepository';
import { getToday } from '@/hooks/useDate';
import { TaskList } from '@/components/task-quick-list';
import { useTasks } from '@/providers/TasksProvider';
import type { Task } from '@/types/task';
import { useAppTheme } from '@/theme/colors';
import { filterTasksForSearch, getTaskSearchContext } from '@/utils/taskSearch';
import {
  getDefaultDateForGroup,
  getTargetGroupForDate,
  normalizeScheduledDate,
} from '@/utils/taskScheduling';

import { createStyles } from './Completed.styles';
import type {
  DashboardGroup,
  GroupSegment,
  PriorityOption,
} from '@/features/dashboard/Dashboard.types';
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
    icon: 'arrow-up-left',
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

const statisticsTabs = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Completed' },
] as const;

type StatisticsTabKey = (typeof statisticsTabs)[number]['key'];

export const StatisticsScreen = () => {
  const sharedHeader = useSharedHeader();
  const searchInput = React.useRef<TextInput>(null);
  const { update: updateTask } = useTaskRepository();
  const { tasks, totals, loading, refreshing, refresh, applyTaskUpdate } =
    useTasks();
  const { categories, addCategory, removeCategory } = useTaskCategories();
  const theme = useAppTheme();
  const { animateLayout } = useCalendarTransition();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const [activeTab, setActiveTab] = React.useState<StatisticsTabKey>('open');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [composerVisible, setComposerVisible] = React.useState(false);
  const [composerMode, setComposerMode] = React.useState<'create' | 'edit'>(
    'create',
  );
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [newTaskContent, setNewTaskContent] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState<string | null>(
    getDefaultDateForGroup('today'),
  );
  const [selectedPriority, setSelectedPriority] = React.useState(0);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [categoryPendingDelete, setCategoryPendingDelete] = React.useState<
    string | null
  >(null);
  const allTasks = React.useMemo(() => Object.values(tasks).flat(), [tasks]);
  const completedTasks = React.useMemo(
    () =>
      allTasks
        .filter(task => task.isComplete)
        .sort((left, right) => {
          const leftDate = left.completed_at ?? left.date ?? '';
          const rightDate = right.completed_at ?? right.date ?? '';
          return leftDate < rightDate ? 1 : -1;
        }),
    [allTasks],
  );
  const openTasks = React.useMemo(
    () =>
      allTasks
        .filter(task => !task.isComplete)
        .sort((left, right) => {
          const leftOverdue = Boolean(left.date && left.date < getToday());
          const rightOverdue = Boolean(right.date && right.date < getToday());

          if (leftOverdue !== rightOverdue) {
            return Number(rightOverdue) - Number(leftOverdue);
          }

          return (right.priority ?? 0) - (left.priority ?? 0);
        }),
    [allTasks],
  );
  const todayKey = React.useMemo(() => getToday(), []);
  const overdueCount = React.useMemo(
    () =>
      openTasks.filter(task => Boolean(task.date && task.date < todayKey))
        .length,
    [openTasks, todayKey],
  );
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleOpenTasks = React.useMemo(
    () => filterTasksForSearch(openTasks, searchQuery),
    [openTasks, searchQuery],
  );
  const visibleCompletedTasks = React.useMemo(
    () => filterTasksForSearch(completedTasks, searchQuery),
    [completedTasks, searchQuery],
  );
  const hasSearchQuery = normalizedSearchQuery.length > 0;
  const trimmedCategoryQuery = categoryQuery.trim();
  const normalizedCategoryQuery = trimmedCategoryQuery.toLowerCase();
  const filteredCategories = React.useMemo(() => {
    if (!normalizedCategoryQuery) {
      return categories;
    }

    return categories.filter(category =>
      category.toLowerCase().includes(normalizedCategoryQuery),
    );
  }, [categories, normalizedCategoryQuery]);
  const canCreateCategory =
    trimmedCategoryQuery.length > 0 &&
    !categories.some(
      category => category.toLowerCase() === normalizedCategoryQuery,
    );

  const handleRefresh = React.useCallback(() => {
    refresh({ showRefreshSpinner: true });
  }, [refresh]);

  const handleBackToHome = React.useCallback(() => {
    Keyboard.dismiss();
    navigation.navigate('Calendar');
  }, [navigation]);

  const handleToggleTask = React.useCallback(
    async (task: Task) => {
      const nextComplete = !task.isComplete;
      const today = getToday();
      const updates = {
        isComplete: nextComplete,
        completed_at: nextComplete ? today : null,
      };

      animateLayout();
      applyTaskUpdate(task.id, updates);

      try {
        await updateTask(task.id, updates);
      } catch (error) {
        await refresh();
        Alert.alert('Update failed', (error as Error).message);
      }
    },
    [animateLayout, applyTaskUpdate, refresh, updateTask],
  );

  const handleRestore = React.useCallback(
    async (task: Task) => {
      animateLayout();
      applyTaskUpdate(task.id, { isComplete: false, completed_at: null });

      try {
        await updateTask(task.id, { isComplete: false, completed_at: null });
      } catch (error) {
        await refresh();
        Alert.alert('Restore failed', (error as Error).message);
      }
    },
    [animateLayout, applyTaskUpdate, refresh, updateTask],
  );

  const handleEditTask = React.useCallback((task: Task) => {
    const fallbackGroup = groupSegments.some(
      segment => segment.key === task.target_group,
    )
      ? (task.target_group as DashboardGroup)
      : 'today';

    setComposerMode('edit');
    setEditingTask(task);
    setNewTaskContent(task.content);
    setSelectedDate(task.date ?? getDefaultDateForGroup(fallbackGroup));
    setSelectedPriority(task.priority ?? 0);
    setCategoryQuery('');
    setSelectedCategory(task.label ?? null);
    setComposerVisible(true);
  }, []);

  const handleCloseComposer = React.useCallback(() => {
    setComposerVisible(false);
    setComposerMode('create');
    setEditingTask(null);
    setNewTaskContent('');
    setSelectedDate(getDefaultDateForGroup('today'));
    setSelectedPriority(0);
    setCategoryQuery('');
    setSelectedCategory(null);
  }, []);

  const handleComposerGroupChange = React.useCallback(
    (group: DashboardGroup) => {
      setSelectedDate(getDefaultDateForGroup(group));
    },
    [],
  );

  const handleComposerDateChange = React.useCallback((date: string | null) => {
    setSelectedDate(normalizeScheduledDate(date));
  }, []);

  const handleCategorySubmit = React.useCallback(
    async (category: string) => {
      const normalizedValue = await addCategory(category);
      if (!normalizedValue) {
        return null;
      }

      setSelectedCategory(normalizedValue);
      setCategoryQuery('');
      return normalizedValue;
    },
    [addCategory],
  );

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
      const unchangedSchedule = selectedDate === editingTask.date;
      const normalizedDate = unchangedSchedule
        ? selectedDate
        : normalizeScheduledDate(selectedDate);
      const effectiveGroup = unchangedSchedule
        ? editingTask.target_group
        : getTargetGroupForDate(normalizedDate);
      let resolvedCategory = selectedCategory ?? null;
      const normalizedQuery = normalizeCategory(categoryQuery);

      if (normalizedQuery && normalizedQuery !== selectedCategory) {
        resolvedCategory = await handleCategorySubmit(categoryQuery);
      }

      await updateTask(editingTask.id, {
        content: trimmed,
        target_group: effectiveGroup,
        priority: selectedPriority,
        date: normalizedDate,
        label: resolvedCategory,
      });
      handleCloseComposer();
      await refresh();
    } catch (error) {
      Alert.alert('Could not update task', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [
    categoryQuery,
    editingTask,
    handleCategorySubmit,
    handleCloseComposer,
    newTaskContent,
    refresh,
    selectedCategory,
    selectedDate,
    selectedPriority,
    submitting,
    updateTask,
  ]);

  const handleSelectPriority = React.useCallback((value: number) => {
    setSelectedPriority(value);
  }, []);

  const handleCreateCategory = React.useCallback(async () => {
    await handleCategorySubmit(categoryQuery);
  }, [categoryQuery, handleCategorySubmit]);

  const handleSelectCategory = React.useCallback(
    async (category: string) => {
      await handleCategorySubmit(category);
    },
    [handleCategorySubmit],
  );

  const handleClearCategory = React.useCallback(() => {
    setSelectedCategory(null);
    setCategoryQuery('');
  }, []);

  const handleRequestDeleteCategory = React.useCallback((category: string) => {
    setCategoryPendingDelete(category);
  }, []);

  const handleCancelDeleteCategory = React.useCallback(() => {
    setCategoryPendingDelete(null);
  }, []);

  const handleConfirmDeleteCategory = React.useCallback(async () => {
    if (!categoryPendingDelete) {
      return;
    }

    try {
      await removeCategory(categoryPendingDelete);

      if (selectedCategory === categoryPendingDelete) {
        setSelectedCategory(null);
      }

      if (normalizeCategory(categoryQuery) === categoryPendingDelete) {
        setCategoryQuery('');
      }

      setCategoryPendingDelete(null);
    } catch (error) {
      Alert.alert('Could not delete category', (error as Error).message);
    }
  }, [categoryPendingDelete, categoryQuery, removeCategory, selectedCategory]);

  const visibleTasks = hasSearchQuery
    ? filterTasksForSearch(allTasks, searchQuery)
    : activeTab === 'open'
    ? visibleOpenTasks
    : visibleCompletedTasks;

  return (
    <View style={styles.root}>
      <PageBackdrop />
      <StatusBar barStyle={theme.statusBarStyle} />
      <PlannerHeader
        title="Statistics"
        onBack={handleBackToHome}
        actions={[
          {
            icon: 'search',
            label: 'Search statistics tasks',
            onPress: () => searchInput.current?.focus(),
          },
        ]}
      />
      {!sharedHeader ? (
        <QuietSearch
          inputRef={searchInput}
          label="Search all tasks"
          clearLabel="Clear statistics search"
          value={searchQuery}
          onChange={value => {
            animateLayout();
            setSearchQuery(value);
          }}
        />
      ) : null}
      <ScrollView
        style={styles.scroll}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.textSecondary}
          />
        }
      >
        <View style={styles.summaryRow}>
          {[
            ['Open', openTasks.length],
            ['Completed', totals.completed],
            ['Overdue', overdueCount],
          ].map(([label, value]) => (
            <View key={label} style={styles.summaryCard}>
              <Text style={styles.metricLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>
        {hasSearchQuery ? (
          <Text style={styles.resultLabel}>{visibleTasks.length} results</Text>
        ) : (
          <View style={styles.tabs}>
            {statisticsTabs.map(tab => (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: activeTab === tab.key }}
                onPress={() => {
                  animateLayout();
                  setActiveTab(tab.key);
                }}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {!loading && visibleTasks.length === 0 ? (
          <QuietEmpty
            icon={CheckCheck}
            label={
              hasSearchQuery
                ? 'No matching tasks'
                : activeTab === 'open'
                ? 'All clear'
                : 'No completed tasks yet'
            }
          />
        ) : (
          <TaskList
            calendar
            tasks={visibleTasks}
            onToggle={
              hasSearchQuery || activeTab === 'open'
                ? handleToggleTask
                : handleRestore
            }
            onPress={handleEditTask}
            getSecondaryText={task => getTaskSearchContext(task)}
            loading={loading && allTasks.length === 0}
          />
        )}
      </ScrollView>

      <TaskComposerModal
        visible={composerVisible}
        onClose={handleCloseComposer}
        insetTop={insets.top}
        insetBottom={insets.bottom}
        newTaskContent={newTaskContent}
        onChangeTaskContent={setNewTaskContent}
        onChangeGroup={handleComposerGroupChange}
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
        onDeleteCategory={handleRequestDeleteCategory}
        categoryPendingDelete={categoryPendingDelete}
        onCancelDeleteCategory={handleCancelDeleteCategory}
        onConfirmDeleteCategory={handleConfirmDeleteCategory}
        mode={composerMode}
        selectedDate={selectedDate}
        onChangeDate={handleComposerDateChange}
      />
    </View>
  );
};
