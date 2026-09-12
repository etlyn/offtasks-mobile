import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/colors';

type HeaderAction = {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export const PlannerHeader = ({
  title,
  onBack,
  actions = [],
}: {
  title: string;
  onBack?: () => void;
  actions?: HeaderAction[];
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const buttonStyle = [
    styles.button,
    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  ];
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={onBack ? 'Back' : 'Open navigation menu'}
        onPress={
          onBack || (() => navigation.dispatch(DrawerActions.openDrawer()))
        }
        style={buttonStyle}
      >
        <Feather
          name={onBack ? 'arrow-left' : 'menu'}
          size={20}
          color={theme.colors.iconPrimary}
        />
      </Pressable>
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[styles.title, { color: theme.colors.textPrimary }]}
      >
        {title}
      </Text>
      {actions.map(action => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled: !!action.disabled }}
          disabled={action.disabled}
          onPress={action.onPress}
          style={[buttonStyle, action.disabled && styles.disabled]}
        >
          <Feather
            name={action.icon}
            size={21}
            color={theme.colors.iconPrimary}
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
  },
  disabled: { opacity: 0.4 },
});
