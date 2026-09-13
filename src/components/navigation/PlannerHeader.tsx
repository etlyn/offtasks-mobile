import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { SquarePen, Flag } from 'lucide-react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/colors';
import { GlassSurface } from '@/components/GlassSurface';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { HeaderSlot, useSharedHeader } from '@/navigation/SharedHeader';

type HeaderAction = {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export const PlannerHeader = ({
  title,
  onBack,
  backInHeader = false,
  actions = [],
}: {
  title: string;
  onBack?: () => void;
  backInHeader?: boolean;
  actions?: HeaderAction[];
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const sharedHeader = useSharedHeader();
  if (sharedHeader) {
    const searchAction = actions.find(action => action.icon === 'search');
    return (
      <>
        <HeaderSlot
          onBack={backInHeader ? onBack : undefined}
          onSearch={searchAction?.onPress}
          searchLabel={searchAction?.label}
        />
        <View style={{ height: insets.top + 58 }} />
        {onBack ? (
          <View style={styles.contextRow}>
            {!backInHeader ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={onBack}
                style={styles.button}
              >
                <Feather
                  name="arrow-left"
                  size={18}
                  color={theme.colors.textPrimary}
                />
              </Pressable>
            ) : null}
            <Text
              accessibilityRole="header"
              style={[styles.contextTitle, { color: theme.colors.textPrimary }]}
            >
              {title}
            </Text>
          </View>
        ) : null}
      </>
    );
  }
  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={onBack ? 'Back' : 'Open navigation menu'}
        onPress={
          onBack || (() => navigation.dispatch(DrawerActions.openDrawer()))
        }
        style={styles.button}
      >
        <GlassSurface style={styles.surface}>
          <Feather
            name={onBack ? 'arrow-left' : 'menu'}
            size={18}
            color={theme.colors.iconPrimary}
          />
        </GlassSurface>
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
          style={[styles.button, action.disabled && styles.disabled]}
        >
          <GlassSurface style={styles.surface}>
            {action.icon === 'edit-3' ? (
              <SquarePen
                size={18}
                strokeWidth={1.8}
                color={theme.isDark ? '#D8F3E5' : '#152D25'}
              />
            ) : action.icon === 'flag' ? (
              <Flag
                size={18}
                strokeWidth={1.8}
                color={theme.isDark ? '#D8F3E5' : '#152D25'}
              />
            ) : (
              <Feather
                name={action.icon}
                size={18}
                color={theme.isDark ? '#D8F3E5' : '#152D25'}
              />
            )}
          </GlassSurface>
        </Pressable>
      ))}
      {actions.length === 0 ? <View style={styles.button} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  contextRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 4,
    marginBottom: 4,
  },
  contextTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
