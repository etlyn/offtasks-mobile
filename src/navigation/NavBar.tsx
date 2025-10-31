import React from 'react';
import { DrawerActions } from '@react-navigation/native';
import type { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/theme/colors';

export const NavBar: React.FC<BottomTabHeaderProps> = ({ navigation, route, options }) => {
  const insets = useSafeAreaInsets();

  const title =
    typeof options.headerTitle === 'string'
      ? options.headerTitle
      : typeof options.title === 'string'
      ? options.title
      : route.name;

  const handleMenuPress = React.useCallback(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.dispatch(DrawerActions.openDrawer());
      return;
    }
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleBackPress = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    handleMenuPress();
  }, [handleMenuPress, navigation]);

  const showBack = navigation.canGoBack();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 12, paddingBottom: insets.bottom > 0 ? 8 : 12 }]}> 
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showBack ? 'Go back' : 'Open navigation menu'}
          onPress={showBack ? handleBackPress : handleMenuPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Feather name={showBack ? 'arrow-left' : 'menu'} size={18} color={palette.slate900} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open navigation menu"
          onPress={handleMenuPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Feather name="menu" size={18} color={palette.slate900} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: palette.lightSurface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.lightBorder,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.lightMuted,
    borderWidth: 1,
    borderColor: palette.lightBorder,
  },
  iconButtonPressed: {
    opacity: 0.85,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate900,
  },
});
