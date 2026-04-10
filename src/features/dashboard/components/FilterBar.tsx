import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { AppTheme } from '@/theme/colors';
import { palette } from '@/theme/colors';
import { getCategoryBadgeColors } from '@/utils/categoryColors';

import { styles } from '../Dashboard.styles';

interface FilterBarThemeStyles {
  filterChip: StyleProp<ViewStyle>;
  filterChipActive: StyleProp<ViewStyle>;
  filterChipText: StyleProp<TextStyle>;
  filterChipTextActive: StyleProp<TextStyle>;
  filterAction: StyleProp<ViewStyle>;
  filterActionActive: StyleProp<ViewStyle>;
  filterActionText: StyleProp<TextStyle>;
  filterActionTextActive: StyleProp<TextStyle>;
  clearFiltersButton: StyleProp<ViewStyle>;
}

export interface FilterBarProps {
  availableLabels: string[];
  selectedLabels: string[];
  activeFilterCount: number;
  prioritySortDirection: 'asc' | 'desc' | null;
  theme: AppTheme;
  themeStyles: FilterBarThemeStyles;
  onTogglePrioritySort: () => void;
  onToggleLabel: (label: string) => void;
  onClearAllFilters: () => void;
}

export const FilterBar = ({
  availableLabels,
  selectedLabels,
  activeFilterCount,
  prioritySortDirection,
  theme,
  themeStyles,
  onTogglePrioritySort,
  onToggleLabel,
  onClearAllFilters,
}: FilterBarProps) => {
  return (
    <View style={styles.advancedFilters}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterActionsRow}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sort by priority"
          onPress={onTogglePrioritySort}
          style={({ pressed }) => [
            styles.filterAction,
            themeStyles.filterAction,
            prioritySortDirection && styles.filterActionActive,
            prioritySortDirection && themeStyles.filterActionActive,
            pressed && styles.filterActionPressed,
          ]}
        >
          <Feather
            name={
              prioritySortDirection === 'desc'
                ? 'arrow-down'
                : prioritySortDirection === 'asc'
                ? 'arrow-up'
                : 'arrow-up-down'
            }
            size={14}
            color={
              prioritySortDirection
                ? theme.colors.textInverse
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.filterActionText,
              themeStyles.filterActionText,
              prioritySortDirection && styles.filterActionTextActive,
              prioritySortDirection && themeStyles.filterActionTextActive,
            ]}
          >
            Priority
          </Text>
        </Pressable>

        {availableLabels.map(label => {
          const isActive = selectedLabels.includes(label);
          const categoryColors = getCategoryBadgeColors(label);

          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${label}`}
              onPress={() => onToggleLabel(label)}
              style={({ pressed }) => [
                styles.filterChip,
                themeStyles.filterChip,
                isActive && styles.filterChipActive,
                isActive && themeStyles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
            >
              <View style={styles.filterChipContent}>
                <View
                  style={[
                    styles.filterChipDot,
                    { backgroundColor: categoryColors.color },
                  ]}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    themeStyles.filterChipText,
                    isActive && styles.filterChipTextActive,
                    isActive && themeStyles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
                {isActive ? (
                  <Feather
                    name="x"
                    size={12}
                    color="rgba(255, 255, 255, 0.86)"
                    style={styles.filterChipClose}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}

        {activeFilterCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear filters"
            onPress={onClearAllFilters}
            style={({ pressed }) => [
              styles.clearFiltersButton,
              themeStyles.clearFiltersButton,
              pressed && styles.filterActionPressed,
            ]}
          >
            <Feather name="x" size={14} color={palette.danger} />
            <Text style={styles.clearFiltersText}>
              Clear ({activeFilterCount})
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
};
