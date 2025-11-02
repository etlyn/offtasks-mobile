import * as React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskQuickList } from '@/components/task-quick-list';
import { createTask, deleteTask, updateTask } from '@/lib/supabase';
import { getAdjacentDay, getToday } from '@/hooks/useDate';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

import { styles } from './Dashboard.styles';
import type {
  DashboardGroup,
  DashboardScreenProps,
  GroupSegment,
  PriorityOption,
} from './Dashboard.types';
import { TaskComposerModal } from './components/TaskComposerModal';
import { CategorySheetModal } from './components/CategorySheetModal';

const groupSegments: GroupSegment[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'upcoming', label: 'Upcoming' },
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
  const insets = useSafeAreaInsets();
  const headerOffset = insets.top + 108;

  const activeGroup = route?.params?.group ?? 'tomorrow';
  const activeTasks = tasks[activeGroup] ?? [];

  const [composerVisible, setComposerVisible] = React.useState(false);
  const [newTaskContent, setNewTaskContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [composerGroup, setComposerGroup] = React.useState<DashboardGroup>(activeGroup);
  const [selectedPriority, setSelectedPriority] = React.useState<number>(0);
  const [categorySheetVisible, setCategorySheetVisible] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);

  const categories = React.useMemo(() => {
    const merged = [...presetCategories, ...customCategories];
    return Array.from(new Set(merged.map((name) => name.trim()))).filter(Boolean);
  }, [customCategories]);

  const normalizedQuery = categoryQuery.trim().toLowerCase();

  const filteredCategories = React.useMemo(() => {
    if (!normalizedQuery) {
      return categories;
    }
    return categories.filter((name) => name.toLowerCase().includes(normalizedQuery));
  }, [categories, normalizedQuery]);

  const canCreateCategory =
    normalizedQuery.length > 0 &&
    !categories.some((name) => name.toLowerCase() === normalizedQuery);

  const selectedPriorityOption = React.useMemo(
    () => priorityOptions.find((option) => option.value === selectedPriority) ?? priorityOptions[0],
    [selectedPriority]
  );

  const handleRefresh = React.useCallback(() => {
    refresh();
  }, [refresh]);

  const handleToggleTask = React.useCallback(
    async (task: Task) => {
      try {
        await updateTask(task.id, { isComplete: !task.isComplete });
        await refresh();
      } catch (error) {
        Alert.alert('Update failed', (error as Error).message);
      }
    },
    [refresh]
  );

  const handleDeleteTask = React.useCallback(
    (task: Task) => {
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

  const openComposer = React.useCallback(() => {
    if (!session?.user?.id) {
      Alert.alert('Not signed in', 'Sign in to add tasks.');
      return;
    }
    setComposerGroup(activeGroup);
    setSelectedPriority(0);
    setSelectedCategory(null);
    setCategoryQuery('');
    setComposerVisible(true);
  }, [activeGroup, session?.user?.id]);

  const closeComposer = React.useCallback(() => {
    setComposerVisible(false);
    setNewTaskContent('');
    setSelectedPriority(0);
    setComposerGroup(activeGroup);
    setSelectedCategory(null);
    setCategoryQuery('');
    setCategorySheetVisible(false);
  }, [activeGroup]);

  const handleCreateTask = React.useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    const trimmed = newTaskContent.trim();
    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await createTask({
        content: trimmed,
        target_group: composerGroup,
        userId: session.user.id,
        date: dateForGroup(composerGroup),
        priority: selectedPriority,
      });
      closeComposer();
      await refresh();
    } catch (error) {
      Alert.alert('Could not create task', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [closeComposer, composerGroup, newTaskContent, refresh, selectedPriority, session?.user?.id, submitting]);

  const handleSelectPriority = React.useCallback((value: number) => {
    setSelectedPriority(value);
  }, []);

  const handleSelectCategory = React.useCallback((value: string) => {
    setSelectedCategory(value);
    setCategorySheetVisible(false);
  }, []);

  const handleAddCategory = React.useCallback(() => {
    if (!normalizedQuery) {
      return;
    }
    const formatted = normalizedQuery.replace(/\s+/g, ' ').trim();
    const capitalised = formatted.replace(/(^|\s)\w/g, (match) => match.toUpperCase());
    setCustomCategories((prev) => (prev.includes(capitalised) ? prev : [...prev, capitalised]));
    setSelectedCategory(capitalised);
    setCategorySheetVisible(false);
  }, [normalizedQuery]);

  React.useEffect(() => {
    if (composerVisible) {
      setComposerGroup(activeGroup);
    }
  }, [activeGroup, composerVisible]);

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
        <TaskQuickList
          tasks={activeTasks}
          onToggle={handleToggleTask}
          onLongPress={handleDeleteTask}
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
        onOpenCategorySheet={() => setCategorySheetVisible(true)}
        selectedPriorityOption={selectedPriorityOption}
        selectedCategory={selectedCategory}
        submitting={submitting}
        onSubmit={handleCreateTask}
      />

      <CategorySheetModal
        visible={categorySheetVisible}
        insetBottom={insets.bottom}
        categoryQuery={categoryQuery}
        onCategoryQueryChange={setCategoryQuery}
        filteredCategories={filteredCategories}
        canCreateCategory={canCreateCategory}
        onCreateCategory={handleAddCategory}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        submitting={submitting}
        onClose={() => setCategorySheetVisible(false)}
      />
    </View>
  );
};
