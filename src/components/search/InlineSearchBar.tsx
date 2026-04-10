import * as React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { palette, useAppTheme } from '@/theme/colors';

const SEARCH_ROW_HEIGHT = 48;
const SEARCH_BAR_HEIGHT = 44;
const CLOSE_BUTTON_SIZE = 44;
const COLLAPSED_BAR_WIDTH = 42;
const SEARCH_BAR_GAP = 10;

interface InlineSearchBarProps {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
  placeholder: string;
  inputRef?: React.RefObject<TextInput | null>;
}

export const InlineSearchBar = ({
  visible,
  value,
  onChangeText,
  onClose,
  placeholder,
  inputRef,
}: InlineSearchBarProps) => {
  const theme = useAppTheme();
  const progress = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [rowWidth, setRowWidth] = React.useState(0);

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress, visible]);

  React.useEffect(() => {
    if (!visible) {
      inputRef?.current?.blur();
      return;
    }

    const timeout = setTimeout(() => {
      inputRef?.current?.focus();
    }, 120);

    return () => clearTimeout(timeout);
  }, [inputRef, visible]);

  const expandedBarWidth = Math.max(
    COLLAPSED_BAR_WIDTH,
    rowWidth - CLOSE_BUTTON_SIZE - SEARCH_BAR_GAP,
  );

  const animatedBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_BAR_WIDTH, expandedBarWidth],
  });
  const animatedCloseOpacity = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  });
  const animatedCloseTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, 0],
  });
  const animatedCloseMargin = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SEARCH_BAR_GAP],
  });

  return (
    <View
      onLayout={({ nativeEvent }) => {
        const nextWidth = nativeEvent.layout.width;
        if (nextWidth > 0 && nextWidth !== rowWidth) {
          setRowWidth(nextWidth);
        }
      }}
      pointerEvents="box-none"
    >
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={styles.rowClip}
      >
        <View style={styles.row}>
          <Animated.View
            style={[
              styles.searchBar,
              {
                width: animatedBarWidth,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={theme.colors.iconMuted}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              enablesReturnKeyAutomatically
              keyboardAppearance={theme.keyboardAppearance}
              selectionColor={palette.mint}
              editable={visible}
              style={[
                styles.searchInput,
                {
                  color: theme.colors.textPrimary,
                },
              ]}
            />
          </Animated.View>

          <Animated.View
            style={{
              marginLeft: animatedCloseMargin,
              opacity: animatedCloseOpacity,
              transform: [{ translateX: animatedCloseTranslateX }],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close search"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                },
                pressed && styles.closeButtonPressed,
              ]}
            >
              <Feather name="x" size={22} color={theme.colors.iconPrimary} />
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: SEARCH_ROW_HEIGHT,
  },
  rowClip: {
    overflow: 'hidden',
  },
  searchBar: {
    height: SEARCH_BAR_HEIGHT,
    borderRadius: SEARCH_BAR_HEIGHT / 2,
    borderWidth: 1,
    paddingLeft: 44,
    paddingRight: 16,
    justifyContent: 'center',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    top: '50%',
    marginTop: -9,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 0,
  },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: CLOSE_BUTTON_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  closeButtonPressed: {
    opacity: 0.84,
  },
});
