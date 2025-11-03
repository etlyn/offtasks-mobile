import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { PriorityOption } from '../Dashboard.types';
import { palette } from '@/theme/colors';
import { SHEET_MAX_HEIGHT, styles as dashboardStyles } from '../Dashboard.styles';

interface PrioritySheetModalProps {
  visible: boolean;
  insetBottom: number;
  options: PriorityOption[];
  selectedPriority: number;
  onSelect: (value: number) => void;
  onClose: () => void;
}

export const PrioritySheetModal: React.FC<PrioritySheetModalProps> = ({
  visible,
  insetBottom,
  options,
  selectedPriority,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      onRequestClose={onClose}
    >
      <View style={dashboardStyles.modalBackdrop}>
        <Pressable style={dashboardStyles.modalFlex} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={dashboardStyles.modalWrapper}
        >
          <View
            style={[
              priorityStyles.sheet,
              {
                paddingBottom: insetBottom + 24,
                maxHeight: SHEET_MAX_HEIGHT,
              },
            ]}
          >
            <View style={dashboardStyles.sheetHandle} />
            <View style={priorityStyles.headerRow}>
              <Text style={priorityStyles.title}>Select Priority</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close priority sheet"
                onPress={onClose}
                style={({ pressed }) => [
                  priorityStyles.closeButton,
                  pressed && priorityStyles.closeButtonPressed,
                ]}
              >
                <Feather name="x" size={18} color={palette.slate600} />
              </Pressable>
            </View>
            <Text style={priorityStyles.subtitle}>Choose the priority level for this task</Text>

            <ScrollView style={priorityStyles.list} keyboardShouldPersistTaps="handled">
              {options.map((option, index) => {
                const isActive = selectedPriority === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => onSelect(option.value)}
                    style={({ pressed }) => [
                      priorityStyles.optionItem,
                      isActive && priorityStyles.optionItemActive,
                      pressed && priorityStyles.optionItemPressed,
                    ]}
                  >
                    <View
                      style={[
                        priorityStyles.optionIcon,
                        {
                          borderColor: option.tint,
                          backgroundColor: option.background,
                        },
                      ]}
                    >
                      <Feather name={option.icon} size={18} color={option.tint} />
                    </View>
                    <View style={priorityStyles.optionCopy} pointerEvents="none">
                      <Text
                        style={[priorityStyles.optionLabel, isActive && priorityStyles.optionLabelActive]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {option.label}
                      </Text>
                      {!!option.description && (
                        <Text style={priorityStyles.optionCaption} numberOfLines={1} ellipsizeMode="tail">
                          {option.description}
                        </Text>
                      )}
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
  );
};

const priorityStyles = StyleSheet.create({
  sheet: {
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
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: palette.slate600,
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    maxHeight: 260,
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
  optionCopy: {
    flex: 1,
    marginLeft: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate900,
  },
  optionLabelActive: {
    color: palette.slate900,
  },
  optionCaption: {
    fontSize: 13,
    color: palette.slate600,
    marginTop: 2,
  },
});
