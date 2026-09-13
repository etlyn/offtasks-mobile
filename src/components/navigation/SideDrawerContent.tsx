import React from 'react';
import { Alert, Keyboard, Switch, Text, View } from 'react-native';
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  EyeOff,
  LogOut,
  Moon,
  RefreshCw,
  SlidersHorizontal,
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

import { createStyles } from './SideDrawerContent.styles';

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
          size={18}
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

  const email = session?.user?.email ?? 'Stored on this device';
  const fullName = session?.user?.user_metadata?.full_name as
    | string
    | undefined;
  const userLabel = session ? fullName?.trim() || email.split('@')[0] : 'Guest';
  const initials =
    userLabel
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const danger = theme.isDark ? '#F4A5A5' : '#A83E3E';

  return (
    <View style={styles.shell}>
      <View pointerEvents="none" style={styles.backdrop}>
        <CalendarBackdrop />
      </View>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.wordmark}>
          offtasks<Text style={styles.brandDot}>.</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={() => navigation.closeDrawer()}
          style={styles.closeTarget}
        >
          <GlassSurface navigation style={styles.closeSurface}>
            <X size={18} strokeWidth={1.8} color={brand} />
          </GlassSurface>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={session ? 'Account and sync' : 'Sign in for sync'}
          accessibilityHint={
            session
              ? 'Open your account and sync settings'
              : 'Your guest items stay on this device'
          }
          onPress={() => handleNavigate('Account')}
          style={styles.profile}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userLabel}
            </Text>
            <Text style={styles.profileDetail} numberOfLines={1}>
              {email}
            </Text>
          </View>
          <ChevronRight
            size={16}
            strokeWidth={1.7}
            color={theme.colors.textMuted}
          />
        </Pressable>

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
          <GlassSurface navigation style={styles.statisticsSurface}>
            <ChartNoAxesColumnIncreasing
              size={19}
              strokeWidth={1.7}
              color={brand}
            />
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
          </GlassSurface>
        </Pressable>

        <Text accessibilityRole="header" style={styles.sectionLabel}>
          Preferences
        </Text>
        <PreferenceRow
          icon={Moon}
          title="Dark mode"
          value={isDarkMode}
          onChange={toggleTheme}
          label="Toggle dark mode"
          styles={styles}
        />
        <PreferenceRow
          icon={EyeOff}
          title="Hide completed"
          value={hideCompleted}
          onChange={setHideCompleted}
          label="Toggle hide completed tasks"
          styles={styles}
        />
        <PreferenceRow
          icon={SlidersHorizontal}
          title="Advanced mode"
          detail="Labels & priority filters"
          value={advancedMode}
          onChange={setAdvancedMode}
          label="Toggle advanced mode"
          styles={styles}
        />
        <PreferenceRow
          icon={RefreshCw}
          title="Auto-move due tasks"
          detail="Move overdue tasks to Today"
          value={autoArrange}
          onChange={setAutoArrange}
          label="Toggle auto move due tasks"
          styles={styles}
        />

        <View style={styles.footer}>
          {!session ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              onPress={() => handleNavigate('Account')}
              style={styles.signIn}
            >
              <Text style={styles.signInLabel}>Sign in</Text>
              <ArrowRight
                size={17}
                strokeWidth={1.8}
                color={theme.isDark ? '#101916' : '#FFFFFF'}
              />
            </Pressable>
          ) : (
            <View style={styles.accountActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log out"
                onPress={handleSignOut}
                style={styles.accountAction}
              >
                <LogOut size={17} strokeWidth={1.7} color={brand} />
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
          <Text style={styles.version}>Version {appVersion}</Text>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};
