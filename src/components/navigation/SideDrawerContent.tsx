import { PrivacyScreen } from '@/analytics/AnalyticsPreferences';
import React from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  ChartNoAxesCombined,
  ChevronRight,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import {
  useDrawerStatus,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabaseClient } from '@/lib/supabase';
import { appVersion } from '@/lib/appVersion';
import { usePendingAccountCleanup } from '@/lib/accountDataCleanup';
import { useAuth } from '@/providers/AuthProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import { AccountScreen } from '@/screens/AccountScreen';
import { useAppTheme } from '@/theme/colors';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { FlowButton, FlowNotice, useDrawerPalette } from './DrawerFlowUI';
import { createStyles } from './SideDrawerContent.styles';

function DrawerThemeControl() {
  const { themeMode, toggleTheme } = usePreferences();
  const theme = useAppTheme();
  const colors = useDrawerPalette();
  const styles = createStyles(theme);
  const dark = themeMode === 'Dark';
  const { reduceMotion } = useCalendarTransition();
  const position = React.useRef(new Animated.Value(dark ? 44 : 0)).current;
  React.useEffect(() => {
    position.stopAnimation();
    const motion = Animated.timing(position, {
      toValue: dark ? 44 : 0,
      duration: reduceMotion ? 0 : 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    motion.start();
    return () => motion.stop();
  }, [dark, position, reduceMotion]);
  return (
    <View
      style={styles.appearanceControl}
      accessibilityRole="radiogroup"
      accessibilityLabel="Appearance"
    >
      <View
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
          <Icon size={16} strokeWidth={1.7} color={colors.brand} />
        </Pressable>
      ))}
    </View>
  );
}

function IconSlot({ icon: Icon }: { icon: LucideIcon }) {
  const colors = useDrawerPalette();
  const styles = createStyles(useAppTheme());
  return (
    <View style={styles.rowIcon} accessible={false}>
      <Icon size={18} strokeWidth={1.7} color={colors.brand} />
    </View>
  );
}

type Panel = 'menu' | 'account' | 'privacy';
export const SideDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation } = props;
  const { session } = useAuth();
  const cleanup = usePendingAccountCleanup();
  const guestCleanup = !session && cleanup.phase === 'confirmed';
  const { totals } = useTasks();
  const { movePastTasksToLater, setMovePastTasksToLater } = usePreferences();
  const colors = useDrawerPalette();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const drawerStatus = useDrawerStatus();
  const [panel, setPanel] = React.useState<Panel>('menu');
  const [signoutError, setSignoutError] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const signoutLock = React.useRef(false);
  const owner = session?.user.id;
  const currentOwner = React.useRef(owner);
  currentOwner.current = owner;
  const mounted = React.useRef(true);
  const { reduceMotion } = useCalendarTransition();
  const opacity = React.useRef(new Animated.Value(1)).current;
  React.useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  React.useEffect(() => {
    if (drawerStatus === 'closed') {
      Keyboard.dismiss();
      setPanel('menu');
    }
  }, [drawerStatus]);
  React.useEffect(() => {
    if (panel === 'menu' || drawerStatus === 'closed') return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        Keyboard.dismiss();
        setPanel('menu');
        return true;
      },
    );
    return () => subscription.remove();
  }, [panel, drawerStatus]);
  React.useEffect(() => {
    opacity.stopAnimation();
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const motion = Animated.timing(opacity, {
      toValue: 1,
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    motion.start();
    return () => motion.stop();
  }, [panel, opacity, reduceMotion]);
  const open = (next: Panel) => {
    Keyboard.dismiss();
    setPanel(next);
  };
  const back = () => open('menu');
  const signOut = async () => {
    if (signoutLock.current || !owner) return;
    const requestedOwner = owner;
    signoutLock.current = true;
    setSigningOut(true);
    setSignoutError(false);
    try {
      const { data, error: sessionError } =
        await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      if (!mounted.current || currentOwner.current !== requestedOwner) return;
      if (data.session?.user.id !== requestedOwner)
        throw new Error('Account changed');
      const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
      if (error) throw error;
      if (mounted.current && currentOwner.current === requestedOwner)
        navigation.closeDrawer();
    } catch {
      if (mounted.current && currentOwner.current === requestedOwner)
        setSignoutError(true);
    } finally {
      signoutLock.current = false;
      if (mounted.current && currentOwner.current === requestedOwner)
        setSigningOut(false);
    }
  };
  const toggleLater = (enabled: boolean) => {
    if (!enabled) {
      setMovePastTasksToLater(false);
      return;
    }
    const consentOwner = owner;
    Alert.alert(
      'Return to Later?',
      'Unfinished tasks on past dates move to Later and lose their dates when you open or refresh the app.\n\nTurning this off won’t restore those dates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: () => {
            if (mounted.current && currentOwner.current === consentOwner)
              setMovePastTasksToLater(true);
          },
        },
      ],
      { cancelable: true },
    );
  };
  const accountName =
    session?.user.user_metadata?.full_name?.trim() ||
    session?.user.user_metadata?.name?.trim() ||
    session?.user.email?.split('@')[0] ||
    'Your account';
  const utility = (
    icon: LucideIcon,
    title: string,
    action: () => void,
    label = title,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={action}
      style={styles.utilityRow}
    >
      <IconSlot icon={icon} />
      <Text style={[styles.rowLabel, styles.rowText]}>{title}</Text>
      <ChevronRight size={14} strokeWidth={1.7} color={colors.brand} />
    </Pressable>
  );
  return (
    <Animated.View style={[styles.shell, { opacity }]}>
      {panel === 'privacy' ? (
        <PrivacyScreen onBack={back} />
      ) : panel === 'account' ? (
        <AccountScreen onBack={back} />
      ) : (
        <>
          <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
            <View style={styles.rowText}>
              <Text style={styles.identityName}>
                {session ? accountName : 'On this device'}
              </Text>
              <Text style={styles.identityDetail}>
                {session ? session.user.email : 'Guest workspace'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={() => navigation.closeDrawer()}
              style={styles.closeTarget}
            >
              <X size={16} strokeWidth={1.7} color={colors.brand} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
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
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.navigate('Dashboard', { screen: 'Statistics' });
                  navigation.closeDrawer();
                }}
                style={styles.utilityRow}
              >
                <IconSlot icon={ChartNoAxesCombined} />
                <Text style={[styles.rowLabel, styles.rowText]}>
                  Statistics
                </Text>
                <ChevronRight
                  size={14}
                  strokeWidth={1.7}
                  color={colors.brand}
                />
              </Pressable>
              <View style={styles.preferenceRow}>
                <IconSlot icon={RefreshCw} />
                <Text style={[styles.rowLabel, styles.rowText]}>
                  Return to Later
                </Text>
                <View style={styles.switchTarget}>
                  <Switch
                    style={styles.compactSwitch}
                    value={movePastTasksToLater}
                    onValueChange={toggleLater}
                    accessibilityLabel="Automatically return past tasks to Later"
                    accessibilityHint="Turning this off will not restore dates"
                    trackColor={{ false: colors.divider, true: colors.brand }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
              <View style={styles.preferenceRow}>
                <IconSlot icon={Sun} />
                <Text style={[styles.rowLabel, styles.rowText]}>
                  Appearance
                </Text>
                <DrawerThemeControl />
              </View>
              {utility(Settings, 'Privacy & analytics', () => open('privacy'))}
              {session ? (
                <>
                  <View style={styles.sectionDivider} />
                  {utility(
                    UserRound,
                    'Account & sync',
                    () => open('account'),
                    'Account and sync',
                  )}
                </>
              ) : null}
            </View>
            {guestCleanup ? (
              <View style={styles.feedback}>
                <FlowNotice title="Offtasks data deleted">
                  Your Etlyn account is kept. Retry only device cleanup; don’t
                  submit deletion again.
                </FlowNotice>
                <FlowButton
                  title={cleanup.busy ? 'Cleaning up…' : 'Retry device cleanup'}
                  secondary
                  disabled={cleanup.busy}
                  onPress={() => {
                    void cleanup.retry().catch(() => undefined);
                  }}
                />
              </View>
            ) : signoutError ? (
              <View style={styles.feedback}>
                <FlowNotice title="Couldn’t sign out">
                  You’re still signed in. Try again.
                </FlowNotice>
              </View>
            ) : null}
            <View style={styles.footer}>
              <View style={styles.accountSection}>
                <FlowButton
                  title={
                    session
                      ? signingOut
                        ? 'Signing out…'
                        : 'Sign out'
                      : 'Sign in for sync'
                  }
                  secondary={Boolean(session)}
                  disabled={signingOut || guestCleanup}
                  onPress={
                    session ? () => void signOut() : () => open('account')
                  }
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Welcome to Offtasks"
                  onPress={() => {
                    navigation.navigate('Welcome');
                    navigation.closeDrawer();
                  }}
                  style={styles.versionTarget}
                >
                  <Text style={styles.version}>Version {appVersion}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </>
      )}
    </Animated.View>
  );
};
