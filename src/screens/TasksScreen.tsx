import * as React from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskQuickList } from '@/components/TaskQuickList';
import { createTask, deleteTask, updateTask } from '@/lib/supabase';
import { getAdjacentDay, getToday } from '@/hooks/useDate';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task, TaskGroup } from '@/types/task';
import { palette } from '@/theme/colors';

type DashboardGroup = Exclude<TaskGroup, 'close'>;

const groupSegments: { key: DashboardGroup; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'upcoming', label: 'Upcoming' },
];

const priorityOptions = [
  {
    value: 0,
    label: 'None',
    description: 'Keep this task unprioritised.',
    icon: 'minus-circle' as const,
    tint: '#64748b',
    background: 'rgba(100, 116, 139, 0.12)',
  },
  {
    value: 1,
    label: 'Low',
    description: 'Good to do when you have the time.',
    icon: 'arrow-down-left' as const,
    tint: '#0891b2',
    background: 'rgba(8, 145, 178, 0.12)',
  },
  {
    value: 2,
    label: 'Medium',
    description: 'Important but not urgent.',
    icon: 'minus' as const,
    tint: '#6366f1',
    background: 'rgba(99, 102, 241, 0.12)',
  },
  {
    value: 3,
    label: 'High',
    description: 'Handle this before everything else.',
    icon: 'alert-triangle' as const,
    tint: '#f97316',
    background: 'rgba(249, 115, 22, 0.12)',
  },
];

const presetCategories = ['Work', 'Personal', 'Home', 'Shopping', 'Health', 'Finance'];

const windowHeight = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = windowHeight * 0.7;

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

interface TasksScreenProps {
  route?: {
    params?: {
      group?: DashboardGroup;
    };
  };
}

export const TasksScreen = ({ route }: TasksScreenProps) => {
  const { tasks, loading, refresh } = useTasks();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const headerOffset = insets.top + 120;

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

  const canCreateCategory = normalizedQuery.length > 0 &&
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
    gap: 28,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mint,
    shadowColor: palette.mint,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  fabPressed: {
    transform: [{ scale: 0.98 }],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardAvoid: {
    width: '100%',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalFlex: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: palette.lightSurface,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 24,
    elevation: 24,
    maxHeight: SHEET_MAX_HEIGHT,
  },
  modalScroll: {
    flexGrow: 0,
    maxHeight: SHEET_MAX_HEIGHT - 120,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.lightBorder,
    marginBottom: 16,
  },
  sheetClose: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.lightMuted,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: 4,
  },
  sheetSubtitle: {
    marginBottom: 20,
    color: palette.slate600,
    fontSize: 14,
    lineHeight: 20,
  },
  sheetSection: {
    marginBottom: 20,
  },
  sheetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sheetInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 140,
    color: palette.slate900,
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  segment: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: palette.mintMuted,
    borderColor: palette.mint,
  },
  segmentPressed: {
    opacity: 0.85,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate600,
  },
  segmentLabelSelected: {
    color: palette.mintStrong,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metaColumn: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 12,
  },
  metaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.lightBorder,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: palette.lightSurface,
  },
  metaButtonPressed: {
    opacity: 0.9,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metaIconNeutral: {
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightMuted,
  },
  metaCopy: {
    flex: 1,
    marginLeft: 12,
  },
  metaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate900,
  },
  metaSubtitle: {
    fontSize: 13,
    color: palette.slate600,
    marginTop: 2,
  },
  createButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: palette.mint,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: palette.mintMuted,
  },
  createButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  createButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.lightSurface,
  },
  optionSheet: {
    backgroundColor: palette.lightSurface,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 24,
    elevation: 24,
    maxHeight: SHEET_MAX_HEIGHT,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
    textAlign: 'center',
  },
  optionSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: palette.slate600,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: palette.lightSurface,
  },
  optionItemActive: {
    borderColor: palette.mint,
  },
  optionItemPressed: {
    opacity: 0.9,
  },
  optionCopy: {
    flex: 1,
    marginLeft: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate900,
  },
  optionCaption: {
    fontSize: 13,
    color: palette.slate600,
    marginTop: 2,
  },
  categorySearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    borderRadius: 16,
    backgroundColor: palette.lightMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  categoryInput: {
    flex: 1,
    fontSize: 15,
    color: palette.slate900,
    paddingVertical: 0,
  },
  categoryList: {
    maxHeight: 260,
  },
});
