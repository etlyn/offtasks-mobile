import { AnalyticsPreferences } from '@/analytics/AnalyticsPreferences';
import React from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  LogIn,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Sun,
  LogOut,
  Moon,
  RefreshCw,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { CalendarBackdrop } from '@/components/PageBackdrop';
import { GlassSurface } from '@/components/GlassSurface';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteAccount, supabaseClient } from '@/lib/supabase';
import { clearPlanner } from '@/lib/plannerSync';
import { appVersion } from '@/lib/appVersion';
import { useAuth } from '@/providers/AuthProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import { useAppTheme } from '@/theme/colors';

import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';

import { createStyles } from './SideDrawerContent.styles';

const compactSwitchStyle = {
  width: 51,
  height: 31,
  transform: [{ scale: 0.78 }],
};

function DrawerThemeControl({
  dark,
  toggleTheme,
}: {
  dark: boolean;
  toggleTheme: () => void;
}) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { reduceMotion } = useCalendarTransition();
  const position = React.useRef(new Animated.Value(dark ? 44 : 0)).current;
  React.useEffect(() => {
    position.stopAnimation();
    if (reduceMotion) {
      position.setValue(dark ? 44 : 0);
      return;
    }
    const motion = Animated.timing(position, {
      toValue: dark ? 44 : 0,
      duration: 240,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    motion.start();
    return () => motion.stop();
  }, [dark, position, reduceMotion]);
  return (
    <View style={styles.appearanceControl}>
      <GlassSurface
        pointerEvents="none"
        testID="drawer-theme-track"
        style={styles.appearanceSurface}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.themeSelected,
          { transform: [{ translateX: position }] },
        ]}
      />
      {[
        { Icon: Sun, value: false, label: 'Light mode' },
        { Icon: Moon, value: true, label: 'Dark mode' },
      ].map(({ Icon, value, label }) => (
        <Pressable
          key={label}
          accessibilityRole="radio"
          accessibilityLabel={label}
          accessibilityState={{ checked: dark === value }}
          onPress={() => {
            if (dark !== value) toggleTheme();
          }}
          style={styles.themeTarget}
        >
          <Icon
            size={15}
            strokeWidth={dark === value ? 1.9 : 1.6}
            color={
              dark === value ? theme.colors.textPrimary : theme.colors.textMuted
            }
          />
        </Pressable>
      ))}
    </View>
  );
}

type ToggleControlProps = {
  value: boolean;
  onPress: (value: boolean) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

const ToggleControl = ({
  value,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: ToggleControlProps) => {
  const theme = useAppTheme();
  return (
    <Switch
      style={compactSwitchStyle}
      hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
      value={value}
      onValueChange={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      trackColor={{
        false: theme.colors.borderStrong,
        true: theme.isDark ? '#D8F3E5' : '#152D25',
      }}
      thumbColor={theme.isDark && value ? '#101916' : '#FFFFFF'}
    />
  );
};

function PreferenceRow({
  icon: Icon,
  title,
  detail,
  value,
  onChange,
  label,
  styles,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.preferenceRow}>
      <View
        style={styles.rowIcon}
        accessible={false}
        accessibilityElementsHidden
      >
        <Icon
          size={16}
          strokeWidth={1.7}
          color={theme.isDark ? '#D8F3E5' : '#152D25'}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{title}</Text>
          {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        </View>
        <View style={styles.switchTarget}>
          <ToggleControl
            value={value}
            onPress={onChange}
            accessibilityLabel={label}
            accessibilityHint={detail}
          />
        </View>
      </View>
    </View>
  );
}

export const SideDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation } = props;
  const { session } = useAuth();
  const { totals } = useTasks();
  const {
    themeMode,
    movePastTasksToLater,
    setMovePastTasksToLater,
    toggleTheme,
  } = usePreferences();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const isDarkMode = themeMode === 'Dark';
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

  const handleNavigate = React.useCallback(
    (routeName: string) => {
      Keyboard.dismiss();
      navigation.navigate('Dashboard', { screen: routeName });
      navigation.closeDrawer();
    },
    [navigation],
  );

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
      if (session) {
        try {
          await clearPlanner(session.user.id);
        } catch {
          Alert.alert(
            'Account deleted',
            'Local cache cleanup failed. Sign-out will still continue.',
          );
        }
      }
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
  }, [navigation, session]);

  const handleDeleteAccount = React.useCallback(() => {
    if (isDeletingAccount) {
      return;
    }

    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all synced tasks, notes and goals. Device guest items are kept. This cannot be undone.',
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

  const accountDetail =
    session?.user?.user_metadata?.full_name?.trim() || session?.user?.email;
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const danger = theme.isDark ? '#F4A5A5' : '#A83E3E';

  return (
    <View style={styles.shell}>
      <View pointerEvents="none" style={styles.backdrop}>
        <CalendarBackdrop />
      </View>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <DrawerThemeControl dark={isDarkMode} toggleTheme={toggleTheme} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={() => navigation.closeDrawer()}
          style={styles.closeTarget}
        >
          <X size={15} strokeWidth={1.7} color={brand} />
        </Pressable>
      </View>
      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            paddingStart: 24,
            paddingEnd: 24,
          },
        ]}
      >
        <View style={styles.controlsSurface}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Statistics"
            accessibilityHint={
              totals.all > 0
                ? `${totals.completed} of ${totals.all} tasks completed`
                : undefined
            }
            onPress={() => handleNavigate('Statistics')}
            style={styles.statisticsTarget}
          >
            <View style={styles.statisticsSurface}>
              <View style={styles.rowIcon}>
                <ChartNoAxesColumnIncreasing
                  size={16}
                  strokeWidth={1.7}
                  color={brand}
                />
              </View>
              <Text style={[styles.rowLabel, styles.statisticsLabel]}>
                Statistics
              </Text>
              {totals.all > 0 ? (
                <Text style={styles.progress}>
                  {totals.completed}/{totals.all}
                </Text>
              ) : null}
              <ChevronRight
                size={16}
                strokeWidth={1.7}
                color={theme.colors.textMuted}
              />
            </View>
          </Pressable>

          <View style={styles.sectionDivider} />
          <PreferenceRow
            icon={RefreshCw}
            title="Return to Later"
            detail="Unfinished past tasks"
            value={movePastTasksToLater}
            onChange={enabled => {
              if (!enabled) {
                setMovePastTasksToLater(false);
                return;
              }
              Alert.alert(
                'Return unfinished tasks to Later?',
                'Unfinished tasks on past dates will lose their assigned date and return to Later. This runs when the app is open or reopened.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Enable',
                    onPress: () => setMovePastTasksToLater(true),
                  },
                ],
              );
            }}
            label="Automatically return past tasks to Later"
            styles={styles}
          />
        </View>
        <View style={styles.footer}>
          <View style={styles.accountSection}>
            {!session ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in for sync"
                accessibilityHint="Your guest items stay on this device"
                onPress={() => handleNavigate('Account')}
                style={styles.accountAction}
              >
                <LogIn size={16} strokeWidth={1.7} color={brand} />
                <Text style={styles.rowLabel}>Sign in for sync</Text>
                <ChevronRight
                  size={14}
                  color={theme.colors.textMuted}
                  style={styles.accountChevron}
                />
              </Pressable>
            ) : (
              <View style={styles.accountActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Account and sync"
                  onPress={() => handleNavigate('Account')}
                  style={styles.accountAction}
                >
                  <RefreshCw size={16} strokeWidth={1.7} color={brand} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>Account and sync</Text>
                    {accountDetail ? (
                      <Text numberOfLines={1} style={styles.rowDetail}>
                        {accountDetail}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight size={14} color={theme.colors.textMuted} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Log out"
                  onPress={handleSignOut}
                  style={styles.accountAction}
                >
                  <LogOut size={16} strokeWidth={1.7} color={brand} />
                  <Text style={styles.rowLabel}>Log out</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete account"
                  disabled={isDeletingAccount}
                  onPress={handleDeleteAccount}
                  style={styles.accountAction}
                >
                  <Trash2 size={16} strokeWidth={1.7} color={danger} />
                  <Text style={[styles.deleteLabel, { color: danger }]}>
                    {isDeletingAccount ? 'Deleting account…' : 'Delete account'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          <AnalyticsPreferences />
          <Text style={styles.version}>Version {appVersion}</Text>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};
