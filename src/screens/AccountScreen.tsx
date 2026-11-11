import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import {
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import { GUEST_ID, readLocalTasks } from '@/lib/localTasks';
import {
  readPlanner,
  syncPlanner,
  plannerSyncProblem,
  subscribePlanner,
} from '@/lib/plannerSync';
import { deleteAccount, supabaseClient } from '@/lib/supabase';
import {
  beginAccountDataDeletion,
  confirmAccountDataDeletion,
  clearRequestedAccountDeletion,
  loadPendingAccountCleanup,
  retryPendingAccountCleanup,
  usePendingAccountCleanup,
} from '@/lib/accountDataCleanup';
import {
  DrawerDestination,
  FlowActionRow,
  FlowButton,
  FlowNotice,
  useDrawerPalette,
} from '@/components/navigation/DrawerFlowUI';
import { ChatGPTConnection } from '@/components/ChatGPTConnection';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { LoginScreen } from './LoginScreen';

/** An import always copies the guest workspace; its source is never removed. */
export async function importGuestItems(expectedOwner?: string) {
  const [tasks, notes, goals] = await Promise.all([
    readLocalTasks(GUEST_ID),
    readPlanner(GUEST_ID, 'note'),
    readPlanner(GUEST_ID, 'goal'),
  ]);
  let accessToken: string | undefined;
  if (expectedOwner) {
    const { data, error } = await supabaseClient.auth.getSession();
    if (
      error ||
      data.session?.user.id !== expectedOwner ||
      !data.session?.access_token
    )
      throw new Error(
        'The account changed. Review the import again. Device items are unchanged.',
      );
    accessToken = data.session.access_token;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const request = supabaseClient.rpc('import_device_items', {
      payload: { tasks, notes, goals },
    });
    // Keep this copy bound to the reviewed account even if auth changes while
    // the request is being dispatched. Never fall through to a new session.
    if (accessToken)
      request.setHeader('Authorization', `Bearer ${accessToken}`);
    const { error } = await request.abortSignal(controller.signal);
    if (error)
      throw new Error(
        'Import did not finish. Device items are unchanged. Check your connection and retry; the sync service may need updating.',
      );
  } finally {
    clearTimeout(timeout);
  }
}

type Activity = 'idle' | 'syncing' | 'importing' | 'deleting';
type Notice = { title: string; detail: string };
type AccountScreenProps = {
  onBack?: () => void;
  onCleanupRequired?: (retry: () => Promise<void>) => void;
};

export const AccountScreen = ({
  onBack,
  onCleanupRequired,
}: AccountScreenProps = {}) => {
  const { session, pendingGuestImport, finishGuestImportReview } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { refresh, error: taskError } = useTasks();
  const colors = useDrawerPalette();
  const { animateLayout } = useCalendarTransition();
  const cleanup = usePendingAccountCleanup();
  const cleanupState = React.useRef(cleanup);
  cleanupState.current = cleanup;
  const [activity, setActivity] = React.useState<Activity>('idle');
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [checked, setChecked] = React.useState(false);
  const [appsExpanded, setAppsExpanded] = React.useState(false);
  const [checkingDeviceStatus, setCheckingDeviceStatus] = React.useState(false);
  const [finishingPreviousCleanup, setFinishingPreviousCleanup] =
    React.useState(false);
  const [, redraw] = React.useReducer(value => value + 1, 0);
  const owner = session?.user.id;
  const identity = React.useRef(owner);
  identity.current = owner;
  const mounted = React.useRef(true);
  const lock = React.useRef(false);
  // Once the server confirms deletion, every retry is local cleanup only.
  const deletedOwner = React.useRef<string | null>(null);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  React.useEffect(() => subscribePlanner(redraw), []);
  React.useEffect(() => {
    setNotice(null);
    setChecked(false);
    setActivity('idle');
    setAppsExpanded(false);
    lock.current = false;
    deletedOwner.current = null;
  }, [owner]);
  const current = (expectedOwner: string) =>
    mounted.current && identity.current === expectedOwner;
  const showNotice = (next: Notice) => {
    animateLayout();
    setNotice(next);
  };
  const leaveAccount = () => {
    if (lock.current) return;
    finishGuestImportReview?.();
    if (onBack) onBack();
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const sync = async (importItems = false) => {
    if (!owner || lock.current || deletedOwner.current) return;
    const expectedOwner = owner;
    lock.current = true;
    setActivity(importItems ? 'importing' : 'syncing');
    showNotice(
      importItems
        ? {
            title: 'Importing device items',
            detail: `To ${
              session?.user.email ?? 'your account'
            }. Your device copy is kept.`,
          }
        : {
            title: 'Checking account changes',
            detail:
              'Your saved notes and goals stay on this device while we check.',
          },
    );
    let imported = false;
    try {
      if (importItems) {
        await importGuestItems(expectedOwner);
        imported = true;
      }
      if (!current(expectedOwner)) return;
      await Promise.all([
        syncPlanner(expectedOwner, 'note'),
        syncPlanner(expectedOwner, 'goal'),
        refresh({ throwOnError: true }),
      ]);
      if (!current(expectedOwner)) return;
      if (plannerSyncProblem(expectedOwner))
        throw new Error('Planner sync unavailable');
      setChecked(true);
      if (imported) {
        finishGuestImportReview?.();
        showNotice({
          title: 'Device items imported',
          detail:
            'Your device copy is kept. Existing account items were not replaced.',
        });
      } else {
        animateLayout();
        setNotice(null);
      }
    } catch {
      if (!current(expectedOwner)) return;
      showNotice(
        imported
          ? {
              title: 'Device items imported',
              detail:
                'Your device copy is kept. Account changes could not be refreshed. Try Sync now.',
            }
          : importItems
          ? {
              title: 'Couldn’t import',
              detail:
                'Your device items are unchanged. Review the import and try again.',
            }
          : {
              title: 'Sync unavailable',
              detail:
                'Notes and goals retry from this device. Account tasks need a connection.',
            },
      );
    } finally {
      if (current(expectedOwner)) {
        lock.current = false;
        setActivity('idle');
      }
    }
  };

  const removeData = async (expectedOwner: string) => {
    if (!current(expectedOwner) || lock.current) return;
    const pendingCleanup = cleanupState.current;
    // A stale native confirmation must never turn another account’s cleanup
    // into an apparent deletion of the account currently being reviewed.
    if (pendingCleanup.owner && pendingCleanup.owner !== expectedOwner) return;
    lock.current = true;
    setActivity('deleting');
    showNotice({
      title: 'Deleting Offtasks data',
      detail: 'Your shared Etlyn account and device guest items are kept.',
    });
    try {
      if (
        deletedOwner.current !== expectedOwner &&
        !(
          pendingCleanup.owner === expectedOwner &&
          pendingCleanup.phase === 'confirmed'
        )
      ) {
        await beginAccountDataDeletion(expectedOwner);
        await deleteAccount(expectedOwner);
        deletedOwner.current = expectedOwner;
        await confirmAccountDataDeletion(expectedOwner);
      }
      await retryPendingAccountCleanup();
      finishGuestImportReview?.();
      if (current(expectedOwner)) onBack?.();
    } catch (error) {
      if (!current(expectedOwner)) return;
      if (
        deletedOwner.current === expectedOwner ||
        (cleanup.owner === expectedOwner && cleanup.phase === 'confirmed')
      ) {
        showNotice({
          title: 'Offtasks data deleted',
          detail:
            'Your Etlyn account is kept. Retry only device cleanup; don’t submit deletion again.',
        });
        onCleanupRequired?.(retryPendingAccountCleanup);
      } else {
        if (
          error &&
          typeof error === 'object' &&
          'deletionRejected' in error &&
          error.deletionRejected === true
        ) {
          try {
            await clearRequestedAccountDeletion(expectedOwner);
          } catch {
            /* The pending marker remains reviewable. */
          }
          if (!current(expectedOwner)) return;
        }
        showNotice({
          title: 'Couldn’t delete Offtasks data',
          detail:
            'No successful deletion is confirmed. You’re still signed in.',
        });
      }
    } finally {
      if (current(expectedOwner)) {
        lock.current = false;
        setActivity('idle');
      }
    }
  };

  const confirmImport = () => {
    if (!owner || lock.current || deletedOwner.current) return;
    const expectedOwner = owner;
    Alert.alert(
      'Import device items?',
      `Add this device’s tasks, notes and goals to ${
        session?.user.email ?? 'your account'
      }.\n\nExisting account items aren’t replaced. Your device copy is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: () => {
            if (current(expectedOwner)) sync(true);
          },
        },
      ],
      { cancelable: true },
    );
  };
  const confirmDelete = () => {
    if (!owner || lock.current || (cleanup.owner && cleanup.owner !== owner))
      return;
    const expectedOwner = owner;
    if (
      deletedOwner.current === expectedOwner ||
      (cleanup.owner === expectedOwner && cleanup.phase === 'confirmed')
    ) {
      removeData(expectedOwner);
      return;
    }
    if (cleanup.owner === expectedOwner && cleanup.phase === 'requested') {
      Alert.alert(
        'Review previous deletion',
        'The previous request’s outcome was not confirmed. Check your Offtasks account data before trying again.\n\nThis review sends no deletion request. A new deletion will still need a separate confirmation.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I checked my account',
            onPress: () => {
              if (!current(expectedOwner)) return;
              clearRequestedAccountDeletion(expectedOwner)
                .then(() => {
                  if (current(expectedOwner))
                    showNotice({
                      title: 'Deletion review complete',
                      detail:
                        'No new deletion was submitted. Delete Offtasks data still requires confirmation.',
                    });
                })
                .catch(() => {
                  if (current(expectedOwner))
                    showNotice({
                      title: 'Couldn’t save review',
                      detail:
                        'Please try reviewing the previous deletion again.',
                    });
                });
            },
          },
        ],
        { cancelable: true },
      );
      return;
    }
    Alert.alert(
      'Delete Offtasks data?',
      'Permanently delete this account’s Offtasks tasks, notes and goals. This can’t be undone.\n\nYour Etlyn sign-in, other apps and guest device items are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeData(expectedOwner);
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (!session) return <LoginScreen onBack={onBack} />;
  const busy = activity !== 'idle';
  const cleanupNeeded =
    deletedOwner.current === owner ||
    (cleanup.owner === owner && cleanup.phase === 'confirmed');
  const deletionUncertain =
    cleanup.owner === owner && cleanup.phase === 'requested' && !cleanupNeeded;
  const previousAccountCleanup = Boolean(
    cleanup.owner && cleanup.owner !== owner,
  );
  const syncError = taskError || plannerSyncProblem(session.user.id);
  const visibleNotice =
    !cleanup.ready && cleanup.error
      ? { title: 'Device status unavailable', detail: cleanup.error }
      : previousAccountCleanup
      ? cleanup.phase === 'confirmed'
        ? {
            title: 'Previous account needs device cleanup',
            detail:
              cleanup.error ||
              'Offtasks data for a previous account was deleted. Finish only that account’s device cleanup. This account stays signed in.',
          }
        : {
            title: 'Previous deletion needs review',
            detail:
              'Sign in to the previous account to review its unconfirmed deletion. No deletion has been submitted for this account.',
          }
      : notice ??
        (cleanupNeeded
          ? {
              title: 'Offtasks data deleted',
              detail:
                'Your Etlyn account is kept. Retry only device cleanup; don’t submit deletion again.',
            }
          : deletionUncertain
          ? {
              title: 'Deletion not confirmed',
              detail:
                'Deletion was interrupted. Check your account before submitting deletion again.',
            }
          : syncError
          ? {
              title: 'Sync unavailable',
              detail:
                'Notes and goals retry from this device. Account tasks need a connection.',
            }
          : null);
  const name = session.user.user_metadata?.full_name?.trim() || 'Your account';
  return (
    <DrawerDestination
      title="Account & sync"
      onBack={leaveAccount}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
          <FlowActionRow
            icon={Trash2}
            title={
              activity === 'deleting'
                ? 'Deleting…'
                : cleanupNeeded
                ? 'Retry device cleanup'
                : deletionUncertain
                ? 'Review deletion'
                : 'Delete Offtasks data'
            }
            accessibilityLabel={
              cleanupNeeded
                ? 'Retry device cleanup'
                : deletionUncertain
                ? 'Review deletion'
                : 'Delete Offtasks data'
            }
            danger={!cleanupNeeded}
            disabled={busy || !cleanup.ready || previousAccountCleanup}
            onPress={confirmDelete}
          />
          <Text style={[styles.meta, { color: colors.secondary }]}>
            Only Offtasks data. Your Etlyn account is kept.
          </Text>
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.meta, { color: colors.secondary }]}>
            {session.user.email}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <View style={styles.workspace}>
          <Text style={[styles.sectionLabel, { color: colors.secondary }]}>
            Workspace
          </Text>
          <FlowActionRow
            icon={RefreshCw}
            title={activity === 'syncing' ? 'Checking…' : 'Sync now'}
            accessibilityLabel="Sync now"
            detail="Check for account changes"
            disabled={busy || cleanupNeeded}
            onPress={() => {
              sync();
            }}
          />
          <FlowActionRow
            icon={RefreshCw}
            title={
              activity === 'importing' ? 'Importing…' : 'Import device items'
            }
            accessibilityLabel="Import device items"
            detail="Keep your device copy"
            chevron
            disabled={busy || cleanupNeeded}
            onPress={confirmImport}
          />
          {!visibleNotice ? (
            <Text style={[styles.meta, { color: colors.secondary }]}>
              Sync status · {checked ? 'Up to date' : 'Not checked'}
            </Text>
          ) : null}
        </View>
        <FlowActionRow
          icon={ExternalLink}
          title="Manage Etlyn account"
          detail="Opens etlyn.com"
          chevron
          disabled={activity === 'importing' || activity === 'deleting'}
          onPress={() => {
            Linking.openURL('https://etlyn.com/auth/account').catch(() => {
              if (owner && current(owner))
                showNotice({
                  title: 'Couldn’t open account',
                  detail: 'Please try again.',
                });
            });
          }}
        />
        {visibleNotice ? (
          <FlowNotice title={visibleNotice.title}>
            {visibleNotice.detail}
          </FlowNotice>
        ) : (
          <Text style={[styles.meta, { color: colors.secondary }]}>
            Device tasks, notes and goals stay separate until you import them.
          </Text>
        )}
        {previousAccountCleanup && cleanup.phase === 'confirmed' ? (
          <FlowButton
            title={
              finishingPreviousCleanup
                ? 'Finishing previous device cleanup…'
                : 'Finish previous device cleanup'
            }
            accessibilityLabel="Finish previous device cleanup"
            secondary
            disabled={finishingPreviousCleanup || cleanup.busy}
            onPress={() => {
              if (finishingPreviousCleanup || cleanup.busy) return;
              const expectedOwner = owner;
              setFinishingPreviousCleanup(true);
              retryPendingAccountCleanup()
                .then(() => {
                  if (expectedOwner && current(expectedOwner)) setNotice(null);
                })
                .catch(() => undefined)
                .finally(() => {
                  if (mounted.current) setFinishingPreviousCleanup(false);
                });
            }}
          />
        ) : null}
        {!cleanup.ready && cleanup.error ? (
          <FlowButton
            title={
              checkingDeviceStatus
                ? 'Checking device status…'
                : 'Retry device status'
            }
            accessibilityLabel="Retry device status"
            secondary
            disabled={checkingDeviceStatus}
            onPress={() => {
              if (checkingDeviceStatus) return;
              setCheckingDeviceStatus(true);
              loadPendingAccountCleanup()
                .catch(() => undefined)
                .finally(() => {
                  if (mounted.current) setCheckingDeviceStatus(false);
                });
            }}
          />
        ) : null}
        {!cleanupNeeded ? (
          <>
            <FlowActionRow
              icon={MessageCircle}
              title="Connected apps"
              detail="ChatGPT access"
              chevron
              disabled={busy}
              onPress={() => {
                animateLayout();
                setAppsExpanded(value => !value);
              }}
            />
            {appsExpanded ? (
              <ChatGPTConnection
                key={session.user.id}
                owner={session.user.id}
              />
            ) : null}
          </>
        ) : null}
        {pendingGuestImport ? (
          <FlowButton
            title="Continue to my account"
            disabled={busy}
            onPress={leaveAccount}
          />
        ) : null}
      </View>
    </DrawerDestination>
  );
};

const styles = StyleSheet.create({
  content: { gap: 24 },
  identity: { gap: 4 },
  name: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  meta: { fontSize: 12, lineHeight: 16 },
  sectionLabel: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth },
  workspace: { gap: 4 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 12 },
});
