import * as React from 'react';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { DashboardGroup, PriorityOption } from '../Dashboard.types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PrioritySlider } from '@/components/PrioritySlider';
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
  const { height: windowHeight } = useWindowDimensions();
  const {
    visible,
    onClose,
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
  const headerTitle = isEditMode ? 'Edit Task' : 'New Task';
  const submitLabel = 'Save';
  const submittingLabel = isEditMode ? 'Updating…' : 'Creating…';

  const priorityMeta = React.useMemo(
    () =>
      priorityOptions.find(option => option.value === selectedPriority) ??
      priorityOptions[0],
    [priorityOptions, selectedPriority],
  );
  const [categoryFocused, setCategoryFocused] = React.useState(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
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

  React.useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleCloseComposer = React.useCallback(() => {
    onClose();
  }, [onClose]);

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

  const handleClearDate = React.useCallback(() => {
    setShowCustomDatePicker(false);
    setAndroidDatePickerVisible(false);
    setLaterWithoutDate();
  }, [setLaterWithoutDate]);

  const handleSelectLater = React.useCallback(() => {
    setShowCustomDatePicker(false);
    setAndroidDatePickerVisible(false);
    setLaterWithoutDate();
  }, [setLaterWithoutDate]);

  const handleToggleLaterDatePicker = React.useCallback(() => {
    if (isLaterPickerVisible) {
      handleClearDate();
      return;
    }

    setLaterWithoutDate();

    if (Platform.OS === 'ios') {
      setShowCustomDatePicker(true);
      return;
    }

    setAndroidDatePickerVisible(true);
  }, [handleClearDate, isLaterPickerVisible, setLaterWithoutDate]);

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

  if (!visible) {
    return null;
  }

  const sheetTopSpacing = insetTop;
  const sheetBottomSpacing = keyboardHeight > 0 ? 8 : 12;
  const safeBottomInset =
    keyboardHeight > 0 ? 12 : Math.max(insetBottom, 20) + 12;
  const sheetHeight = Math.max(
    420,
    windowHeight - keyboardHeight - sheetTopSpacing - sheetBottomSpacing,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleCloseComposer}
      presentationStyle="overFullScreen"
      transparent
      statusBarTranslucent
    >
      <View style={composerStyles.overlay}>
        <Pressable
          style={composerStyles.backdrop}
          onPress={handleCloseComposer}
        />
        <View
          style={[
            composerStyles.sheetHost,
            {
              paddingTop: sheetTopSpacing,
              paddingBottom: sheetBottomSpacing,
            },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              composerStyles.container,
              {
                paddingBottom: safeBottomInset,
                height: sheetHeight,
              },
            ]}
          >
            <View style={composerStyles.sheetGlow} pointerEvents="none" />
            <View style={composerStyles.handleWrap}>
              <View style={composerStyles.handle} />
            </View>
            <View style={composerStyles.header}>
              <Pressable
                style={({ pressed }) => [
                  composerStyles.headerAction,
                  pressed && composerStyles.headerActionPressed,
                ]}
                onPress={handleCloseComposer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={composerStyles.headerActionText}>Cancel</Text>
              </Pressable>
              <Text style={composerStyles.title}>{headerTitle}</Text>
              <Pressable
                style={({ pressed }) => [
                  composerStyles.headerAction,
                  pressed &&
                    !disableSubmit &&
                    composerStyles.headerActionPressed,
                ]}
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
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
                    style={composerStyles.taskInput}
                    placeholder="What needs to be done?"
                    placeholderTextColor={theme.colors.textMuted}
                    value={newTaskContent}
                    onChangeText={onChangeTaskContent}
                    editable={!submitting}
                    multiline
                    textAlignVertical="top"
                    autoFocus
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
                      onPress={handleSelectToday}
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
                        isTomorrowSelected &&
                          composerStyles.segmentButtonActive,
                        pressed && composerStyles.segmentButtonPressed,
                      ]}
                      onPress={handleSelectTomorrow}
                      disabled={submitting}
                    >
                      <Text
                        style={[
                          composerStyles.segmentText,
                          isTomorrowSelected &&
                            composerStyles.segmentTextActive,
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
                        onPress={handleSelectLater}
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
                        onPress={handleToggleLaterDatePicker}
                        disabled={submitting}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Feather
                          name={isLaterPickerVisible ? 'x' : 'calendar'}
                          size={15}
                          color={
                            isLaterSelected
                              ? theme.colors.textPrimary
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
                          accentColor={palette.accent}
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
                    <View style={composerStyles.priorityBadge}>
                      <Feather
                        name="chevrons-up"
                        size={13}
                        color={priorityMeta.tint}
                      />
                      <Text
                        style={[
                          composerStyles.priorityBadgeText,
                          { color: priorityMeta.tint },
                        ]}
                      >
                        {priorityMeta.label}
                      </Text>
                    </View>
                  </View>
                  <PrioritySlider
                    value={selectedPriority}
                    onChange={onSelectPriority}
                    disabled={submitting}
                  />
                </View>

                <View style={composerStyles.sectionDivider} />

                <View style={composerStyles.section}>
                  <Text style={composerStyles.fieldLabel}>Category</Text>
                  <View style={composerStyles.categoryFieldWrap}>
                    <TextInput
                      style={composerStyles.categoryInput}
                      placeholder="Type or select a category"
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
                              pressed &&
                                composerStyles.categorySuggestionPressed,
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
                          <Feather
                            name="plus"
                            size={14}
                            color={palette.mintStrong}
                          />
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
        </View>
      </View>

      <ConfirmDialog
        visible={categoryPendingDelete !== null}
        title="Remove category?"
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
      alignSelf: 'stretch',
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: theme.isDark
        ? 'rgba(15, 23, 42, 0.94)'
        : 'rgba(255, 255, 255, 0.97)',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(148, 163, 184, 0.22)'
        : 'rgba(226, 232, 240, 0.9)',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 1,
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
      paddingTop: 0,
    },
    handle: {
      width: 42,
      height: 5,
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
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    headerAction: {
      minWidth: 56,
    },
    headerActionPressed: {
      opacity: 0.72,
    },
    headerActionText: {
      fontSize: 17,
      color: palette.accent,
      lineHeight: 26,
      fontWeight: '400',
    },
    headerSubmitText: {
      textAlign: 'right',
      fontWeight: '500',
    },
    headerSubmitTextDisabled: {
      opacity: 0.3,
    },
    headerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    scroll: {
      flexGrow: 0,
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
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    taskInput: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      paddingHorizontal: 0,
      paddingVertical: 10,
      fontSize: 17,
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
      minHeight: 42,
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
      minHeight: 42,
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
      width: 38,
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
      marginTop: -10,
      marginBottom: -18,
      overflow: 'hidden',
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 2,
    },
    segmentButtonPressed: {
      opacity: 0.7,
    },
    segmentText: {
      fontSize: 15,
      lineHeight: 23,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: theme.colors.textPrimary,
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
      minHeight: 48,
    },
    categoryInput: {
      flex: 1,
      fontSize: 17,
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
