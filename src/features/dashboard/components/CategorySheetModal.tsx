import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { palette } from '@/theme/colors';
import { SHEET_MAX_HEIGHT, styles } from '../Dashboard.styles';

interface CategorySheetModalProps {
  visible: boolean;
  insetBottom: number;
  categoryQuery: string;
  onCategoryQueryChange: (value: string) => void;
  filteredCategories: string[];
  canCreateCategory: boolean;
  onCreateCategory: () => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  submitting: boolean;
  onClose: () => void;
}

export const CategorySheetModal: React.FC<CategorySheetModalProps> = ({
  visible,
  insetBottom,
  categoryQuery,
  onCategoryQueryChange,
  filteredCategories,
  canCreateCategory,
  onCreateCategory,
  selectedCategory,
  onSelectCategory,
  submitting,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'overFullScreen'}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.modalWrapper}
        >
          <Pressable style={styles.modalFlex} onPress={onClose} />
          <View
            style={[styles.optionSheet, { paddingBottom: insetBottom + 24, maxHeight: SHEET_MAX_HEIGHT }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.optionTitle}>Select Category</Text>
            <Text style={styles.optionSubtitle}>Keep similar work grouped for quicker scanning.</Text>
            <View style={styles.categorySearch}>
              <Feather name="search" size={18} color={palette.slate600} />
              <TextInput
                style={styles.categoryInput}
                placeholder="Search or create…"
                placeholderTextColor={palette.slate600}
                value={categoryQuery}
                onChangeText={onCategoryQueryChange}
                editable={!submitting}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <ScrollView style={styles.categoryList} keyboardShouldPersistTaps="handled">
              {canCreateCategory && (
                <Pressable
                  style={({ pressed }) => [styles.optionItem, pressed && styles.optionItemPressed]}
                  onPress={onCreateCategory}
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
                    onPress={() => onSelectCategory(category)}
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
  );
};
