import * as React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  FlatList,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { palette } from '@/theme/colors';

interface CategoryInputProps {
  value: string;
  onChangeText: (text: string) => void;
  suggestions: string[];
  onSubmit?: (category: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CategoryInput: React.FC<CategoryInputProps> = ({
  value,
  onChangeText,
  suggestions,
  onSubmit,
  placeholder = 'Category (optional)',
  disabled = false,
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const normalizedValue = value.trim().toLowerCase();
  const filteredSuggestions = React.useMemo(() => {
    if (!normalizedValue) {
      return suggestions.slice(0, 5); // Show top 5 when empty
    }
    return suggestions
      .filter((s) => s.toLowerCase().includes(normalizedValue))
      .slice(0, 5);
  }, [suggestions, normalizedValue]);

  const hasSuggestions = filteredSuggestions.length > 0 && showSuggestions;

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay to allow suggestion press to fire
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChangeText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
    if (onSubmit) {
      onSubmit(suggestion);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Feather name="tag" size={18} color={palette.slate600} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={palette.slate600}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (value.trim() && onSubmit) {
              onSubmit(value.trim());
            }
          }}
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => {
              onChangeText('');
              inputRef.current?.focus();
            }}
            style={styles.clearButton}
          >
            <Feather name="x" size={16} color={palette.slate600} />
          </Pressable>
        )}
      </View>

      {hasSuggestions && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.suggestionItem,
                  pressed && styles.suggestionItemPressed,
                ]}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Feather name="tag" size={16} color={palette.mint} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    backgroundColor: palette.lightMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.slate900,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: palette.lightSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    maxHeight: 180,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.lightBorder,
  },
  suggestionItemPressed: {
    backgroundColor: palette.lightMuted,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: palette.slate900,
    flex: 1,
  },
});

