import React from 'react';
import { Alert, Keyboard, Pressable, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteAccount, supabaseClient } from '@/lib/supabase';
import { appVersion } from '@/lib/appVersion';
import { useAuth } from '@/providers/AuthProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import { useAppTheme } from '@/theme/colors';

import { createStyles } from './SideDrawerContent.styles';

type ToggleControlProps = {
  value: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  styles: ReturnType<typeof createStyles>;
};

const ToggleControl = ({
  value,
  onPress,
  accessibilityLabel,
  styles,
}: ToggleControlProps) => (
  <Pressable
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    style={({ pressed }) => [
      styles.glassToggle,
      value && styles.glassToggleActive,
      pressed && styles.glassTogglePressed,
    ]}
  >
    <View
      style={[
        styles.glassToggleTrackFill,
        value && styles.glassToggleTrackFillActive,
      ]}
    />
    <View
      style={[styles.glassToggleThumb, value && styles.glassToggleThumbActive]}
    />
  </Pressable>
);

export const SideDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation } = props;
  const { session } = useAuth();
  const { totals } = useTasks();
  const {
    hideCompleted,
    advancedMode,
    themeMode,
    setHideCompleted,
    setAdvancedMode,
    autoArrange,
    setAutoArrange,
    toggleTheme,
  } = usePreferences();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const isDarkMode = themeMode === 'Dark';
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

  const handleNavigate = React.useCallback(
    (routeName: string) => {
      navigation.navigate(routeName as never);
      navigation.closeDrawer();
    },
    [navigation],
  );

  const handleResetToHome = React.useCallback(() => {
    Keyboard.dismiss();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Dashboard',
            state: {
              index: 0,
              routes: [{ name: 'Today', params: { group: 'today' } }],
            },
          },
        ],
      }),
    );
  }, [navigation]);

  const handleSignOut = React.useCallback(async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert('Sign out failed', (error as Error).message);
      return;
    }
    navigation.closeDrawer();
  }, [navigation]);

  const performDeleteAccount = React.useCallback(async () => {
    setIsDeletingAccount(true);

    try {
      await deleteAccount();
      const { error } = await supabaseClient.auth.signOut({ scope: 'local' });

      if (error) {
        console.warn(
          'Account deleted, but local session cleanup reported an error',
          error,
        );
      }

      navigation.closeDrawer();
    } catch (error) {
      Alert.alert(
        'Delete account failed',
        error instanceof Error
          ? error.message
          : 'Unable to delete account right now. Please try again.',
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }, [navigation]);

  const handleDeleteAccount = React.useCallback(() => {
    if (isDeletingAccount) {
      return;
    }

    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all synced tasks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: performDeleteAccount,
        },
      ],
      { cancelable: true },
    );
  }, [isDeletingAccount, performDeleteAccount]);

  const email = session?.user?.email ?? 'Offline';
  const fullName = session?.user?.user_metadata?.full_name as
    | string
    | undefined;
  const userLabel = fullName?.trim() || email.split('@')[0] || 'User';
  const initials =
    userLabel
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  const completionLabel =
    totals.all > 0
      ? `${totals.completed}/${totals.all} completed`
      : 'No tasks yet';
  const handleCloseDrawer = React.useCallback(() => {
    navigation.closeDrawer();
  }, [navigation]);

  return (
    <DrawerContentScrollView
      {...props}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={handleCloseDrawer}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
        >
          <Feather name="x" size={18} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to home today"
        onPress={handleResetToHome}
        style={({ pressed }) => [
          styles.heroCard,
          pressed && styles.closeButtonPressed,
        ]}
      >
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{userLabel}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {email}
            </Text>
            <Text style={styles.profileMetaNote}>{completionLabel}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.menuCard}>
        <Pressable
          style={({ pressed }) => [
            styles.menuRow,
            pressed && styles.menuRowPressed,
          ]}
          onPress={() => handleNavigate('Statistics')}
        >
          <View style={[styles.menuIcon, styles.statisticsIcon]}>
            <Feather
              name="pie-chart"
              size={16}
              color={theme.colors.iconPrimary}
            />
          </View>
          <View style={styles.menuTextBlock}>
            <Text style={styles.menuLabel}>Statistics</Text>
          </View>
          <View style={styles.menuActionSlot}>
            <Feather
              name="chevron-right"
              size={18}
              color={theme.colors.iconMuted}
              style={styles.menuChevron}
            />
          </View>
        </Pressable>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.themeIcon]}>
            <Feather
              name={isDarkMode ? 'moon' : 'sun'}
              size={16}
              color={theme.isDark ? '#fde68a' : '#8a5a00'}
            />
          </View>
          <View style={styles.menuTextBlock}>
            <Text style={styles.menuLabel}>Appearance</Text>
            <Text style={styles.menuValue}>
              {isDarkMode ? 'Dark glass' : 'Light glass'}
            </Text>
          </View>
          <ToggleControl
            value={isDarkMode}
            onPress={toggleTheme}
            accessibilityLabel="Toggle dark mode"
            styles={styles}
          />
        </View>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.hideIcon]}>
            <Feather
              name="eye-off"
              size={16}
              color={theme.colors.iconPrimary}
            />
          </View>
          <View style={styles.menuTextBlock}>
            <Text style={styles.menuLabel}>Hide Completed Tasks</Text>
            <Text style={styles.menuValue}>
              Keep the drawer focused on active work
            </Text>
          </View>
          <ToggleControl
            value={hideCompleted}
            onPress={() => {
              setHideCompleted(!hideCompleted);
            }}
            accessibilityLabel="Toggle hide completed tasks"
            styles={styles}
          />
        </View>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.advancedIcon]}>
            <Feather name="cpu" size={16} color={theme.colors.iconPrimary} />
          </View>
          <View style={styles.menuTextBlock}>
            <Text style={styles.menuLabel}>Advanced Mode</Text>
            <Text style={styles.menuValue}>
              Show extra controls and deeper task detail
            </Text>
          </View>
          <ToggleControl
            value={advancedMode}
            onPress={() => {
              setAdvancedMode(!advancedMode);
            }}
            accessibilityLabel="Toggle advanced mode"
            styles={styles}
          />
        </View>

        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, styles.autoIcon]}>
            <Feather
              name="refresh-cw"
              size={16}
              color={theme.colors.iconPrimary}
            />
          </View>
          <View style={styles.menuTextBlock}>
            <Text style={styles.menuLabel}>Auto-move due tasks</Text>
            <Text style={styles.menuValue}>
              Reflow overdue items into the current day
            </Text>
          </View>
          <ToggleControl
            value={autoArrange}
            onPress={() => {
              setAutoArrange(!autoArrange);
            }}
            accessibilityLabel="Toggle auto move due tasks"
            styles={styles}
          />
        </View>

        <View style={[styles.menuRow, styles.menuRowLast]}>
          <View style={[styles.menuIcon, styles.versionIcon]}>
            <Feather name="info" size={16} color={theme.colors.iconPrimary} />
          </View>
          <View style={styles.menuTextBlock}>
            <Text style={styles.menuLabel}>App Version</Text>
          </View>
          <View style={styles.menuActionSlot}>
            <Text style={styles.menuActionValue}>{appVersion}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          disabled={isDeletingAccount}
          style={({ pressed }) => [
            styles.deleteAccountButton,
            pressed && styles.deleteAccountButtonPressed,
            isDeletingAccount && styles.footerButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
        >
          <View style={styles.deleteAccountIconWrap}>
            <Feather name="trash-2" size={16} color="#b91c1c" />
          </View>
          <Text style={styles.deleteAccountLabel}>
            {isDeletingAccount ? 'Deleting Account' : 'Delete Account'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
          onPress={handleSignOut}
        >
          <View style={styles.logoutIconWrap}>
            <Feather name="log-out" size={16} color="#e11d24" />
          </View>
          <Text style={styles.logoutLabel}>Log Out</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
};
