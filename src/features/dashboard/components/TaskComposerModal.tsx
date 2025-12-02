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
  View,
} from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DashboardGroup, GroupSegment, PriorityOption } from '../Dashboard.types';
import { SHEET_MAX_HEIGHT } from '../Dashboard.styles';
import { PrioritySlider } from '@/components/PrioritySlider';
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
  mode?: 'create' | 'edit';
}

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
    onClearCategory,
    submitting,
    onSubmit,
    categoryQuery,
    onCategoryQueryChange,
    filteredCategories,
    canCreateCategory,
    onCreateCategory,
    onSelectCategory,
    mode = 'create',
  } = props;

  const disableSubmit = !newTaskContent.trim() || submitting;
  const insets = useSafeAreaInsets();
  const [categorySheetVisible, setCategorySheetVisible] = React.useState(false);
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

  const handleClearCategory = React.useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      onClearCategory();
    },
    [onClearCategory]
  );

  const handleCloseComposer = React.useCallback(() => {
    setCategorySheetVisible(false);
    onClose();
  }, [onClose]);

  const handleOpenCategorySheet = React.useCallback(() => {
    if (submitting) {
      return;
    }
    Keyboard.dismiss();
    setCategorySheetVisible(true);
  }, [submitting]);

  const handleCloseCategorySheet = React.useCallback(() => {
    setCategorySheetVisible(false);
  }, []);

  const handleCreateCategoryPress = React.useCallback(() => {
    onCreateCategory();
    setCategorySheetVisible(false);
  }, [onCreateCategory]);

  const handleSelectCategoryPress = React.useCallback(
    (category: string) => {
      onSelectCategory(category);
      setCategorySheetVisible(false);
    },
    [onSelectCategory]
  );

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
                          <Text
                            style={[
                              composerStyles.segmentText,
                              isSelected && composerStyles.segmentTextActive,
                            ]}
                          >
                            {segment.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={composerStyles.section}>
                  <Text style={composerStyles.sectionLabel}>Priority</Text>
                  <View style={composerStyles.prioritySummary}>
                    <View
                      style={[
                        composerStyles.priorityIcon,
                        {
                          borderColor: priorityMeta.tint,
                          backgroundColor: priorityMeta.background,
                        },
                      ]}
                    >
                      <Feather name={priorityMeta.icon} size={18} color={priorityMeta.tint} />
                    </View>
                    <View style={composerStyles.priorityCopy}>
                      <Text style={composerStyles.priorityLabel}>{priorityMeta.label}</Text>
                      {!!priorityMeta.description && (
                        <Text style={composerStyles.priorityHint}>{priorityMeta.description}</Text>
                      )}
                    </View>
                  </View>
                  <PrioritySlider
                    value={selectedPriority}
                    onChange={onSelectPriority}
                    disabled={submitting}
                  />
                </View>

                <View style={composerStyles.section}>
                  <Text style={composerStyles.sectionLabel}>Category</Text>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      composerStyles.selectorField,
                      submitting && composerStyles.selectorFieldDisabled,
                      pressed && !submitting && composerStyles.selectorFieldPressed,
                    ]}
                    onPress={handleOpenCategorySheet}
                    disabled={false}
                  >
                    <Feather
                      name="tag"
                      size={18}
                      color={palette.slate600}
                      style={composerStyles.selectorIcon}
                    />
                    <Text
                      style={
                        selectedCategory
                          ? composerStyles.selectorValue
                          : composerStyles.selectorPlaceholder
                      }
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {selectedCategory ?? 'Choose category'}
                    </Text>
                    {selectedCategory ? (
                      <Pressable
                        onPress={handleClearCategory}
                        disabled={submitting}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={({ pressed }) => [
                          composerStyles.selectorClear,
                          pressed && !submitting && composerStyles.selectorClearPressed,
                        ]}
                      >
                        <Feather name="x" size={16} color={palette.slate600} />
                      </Pressable>
                    ) : (
                      <Feather name="chevron-right" size={18} color={palette.slate600} />
                    )}
                  </Pressable>
                </View>
              </View>

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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

    {categorySheetVisible && (
      <View style={composerStyles.sheetOverlay} pointerEvents="box-none">
        <Pressable
          style={composerStyles.sheetBackdrop}
          onPress={handleCloseCategorySheet}
        />
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={composerStyles.sheetWrapper}
        >
          <View
            style={[
              composerStyles.sheet,
              { paddingBottom: insetBottom + 24 },
            ]}
          >
            <View style={composerStyles.sheetHandle} />
            <Text style={composerStyles.sheetTitle}>Select Category</Text>
            <Text style={composerStyles.sheetSubtitle}>
              Keep similar work grouped for quicker scanning.
            </Text>
            <View style={composerStyles.categorySearch}>
              <Feather name="search" size={18} color={palette.slate600} />
              <TextInput
                style={composerStyles.categoryInput}
                placeholder="Search or create…"
                placeholderTextColor={palette.slate600}
                value={categoryQuery}
                onChangeText={onCategoryQueryChange}
                editable={!submitting}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <ScrollView style={composerStyles.categoryList} keyboardShouldPersistTaps="handled">
              {canCreateCategory && (
                <Pressable
                  style={({ pressed }) => [
                    composerStyles.optionItem,
                    pressed && composerStyles.optionItemPressed,
                  ]}
                  onPress={handleCreateCategoryPress}
                  disabled={submitting}
                >
                  <View style={[composerStyles.optionIcon, composerStyles.optionIconNeutral]}>
                    <Feather name="plus" size={18} color={palette.slate600} />
                  </View>
                  <View style={composerStyles.optionCopy}>
                    <Text style={composerStyles.optionLabel}>Add “{categoryQuery.trim()}”</Text>
                    <Text style={composerStyles.optionCaption}>Create a reusable category.</Text>
                  </View>
                </Pressable>
              )}
              {filteredCategories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <Pressable
                    key={category}
                    style={({ pressed }) => [
                      composerStyles.optionItem,
                      isActive && composerStyles.optionItemActive,
                      pressed && composerStyles.optionItemPressed,
                    ]}
                    onPress={() => handleSelectCategoryPress(category)}
                    disabled={submitting}
                  >
                    <View style={[composerStyles.optionIcon, composerStyles.optionIconNeutral]}>
                      <Feather name="tag" size={18} color={palette.slate600} />
                    </View>
                    <View style={composerStyles.optionCopy}>
                      <Text style={composerStyles.optionLabel}>{category}</Text>
                      <Text style={composerStyles.optionCaption}>Tap to assign this category.</Text>
                    </View>
                    {isActive && <Feather name="check" size={18} color={palette.mintStrong} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    )}
    </Modal>
    </>
  );
};

const composerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.lightBackground,
  },
  keyboardAvoider: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: palette.lightSurface,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.slate900,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.lightMuted,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  body: {
    flexGrow: 1,
    gap: 28,
  },
  taskInput: {
    backgroundColor: palette.lightMuted,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    lineHeight: 24,
    color: palette.slate900,
    minHeight: 120,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: palette.lightBorder,
  },
  section: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentGroup: {
    flexDirection: 'row',
    backgroundColor: palette.lightMuted,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },
  segmentButtonActive: {
    backgroundColor: palette.lightSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentButtonPressed: {
    opacity: 0.7,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate600,
  },
  segmentTextActive: {
    color: palette.mint,
  },
  prioritySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  priorityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityCopy: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate900,
  },
  priorityHint: {
    fontSize: 13,
    color: palette.slate600,
    marginTop: 2,
  },
  selectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  selectorFieldPressed: {
    opacity: 0.75,
  },
  selectorFieldDisabled: {
    opacity: 0.6,
  },
  selectorIcon: {
    marginRight: 4,
  },
  selectorPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(15, 23, 42, 0.45)',
  },
  selectorValue: {
    flex: 1,
    fontSize: 15,
    color: palette.slate900,
    fontWeight: '500',
  },
  selectorClear: {
    padding: 4,
    borderRadius: 12,
  },
  selectorClearPressed: {
    opacity: 0.7,
  },
  submitButton: {
    backgroundColor: palette.mint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: palette.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.lightSurface,
    letterSpacing: -0.2,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.lightSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    paddingHorizontal: 24,
    paddingTop: 20,
    maxHeight: SHEET_MAX_HEIGHT,
    shadowColor: palette.lightShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 24,
    elevation: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.lightBorder,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
    textAlign: 'center',
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: palette.slate600,
    textAlign: 'center',
    marginBottom: 20,
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
    maxHeight: SHEET_MAX_HEIGHT - 160,
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
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  optionIconNeutral: {
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightMuted,
  },
  optionCopy: {
    flex: 1,
    marginRight: 12,
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
});
