import * as React from 'react';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Keyboard,
  KeyboardAvoidingView,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { DashboardGroup, PriorityOption } from '../Dashboard.types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  GentlePressable as Pressable,
  PageBackdrop,
} from '@/components/ProductUI';
import { useCalendarTransition } from './useCalendarTransition';
import { getAdjacentDay, getToday } from '@/hooks/useDate';
import { palette, useAppTheme } from '@/theme/colors';

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

const formatLaterDateLabel = (value: string) => {
  const parsed = parseDateKey(value);
  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
};

interface TaskComposerModalProps {
  visible: boolean;
  onClose: () => void;
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
  onCreateCategory: () => void;
  onSelectCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  categoryPendingDelete: string | null;
  onCancelDeleteCategory: () => void;
  onConfirmDeleteCategory: () => void;
  mode?: 'create' | 'edit';
  selectedDate?: string | null;
  onChangeDate?: (value: string | null) => void;
}

export const TaskComposerModal: React.FC<TaskComposerModalProps> = props => {
  const theme = useAppTheme();
  const { reduceMotion, animateLayout } = useCalendarTransition();
  const inputRef = React.useRef<TextInput>(null);
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const initialDraft = React.useRef('');
  const {
    visible,
    onClose,
    insetBottom,
    newTaskContent,
    onChangeTaskContent,
    onChangeGroup,
    priorityOptions,
    onSelectPriority,
    selectedPriority,
    selectedCategory,
    onClearCategory,
    onSelectCategory,
    onSubmit,
    submitting,
    categoryQuery,
    onCategoryQueryChange,
    filteredCategories,
    canCreateCategory,
    onCreateCategory,
    onDeleteCategory,
    categoryPendingDelete,
    onCancelDeleteCategory,
    onConfirmDeleteCategory,
    mode,
    selectedDate,
    onChangeDate,
  } = props;

  const disableSubmit = !newTaskContent.trim() || submitting;
  const isEditMode = mode === 'edit';
  const headerTitle = isEditMode ? 'Edit task' : 'New task';
  const submitLabel = 'Save';
  const submittingLabel = isEditMode ? 'Updating…' : 'Creating…';

  const [categoryFocused, setCategoryFocused] = React.useState(false);
  const todayKey = React.useMemo(() => getToday(), []);
  const tomorrowKey = React.useMemo(() => getAdjacentDay(1), []);
  const laterDefaultKey = React.useMemo(() => getAdjacentDay(2), []);
  const [customPickerDate, setCustomPickerDate] = React.useState<Date>(
    parseDateKey(selectedDate ?? laterDefaultKey),
  );
  const [showCustomDatePicker, setShowCustomDatePicker] = React.useState(false);
  const [androidDatePickerVisible, setAndroidDatePickerVisible] =
    React.useState(false);
  const composerStyles = React.useMemo(() => createStyles(theme), [theme]);
  const minimumDate = React.useMemo(() => parseDateKey(todayKey), [todayKey]);
  const isLaterPickerVisible =
    Platform.OS === 'ios' ? showCustomDatePicker : androidDatePickerVisible;
  const isTodaySelected = selectedDate === todayKey;
  const isTomorrowSelected = selectedDate === tomorrowKey;
  const isCustomDateSelected =
    !!selectedDate && !isTodaySelected && !isTomorrowSelected;
  const isLaterSelected = !selectedDate || isCustomDateSelected;
  const laterLabel = isCustomDateSelected
    ? formatLaterDateLabel(selectedDate)
    : 'Later';

  React.useEffect(() => {
    setCustomPickerDate(parseDateKey(selectedDate ?? laterDefaultKey));
  }, [laterDefaultKey, selectedDate]);

  const draft = JSON.stringify([
    newTaskContent,
    selectedDate,
    selectedPriority,
    selectedCategory,
    categoryQuery,
  ]);
  React.useEffect(() => {
    if (visible) initialDraft.current = draft;
    // Capture only when the sheet opens, not on each edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleCloseComposer = React.useCallback(() => {
    if (submitting) return;
    if (draft !== initialDraft.current) {
      Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
      return;
    }
    onClose();
  }, [draft, onClose, submitting]);

  const handleSubmitPress = React.useCallback(() => {
    if (disableSubmit) {
      return;
    }

    onSubmit();
  }, [disableSubmit, onSubmit]);

  const handleSelectToday = React.useCallback(() => {
    setShowCustomDatePicker(false);
    setAndroidDatePickerVisible(false);
    onChangeGroup('today');
  }, [onChangeGroup]);

  const handleSelectTomorrow = React.useCallback(() => {
    setShowCustomDatePicker(false);
    setAndroidDatePickerVisible(false);
    onChangeGroup('tomorrow');
  }, [onChangeGroup]);

  const setLaterWithoutDate = React.useCallback(() => {
    setCustomPickerDate(parseDateKey(laterDefaultKey));

    if (onChangeDate) {
      onChangeDate(null);
      return;
    }

    onChangeGroup('upcoming');
  }, [laterDefaultKey, onChangeDate, onChangeGroup]);

  const handleSelectLater = React.useCallback(() => {
    setShowCustomDatePicker(false);
    setAndroidDatePickerVisible(false);
    setLaterWithoutDate();
  }, [setLaterWithoutDate]);

  const handleToggleLaterDatePicker = React.useCallback(() => {
    if (isLaterPickerVisible) {
      setShowCustomDatePicker(false);
      setAndroidDatePickerVisible(false);
      return;
    }

    setCustomPickerDate(parseDateKey(selectedDate ?? laterDefaultKey));

    if (Platform.OS === 'ios') {
      setShowCustomDatePicker(true);
      return;
    }

    setAndroidDatePickerVisible(true);
  }, [isLaterPickerVisible, selectedDate, laterDefaultKey]);

  const handleCustomDateChange = React.useCallback(
    (event: DateTimePickerEvent, nextDate?: Date) => {
      if (Platform.OS === 'android') {
        setAndroidDatePickerVisible(false);
      }

      if (event.type === 'dismissed' || !nextDate) {
        return;
      }

      setCustomPickerDate(nextDate);
      if (onChangeDate) {
        onChangeDate(toDateKey(nextDate));
      }
    },
    [onChangeDate],
  );

  const showCategorySuggestions =
    categoryFocused &&
    !submitting &&
    (filteredCategories.length > 0 || canCreateCategory);

  const categoryFieldValue =
    categoryQuery.length > 0 ? categoryQuery : selectedCategory ?? '';

  const handleCategoryChange = React.useCallback(
    (value: string) => {
      onCategoryQueryChange(value);

      if (!value.trim() && selectedCategory) {
        onClearCategory();
      }
    },
    [onCategoryQueryChange, onClearCategory, selectedCategory],
  );

  const handleSelectCategoryOption = React.useCallback(
    (category: string) => {
      onSelectCategory(category);
      onCategoryQueryChange('');
      Keyboard.dismiss();
      setCategoryFocused(false);
    },
    [onCategoryQueryChange, onSelectCategory],
  );

  const handleCreateCategoryOption = React.useCallback(() => {
    onCreateCategory();
    Keyboard.dismiss();
    setCategoryFocused(false);
  }, [onCreateCategory]);

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'none' : 'slide'}
      onShow={() => inputRef.current?.focus()}
      onRequestClose={handleCloseComposer}
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={composerStyles.nativeSheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            composerStyles.container,
            { paddingBottom: Math.max(insetBottom, 16) },
          ]}
        >
          <PageBackdrop />
          <View style={composerStyles.handleWrap}>
            <View style={composerStyles.handle} />
          </View>
          <View style={composerStyles.header}>
            <Pressable
              style={({ pressed }) => [
                composerStyles.headerAction,
                pressed && composerStyles.headerActionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel task"
              disabled={submitting}
              onPress={handleCloseComposer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={composerStyles.headerActionText}>Cancel</Text>
            </Pressable>
            <Text style={composerStyles.title}>{headerTitle}</Text>
            <Pressable
              style={({ pressed }) => [
                composerStyles.headerAction,
                pressed && !disableSubmit && composerStyles.headerActionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save task"
              onPress={handleSubmitPress}
              disabled={disableSubmit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  composerStyles.headerActionText,
                  composerStyles.headerSubmitText,
                  disableSubmit && composerStyles.headerSubmitTextDisabled,
                ]}
              >
                {submitting ? submittingLabel : submitLabel}
              </Text>
            </Pressable>
          </View>
          <View style={composerStyles.headerDivider} />

          <ScrollView
            style={composerStyles.scroll}
            contentContainerStyle={composerStyles.scrollContent}
            automaticallyAdjustKeyboardInsets={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={composerStyles.body}>
              <View style={composerStyles.section}>
                <Text style={composerStyles.fieldLabel}>Task</Text>
                <TextInput
                  ref={inputRef}
                  accessibilityLabel="Task content"
                  selectionColor={brand}
                  style={composerStyles.taskInput}
                  placeholder="What needs to be done?"
                  placeholderTextColor={theme.colors.textMuted}
                  value={newTaskContent}
                  onChangeText={onChangeTaskContent}
                  editable={!submitting}
                  multiline
                  textAlignVertical="top"
                  keyboardAppearance={theme.keyboardAppearance}
                />
              </View>

              <View style={composerStyles.sectionDivider} />

              <View style={composerStyles.section}>
                <Text style={composerStyles.fieldLabel}>When</Text>
                <View style={composerStyles.segmentGroup}>
                  <Pressable
                    style={({ pressed }) => [
                      composerStyles.segmentButton,
                      isTodaySelected && composerStyles.segmentButtonActive,
                      pressed && composerStyles.segmentButtonPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityLabel="Schedule today"
                    accessibilityState={{ selected: isTodaySelected }}
                    onPress={() => {
                      animateLayout();
                      handleSelectToday();
                    }}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        composerStyles.segmentText,
                        isTodaySelected && composerStyles.segmentTextActive,
                      ]}
                    >
                      Today
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      composerStyles.segmentButton,
                      isTomorrowSelected && composerStyles.segmentButtonActive,
                      pressed && composerStyles.segmentButtonPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityLabel="Schedule tomorrow"
                    accessibilityState={{ selected: isTomorrowSelected }}
                    onPress={() => {
                      animateLayout();
                      handleSelectTomorrow();
                    }}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        composerStyles.segmentText,
                        isTomorrowSelected && composerStyles.segmentTextActive,
                      ]}
                    >
                      Tomorrow
                    </Text>
                  </Pressable>
                  <View
                    style={[
                      composerStyles.laterSegmentShell,
                      isLaterSelected && composerStyles.segmentButtonActive,
                    ]}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        composerStyles.laterSegmentMain,
                        pressed && composerStyles.segmentButtonPressed,
                      ]}
                      accessibilityRole="radio"
                      accessibilityLabel="Schedule later"
                      accessibilityState={{ selected: isLaterSelected }}
                      onPress={() => {
                        animateLayout();
                        handleSelectLater();
                      }}
                      disabled={submitting}
                    >
                      <Text
                        style={[
                          composerStyles.segmentText,
                          isLaterSelected && composerStyles.segmentTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {laterLabel}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        composerStyles.laterSegmentIconButton,
                        isLaterSelected &&
                          composerStyles.laterSegmentIconButtonActive,
                        pressed && composerStyles.segmentButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isLaterPickerVisible
                          ? 'Hide date picker'
                          : 'Choose task date'
                      }
                      onPress={() => {
                        animateLayout();
                        handleToggleLaterDatePicker();
                      }}
                      disabled={submitting}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather
                        name={isLaterPickerVisible ? 'chevron-up' : 'calendar'}
                        size={15}
                        color={
                          isLaterSelected
                            ? theme.isDark
                              ? '#101916'
                              : '#FFFFFF'
                            : theme.colors.textSecondary
                        }
                      />
                    </Pressable>
                  </View>
                </View>
                {Platform.OS === 'ios' && showCustomDatePicker ? (
                  <View style={composerStyles.datePickerPanel}>
                    <View style={composerStyles.datePickerInlineWrap}>
                      <DateTimePicker
                        value={customPickerDate}
                        mode="date"
                        display="inline"
                        minimumDate={minimumDate}
                        onChange={handleCustomDateChange}
                        accentColor={brand}
                        themeVariant={theme.isDark ? 'dark' : 'light'}
                      />
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={composerStyles.sectionDivider} />

              <View style={composerStyles.section}>
                <View style={composerStyles.priorityHeader}>
                  <Text style={composerStyles.fieldLabel}>Priority</Text>
                </View>
                <View style={composerStyles.segmentGroup}>
                  {priorityOptions.map(option => (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityLabel={`Priority: ${option.label}`}
                      accessibilityState={{
                        selected: option.value === selectedPriority,
                      }}
                      disabled={submitting}
                      onPress={() => {
                        animateLayout();
                        onSelectPriority(option.value);
                      }}
                      style={[
                        composerStyles.segmentButton,
                        option.value === selectedPriority &&
                          composerStyles.segmentButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          composerStyles.segmentText,
                          option.value === selectedPriority &&
                            composerStyles.segmentTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={composerStyles.sectionDivider} />

              <View style={composerStyles.section}>
                <Text style={composerStyles.fieldLabel}>Goal</Text>
                <View style={composerStyles.categoryFieldWrap}>
                  <TextInput
                    style={composerStyles.categoryInput}
                    accessibilityLabel="Task goal"
                    selectionColor={brand}
                    placeholder="Choose or create a goal"
                    placeholderTextColor={theme.colors.textMuted}
                    value={categoryFieldValue}
                    onChangeText={handleCategoryChange}
                    editable={!submitting}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onFocus={() => setCategoryFocused(true)}
                    onBlur={() => {
                      setTimeout(() => setCategoryFocused(false), 120);
                    }}
                    returnKeyType={canCreateCategory ? 'done' : 'next'}
                    onSubmitEditing={() => {
                      if (canCreateCategory) {
                        handleCreateCategoryOption();
                        return;
                      }

                      if (filteredCategories[0]) {
                        handleSelectCategoryOption(filteredCategories[0]);
                      }
                    }}
                    keyboardAppearance={theme.keyboardAppearance}
                  />
                  {(categoryFieldValue.length > 0 || selectedCategory) &&
                  !submitting ? (
                    <Pressable
                      style={({ pressed }) => [
                        composerStyles.categoryClearButton,
                        pressed && composerStyles.categoryClearButtonPressed,
                      ]}
                      onPress={() => {
                        onCategoryQueryChange('');
                        onClearCategory();
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather
                        name="x"
                        size={16}
                        color={theme.colors.iconMuted}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {showCategorySuggestions ? (
                  <View style={composerStyles.categorySuggestions}>
                    {filteredCategories.slice(0, 5).map(category => (
                      <View
                        key={category}
                        style={composerStyles.categorySuggestionRow}
                      >
                        <Pressable
                          style={({ pressed }) => [
                            composerStyles.categorySuggestion,
                            composerStyles.categorySuggestionMain,
                            pressed && composerStyles.categorySuggestionPressed,
                          ]}
                          onPress={() => handleSelectCategoryOption(category)}
                        >
                          <Text style={composerStyles.categorySuggestionText}>
                            {category}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [
                            composerStyles.categoryDeleteButton,
                            pressed &&
                              composerStyles.categoryDeleteButtonPressed,
                          ]}
                          onPressIn={() => {
                            setCategoryFocused(false);
                            onDeleteCategory(category);
                          }}
                          hitSlop={{
                            top: 8,
                            bottom: 8,
                            left: 8,
                            right: 8,
                          }}
                        >
                          <Feather
                            name="trash-2"
                            size={15}
                            color={theme.colors.dangerBorder}
                          />
                        </Pressable>
                      </View>
                    ))}
                    {canCreateCategory ? (
                      <Pressable
                        style={({ pressed }) => [
                          composerStyles.categorySuggestion,
                          composerStyles.categoryCreateSuggestion,
                          pressed && composerStyles.categorySuggestionPressed,
                        ]}
                        onPress={handleCreateCategoryOption}
                      >
                        <Feather name="plus" size={14} color={brand} />
                        <Text style={composerStyles.categoryCreateText}>
                          Add “{categoryQuery.trim()}”
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={categoryPendingDelete !== null}
        title="Remove goal?"
        message={`Delete “${
          categoryPendingDelete ?? ''
        }” from reusable categories? Existing task labels will stay as they are.`}
        confirmLabel="Remove"
        destructive
        renderInline
        onCancel={onCancelDeleteCategory}
        onConfirm={onConfirmDeleteCategory}
      />

      {Platform.OS !== 'ios' && androidDatePickerVisible ? (
        <DateTimePicker
          value={customPickerDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={handleCustomDateChange}
        />
      ) : null}
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    nativeSheet: { flex: 1, backgroundColor: theme.colors.background },
    overlay: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingHorizontal: 12,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    sheetHost: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    container: {
      flex: 1,
      alignSelf: 'stretch',
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
      borderWidth: 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0,
      shadowRadius: 28,
      elevation: 24,
    },
    sheetGlow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Platform.select({
        ios: theme.isDark
          ? 'rgba(15, 23, 42, 0.08)'
          : 'rgba(255, 255, 255, 0.06)',
        default: 'transparent',
      }),
    },
    handleWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
    },
    handle: {
      width: 28,
      height: 3,
      borderRadius: 3,
      backgroundColor: theme.isDark
        ? 'rgba(226, 232, 240, 0.24)'
        : 'rgba(15, 23, 42, 0.14)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 46,
      paddingLeft: 18,
      paddingRight: 18,
      marginTop: 0,
    },
    title: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    headerAction: {
      minWidth: 56,
      minHeight: 44,
      justifyContent: 'center',
    },
    headerActionPressed: {
      opacity: 0.72,
    },
    headerActionText: {
      fontSize: 14,
      color: theme.isDark ? '#D8F3E5' : '#152D25',
      lineHeight: 26,
      fontWeight: '400',
    },
    headerSubmitText: {
      textAlign: 'center',
      fontWeight: '600',
      color: theme.isDark ? '#101916' : '#FFFFFF',
      backgroundColor: theme.isDark ? '#D8F3E5' : '#152D25',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 5,
      overflow: 'hidden',
    },
    headerSubmitTextDisabled: {
      opacity: 0.3,
    },
    headerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 6,
    },
    body: {
      gap: 12,
    },
    fieldLabel: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 0,
    },
    taskInput: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      paddingHorizontal: 0,
      paddingVertical: 10,
      fontSize: 15,
      lineHeight: 26,
      color: theme.colors.textPrimary,
      minHeight: 88,
    },
    section: {
      gap: 8,
      paddingVertical: 4,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    segmentGroup: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    segmentButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      gap: 6,
      backgroundColor: 'transparent',
    },
    laterSegmentShell: {
      flex: 1,
      minHeight: 44,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: 'transparent',
    },
    laterSegmentMain: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingLeft: 12,
      paddingRight: 8,
    },
    laterSegmentIconButton: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.colors.border,
    },
    laterSegmentIconButtonActive: {
      borderLeftColor: theme.colors.glassBorder,
    },
    datePickerPanel: {
      marginTop: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSubtle,
      overflow: 'hidden',
    },
    datePickerInlineWrap: {
      marginTop: 0,
      marginBottom: 0,
      overflow: 'hidden',
    },
    segmentButtonActive: {
      backgroundColor: theme.isDark ? '#D8F3E5' : '#152D25',
    },
    segmentButtonPressed: {
      opacity: 0.7,
    },
    segmentText: {
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: theme.isDark ? '#101916' : '#FFFFFF',
    },
    priorityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 23,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    priorityBadgeText: {
      fontSize: 15,
      lineHeight: 23,
      fontWeight: '400',
    },
    categoryFieldWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.surfaceSubtle,
      paddingHorizontal: 14,
      minHeight: 44,
    },
    categoryInput: {
      flex: 1,
      fontSize: 15,
      lineHeight: 24,
      color: theme.colors.textPrimary,
      paddingVertical: 12,
    },
    categoryClearButton: {
      marginLeft: 8,
      padding: 2,
    },
    categoryClearButtonPressed: {
      opacity: 0.7,
    },
    categorySuggestions: {
      marginTop: 4,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.surfaceSubtle,
      overflow: 'hidden',
    },
    categorySuggestion: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    categorySuggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    categorySuggestionMain: {
      flex: 1,
      borderBottomWidth: 0,
    },
    categorySuggestionPressed: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    categorySuggestionText: {
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    categoryCreateSuggestion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 0,
    },
    categoryCreateText: {
      fontSize: 14,
      color: palette.mintStrong,
      fontWeight: '500',
    },
    categoryDeleteButton: {
      alignItems: 'center',
      alignSelf: 'stretch',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    categoryDeleteButtonPressed: {
      backgroundColor: theme.colors.dangerSurface,
    },
  });
