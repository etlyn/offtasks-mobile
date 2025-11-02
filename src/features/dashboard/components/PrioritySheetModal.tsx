import * as React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
        <View style={dashboardStyles.sheetContainer} pointerEvents="box-none">
          <View
            style={[
              priorityStyles.sheet,
              {
                paddingBottom: Math.max(insetBottom, 16) + 16,
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
                <Feather name="x" size={16} color={palette.slate600} />
              </Pressable>
            </View>
            <Text style={priorityStyles.subtitle}>Choose the priority level for this task</Text>

            <View style={priorityStyles.list}>
              {options.map((option, index) => {
                const isActive = selectedPriority === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => onSelect(option.value)}
                    style={({ pressed }) => [
                      priorityStyles.optionCard,
                      isActive && priorityStyles.optionCardActive,
                      pressed && priorityStyles.optionCardPressed,
                      index !== options.length - 1 && priorityStyles.optionCardSpacer,
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
                      <Feather name={option.icon} size={16} color={option.tint} />
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
                    {isActive && <Feather name="check" size={18} color={palette.mint} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const priorityStyles = StyleSheet.create({
  sheet: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: SHEET_MAX_HEIGHT,
    shadowColor: 'rgba(15, 23, 42, 0.18)',
    shadowOpacity: 1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: palette.slate900,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(148, 163, 184, 0.28)',
  },
  subtitle: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: '#717182',
    textAlign: 'center',
  },
  list: {
    marginTop: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    backgroundColor: 'rgba(248, 250, 255, 0.95)',
    minHeight: 56,
    width: '100%',
  },
  optionCardSpacer: {
    marginBottom: 12,
  },
  optionCardActive: {
    backgroundColor: '#e2e8f0',
    shadowColor: 'rgba(15, 23, 42, 0.16)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  optionCardPressed: {
    opacity: 0.9,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 14,
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate600,
  },
  optionLabelActive: {
    color: palette.slate900,
  },
  optionCaption: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: palette.slate600,
  },
});
