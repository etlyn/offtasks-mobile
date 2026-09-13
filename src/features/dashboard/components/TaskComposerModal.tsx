import * as React from 'react';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Animated,
  Easing,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Flag,
  Minus,
  Plus,
  Search,
  SignalLow,
  SignalMedium,
  SignalHigh,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import type { DashboardGroup, PriorityOption } from '../Dashboard.types';
import {
  GentlePressable as Pressable,
  PageBackdrop,
} from '@/components/ProductUI';
import { GlassSurface } from '@/components/GlassSurface';
import { DetachedTaskSheet } from './DetachedTaskSheet';
import { useCalendarTransition } from './useCalendarTransition';
import { getToday } from '@/hooks/useDate';
import { useAppTheme } from '@/theme/colors';

const parseDateKey = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
const toDateKey = (value: Date) =>
  [
    value.getFullYear(),
    (value.getMonth() + 1).toString().padStart(2, '0'),
    value.getDate().toString().padStart(2, '0'),
  ].join('-');
const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(parseDateKey(value).getFullYear() !== new Date().getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  }).format(parseDateKey(value));
type Panel = 'date' | 'priority' | 'goal' | null;
const priorityIcons = [Minus, SignalLow, SignalMedium, SignalHigh];

// A quiet breathing mark indicates work without implying measured progress.
function SavingPulse({
  color,
  reduceMotion,
}: {
  color: string;
  reduceMotion: boolean;
}) {
  const opacity = React.useRef(new Animated.Value(0.45)).current;
  React.useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    motion.start();
    return () => motion.stop();
  }, [opacity, reduceMotion]);
  return (
    <View
      accessibilityLabel="Saving task"
      accessibilityLiveRegion="polite"
      testID="task-saving-pulse"
      style={savingStyles.target}
    >
      <Animated.View
        style={[savingStyles.line, { backgroundColor: color, opacity }]}
      />
    </View>
  );
}

const savingStyles = StyleSheet.create({
  target: { height: 20, width: 30, justifyContent: 'center' },
  line: { height: 3, borderRadius: 2 },
});

interface TaskComposerModalProps {
  visible: boolean;
  goalMode?: boolean;
  allowGoalSelection?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  insetTop: number;
  insetBottom: number;
  newTaskContent: string;
  onChangeTaskContent: (value: string) => void;
  onChangeGroup: (group: DashboardGroup) => void;
  priorityOptions: PriorityOption[];
  onSelectPriority: (value: number) => void;
  selectedPriority: number;
  selectedCategory: string | null;
  onClearCategory: () => void;
  submitting: boolean;
  onSubmit: () => void;
  // Category sheet props
  categoryQuery: string;
  onCategoryQueryChange: (value: string) => void;
  filteredCategories: string[];
  canCreateCategory: boolean;
  onCreateCategory: () => void | Promise<void>;
  onSelectCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  categoryPendingDelete: string | null;
  onCancelDeleteCategory: () => void;
  onConfirmDeleteCategory: () => void;
  mode?: 'create' | 'edit';
  selectedDate?: string | null;
  onChangeDate?: (value: string | null) => void;
}

export const TaskComposerModal: React.FC<TaskComposerModalProps> = ({
  visible,
  goalMode = false,
  allowGoalSelection = false,
  onClose,
  onDismiss,
  insetTop,
  insetBottom,
  newTaskContent,
  onChangeTaskContent,
  onChangeGroup,
  priorityOptions,
  onSelectPriority,
  selectedPriority,
  selectedCategory,
  onClearCategory,
  submitting,
  onSubmit,
  categoryQuery,
  onCategoryQueryChange,
  filteredCategories,
  canCreateCategory,
  onCreateCategory,
  onSelectCategory,
  mode,
  selectedDate,
  onChangeDate,
}) => {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const inverse = theme.isDark ? '#101916' : '#FFFFFF';
  const inputRef = React.useRef<TextInput>(null);
  const contentHeight = React.useRef(new Animated.Value(160)).current;
  const measuredContentHeight = React.useRef<number | null>(null);
  const [contentMeasured, setContentMeasured] = React.useState(false);
  const resizeContent = (_width: number, height: number) => {
    if (height === measuredContentHeight.current) return;
    const firstMeasurement = measuredContentHeight.current === null;
    measuredContentHeight.current = height;
    contentHeight.stopAnimation();
    if (firstMeasurement || reduceMotion) contentHeight.setValue(height);
    else
      Animated.timing(contentHeight, {
        toValue: height,
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
        isInteraction: false,
      }).start();
    setContentMeasured(true);
  };
  React.useEffect(() => {
    if (reduceMotion && measuredContentHeight.current !== null) {
      contentHeight.stopAnimation();
      contentHeight.setValue(measuredContentHeight.current);
    }
    return () => contentHeight.stopAnimation();
  }, [contentHeight, reduceMotion]);
  const [panel, setPanel] = React.useState<Panel>(null);
  const [creatingGoal, setCreatingGoal] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState(() =>
    parseDateKey(getToday()),
  );
  const dateStep = panel === 'date' && Platform.OS === 'ios';
  const busy = submitting || creatingGoal;
  const disableSubmit = !newTaskContent.trim() || busy;
  const editing = mode === 'edit';
  const priorityLabel =
    priorityOptions.find(option => option.value === selectedPriority)?.label ??
    'None';
  const PriorityIcon = priorityIcons[selectedPriority] ?? SignalHigh;
  const pickerDate = parseDateKey(selectedDate ?? getToday());
  const minimumDate = parseDateKey(
    selectedDate && selectedDate < getToday() ? selectedDate : getToday(),
  );

  React.useEffect(() => {
    if (visible) {
      setPanel(null);
    }
  }, [visible]);

  const closePanel = () => {
    setPanel(null);
    onCategoryQueryChange('');
  };
  const openPanel = (next: Panel) => {
    if (busy) return;
    if (next === 'date') {
      setDraftDate(pickerDate);
      Keyboard.dismiss();
    }
    setPanel(current => (current === next ? null : next));
    onCategoryQueryChange('');
  };
  const returnToTask = () => {
    closePanel();
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const closeComposer = () => {
    if (busy) return;
    onClose();
  };
  const selectDate = (event: DateTimePickerEvent, value?: Date) => {
    if (busy) return;
    if (event.type === 'dismissed' || !value) {
      if (Platform.OS !== 'ios') closePanel();
      return;
    }
    onChangeDate?.(toDateKey(value));
    returnToTask();
  };
  const selectGoal = (goal: string | null) => {
    if (busy) return;
    if (goal) onSelectCategory(goal);
    else onClearCategory();
    returnToTask();
  };
  const createGoal = async () => {
    if (busy || !canCreateCategory) return;
    setCreatingGoal(true);
    try {
      await onCreateCategory();
      returnToTask();
    } catch (error) {
      Alert.alert(
        'Could not create goal',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setCreatingGoal(false);
    }
  };

  const chip = (
    key: Exclude<Panel, null>,
    Icon: LucideIcon,
    text: string,
    selected: boolean,
    label: string,
  ) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={
        key === 'date'
          ? 'Choose a date or leave this task unscheduled'
          : 'Optional'
      }
      accessibilityState={{ expanded: panel === key }}
      disabled={busy}
      onPress={() => openPanel(key)}
      style={styles.chipTarget}
    >
      <View
        style={[
          styles.chip,
          selected && styles.chipSelected,
          panel === key && styles.chipOpen,
        ]}
      >
        <Icon
          size={16}
          strokeWidth={1.7}
          color={selected ? brand : theme.colors.textSecondary}
        />
        <Text
          numberOfLines={1}
          style={[styles.chipText, selected && styles.chipTextSelected]}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <DetachedTaskSheet
      visible={visible}
      reduceMotion={reduceMotion}
      insetTop={insetTop}
      insetBottom={insetBottom}
      onShow={() => inputRef.current?.focus()}
      onClose={() => (panel ? closePanel() : closeComposer())}
      onDismiss={onDismiss}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <PageBackdrop />
      </View>
      <View style={styles.grabberWrap}>
        <View style={styles.grabber} />
      </View>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dateStep ? 'Back to task' : 'Cancel task'}
          onPress={dateStep ? returnToTask : closeComposer}
          disabled={busy}
          style={styles.closeAction}
        >
          <View style={styles.closeSurface}>
            {dateStep ? (
              <ArrowLeft size={18} strokeWidth={1.7} color={brand} />
            ) : (
              <X size={18} strokeWidth={1.7} color={brand} />
            )}
          </View>
        </Pressable>
        {dateStep ? (
          <Text accessibilityRole="header" style={styles.panelTitle}>
            Date
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dateStep ? 'Set task date' : 'Save task'}
          accessibilityState={{
            busy,
            disabled: dateStep ? busy : disableSubmit,
          }}
          disabled={dateStep ? busy : disableSubmit}
          onPress={() => {
            if (dateStep) {
              onChangeDate?.(toDateKey(draftDate));
              returnToTask();
            } else if (!disableSubmit) onSubmit();
          }}
          style={styles.headerAction}
        >
          <View style={styles.submit}>
            {busy ? (
              <SavingPulse color={inverse} reduceMotion={reduceMotion} />
            ) : (
              <Text style={styles.submitText}>
                {dateStep ? 'Done' : editing ? 'Save' : 'Add'}
              </Text>
            )}
          </View>
        </Pressable>
      </View>
      <Animated.ScrollView
        testID="task-composer-content"
        style={[styles.scroll, contentMeasured && { height: contentHeight }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={false}
      >
        <View
          testID="task-composer-measure"
          // Measure intrinsic content, not the scroll viewport: the viewport
          // grows to fill its animated height and would cause a resize loop.
          style={styles.content}
          onLayout={({ nativeEvent: { layout } }) =>
            resizeContent(layout.width, layout.height)
          }
        >
          {dateStep ? (
            <View testID="task-date-step">
              <DateTimePicker
                testID="task-date-wheel"
                value={draftDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                onChange={(event, value) => {
                  if (event.type === 'set' && value) setDraftDate(value);
                }}
                style={styles.dateWheel}
                textColor={brand}
                themeVariant={theme.isDark ? 'dark' : 'light'}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="No date"
                style={styles.noDate}
                onPress={() => {
                  if (onChangeDate) onChangeDate(null);
                  else onChangeGroup('upcoming');
                  returnToTask();
                }}
              >
                <Minus size={16} color={brand} />
                <Text style={styles.chipTextSelected}>No date</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <GlassSurface style={styles.inputSurface}>
                <TextInput
                  ref={inputRef}
                  accessibilityLabel="Task content"
                  placeholder="What needs to be done?"
                  placeholderTextColor={theme.colors.textMuted}
                  selectionColor={brand}
                  style={styles.input}
                  value={newTaskContent}
                  onChangeText={onChangeTaskContent}
                  editable={!busy}
                  multiline
                  textAlignVertical="top"
                  onFocus={() => {
                    if (panel) closePanel();
                  }}
                  keyboardAppearance={theme.keyboardAppearance}
                />
              </GlassSurface>
              <View style={styles.tools}>
                {chip(
                  'date',
                  CalendarDays,
                  selectedDate ? formatDate(selectedDate) : 'No date',
                  !!selectedDate,
                  panel === 'date' ? 'Hide date picker' : 'Choose task date',
                )}
                {goalMode &&
                  chip(
                    'priority',
                    selectedPriority ? PriorityIcon : SignalHigh,
                    selectedPriority ? priorityLabel : 'Priority',
                    !!selectedPriority,
                    'Choose task priority',
                  )}
                {goalMode &&
                  allowGoalSelection &&
                  chip(
                    'goal',
                    Flag,
                    selectedCategory ?? 'Goal',
                    !!selectedCategory,
                    'Choose task goal',
                  )}
              </View>
              {panel && panel !== 'date' ? (
                <View style={styles.panel} testID="task-options-panel">
                  <View style={styles.panelHeader}>
                    <Text accessibilityRole="header" style={styles.panelTitle}>
                      {panel === 'priority' ? 'Priority' : 'Goal'}
                    </Text>
                    <Text style={styles.optional}>Optional</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close task options"
                      style={styles.closePanel}
                      disabled={busy}
                      onPress={closePanel}
                    >
                      <X
                        size={16}
                        strokeWidth={1.7}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                  {panel === 'priority' ? (
                    priorityOptions.map(option => {
                      const Icon = priorityIcons[option.value] ?? SignalHigh;
                      const selected = selectedPriority === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="radio"
                          accessibilityLabel={`Priority: ${option.label}`}
                          accessibilityState={{ selected }}
                          disabled={busy}
                          style={[
                            styles.option,
                            selected && styles.optionSelected,
                          ]}
                          onPress={() => {
                            onSelectPriority(option.value);
                            returnToTask();
                          }}
                        >
                          <Icon size={18} strokeWidth={1.7} color={brand} />
                          <Text style={styles.optionText}>
                            {option.value ? option.label : 'No priority'}
                          </Text>
                          {selected ? (
                            <Check size={17} strokeWidth={1.8} color={brand} />
                          ) : null}
                        </Pressable>
                      );
                    })
                  ) : (
                    <>
                      <View style={styles.goalSearch}>
                        <Search
                          size={16}
                          strokeWidth={1.7}
                          color={theme.colors.textSecondary}
                        />
                        <TextInput
                          accessibilityLabel="Find a goal"
                          placeholder="Find a goal"
                          placeholderTextColor={theme.colors.textMuted}
                          value={categoryQuery}
                          onChangeText={onCategoryQueryChange}
                          editable={!busy}
                          style={styles.goalInput}
                          selectionColor={brand}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={() => Keyboard.dismiss()}
                          keyboardAppearance={theme.keyboardAppearance}
                        />
                        {categoryQuery ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Clear goal search"
                            disabled={busy}
                            onPress={() => onCategoryQueryChange('')}
                            style={styles.closePanel}
                          >
                            <X size={15} color={brand} />
                          </Pressable>
                        ) : null}
                      </View>
                      <ScrollView
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        style={styles.goalList}
                      >
                        <Pressable
                          accessibilityRole="radio"
                          accessibilityLabel="No goal"
                          accessibilityState={{ selected: !selectedCategory }}
                          disabled={busy}
                          style={[
                            styles.option,
                            !selectedCategory && styles.optionSelected,
                          ]}
                          onPress={() => selectGoal(null)}
                        >
                          <Minus size={17} color={brand} strokeWidth={1.7} />
                          <Text style={styles.optionText}>No goal</Text>
                          {!selectedCategory ? (
                            <Check size={17} color={brand} />
                          ) : null}
                        </Pressable>
                        {filteredCategories.map(goal => (
                          <Pressable
                            key={goal}
                            accessibilityRole="radio"
                            accessibilityLabel={`Goal: ${goal}`}
                            accessibilityState={{
                              selected: goal === selectedCategory,
                            }}
                            disabled={busy}
                            style={[
                              styles.option,
                              goal === selectedCategory &&
                                styles.optionSelected,
                            ]}
                            onPress={() => selectGoal(goal)}
                          >
                            <Flag size={17} strokeWidth={1.7} color={brand} />
                            <Text style={styles.optionText}>{goal}</Text>
                            {goal === selectedCategory ? (
                              <Check size={17} color={brand} />
                            ) : null}
                          </Pressable>
                        ))}
                        {canCreateCategory ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Create goal: ${categoryQuery.trim()}`}
                            disabled={busy}
                            style={styles.option}
                            onPress={createGoal}
                          >
                            <Plus size={17} color={brand} strokeWidth={1.8} />
                            <Text style={styles.optionText}>
                              Create “{categoryQuery.trim()}”
                            </Text>
                          </Pressable>
                        ) : null}
                      </ScrollView>
                    </>
                  )}
                </View>
              ) : null}
            </>
          )}
        </View>
      </Animated.ScrollView>
      {panel === 'date' && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={selectDate}
        />
      ) : null}
    </DetachedTaskSheet>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const edge = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(21,45,37,0.10)';
  const tint = theme.isDark ? 'rgba(216,243,229,0.09)' : 'rgba(21,45,37,0.055)';
  return StyleSheet.create({
    scroll: { flexGrow: 0, flexShrink: 1 },
    dateWheel: { height: 180, width: '100%' },
    noDate: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    grabberWrap: { alignItems: 'center', paddingTop: 8, height: 15 },
    grabber: {
      width: 28,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.24)'
        : 'rgba(21,45,37,0.20)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      minHeight: 44,
      marginBottom: 4,
    },
    closeAction: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -4,
    },
    closeSurface: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tint,
    },
    headerAction: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
    submit: {
      minHeight: 34,
      minWidth: 58,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 17,
      backgroundColor: brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.isDark ? '#101916' : '#FFFFFF',
    },
    content: { paddingHorizontal: 16, paddingBottom: 10 },
    inputSurface: {
      minHeight: 88,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: edge,
    },
    input: {
      minHeight: 88,
      maxHeight: 220,
      fontSize: 16,
      lineHeight: 25,
      color: theme.colors.textPrimary,
      paddingHorizontal: 16,
      paddingTop: 15,
      paddingBottom: 15,
    },
    tools: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
      marginBottom: 8,
    },
    chipTarget: {
      minHeight: 44,
      justifyContent: 'center',
      maxWidth: '100%',
      flexShrink: 1,
    },
    chip: {
      minHeight: 32,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.5)',
    },
    chipSelected: { backgroundColor: tint },
    chipOpen: {
      backgroundColor: theme.isDark
        ? 'rgba(216,243,229,0.16)'
        : 'rgba(21,45,37,0.11)',
    },
    chipText: {
      flexShrink: 1,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    chipTextSelected: { color: brand, fontWeight: '500' },
    panel: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: edge,
      paddingTop: 6,
      marginTop: 2,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      gap: 8,
    },
    panelTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    optional: { fontSize: 12, color: theme.colors.textMuted },
    closePanel: {
      marginLeft: 'auto',
      width: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    option: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: 12,
    },
    optionSelected: { backgroundColor: tint },
    optionText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textPrimary,
    },
    goalSearch: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 12,
      paddingRight: 2,
      marginBottom: 8,
      borderRadius: 14,
      backgroundColor: tint,
    },
    goalInput: {
      flex: 1,
      minHeight: 44,
      fontSize: 14,
      color: theme.colors.textPrimary,
      paddingVertical: 10,
    },
    goalList: { maxHeight: 240 },
  });
};
