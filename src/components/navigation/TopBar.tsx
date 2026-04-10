import * as React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { InlineSearchBar } from '@/components/search/InlineSearchBar';
import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/colors';

type LeftActionIcon = 'menu' | 'arrow-left' | 'chevron-left';

export interface TopBarProps {
  topInset: number;
  titlePrimary: string;
  titleSecondary?: string;
  subtitle?: string;
  searchVisible: boolean;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChangeText: (value: string) => void;
  onSearchToggle: () => void;
  onSearchClose: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  leftAction?: {
    icon: LeftActionIcon;
    label: string;
    onPress: () => void;
  };
}

export const TopBar = ({
  topInset,
  titlePrimary,
  titleSecondary,
  subtitle,
  searchVisible,
  searchValue,
  searchPlaceholder,
  onSearchChangeText,
  onSearchToggle,
  onSearchClose,
  inputRef,
  leftAction,
}: TopBarProps) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const progress = React.useRef(
    new Animated.Value(searchVisible ? 1 : 0),
  ).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: searchVisible ? 1 : 0,
      duration: searchVisible ? 220 : 180,
      easing: searchVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, searchVisible]);

  const collapsedOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0.28, 0],
  });
  const collapsedTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const searchOpacity = progress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.2, 1],
  });
  const searchTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <View style={[styles.card, searchVisible && styles.cardSearchActive]}>
        <Animated.View
          pointerEvents={searchVisible ? 'none' : 'auto'}
          style={[
            styles.defaultRow,
            {
              opacity: collapsedOpacity,
              transform: [{ translateX: collapsedTranslateX }],
            },
          ]}
        >
          {leftAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={leftAction.label}
              onPress={leftAction.onPress}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Feather
                name={leftAction.icon}
                size={leftAction.icon === 'menu' ? 19 : 18}
                color={theme.colors.iconPrimary}
              />
            </Pressable>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}

          <View style={styles.centerContent}>
            <Text style={styles.title}>
              <Text style={styles.titlePrimary}>{titlePrimary}</Text>
              {titleSecondary ? (
                <Text style={styles.titleSecondary}>{titleSecondary}</Text>
              ) : null}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open task search"
            onPress={onSearchToggle}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Feather name="search" size={18} color={theme.colors.iconPrimary} />
          </Pressable>
        </Animated.View>

        <Animated.View
          pointerEvents={searchVisible ? 'auto' : 'none'}
          style={[
            styles.searchRow,
            {
              opacity: searchOpacity,
              transform: [{ translateX: searchTranslateX }],
            },
          ]}
        >
          <InlineSearchBar
            visible={searchVisible}
            value={searchValue}
            onChangeText={onSearchChangeText}
            onClose={onSearchClose}
            placeholder={searchPlaceholder}
            inputRef={inputRef}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 18,
    },
    card: {
      height: 48,
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: theme.colors.glass,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 32,
      elevation: 10,
      overflow: 'hidden',
    },
    cardSearchActive: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: 'transparent',
      borderWidth: 0,
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      overflow: 'visible',
    },
    defaultRow: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 6,
      gap: 8,
    },
    searchRow: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 16,
      elevation: 8,
    },
    iconButtonPressed: {
      opacity: 0.84,
    },
    iconButtonPlaceholder: {
      width: 36,
      height: 36,
    },
    centerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      letterSpacing: -0.1,
      color: theme.colors.textPrimary,
    },
    titlePrimary: {
      color: theme.colors.textPrimary,
    },
    titleSecondary: {
      color: theme.colors.textMuted,
    },
    subtitle: {
      marginTop: 1,
      fontSize: 11,
      fontWeight: '500',
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });
