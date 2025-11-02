import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { DashboardGroup, GroupSegment, PriorityOption } from '../Dashboard.types';
import { palette } from '@/theme/colors';
import { styles as dashboardStyles } from '../Dashboard.styles';

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
  onOpenCategorySheet: () => void;
  selectedPriorityOption: PriorityOption;
  selectedCategory: string | null;
  submitting: boolean;
  onSubmit: () => void;
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
    onOpenCategorySheet,
    selectedPriorityOption,
    selectedCategory,
    submitting,
    onSubmit,
  } = props;

  const disableSubmit = !newTaskContent.trim() || submitting;

  const [priorityMenuOpen, setPriorityMenuOpen] = React.useState(false);

  const bottomInset = Math.max(insetBottom, 18);

  React.useEffect(() => {
    if (!visible) {
      setPriorityMenuOpen(false);
    }
  }, [visible]);

  const handlePriorityPress = React.useCallback(() => {
    Keyboard.dismiss();
    setPriorityMenuOpen((prev) => !prev);
  }, []);

  const handleCategoryPress = React.useCallback(() => {
    Keyboard.dismiss();
    setPriorityMenuOpen(false);
    setTimeout(onOpenCategorySheet, 0);
  }, [onOpenCategorySheet]);

  const handleSelectPriority = React.useCallback(
    (value: number) => {
      setPriorityMenuOpen(false);
      onSelectPriority(value);
    },
    [onSelectPriority]
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={composerStyles.overlay} accessibilityViewIsModal>
      <Pressable style={composerStyles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={composerStyles.avoider}
        pointerEvents="box-none"
      >
        <View
          style={[
            composerStyles.sheet,
            {
              paddingBottom: bottomInset + 16,
              marginBottom: bottomInset + 16,
            },
          ]}
        >
          <View style={dashboardStyles.sheetHandle} />

          <View style={composerStyles.headerRow}>
            <View style={composerStyles.headerCopy}>
              <Text style={composerStyles.eyebrow}>Create a new task</Text>
              <Text style={composerStyles.title}>New Task</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                composerStyles.closeButton,
                pressed && composerStyles.closeButtonPressed,
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close task composer"
            >
              <Feather name="x" size={18} color={palette.slate600} />
            </Pressable>
          </View>

          <ScrollView
            style={composerStyles.scroll}
            contentContainerStyle={[
              composerStyles.formContent,
              priorityMenuOpen && composerStyles.formContentExpanded,
            ]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setPriorityMenuOpen(false)}
          >
            <View style={composerStyles.section}>
              <Text style={composerStyles.label}>Task</Text>
              <TextInput
                style={composerStyles.input}
                placeholder="What needs to happen?"
                placeholderTextColor="#64748b"
                value={newTaskContent}
                onChangeText={onChangeTaskContent}
                editable={!submitting}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={composerStyles.section}>
              <Text style={composerStyles.label}>When</Text>
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
                      onPress={() => {
                        setPriorityMenuOpen(false);
                        onChangeGroup(segment.key);
                      }}
                    >
                      <Text
                        style={[composerStyles.segmentLabel, isSelected && composerStyles.segmentLabelActive]}
                      >
                        {segment.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

              <View style={composerStyles.metaRow}>
                <View style={[composerStyles.metaColumn, composerStyles.metaColumnLeft]}>
                  <Text style={composerStyles.label}>Priority</Text>
                  <Pressable
                    style={({ pressed }) => [
                      composerStyles.metaButton,
                      pressed && composerStyles.metaButtonPressed,
                    ]}
                    onPress={handlePriorityPress}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <View
                      style={[
                        composerStyles.metaIcon,
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
                    <View style={composerStyles.metaCopy} pointerEvents="none">
                      <Text style={composerStyles.metaTitle} numberOfLines={1} ellipsizeMode="tail">
                        {selectedPriorityOption.label}
                      </Text>
                      <Text style={composerStyles.metaSubtitle} numberOfLines={1} ellipsizeMode="tail">
                        {selectedPriorityOption.description}
                      </Text>
                    </View>
                    <Feather
                      name={priorityMenuOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={palette.slate600}
                    />
                  </Pressable>
                  {priorityMenuOpen && (
                    <View style={composerStyles.priorityMenu}>
                      {priorityOptions.map((option, index) => {
                        const isActive = option.value === selectedPriorityOption.value;
                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => handleSelectPriority(option.value)}
                            style={({ pressed }) => [
                              composerStyles.priorityOption,
                              isActive && composerStyles.priorityOptionActive,
                              pressed && composerStyles.priorityOptionPressed,
                              index !== priorityOptions.length - 1 && composerStyles.priorityOptionDivider,
                            ]}
                          >
                            <View
                              style={[
                                composerStyles.priorityIcon,
                                {
                                  borderColor: option.tint,
                                  backgroundColor: option.background,
                                },
                              ]}
                            >
                              <Feather name={option.icon} size={16} color={option.tint} />
                            </View>
                            <View style={composerStyles.priorityCopy} pointerEvents="none">
                              <Text
                                style={[composerStyles.priorityLabel, isActive && composerStyles.priorityLabelActive]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {option.label}
                              </Text>
                              <Text style={composerStyles.priorityCaption} numberOfLines={1} ellipsizeMode="tail">
                                {option.description}
                              </Text>
                            </View>
                            {isActive && <Feather name="check" size={18} color={palette.mint} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                <View style={[composerStyles.metaColumn, composerStyles.metaColumnRight]}>
                  <Text style={composerStyles.label}>Category</Text>
                  <Pressable
                    style={({ pressed }) => [
                      composerStyles.metaButton,
                      pressed && composerStyles.metaButtonPressed,
                    ]}
                    onPress={handleCategoryPress}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <View style={[composerStyles.metaIcon, composerStyles.metaIconNeutral]}>
                      <Feather name="tag" size={18} color={palette.slate600} />
                    </View>
                    <View style={composerStyles.metaCopy} pointerEvents="none">
                      <Text style={composerStyles.metaTitle} numberOfLines={1} ellipsizeMode="tail">
                        {selectedCategory ?? 'None'}
                      </Text>
                      <Text style={composerStyles.metaSubtitle} numberOfLines={1} ellipsizeMode="tail">
                        {selectedCategory ? 'Assigned to this list' : 'Optional organisation'}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={palette.slate600} />
                  </Pressable>
                </View>
              </View>
          </ScrollView>

          <View style={composerStyles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create task"
              style={({ pressed }) => [
                composerStyles.submitButton,
                disableSubmit && composerStyles.submitButtonDisabled,
                pressed && !disableSubmit && composerStyles.submitButtonPressed,
              ]}
              onPress={onSubmit}
              disabled={disableSubmit}
            >
              <Text style={composerStyles.submitButtonLabel}>
                {submitting ? 'Creating…' : 'Create Task'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const composerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
    zIndex: 30,
  },
  backdrop: {
    flex: 1,
  },
  avoider: {
    width: '100%',
  },
  sheet: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
    shadowColor: 'rgba(15, 23, 42, 0.28)',
    shadowOpacity: 1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -12 },
    elevation: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerCopy: {
    flexShrink: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: palette.slate900,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(100, 116, 139, 0.24)',
  },
  scroll: {},
  formContent: {
    paddingBottom: 16,
  },
  formContentExpanded: {
    paddingBottom: 160,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  input: {
    minHeight: 112,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(241, 245, 249, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    color: palette.slate900,
    fontSize: 16,
    lineHeight: 22,
  },
  segmentGroup: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(0, 150, 137, 0.12)',
    borderWidth: 1,
    borderColor: palette.mint,
  },
  segmentButtonPressed: {
    opacity: 0.85,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  segmentLabelActive: {
    color: palette.mint,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaColumn: {
    flex: 1,
  },
  metaColumnLeft: {
    marginRight: 8,
  },
  metaColumnRight: {
    marginLeft: 8,
  },
  metaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: palette.lightMuted,
  },
  metaButtonPressed: {
    opacity: 0.92,
  },
  metaIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metaIconNeutral: {
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
  },
  metaCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  metaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate900,
  },
  metaSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mint,
    shadowColor: 'rgba(0, 150, 137, 0.28)',
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(148, 163, 184, 0.36)',
    shadowOpacity: 0,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: palette.lightSurface,
  },
  priorityMenu: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: 'rgba(15, 23, 42, 0.12)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    paddingVertical: 4,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  priorityOptionDivider: {
    marginBottom: 4,
  },
  priorityOptionActive: {
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
  },
  priorityOptionPressed: {
    opacity: 0.9,
  },
  priorityIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  priorityCopy: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate600,
  },
  priorityLabelActive: {
    color: palette.slate900,
  },
  priorityCaption: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
});
