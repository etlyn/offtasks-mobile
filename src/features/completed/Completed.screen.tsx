import React from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {
  CommonActions,
  NavigationProp,
  ParamListBase,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  normalizeCategory,
  useTaskCategories,
} from '@/hooks/useTaskCategories';
import { TopBar } from '@/components/navigation/TopBar';
import { updateTask } from '@/lib/supabase';
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

const fireworksParticles = [
  {
    anchorX: 0.28,
    anchorY: 92,
    size: 10,
    color: '#f97316',
    translateX: -46,
    translateY: -64,
    delay: 0,
    rotate: '16deg',
  },
  {
    anchorX: 0.28,
    anchorY: 92,
    size: 8,
    color: '#facc15',
    translateX: 40,
    translateY: -72,
    delay: 40,
    rotate: '-12deg',
  },
  {
    anchorX: 0.28,
    anchorY: 92,
    size: 6,
    color: '#fb7185',
    translateX: -18,
    translateY: -94,
    delay: 80,
    rotate: '24deg',
  },
  {
    anchorX: 0.28,
    anchorY: 92,
    size: 7,
    color: '#2dd4bf',
    translateX: 58,
    translateY: -26,
    delay: 120,
    rotate: '-20deg',
  },
  {
    anchorX: 0.72,
    anchorY: 96,
    size: 10,
    color: '#38bdf8',
    translateX: 48,
    translateY: -68,
    delay: 60,
    rotate: '-18deg',
  },
  {
    anchorX: 0.72,
    anchorY: 96,
    size: 8,
    color: '#c084fc',
    translateX: -44,
    translateY: -74,
    delay: 100,
    rotate: '14deg',
  },
  {
    anchorX: 0.72,
    anchorY: 96,
    size: 6,
    color: '#4ade80',
    translateX: 16,
    translateY: -98,
    delay: 140,
    rotate: '28deg',
  },
  {
    anchorX: 0.72,
    anchorY: 96,
    size: 7,
    color: '#fb7185',
    translateX: -62,
    translateY: -28,
    delay: 180,
    rotate: '-26deg',
  },
];

const celebrationEmojiDrops = [
  { emoji: '🎉', anchorX: 0.1, driftX: 18, delay: 0, duration: 2500, spin: 18 },
  {
    emoji: '✨',
    anchorX: 0.22,
    driftX: -16,
    delay: 90,
    duration: 2750,
    spin: -20,
  },
  {
    emoji: '🥳',
    anchorX: 0.34,
    driftX: 22,
    delay: 180,
    duration: 2900,
    spin: 24,
  },
  {
    emoji: '🎊',
    anchorX: 0.48,
    driftX: -10,
    delay: 60,
    duration: 3050,
    spin: -16,
  },
  {
    emoji: '🏆',
    anchorX: 0.62,
    driftX: 16,
    delay: 140,
    duration: 2800,
    spin: 16,
  },
  {
    emoji: '⭐',
    anchorX: 0.76,
    driftX: -20,
    delay: 220,
    duration: 2950,
    spin: -22,
  },
  {
    emoji: '🎈',
    anchorX: 0.9,
    driftX: 12,
    delay: 120,
    duration: 3150,
    spin: 18,
  },
] as const;

const statisticsTabs = [
  { key: 'open', label: 'Open issues', icon: 'alert-circle' },
  { key: 'closed', label: 'Closed issues', icon: 'check-circle' },
] as const;

type StatisticsTabKey = (typeof statisticsTabs)[number]['key'];

const sectionLabels = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Later',
  close: 'Close',
} as const;

export const StatisticsScreen = () => {
  const { tasks, totals, loading, refresh, applyTaskUpdate } = useTasks();
  const { categories, addCategory, removeCategory } = useTaskCategories();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const searchInputRef = React.useRef<TextInput | null>(null);

  const [activeTab, setActiveTab] = React.useState<StatisticsTabKey>('open');
  const [searchVisible, setSearchVisible] = React.useState(false);
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
  const [showFireworks, setShowFireworks] = React.useState(false);

  const fireworkAnimations = React.useRef(
    fireworksParticles.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.25),
    })),
  ).current;
  const emojiRainAnimations = React.useRef(
    celebrationEmojiDrops.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    })),
  ).current;
  const haloOpacity = React.useRef(new Animated.Value(0)).current;
  const haloScale = React.useRef(new Animated.Value(0.2)).current;

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
  const groupedOpenCounts = React.useMemo(
    () => ({
      today: openTasks.filter(task => task.target_group === 'today').length,
      tomorrow: openTasks.filter(task => task.target_group === 'tomorrow')
        .length,
      upcoming: openTasks.filter(task => task.target_group === 'upcoming')
        .length,
    }),
    [openTasks],
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
  const globalSearchResults = React.useMemo(
    () => filterTasksForSearch(allTasks, searchQuery),
    [allTasks, searchQuery],
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
    refresh();
  }, [refresh]);

  const handleCloseSearch = React.useCallback(() => {
    setSearchQuery('');
    setSearchVisible(false);
    Keyboard.dismiss();
  }, []);

  const handleToggleSearch = React.useCallback(() => {
    if (searchVisible) {
      handleCloseSearch();
      return;
    }

    setSearchVisible(true);
  }, [handleCloseSearch, searchVisible]);

  const handleBackToHome = React.useCallback(() => {
    handleCloseSearch();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Dashboard',
            state: {
              index: 0,
              routes: [{ name: 'Today', params: { group: 'today' } }],
            },
          },
        ],
      }),
    );
  }, [handleCloseSearch, navigation]);

  const handleToggleTask = React.useCallback(
    async (task: Task) => {
      const nextComplete = !task.isComplete;
      const today = getToday();
      const updates = {
        isComplete: nextComplete,
        completed_at: nextComplete ? today : null,
        target_group: nextComplete ? 'today' : task.target_group,
        date: nextComplete ? today : task.date,
      };

      applyTaskUpdate(task.id, updates);

      try {
        await updateTask(task.id, updates);
      } catch (error) {
        await refresh();
        throw error;
      }
    },
    [applyTaskUpdate, refresh],
  );

  const handleRestore = React.useCallback(
    async (task: Task) => {
      applyTaskUpdate(task.id, { isComplete: false, completed_at: null });

      try {
        await updateTask(task.id, { isComplete: false, completed_at: null });
      } catch (error) {
        await refresh();
        throw error;
      }
    },
    [applyTaskUpdate, refresh],
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
    setSelectedDate(
      normalizeScheduledDate(
        task.date ?? getDefaultDateForGroup(fallbackGroup),
      ),
    );
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
      const normalizedDate = normalizeScheduledDate(selectedDate);
      const effectiveGroup = getTargetGroupForDate(normalizedDate);
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

  useFocusEffect(
    React.useCallback(() => {
      setShowFireworks(true);

      fireworkAnimations.forEach(animation => {
        animation.opacity.setValue(0);
        animation.translateX.setValue(0);
        animation.translateY.setValue(0);
        animation.scale.setValue(0.25);
      });
      emojiRainAnimations.forEach(animation => {
        animation.opacity.setValue(0);
        animation.translateX.setValue(0);
        animation.translateY.setValue(0);
        animation.rotate.setValue(0);
        animation.scale.setValue(0.8);
      });
      haloOpacity.setValue(0);
      haloScale.setValue(0.2);

      const animation = Animated.parallel([
        Animated.sequence([
          Animated.timing(haloOpacity, {
            toValue: 0.28,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0,
            duration: 420,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(haloScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        ...fireworkAnimations.map((animatedValues, index) => {
          const particle = fireworksParticles[index];

          return Animated.sequence([
            Animated.delay(particle.delay),
            Animated.parallel([
              Animated.timing(animatedValues.opacity, {
                toValue: 1,
                duration: 70,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValues.translateX, {
                toValue: particle.translateX,
                duration: 540,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValues.translateY, {
                toValue: particle.translateY,
                duration: 540,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValues.scale, {
                toValue: 1,
                duration: 180,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(animatedValues.opacity, {
              toValue: 0,
              duration: 180,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]);
        }),
        ...emojiRainAnimations.map((animatedValues, index) => {
          const drop = celebrationEmojiDrops[index];

          return Animated.sequence([
            Animated.delay(drop.delay),
            Animated.parallel([
              Animated.timing(animatedValues.opacity, {
                toValue: 1,
                duration: 140,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValues.translateY, {
                toValue: windowHeight + 220,
                duration: drop.duration,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValues.translateX, {
                toValue: drop.driftX,
                duration: drop.duration,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValues.rotate, {
                toValue: drop.spin,
                duration: drop.duration,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(animatedValues.scale, {
                  toValue: 1.1,
                  duration: 280,
                  easing: Easing.out(Easing.back(1.2)),
                  useNativeDriver: true,
                }),
                Animated.timing(animatedValues.scale, {
                  toValue: 0.92,
                  duration: Math.max(drop.duration - 280, 200),
                  easing: Easing.inOut(Easing.quad),
                  useNativeDriver: true,
                }),
              ]),
            ]),
            Animated.timing(animatedValues.opacity, {
              toValue: 0,
              duration: 140,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]);
        }),
      ]);

      animation.start(({ finished }) => {
        if (finished) {
          setShowFireworks(false);
        }
      });

      return () => {
        animation.stop();
        setShowFireworks(false);
      };
    }, [
      emojiRainAnimations,
      fireworkAnimations,
      haloOpacity,
      haloScale,
      windowHeight,
    ]),
  );

  return (
    <View style={styles.root}>
      {showFireworks ? (
        <View pointerEvents="none" style={styles.fireworksLayer}>
          <Animated.View
            style={[
              styles.fireworksHalo,
              {
                left: windowWidth * 0.5 - 64,
                top: insets.top + 40,
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          {fireworksParticles.map((particle, index) => {
            const animatedValues = fireworkAnimations[index];

            return (
              <Animated.View
                key={`${particle.anchorX}-${particle.delay}`}
                style={[
                  styles.fireworkParticle,
                  {
                    left: windowWidth * particle.anchorX,
                    top: insets.top + particle.anchorY,
                    width: particle.size,
                    height: particle.size * 2.8,
                    borderRadius: particle.size,
                    backgroundColor: particle.color,
                    opacity: animatedValues.opacity,
                    transform: [
                      { translateX: animatedValues.translateX },
                      { translateY: animatedValues.translateY },
                      { scale: animatedValues.scale },
                      { rotate: particle.rotate },
                    ],
                  },
                ]}
              />
            );
          })}
          {celebrationEmojiDrops.map((drop, index) => {
            const animatedValues = emojiRainAnimations[index];
            const rotate = animatedValues.rotate.interpolate({
              inputRange: [-30, 30],
              outputRange: ['-30deg', '30deg'],
            });

            return (
              <Animated.View
                key={`${drop.emoji}-${index}`}
                style={[
                  styles.emojiRainItem,
                  {
                    left: windowWidth * drop.anchorX,
                    top: insets.top - 40,
                    opacity: animatedValues.opacity,
                    transform: [
                      { translateX: animatedValues.translateX },
                      { translateY: animatedValues.translateY },
                      { rotate },
                      { scale: animatedValues.scale },
                    ],
                  },
                ]}
              >
                <Text style={styles.emojiRainText}>{drop.emoji}</Text>
              </Animated.View>
            );
          })}
        </View>
      ) : null}

      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <TopBar
        topInset={insets.top}
        titlePrimary="Statistics"
        subtitle="Search and manage all tasks"
        searchVisible={searchVisible}
        searchValue={searchQuery}
        searchPlaceholder="Search all tasks"
        onSearchChangeText={setSearchQuery}
        onSearchToggle={handleToggleSearch}
        onSearchClose={handleCloseSearch}
        inputRef={searchInputRef}
        leftAction={{
          icon: 'chevron-left',
          label: 'Back to home',
          onPress: handleBackToHome,
        }}
      />

      <ScrollView
        style={styles.scroll}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              loading && openTasks.length === 0 && completedTasks.length === 0
            }
            onRefresh={handleRefresh}
            tintColor={theme.colors.textSecondary}
          />
        }
      >
        {!searchVisible ? (
          <View style={styles.stickyHeader}>
            <View style={styles.headerContent}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabRail}
              >
                {statisticsTabs.map(tab => {
                  const isActive = tab.key === activeTab;

                  return (
                    <Pressable
                      key={tab.key}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${tab.label}`}
                      onPress={() => setActiveTab(tab.key)}
                      style={({ pressed }) => [
                        styles.tabPill,
                        isActive && styles.tabPillActive,
                        pressed && styles.tabPillPressed,
                      ]}
                    >
                      <Feather
                        name={tab.icon}
                        size={14}
                        color={
                          isActive
                            ? theme.colors.textInverse
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.tabPillText,
                          isActive && styles.tabPillTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ) : null}

        <View style={styles.bodyContent}>
          {searchVisible ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Search results</Text>
              <TaskList
                tasks={hasSearchQuery ? globalSearchResults : []}
                onToggle={handleToggleTask}
                onPress={handleEditTask}
                getSecondaryText={task => getTaskSearchContext(task)}
                loading={loading && allTasks.length === 0}
                emptyTitle={
                  hasSearchQuery
                    ? 'No matching tasks'
                    : 'Start typing to search'
                }
                emptyDescription={
                  hasSearchQuery
                    ? 'Try a different search term.'
                    : 'Results will appear once you enter a search term.'
                }
              />
            </View>
          ) : null}

          {!searchVisible ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.metricLabel}>Open</Text>
                <Text style={styles.summaryValue}>{openTasks.length}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.metricLabel}>Closed</Text>
                <Text style={styles.summaryValue}>{totals.completed}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.metricLabel}>Overdue</Text>
                <Text style={styles.summaryValue}>{overdueCount}</Text>
              </View>
            </View>
          ) : null}

          {!searchVisible && activeTab === 'open' ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Open issues</Text>
                <View style={styles.overduePill}>
                  <Feather name="alert-triangle" size={13} color="#b45309" />
                  <Text style={styles.overduePillText}>
                    {overdueCount} overdue
                  </Text>
                </View>
              </View>

              <View style={styles.openIssueSummaryRow}>
                <View style={styles.openIssueSummaryCard}>
                  <Text style={styles.openIssueSummaryLabel}>Today</Text>
                  <Text style={styles.openIssueSummaryValue}>
                    {groupedOpenCounts.today}
                  </Text>
                </View>
                <View style={styles.openIssueSummaryCard}>
                  <Text style={styles.openIssueSummaryLabel}>Tomorrow</Text>
                  <Text style={styles.openIssueSummaryValue}>
                    {groupedOpenCounts.tomorrow}
                  </Text>
                </View>
                <View style={styles.openIssueSummaryCard}>
                  <Text style={styles.openIssueSummaryLabel}>Later</Text>
                  <Text style={styles.openIssueSummaryValue}>
                    {groupedOpenCounts.upcoming}
                  </Text>
                </View>
              </View>

              {visibleOpenTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    {normalizedSearchQuery
                      ? 'No matching open issues'
                      : 'No open issues'}
                  </Text>
                </View>
              ) : (
                visibleOpenTasks.map((task, index) => {
                  const isLast = index === visibleOpenTasks.length - 1;
                  const isOverdue = Boolean(task.date && task.date < todayKey);

                  return (
                    <View
                      key={task.id}
                      style={[styles.issueRow, isLast && styles.issueRowLast]}
                    >
                      <View style={styles.issueCopy}>
                        <Text style={styles.issueTitle}>{task.content}</Text>
                        <Text style={styles.issueMeta}>
                          {task.label?.trim() ||
                            sectionLabels[task.target_group]}
                        </Text>
                      </View>

                      <View style={styles.issueBadgeGroup}>
                        {isOverdue ? (
                          <View style={styles.issueBadgeWarning}>
                            <Text style={styles.issueBadgeWarningText}>
                              Overdue
                            </Text>
                          </View>
                        ) : null}
                        {task.priority ? (
                          <View style={styles.issueBadgeNeutral}>
                            <Text style={styles.issueBadgeNeutralText}>
                              P{task.priority}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {!searchVisible && activeTab === 'closed' ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Closed issues</Text>

              <TaskList
                tasks={visibleCompletedTasks}
                onToggle={handleRestore}
                onPress={handleEditTask}
                loading={loading && visibleCompletedTasks.length === 0}
                emptyIcon="check-circle"
                emptyTitle={
                  normalizedSearchQuery
                    ? 'No matching closed issues'
                    : 'No closed issues'
                }
              />
            </View>
          ) : null}
        </View>
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
