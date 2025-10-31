import * as React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

import { DashboardHeader } from '@/components/dashboard-header';
import { TaskQuickList } from '@/components/task-quick-list';
import { createTask, deleteTask, updateTask } from '@/lib/supabase';
import { getAdjacentDay, getToday } from '@/hooks/useDate';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

import { styles, SHEET_MAX_HEIGHT } from './Dashboard.styles';
import type {
  DashboardGroup,
  DashboardScreenProps,
  GroupSegment,
  PriorityOption,
} from './Dashboard.types';

const groupLabels: Record<DashboardGroup, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming',
};

const groupCaptions: Record<DashboardGroup, string> = {
  today: 'Lock in on what you promised yourself for today.',
  tomorrow: 'Preview tomorrow to stay one step ahead.',
  upcoming: 'Stage future tasks so nothing falls through the cracks.',
};

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

  const activeGroup = route?.params?.group ?? 'tomorrow';
  const activeTasks = tasks[activeGroup] ?? [];

  const completedCount = React.useMemo(
    () => activeTasks.filter((task) => task.isComplete).length,
    [activeTasks]
  );
  const totalCount = activeTasks.length;

  const [composerVisible, setComposerVisible] = React.useState(false);
  const [newTaskContent, setNewTaskContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [composerGroup, setComposerGroup] = React.useState<DashboardGroup>(activeGroup);
  const [selectedPriority, setSelectedPriority] = React.useState<number>(0);
  const [prioritySheetVisible, setPrioritySheetVisible] = React.useState(false);
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
    setPrioritySheetVisible(false);
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
    setPrioritySheetVisible(false);
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

  const summaryLabel = totalCount > 0 ? `${completedCount} of ${totalCount}` : 'Nothing scheduled';
  const caption = groupCaptions[activeGroup];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}> 
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 180 }]}
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
        <DashboardHeader dayLabel={groupLabels[activeGroup]} summary={summaryLabel} caption={caption} />

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

      <Modal
        visible={composerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeComposer}
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalFlex} onPress={closeComposer} />
          <View style={styles.sheetContainer} pointerEvents="box-none">
            <View
              style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}
            >
              <View style={styles.sheetHandle} />
              <Pressable
                style={styles.sheetClose}
                onPress={closeComposer}
                accessibilityRole="button"
                accessibilityLabel="Close task composer"
              >
                <Feather name="x" size={18} color={palette.slate600} />
              </Pressable>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sheetTitle}>New Task</Text>
                <Text style={styles.sheetSubtitle}>What needs to be done?</Text>

                <View style={styles.sheetSection}>
                  <Text style={styles.sheetLabel}>Task</Text>
                  <TextInput
                    style={styles.sheetInput}
                    placeholder="What needs to happen?"
                    placeholderTextColor={palette.slate600}
                    value={newTaskContent}
                    onChangeText={setNewTaskContent}
                    editable={!submitting}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sheetLabel}>When</Text>
                  <View style={styles.segmentGroup}>
                    {groupSegments.map((segment) => {
                      const isSelected = composerGroup === segment.key;
                      return (
                        <Pressable
                          key={segment.key}
                          style={({ pressed }) => [
                            styles.segment,
                            isSelected && styles.segmentSelected,
                            pressed && styles.segmentPressed,
                          ]}
                          onPress={() => setComposerGroup(segment.key)}
                        >
                          <Text style={[styles.segmentLabel, isSelected && styles.segmentLabelSelected]}>
                            {segment.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaColumn}>
                    <Text style={styles.sheetLabel}>Priority</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.metaButton,
                        pressed && styles.metaButtonPressed,
                      ]}
                      onPress={() => setPrioritySheetVisible(true)}
                    >
                      <View
                        style={[
                          styles.metaIcon,
                          {
                            borderColor: selectedPriorityOption.tint,
                            backgroundColor: selectedPriorityOption.background,
                          },
                        ]}
                      >
                        <Feather
                          name={selectedPriorityOption.icon}
                          size={18}
                          color={selectedPriorityOption.tint}
                        />
                      </View>
                      <View style={styles.metaCopy}>
                        <Text style={styles.metaTitle}>{selectedPriorityOption.label}</Text>
                        <Text style={styles.metaSubtitle}>{selectedPriorityOption.description}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={palette.slate600} />
                    </Pressable>
                  </View>

                  <View style={styles.metaColumn}>
                    <Text style={styles.sheetLabel}>Category</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.metaButton,
                        pressed && styles.metaButtonPressed,
                      ]}
                      onPress={() => setCategorySheetVisible(true)}
                    >
                      <View style={[styles.metaIcon, styles.metaIconNeutral]}>
                        <Feather name="tag" size={18} color={palette.slate600} />
                      </View>
                      <View style={styles.metaCopy}>
                        <Text style={styles.metaTitle}>{selectedCategory ?? 'None'}</Text>
                        <Text style={styles.metaSubtitle}>
                          {selectedCategory ? 'Assigned to this list' : 'Optional organisation'}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={palette.slate600} />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create task"
                  style={({ pressed }) => [
                    styles.createButton,
                    (!newTaskContent.trim() || submitting) && styles.createButtonDisabled,
                    pressed && newTaskContent.trim() && !submitting && styles.createButtonPressed,
                  ]}
                  onPress={handleCreateTask}
                  disabled={!newTaskContent.trim() || submitting}
                >
                  <Text style={styles.createButtonLabel}>
                    {submitting ? 'Creating…' : 'Create Task'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={prioritySheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrioritySheetVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalFlex} onPress={() => setPrioritySheetVisible(false)} />
          <View
            style={[styles.optionSheet, { paddingBottom: insets.bottom + 24, maxHeight: SHEET_MAX_HEIGHT }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.optionTitle}>Select Priority</Text>
            <Text style={styles.optionSubtitle}>
              Set how urgent this task feels for future you.
            </Text>
            {priorityOptions.map((option) => {
              const isActive = selectedPriority === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isActive && styles.optionItemActive,
                    pressed && styles.optionItemPressed,
                  ]}
                  onPress={() => handleSelectPriority(option.value)}
                >
                  <View
                    style={[
                      styles.metaIcon,
                      {
                        borderColor: option.tint,
                        backgroundColor: option.background,
                      },
                    ]}
                  >
                    <Feather name={option.icon} size={18} color={option.tint} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionCaption}>{option.description}</Text>
                  </View>
                  {isActive && <Feather name="check" size={18} color={palette.mintStrong} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal
        visible={categorySheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategorySheetVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={styles.modalWrapper}
          >
            <Pressable style={styles.modalFlex} onPress={() => setCategorySheetVisible(false)} />
            <View
              style={[styles.optionSheet, { paddingBottom: insets.bottom + 24, maxHeight: SHEET_MAX_HEIGHT }]}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.optionTitle}>Select Category</Text>
              <Text style={styles.optionSubtitle}>
                Keep similar work grouped for quicker scanning.
              </Text>
              <View style={styles.categorySearch}>
                <Feather name="search" size={18} color={palette.slate600} />
                <TextInput
                  style={styles.categoryInput}
                  placeholder="Search or create…"
                  placeholderTextColor={palette.slate600}
                  value={categoryQuery}
                  onChangeText={setCategoryQuery}
                  editable={!submitting}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <ScrollView style={styles.categoryList} keyboardShouldPersistTaps="handled">
                {canCreateCategory && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionItem,
                      pressed && styles.optionItemPressed,
                    ]}
                    onPress={handleAddCategory}
                  >
                    <View style={[styles.metaIcon, styles.metaIconNeutral]}>
                      <Feather name="plus" size={18} color={palette.slate600} />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionLabel}>Add “{categoryQuery.trim()}”</Text>
                      <Text style={styles.optionCaption}>Create a reusable category.</Text>
                    </View>
                  </Pressable>
                )}
                {filteredCategories.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <Pressable
                      key={category}
                      style={({ pressed }) => [
                        styles.optionItem,
                        isActive && styles.optionItemActive,
                        pressed && styles.optionItemPressed,
                      ]}
                      onPress={() => handleSelectCategory(category)}
                    >
                      <View style={[styles.metaIcon, styles.metaIconNeutral]}>
                        <Feather name="tag" size={18} color={palette.slate600} />
                      </View>
                      <View style={styles.optionCopy}>
                        <Text style={styles.optionLabel}>{category}</Text>
                        <Text style={styles.optionCaption}>Tap to assign this category.</Text>
                      </View>
                      {isActive && <Feather name="check" size={18} color={palette.mintStrong} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};
