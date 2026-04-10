import * as React from 'react';
import {
  Alert,
  Keyboard,
  StyleSheet,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawerStatus } from '@react-navigation/drawer';

import { TopBar } from '@/components/navigation/TopBar';
import { TaskList } from '@/components/task-quick-list';
import {
  normalizeCategory,
  useTaskCategories,
} from '@/hooks/useTaskCategories';
import { createTask, deleteTask, updateTask } from '@/lib/supabase';
import { getToday } from '@/hooks/useDate';
import { useAuth } from '@/providers/AuthProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { palette, useAppTheme } from '@/theme/colors';
import { filterTasksForSearch, getTaskSearchContext } from '@/utils/taskSearch';
import {
  getDefaultDateForGroup,
  getTargetGroupForDate,
  normalizeScheduledDate,
} from '@/utils/taskScheduling';

import { styles } from './Dashboard.styles';
import type {
  DashboardGroup,
  DashboardScreenProps,
  GroupSegment,
  PriorityOption,
} from './Dashboard.types';
import { FilterBar } from './components/FilterBar';
import { Layout } from './components/Layout';
import { TaskComposerModal } from './components/TaskComposerModal';

const groupSegments: GroupSegment[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'upcoming', label: 'Later' },
];

const groupLabels: Record<DashboardGroup, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Later',
};

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

export const DashboardScreen = ({ route }: DashboardScreenProps) => {
  const { tasks, loading, refresh, applyTaskUpdate } = useTasks();
  const { session } = useAuth();
  const { hideCompleted, advancedMode } = usePreferences();
  const { categories, addCategory, removeCategory } = useTaskCategories();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const searchInputRef = React.useRef<TextInput | null>(null);
  const [searchDockVisible, setSearchDockVisible] = React.useState(false);
  const navigation = useNavigation();
  const drawerStatus = useDrawerStatus();
  const prevDrawerStatusRef = React.useRef(drawerStatus);
  const themeStyles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: theme.colors.background,
        },
        filterChip: {
          borderColor: theme.colors.borderStrong,
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
        },
        filterChipActive: {
          backgroundColor: palette.mintStrong,
          borderColor: palette.mintStrong,
          shadowColor: theme.colors.shadow,
        },
        filterChipText: {
          color: theme.colors.textSecondary,
        },
        filterChipTextActive: {
          color: theme.colors.textInverse,
        },
        filterAction: {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        filterActionActive: {
          borderColor: palette.mintStrong,
          backgroundColor: palette.mintStrong,
        },
        filterActionText: {
          color: theme.colors.textSecondary,
        },
        filterActionTextActive: {
          color: theme.colors.textInverse,
        },
        clearFiltersButton: {
          borderColor: theme.colors.dangerBorder,
          backgroundColor: theme.colors.dangerSurface,
        },
      }),
    [theme],
  );

  const activeGroup = route?.params?.group ?? 'tomorrow';
  const allTasks = React.useMemo(() => Object.values(tasks).flat(), [tasks]);
  const baseTasks = React.useMemo(
    () => tasks[activeGroup] ?? [],
    [activeGroup, tasks],
  );

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLabels, setSelectedLabels] = React.useState<string[]>([]);
  const [prioritySortDirection, setPrioritySortDirection] = React.useState<
    'asc' | 'desc' | null
  >(null);

  const effectiveShowCompleted = !hideCompleted;
  const applyFilters = advancedMode || hideCompleted;

  const availableLabels = React.useMemo(() => {
    const labels = baseTasks
      .map(task => task.label?.trim())
      .filter((label): label is string => Boolean(label));
    return Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b));
  }, [baseTasks]);

  React.useEffect(() => {
    if (selectedLabels.length === 0) {
      return;
    }
    setSelectedLabels(prev =>
      prev.filter(label => availableLabels.includes(label)),
    );
  }, [availableLabels, selectedLabels.length]);

  const filteredTasks = React.useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    if (!applyFilters && !normalizedSearchQuery) {
      return baseTasks;
    }

    return baseTasks.filter(task => {
      if (
        normalizedSearchQuery &&
        !task.content.toLowerCase().includes(normalizedSearchQuery)
      ) {
        return false;
      }

      if (advancedMode) {
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
  }, [
    advancedMode,
    applyFilters,
    baseTasks,
    effectiveShowCompleted,
    searchQuery,
    selectedLabels,
  ]);

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

  const globalSearchResults = React.useMemo(
    () => filterTasksForSearch(allTasks, searchQuery),
    [allTasks, searchQuery],
  );
  const hasSearchQuery = searchQuery.trim().length > 0;

  const displayTasks = searchDockVisible
    ? hasSearchQuery
      ? globalSearchResults
      : []
    : advancedMode
    ? sortedTasks
    : filteredTasks;

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedLabels.length +
    (prioritySortDirection ? 1 : 0);
  const totalCount = baseTasks.length;
  const completedCount = baseTasks.filter(task => task.isComplete).length;

  const [composerVisible, setComposerVisible] = React.useState(false);
  const [composerMode, setComposerMode] = React.useState<'create' | 'edit'>(
    'create',
  );
  const [editingTask, setEditingTask] = React.useState<
    Task | TaskWithOverdueFlag | null
  >(null);
  const [newTaskContent, setNewTaskContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(
    getDefaultDateForGroup(activeGroup),
  );
  const [selectedPriority, setSelectedPriority] = React.useState<number>(0);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const [categoryPendingDelete, setCategoryPendingDelete] = React.useState<
    string | null
  >(null);

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

  const handleCloseSearch = React.useCallback(() => {
    setSearchQuery('');
    setSearchDockVisible(false);
    Keyboard.dismiss();
  }, []);

  const handleRefresh = React.useCallback(() => {
    refresh();
  }, [refresh]);

  const handleToggleTask = React.useCallback(
    async (task: Task | TaskWithOverdueFlag) => {
      try {
        const nextComplete = !task.isComplete;
        const today = getToday();
        const taskUpdates = {
          isComplete: nextComplete,
          completed_at: nextComplete ? today : null,
          target_group: nextComplete ? 'today' : task.target_group,
          date: nextComplete ? today : task.date,
        };

        applyTaskUpdate(task.id, taskUpdates);
        await updateTask(task.id, {
          ...taskUpdates,
        });
      } catch (error) {
        await refresh();
        Alert.alert('Update failed', (error as Error).message);
      }
    },
    [applyTaskUpdate, refresh],
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
    [refresh],
  );

  const handleEditTask = React.useCallback(
    (task: Task | TaskWithOverdueFlag) => {
      if (!session?.user?.id) {
        return;
      }

      const groupOverride = groupSegments.some(
        segment => segment.key === task.target_group,
      )
        ? (task.target_group as DashboardGroup)
        : activeGroup;

      setComposerMode('edit');
      setEditingTask(task);
      setNewTaskContent(task.content);
      setSelectedDate(
        normalizeScheduledDate(
          task.date ?? getDefaultDateForGroup(groupOverride),
        ),
      );
      setSelectedPriority(task.priority ?? 0);
      setCategoryQuery('');
      setSelectedCategory(task.label ?? null);
      setComposerVisible(true);
    },
    [activeGroup, session?.user?.id],
  );

  const handleShowTaskDetails = React.useCallback(
    (task: Task | TaskWithOverdueFlag) => {
      const priorityLabel =
        priorityOptions.find(p => p.value === task.priority)?.label ?? 'None';
      const groupLabel =
        groupSegments.find(s => s.key === task.target_group)?.label ??
        task.target_group;

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
        [{ text: 'OK', style: 'default' }],
      );
    },
    [],
  );

  const openComposer = React.useCallback(() => {
    if (!session?.user?.id) {
      Alert.alert('Not signed in', 'Sign in to add tasks.');
      return;
    }
    setComposerMode('create');
    setEditingTask(null);
    setNewTaskContent('');
    setSelectedDate(getDefaultDateForGroup(activeGroup));
    setSelectedPriority(0);
    setCategoryQuery('');
    setSelectedCategory(null);
    setComposerVisible(true);
  }, [activeGroup, session?.user?.id]);

  const closeComposer = React.useCallback(() => {
    setComposerVisible(false);
    setNewTaskContent('');
    setSelectedPriority(0);
    setSelectedDate(getDefaultDateForGroup(activeGroup));
    setCategoryQuery('');
    setSelectedCategory(null);
    setComposerMode('create');
    setEditingTask(null);
  }, [activeGroup]);

  const handleComposerGroupChange = React.useCallback(
    (group: DashboardGroup) => {
      setSelectedDate(getDefaultDateForGroup(group));
    },
    [],
  );

  const handleComposerDateChange = React.useCallback((date: string | null) => {
    const normalizedDate = normalizeScheduledDate(date);
    setSelectedDate(normalizedDate);
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
    if (!session?.user?.id) {
      return;
    }

    const trimmed = newTaskContent.trim();
    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const normalizedDate = normalizeScheduledDate(selectedDate);
      const effectiveGroup = getTargetGroupForDate(normalizedDate);
      let resolvedCategory = selectedCategory ?? null;
      const normalizedQuery = normalizeCategory(categoryQuery);

      if (normalizedQuery && normalizedQuery !== selectedCategory) {
        resolvedCategory = await handleCategorySubmit(categoryQuery);
      }

      if (composerMode === 'edit' && editingTask) {
        await updateTask(editingTask.id, {
          content: trimmed,
          target_group: effectiveGroup,
          priority: selectedPriority,
          date: normalizedDate,
          label: resolvedCategory,
        });
      } else {
        await createTask({
          content: trimmed,
          target_group: effectiveGroup,
          userId: session.user.id,
          date: normalizedDate,
          priority: selectedPriority,
          label: resolvedCategory,
        });
      }
      closeComposer();
      await refresh();
    } catch (error) {
      Alert.alert(
        composerMode === 'edit'
          ? 'Could not update task'
          : 'Could not create task',
        (error as Error).message,
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    categoryQuery,
    closeComposer,
    composerMode,
    editingTask,
    handleCategorySubmit,
    newTaskContent,
    refresh,
    selectedCategory,
    selectedDate,
    selectedPriority,
    session?.user?.id,
    submitting,
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
  const handleToggleSearch = React.useCallback(() => {
    setSearchDockVisible(current => {
      if (current) {
        Keyboard.dismiss();
        setSearchQuery('');
        return false;
      }

      return true;
    });
  }, []);

  const handleOpenDrawer = React.useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

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

  React.useEffect(() => {
    if (composerVisible && composerMode === 'create') {
      setSelectedDate(getDefaultDateForGroup(activeGroup));
    }
  }, [activeGroup, composerMode, composerVisible]);

  React.useEffect(() => {
    const prev = prevDrawerStatusRef.current;
    prevDrawerStatusRef.current = drawerStatus;

    if (!searchDockVisible) {
      return;
    }

    if (
      (drawerStatus === 'open' && prev !== 'open') ||
      (drawerStatus === 'closed' && prev !== 'closed')
    ) {
      handleCloseSearch();
    }
  }, [drawerStatus, handleCloseSearch, searchDockVisible]);

  const toggleLabel = React.useCallback((label: string) => {
    setSelectedLabels(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label],
    );
  }, []);

  const togglePrioritySort = React.useCallback(() => {
    setPrioritySortDirection(prev => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
  }, []);

  const clearAllFilters = React.useCallback(() => {
    setSearchQuery('');
    setSelectedLabels([]);
    setPrioritySortDirection(null);
  }, []);

  return (
    <View style={[styles.root, themeStyles.root]}>
      <StatusBar
        translucent
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
      />

      <TopBar
        topInset={insets.top}
        titlePrimary={String(completedCount)}
        titleSecondary={` / ${totalCount}`}
        subtitle={groupLabels[activeGroup]}
        searchVisible={searchDockVisible}
        searchValue={searchQuery}
        searchPlaceholder="Search all tasks"
        onSearchChangeText={setSearchQuery}
        onSearchToggle={handleToggleSearch}
        onSearchClose={handleCloseSearch}
        inputRef={searchInputRef}
        leftAction={{
          icon: 'menu',
          label: 'Open navigation menu',
          onPress: handleOpenDrawer,
        }}
      />

      <Layout
        bottomInset={insets.bottom}
        loading={loading}
        onRefresh={handleRefresh}
        onAddTask={openComposer}
        showFab={!searchDockVisible}
        filterBar={
          !searchDockVisible && advancedMode ? (
            <FilterBar
              availableLabels={availableLabels}
              selectedLabels={selectedLabels}
              activeFilterCount={activeFilterCount}
              prioritySortDirection={prioritySortDirection}
              theme={theme}
              themeStyles={themeStyles}
              onTogglePrioritySort={togglePrioritySort}
              onToggleLabel={toggleLabel}
              onClearAllFilters={clearAllFilters}
            />
          ) : null
        }
      >
        <TaskList
          tasks={displayTasks}
          onToggle={handleToggleTask}
          onPress={handleEditTask}
          onLongPress={
            searchDockVisible || advancedMode
              ? handleShowTaskDetails
              : undefined
          }
          onDelete={handleDeleteTask}
          getSecondaryText={
            searchDockVisible ? task => getTaskSearchContext(task) : undefined
          }
          loading={
            loading &&
            (searchDockVisible ? allTasks.length === 0 : baseTasks.length === 0)
          }
          emptyIcon={
            searchDockVisible && !hasSearchQuery
              ? 'rotate-cw'
              : searchDockVisible || activeFilterCount > 0
              ? 'filter'
              : 'inbox'
          }
          emptyTitle={
            searchDockVisible && !hasSearchQuery
              ? 'Start typing to search'
              : searchDockVisible || activeFilterCount > 0
              ? 'No matching tasks'
              : 'No tasks yet'
          }
          emptyDescription={
            searchDockVisible && !hasSearchQuery
              ? 'Results will appear once you enter a search term.'
              : searchDockVisible || activeFilterCount > 0
              ? 'Adjust your filters to see tasks again.'
              : 'Add a task to start building your list.'
          }
        />
      </Layout>

      <TaskComposerModal
        visible={composerVisible}
        onClose={closeComposer}
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
