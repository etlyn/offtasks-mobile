import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { findNodeHandle } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DashboardGroup, GroupSegment, PriorityOption } from '../Dashboard.types';
import { palette } from '@/theme/colors';

interface TaskComposerModalProps {
  visible: boolean;
  onClose: () => void;
  insetBottom: number;
  newTaskContent: string;
  onChangeTaskContent: (value: string) => void;
  composerGroup: DashboardGroup;
  onChangeGroup: (group: DashboardGroup) => void;
  groupSegments: GroupSegment[];
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
  selectedDate: string;
  onChangeDate: (value: string) => void;
  mode?: 'create' | 'edit';
}

const formatDateForStorage = (date: Date) => {
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0'),
  ].join('-');
};

const parseStoredDate = (value: string) => {
  const [year, month, day] = value.split('-').map((chunk) => Number(chunk));

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
};

export const TaskComposerModal: React.FC<TaskComposerModalProps> = (props) => {
  const {
    visible,
    onClose,
    insetBottom,
    newTaskContent,
    onChangeTaskContent,
    composerGroup,
    onChangeGroup,
    groupSegments,
    priorityOptions,
    onSelectPriority,
    selectedPriority,
    selectedCategory,
    onSelectCategory,
    onSubmit,
    submitting,
    selectedDate,
    onChangeDate,
    mode,
  } = props;

  const disableSubmit = !newTaskContent.trim() || submitting;
  const insets = useSafeAreaInsets();
  const isEditMode = mode === 'edit';
  const headerTitle = isEditMode ? 'Update Task' : 'New Task';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Task';
  const submittingLabel = isEditMode ? 'Updating…' : 'Creating…';

  const priorityMeta = React.useMemo(
    () =>
      priorityOptions.find((option) => option.value === selectedPriority) ??
      priorityOptions[0],
    [priorityOptions, selectedPriority]
  );

  const categoryOptions = React.useMemo(() => {
    const base = ['Work', 'Personal', 'Shopping', 'Health', 'Finance'];
    const extras = props.filteredCategories ?? [];
    const merged = Array.from(new Set([...base, ...extras])).filter(Boolean);
    return ['None', ...merged];
  }, [props.filteredCategories]);

  const categoryEmojiMap: Record<string, string> = {
    None: '📁',
    Work: '💼',
    Personal: '🏠',
    Shopping: '🛒',
    Health: '❤️',
    Finance: '💰',
  };

  const selectedCategoryLabel = selectedCategory ?? 'None';
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const selectedDateObject = React.useMemo(() => parseStoredDate(selectedDate), [selectedDate]);

  const selectedDateLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(selectedDateObject),
    [selectedDateObject]
  );
  const [pendingDate, setPendingDate] = React.useState<Date>(selectedDateObject);

  const handleCloseComposer = React.useCallback(() => {
    onClose();
  }, [onClose]);

  const priorityTriggerRef = React.useRef<View>(null);
  const categoryTriggerRef = React.useRef<View>(null);
  const [openDropdown, setOpenDropdown] = React.useState<'priority' | 'category' | null>(null);
  const [dropdownLayout, setDropdownLayout] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    listHeight: number;
  } | null>(null);

  const openDropdownFor = React.useCallback(
    (type: 'priority' | 'category') => {
      const ref = type === 'priority' ? priorityTriggerRef : categoryTriggerRef;
      const listLength = type === 'priority' ? priorityOptions.length : categoryOptions.length;
      const rowHeight = 48;
      const listHeight = Math.min(rowHeight * listLength + 12, 260);

      Keyboard.dismiss();
      const node = ref.current ? findNodeHandle(ref.current) : null;
      if (!node) {
        setOpenDropdown(type);
        setDropdownLayout(null);
        return;
      }

      UIManager.measureInWindow(node, (x: number, y: number, width: number, height: number) => {
        setDropdownLayout({ x, y, width, height, listHeight });
        setOpenDropdown(type);
      });
    },
    [categoryOptions.length, priorityOptions.length]
  );

  const closeDropdown = React.useCallback(() => {
    setOpenDropdown(null);
  }, []);

  const openDatePicker = React.useCallback(() => {
    closeDropdown();
    Keyboard.dismiss();
    setPendingDate(selectedDateObject);
    setShowDatePicker(true);
  }, [closeDropdown, selectedDateObject]);

  const handleDateChange = React.useCallback(
    (event: DateTimePickerEvent, value?: Date) => {
      if (Platform.OS === 'android') {
        if (event.type === 'dismissed') {
          setShowDatePicker(false);
          return;
        }

        if (value) {
          onChangeDate(formatDateForStorage(value));
        }

        setShowDatePicker(false);
        return;
      }

      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }

      if (value) {
        setPendingDate(value);
      }
    },
    [onChangeDate]
  );

  const handleConfirmDate = React.useCallback(() => {
      onChangeDate(formatDateForStorage(pendingDate));
      setShowDatePicker(false);
  }, [onChangeDate, pendingDate]);

  if (!visible) {
    return null;
  }

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleCloseComposer}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={composerStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={composerStyles.keyboardAvoider}
        >
          <View
            style={[
              composerStyles.container,
              {
                paddingTop: insets.top + 12,
                paddingBottom: Math.max(insetBottom, 20) + 12,
              },
            ]}
          >
            <View style={composerStyles.handle} />
            <View style={composerStyles.header}>
              <Text style={composerStyles.title}>{headerTitle}</Text>
              <Pressable
                style={({ pressed }) => [
                  composerStyles.closeButton,
                  pressed && composerStyles.closeButtonPressed,
                ]}
                onPress={handleCloseComposer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={palette.slate600} />
              </Pressable>
            </View>

            <ScrollView
              style={composerStyles.scroll}
              contentContainerStyle={composerStyles.scrollContent}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              <View style={composerStyles.body}>
                <TextInput
                  style={composerStyles.taskInput}
                  placeholder="What needs to be done?"
                  placeholderTextColor={palette.slate600}
                  value={newTaskContent}
                  onChangeText={onChangeTaskContent}
                  editable={!submitting}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />

                <View style={composerStyles.section}>
                  <Text style={composerStyles.sectionLabel}>When</Text>
                  <View style={composerStyles.segmentGroup}>
                    {groupSegments.map((segment) => {
                      const isSelected = composerGroup === segment.key;
                      const iconName =
                        segment.key === 'today'
                          ? 'sun'
                          : segment.key === 'tomorrow'
                          ? 'sunrise'
                          : 'calendar';
                      const label =
                        segment.key === 'tomorrow'
                          ? 'Tmrw'
                          : segment.key === 'upcoming'
                          ? 'Later'
                          : 'Today';
                      return (
                        <Pressable
                          key={segment.key}
                          style={({ pressed }) => [
                            composerStyles.segmentButton,
                            isSelected && composerStyles.segmentButtonActive,
                            pressed && composerStyles.segmentButtonPressed,
                          ]}
                          onPress={() => onChangeGroup(segment.key)}
                        >
                          <Feather
                            name={iconName}
                            size={16}
                            color={isSelected ? '#2fb59a' : '#6b7280'}
                          />
                          <Text
                            style={[
                              composerStyles.segmentText,
                              isSelected && composerStyles.segmentTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={composerStyles.section}>
                  <View style={composerStyles.dropdownRow}>
                    <View style={composerStyles.dropdownColumn}>
                      <View style={composerStyles.dropdownLabelRow}>
                        <Feather name="flag" size={14} color={priorityMeta.tint} />
                        <Text style={composerStyles.sectionLabel}>Priority</Text>
                      </View>
                      <Pressable
                        ref={priorityTriggerRef}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          composerStyles.dropdownTrigger,
                          pressed && composerStyles.dropdownTriggerPressed,
                        ]}
                        onPress={() => openDropdownFor('priority')}
                        disabled={submitting}
                      >
                        <Text
                          style={composerStyles.dropdownValue}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {priorityMeta.label}
                        </Text>
                        <Feather name="chevron-down" size={16} color={palette.slate600} />
                      </Pressable>
                    </View>

                    <View style={composerStyles.dropdownColumn}>
                      <View style={composerStyles.dropdownLabelRow}>
                        <Text style={composerStyles.dropdownLabelEmoji}>
                          {categoryEmojiMap[selectedCategoryLabel] ?? '📁'}
                        </Text>
                        <Text style={composerStyles.sectionLabel}>Category</Text>
                      </View>
                      <Pressable
                        ref={categoryTriggerRef}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          composerStyles.dropdownTrigger,
                          pressed && composerStyles.dropdownTriggerPressed,
                        ]}
                        onPress={() => openDropdownFor('category')}
                        disabled={submitting}
                      >
                        <Text
                          style={composerStyles.dropdownValue}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {selectedCategoryLabel}
                        </Text>
                        <Feather name="chevron-down" size={16} color={palette.slate600} />
                      </Pressable>
                    </View>

                    <View style={composerStyles.dropdownColumn}>
                      <View style={composerStyles.dropdownLabelRow}>
                        <Feather name="calendar" size={14} color={palette.slate600} />
                        <Text style={composerStyles.sectionLabel}>Due Date</Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          composerStyles.dropdownTrigger,
                          pressed && composerStyles.dropdownTriggerPressed,
                        ]}
                        onPress={openDatePicker}
                        disabled={submitting}
                      >
                        <Text
                          style={composerStyles.dropdownValue}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {selectedDateLabel}
                        </Text>
                        <Feather name="chevron-down" size={16} color={palette.slate600} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={composerStyles.footer}>
              <Pressable
                style={({ pressed }) => [
                  composerStyles.submitButton,
                  disableSubmit && composerStyles.submitButtonDisabled,
                  pressed && !disableSubmit && composerStyles.submitButtonPressed,
                ]}
                onPress={onSubmit}
                disabled={disableSubmit}
              >
                <Text style={composerStyles.submitButtonText}>
                  {submitting ? submittingLabel : submitLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
      {openDropdown && dropdownLayout ? (
        <View style={composerStyles.dropdownOverlay} pointerEvents="box-none">
          <Pressable style={composerStyles.dropdownBackdrop} onPress={closeDropdown} />
          <View
            style={[
              composerStyles.dropdownMenu,
              {
                width: dropdownLayout.width,
                left: dropdownLayout.x,
                top: Math.max(8, dropdownLayout.y - dropdownLayout.listHeight - 8),
                maxHeight: dropdownLayout.listHeight,
              },
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              {openDropdown === 'priority' &&
                priorityOptions.map((option) => {
                  const isActive = option.value === selectedPriority;
                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => [
                        composerStyles.dropdownItem,
                        isActive && composerStyles.dropdownItemActive,
                        pressed && composerStyles.dropdownItemPressed,
                      ]}
                      onPress={() => {
                        onSelectPriority(option.value);
                        closeDropdown();
                      }}
                    >
                      <View style={composerStyles.dropdownItemLeft}>
                        <Feather name="flag" size={16} color={option.tint} />
                        <Text style={composerStyles.dropdownItemLabel}>{option.label}</Text>
                      </View>
                      {isActive && <Feather name="check" size={16} color={palette.mintStrong} />}
                    </Pressable>
                  );
                })}
              {openDropdown === 'category' &&
                categoryOptions.map((option) => {
                  const isActive = (selectedCategory ?? 'None') === option;
                  return (
                    <Pressable
                      key={option}
                      style={({ pressed }) => [
                        composerStyles.dropdownItem,
                        isActive && composerStyles.dropdownItemActive,
                        pressed && composerStyles.dropdownItemPressed,
                      ]}
                      onPress={() => {
                        if (option === 'None') {
                          props.onClearCategory?.();
                        } else {
                          onSelectCategory(option);
                        }
                        closeDropdown();
                      }}
                    >
                      <View style={composerStyles.dropdownItemLeft}>
                        <Text style={composerStyles.dropdownEmojiSmall}>
                          {categoryEmojiMap[option] ?? '📁'}
                        </Text>
                        <Text style={composerStyles.dropdownItemLabel}>{option}</Text>
                      </View>
                      {isActive && <Feather name="check" size={16} color={palette.mintStrong} />}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      ) : null}
      {showDatePicker ? (
        Platform.OS === 'ios' ? (
          <View style={composerStyles.datePickerOverlay} pointerEvents="box-none">
            <Pressable
              style={composerStyles.datePickerBackdrop}
              onPress={() => setShowDatePicker(false)}
            />
            <View
              style={[
                composerStyles.datePickerSheet,
                { marginBottom: Math.max(insets.bottom, 12) },
              ]}
            >
              <View style={composerStyles.datePickerHeader}>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={composerStyles.datePickerAction}>Cancel</Text>
                </Pressable>
                <Text style={composerStyles.datePickerTitle}>Select date</Text>
                <Pressable onPress={handleConfirmDate}>
                  <Text style={composerStyles.datePickerAction}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pendingDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={composerStyles.iosDatePicker}
              />
            </View>
          </View>
        ) : (
          <DateTimePicker
            value={selectedDateObject}
            mode="date"
            display="calendar"
            onChange={handleDateChange}
          />
        )
      ) : null}
    </Modal>
    </>
  );
};

const composerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  keyboardAvoider: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  body: {
    flexGrow: 1,
    gap: 18,
  },
  taskInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 22,
    color: '#0f172a',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#cfeee6',
    shadowColor: 'rgba(15, 23, 42, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 2,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  segmentGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  segmentButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(15, 23, 42, 0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentButtonPressed: {
    opacity: 0.7,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  segmentTextActive: {
    color: '#22b39b',
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dropdownColumn: {
    flex: 1,
    gap: 8,
  },
  dropdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownLabelEmoji: {
    fontSize: 14,
    lineHeight: 16,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 6,
  },
  dropdownTriggerPressed: {
    opacity: 0.85,
  },
  dropdownIconWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  submitButton: {
    backgroundColor: '#2fb59a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(47, 181, 154, 0.35)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#cfeee6',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  dropdownItemActive: {
    backgroundColor: '#e9f7f2',
  },
  dropdownItemPressed: {
    opacity: 0.85,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownItemLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  dropdownEmojiSmall: {
    fontSize: 16,
  },
  datePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 30,
  },
  datePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  datePickerSheet: {
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 10,
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 12,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  datePickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  datePickerAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2fb59a',
  },
  iosDatePicker: {
    alignSelf: 'stretch',
  },
});
