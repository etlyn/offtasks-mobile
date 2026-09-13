import * as React from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawerStatus } from '@react-navigation/drawer';

import { PlannerHeader } from '@/components/navigation/PlannerHeader';
import { QuietEmpty } from '@/components/ProductUI';
import { Bookmark, Flag } from 'lucide-react-native';
import { tasksForDay, tasksForGoal } from '@/utils/planner';
import { TaskList } from '@/components/task-quick-list';
import {
  normalizeCategory,
  useTaskCategories,
} from '@/hooks/useTaskCategories';
import { useTaskRepository } from '@/lib/taskRepository';
import { getToday } from '@/hooks/useDate';
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
import { useTaskCreation } from '@/navigation/TaskCreationContext';
import { MonthCalendar } from './components/MonthCalendar';
import { useCalendarTransition } from './components/useCalendarTransition';
import { useSearchTransition } from './components/useSearchTransition';
import { TaskSearchHeader, TaskSearchEmpty } from './components/TaskSearch';
import {
  CalendarBackdrop,
  CalendarHomeHeader,
  CalendarPlanHeading,
  CalendarEmptyPlan,
} from './components/CalendarHome';

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

export const DashboardScreen = ({
  route,
  onBack,
  composerOnly = false,
  initialDate,
  initialCategory,
  onComposerClose,
}: DashboardScreenProps) => {
  const { tasks, loading, error, refreshing, refresh, applyTaskUpdate } =
    useTasks();
  const {
    create: createTask,
    update: updateTask,
    remove: deleteTask,
  } = useTaskRepository();
  const { hideCompleted, advancedMode } = usePreferences();
  const { categories, addCategory, removeCategory } = useTaskCategories();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [searchDockVisible, setSearchDockVisible] = React.useState(false);
  const searchRequest = route?.params?.searchToggleRequestId;
  React.useEffect(() => {
    if (searchRequest) setSearchDockVisible(true);
  }, [searchRequest]);
  const {
    reduceMotion: reduceSearchMotion,
    animateLayout: animateSearchLayout,
  } = useCalendarTransition();
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

  const activeGroup = route?.params?.group ?? 'today';
  const isCalendar = route?.params?.view === 'calendar';
  const goal =
    route?.params?.view === 'goal' ? route.params.category : undefined;
  const [calendarDay, setCalendarDay] = React.useState(getToday());
  const [calendarExpanded, setCalendarExpanded] = React.useState(true);
  const { animateLayout: animateCalendarLayout } = useCalendarTransition();
  const changeCalendarExpanded = React.useCallback(
    (expanded: boolean) => {
      animateCalendarLayout();
      setCalendarExpanded(expanded);
    },
    [animateCalendarLayout],
  );
  const resetCalendar = () => {
    animateCalendarLayout();
    setCalendarDay(getToday());
  };
  const taskCreation = useTaskCreation();
  const setGlobalCalendarDay = taskCreation?.setCalendarDay;
  React.useEffect(() => {
    if (isCalendar) setGlobalCalendarDay?.(calendarDay);
  }, [isCalendar, calendarDay, setGlobalCalendarDay]);
  const allTasks = React.useMemo(() => Object.values(tasks).flat(), [tasks]);
  const baseTasks = React.useMemo(
    () =>
      goal
        ? tasksForGoal(allTasks, goal)
        : isCalendar
        ? tasksForDay(allTasks, calendarDay)
        : tasks[activeGroup] ?? [],
    [activeGroup, tasks, goal, isCalendar, calendarDay, allTasks],
  );

  const [searchQuery, setSearchQuery] = React.useState('');
  const searchTransition = useSearchTransition(
    searchDockVisible,
    reduceSearchMotion,
    () => setSearchQuery(''),
  );
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
    if (!applyFilters) {
      return baseTasks;
    }

    return baseTasks.filter(task => {
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

  const activeFilterCount =
    selectedLabels.length + (prioritySortDirection ? 1 : 0);
  const totalCount = baseTasks.length;
  const completedCount = baseTasks.filter(task => task.isComplete).length;

  const [composerVisible, setComposerVisible] = React.useState(composerOnly);
  const [composerMode, setComposerMode] = React.useState<'create' | 'edit'>(
    'create',
  );
  const [editingTask, setEditingTask] = React.useState<
    Task | TaskWithOverdueFlag | null
  >(null);
  const [newTaskContent, setNewTaskContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(
    initialDate ?? getDefaultDateForGroup(activeGroup),
  );
  const [selectedPriority, setSelectedPriority] = React.useState<number>(0);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    initialCategory ?? null,
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
    setSearchDockVisible(false);
    Keyboard.dismiss();
  }, []);

  React.useEffect(() => {
    if (!searchDockVisible) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleCloseSearch();
        return true;
      },
    );
    return () => subscription.remove();
  }, [searchDockVisible, handleCloseSearch]);

  const handleSearchChange = React.useCallback(
    (value: string) => {
      animateSearchLayout();
      setSearchQuery(value);
    },
    [animateSearchLayout],
  );

  const handleRefresh = React.useCallback(() => {
    refresh({ showRefreshSpinner: true });
  }, [refresh]);

  const handleToggleTask = React.useCallback(
    async (task: Task | TaskWithOverdueFlag) => {
      try {
        const nextComplete = !task.isComplete;
        const today = getToday();
        const taskUpdates = {
          isComplete: nextComplete,
          completed_at: nextComplete ? today : null,
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
    [applyTaskUpdate, refresh, updateTask],
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
    [refresh, deleteTask],
  );

  const handleEditTask = React.useCallback(
    (task: Task | TaskWithOverdueFlag) => {
      const groupOverride = groupSegments.some(
        segment => segment.key === task.target_group,
      )
        ? (task.target_group as DashboardGroup)
        : activeGroup;

      setComposerMode('edit');
      setEditingTask(task);
      setNewTaskContent(task.content);
      setSelectedDate(task.date ?? getDefaultDateForGroup(groupOverride));
      setSelectedPriority(task.priority ?? 0);
      setCategoryQuery('');
      setSelectedCategory(task.label ?? null);
      setComposerVisible(true);
    },
    [activeGroup],
  );

  const handledTaskRequest = React.useRef<number | null>(null);
  const openTaskRequest = route?.params?.openTaskRequest;
  React.useEffect(() => {
    if (
      !openTaskRequest ||
      loading ||
      composerOnly ||
      handledTaskRequest.current === openTaskRequest.requestId
    )
      return;
    const task = allTasks.find(item => item.id === openTaskRequest.id);
    handledTaskRequest.current = openTaskRequest.requestId;
    if (task) handleEditTask(task);
    else Alert.alert('Task unavailable', 'This task may have been removed.');
  }, [openTaskRequest, loading, composerOnly, allTasks, handleEditTask]);

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
    setComposerMode('create');
    setEditingTask(null);
    setNewTaskContent('');
    setSelectedDate(
      isCalendar
        ? normalizeScheduledDate(calendarDay)
        : getDefaultDateForGroup(activeGroup),
    );
    setSelectedPriority(0);
    setCategoryQuery('');
    setSelectedCategory(goal ?? null);
    setComposerVisible(true);
  }, [activeGroup, isCalendar, calendarDay, goal]);

  const closeComposer = React.useCallback(() => {
    setComposerVisible(false);
  }, []);

  const finishClosingComposer = React.useCallback(() => {
    setNewTaskContent('');
    setSelectedPriority(0);
    setSelectedDate(getDefaultDateForGroup(activeGroup));
    setCategoryQuery('');
    setSelectedCategory(null);
    setComposerMode('create');
    setEditingTask(null);
    onComposerClose?.();
  }, [activeGroup, onComposerClose]);

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
    const trimmed = newTaskContent.trim();
    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const unchangedSchedule =
        composerMode === 'edit' &&
        editingTask &&
        selectedDate === editingTask.date;
      const normalizedDate = unchangedSchedule
        ? selectedDate
        : normalizeScheduledDate(selectedDate);
      const effectiveGroup = unchangedSchedule
        ? editingTask.target_group
        : getTargetGroupForDate(normalizedDate);
      // Goal search is not a selection. Only an explicit selection/create action
      // assigns a goal; ordinary task saving never creates one implicitly.
      const resolvedCategory = selectedCategory ?? null;

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
    closeComposer,
    composerMode,
    editingTask,
    newTaskContent,
    refresh,
    selectedCategory,
    selectedDate,
    selectedPriority,
    createTask,
    updateTask,
    submitting,
  ]);

  const handleSelectPriority = React.useCallback((value: number) => {
    setSelectedPriority(value);
  }, []);

  const handleCreateCategory = React.useCallback(async () => {
    await handleCategorySubmit(categoryQuery);
  }, [categoryQuery, handleCategorySubmit]);

  const handleSelectCategory = React.useCallback((category: string) => {
    setSelectedCategory(category);
    setCategoryQuery('');
  }, []);

  const handleClearCategory = React.useCallback(() => {
    setSelectedCategory(null);
    setCategoryQuery('');
  }, []);
  const handleToggleSearch = React.useCallback(() => {
    if (searchDockVisible) {
      handleCloseSearch();
      return;
    }
    setSearchDockVisible(true);
  }, [handleCloseSearch, searchDockVisible]);

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

  const composer = (
    <TaskComposerModal
      visible={composerVisible}
      onClose={closeComposer}
      onDismiss={finishClosingComposer}
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
  );
  if (composerOnly) return composer;

  const renderPage = (searchPage: boolean) => {
    const displayTasks = searchPage
      ? hasSearchQuery
        ? globalSearchResults
        : []
      : advancedMode
      ? sortedTasks
      : filteredTasks;
    return (
      <>
        {isCalendar && !searchPage ? (
          <CalendarHomeHeader
            onMenu={handleOpenDrawer}
            onSearch={handleToggleSearch}
          />
        ) : !searchPage ? (
          <PlannerHeader
            title={
              goal ||
              (isCalendar
                ? new Date(`${calendarDay}T12:00:00`).toLocaleDateString(
                    undefined,
                    { weekday: 'long', month: 'short', day: 'numeric' },
                  )
                : groupLabels[activeGroup])
            }
            onBack={onBack}
            backInHeader={!!goal && !!onBack}
            actions={[
              {
                icon: 'search',
                label: 'Search tasks',
                onPress: handleToggleSearch,
              },
            ]}
          />
        ) : (
          <TaskSearchHeader
            topInset={insets.top}
            value={searchQuery}
            onChange={handleSearchChange}
            onClose={handleCloseSearch}
            progress={searchTransition.progress}
            fieldProgress={searchTransition.fieldProgress}
            ready={searchTransition.ready}
            resultCount={displayTasks.length}
          />
        )}

        <Layout
          bottomInset={insets.bottom}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onAddTask={openComposer}
          showFab={false}
          calendar
          search={searchPage}
          entranceProgress={searchPage ? searchTransition.progress : undefined}
          onScrollUp={
            isCalendar && !searchPage && calendarExpanded
              ? () => changeCalendarExpanded(false)
              : undefined
          }
          filterBar={
            !searchPage && advancedMode ? (
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
          {error ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading tasks"
              onPress={handleRefresh}
            >
              <Text
                accessibilityRole="alert"
                style={{ color: theme.colors.textPrimary }}
              >
                {error} Tap to retry.
              </Text>
            </Pressable>
          ) : null}
          {isCalendar && !searchPage ? (
            <MonthCalendar
              day={calendarDay}
              onChange={setCalendarDay}
              tasks={allTasks}
              expanded={calendarExpanded}
              onExpandedChange={changeCalendarExpanded}
            />
          ) : null}
          {isCalendar && !searchPage ? (
            <CalendarPlanHeading
              completed={completedCount}
              total={totalCount}
              day={calendarDay}
              onReset={resetCalendar}
            />
          ) : !searchPage ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontWeight: '600',
                  fontSize: 15,
                }}
              >
                {isCalendar
                  ? calendarDay === getToday()
                    ? "Today's plan"
                    : 'Day plan'
                  : 'Tasks'}
              </Text>
              {totalCount > 0 ? (
                <Text
                  style={{ color: theme.colors.textSecondary, fontSize: 12 }}
                >
                  {completedCount}/{totalCount}
                </Text>
              ) : null}
            </View>
          ) : null}
          {searchPage && !loading && displayTasks.length === 0 ? (
            error ? null : (
              <TaskSearchEmpty hasQuery={hasSearchQuery} />
            )
          ) : isCalendar &&
            !searchPage &&
            !loading &&
            !error &&
            activeFilterCount === 0 &&
            displayTasks.length === 0 ? (
            <CalendarEmptyPlan
              allComplete={totalCount > 0 && completedCount === totalCount}
            />
          ) : !searchPage && !loading && !error && displayTasks.length === 0 ? (
            <QuietEmpty
              icon={goal ? Flag : Bookmark}
              label={
                activeFilterCount > 0 ? 'No matching tasks' : 'No tasks planned'
              }
            />
          ) : (
            <TaskList
              calendar
              tasks={displayTasks}
              onToggle={handleToggleTask}
              onPress={handleEditTask}
              onLongPress={
                searchPage || advancedMode ? handleShowTaskDetails : undefined
              }
              onDelete={handleDeleteTask}
              getSecondaryText={
                searchPage ? task => getTaskSearchContext(task) : undefined
              }
              loading={
                loading &&
                (searchPage ? allTasks.length === 0 : baseTasks.length === 0)
              }
              emptyIcon={activeFilterCount > 0 ? 'filter' : 'inbox'}
              emptyTitle={
                activeFilterCount > 0 ? 'No matching tasks' : 'No tasks yet'
              }
              emptyDescription={
                activeFilterCount > 0
                  ? 'Adjust your filters to see tasks again.'
                  : 'Add a task to start building your list.'
              }
            />
          )}
        </Layout>
      </>
    );
  };

  return (
    <View style={[styles.root, themeStyles.root]}>
      <StatusBar
        translucent
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
      />
      <CalendarBackdrop />
      <View
        testID="search-underlay"
        style={styles.scroll}
        pointerEvents={searchTransition.mounted ? 'none' : 'auto'}
        accessibilityElementsHidden={searchTransition.mounted}
        importantForAccessibility={
          searchTransition.mounted ? 'no-hide-descendants' : 'auto'
        }
      >
        {renderPage(false)}
      </View>
      {searchTransition.mounted ? (
        <View
          testID="task-search-overlay"
          style={StyleSheet.absoluteFill}
          onAccessibilityEscape={handleCloseSearch}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              themeStyles.root,
              { opacity: searchTransition.progress },
            ]}
          >
            <CalendarBackdrop />
          </Animated.View>
          {renderPage(true)}
        </View>
      ) : null}
      {composer}
    </View>
  );
};
