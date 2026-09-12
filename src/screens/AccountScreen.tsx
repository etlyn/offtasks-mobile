import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import { PlannerHeader } from '@/components/navigation/PlannerHeader';
import { plannerStyles } from '@/features/planner/Planner.styles';
import { useAppTheme } from '@/theme/colors';
import { GUEST_ID, readLocalTasks } from '@/lib/localTasks';
import {
  readPlanner,
  syncPlanner,
  plannerSyncProblem,
  subscribePlanner,
} from '@/lib/plannerSync';
import { supabaseClient } from '@/lib/supabase';
import { LoginScreen } from './LoginScreen';

export async function importGuestItems() {
  const [tasks, notes, goals] = await Promise.all([
    readLocalTasks(GUEST_ID),
    readPlanner(GUEST_ID, 'note'),
    readPlanner(GUEST_ID, 'goal'),
  ]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const { error } = await supabaseClient
      .rpc('import_device_items', { payload: { tasks, notes, goals } })
      .abortSignal(controller.signal);
    if (error)
      throw new Error(
        'Import did not finish. Device items are unchanged. Check your connection and retry; the sync service may need updating.',
      );
  } finally {
    clearTimeout(timeout);
  }
}

export const AccountScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation();
  const { refresh, error: taskError } = useTasks();
  const theme = useAppTheme();
  const styles = plannerStyles(theme);
  const [busy, setBusy] = React.useState(false);
  const lock = React.useRef(false);
  const [, redraw] = React.useReducer(value => value + 1, 0);
  React.useEffect(() => subscribePlanner(redraw), []);
  if (!session) return <LoginScreen />;

  const sync = async (importItems = false) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (importItems) await importGuestItems();
      await Promise.all([
        syncPlanner(session.user.id, 'note'),
        syncPlanner(session.user.id, 'goal'),
        refresh(),
      ]);
      if (importItems)
        Alert.alert('Device items imported', 'Your device copy is unchanged.');
    } catch (error) {
      Alert.alert('Sync unavailable', (error as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={styles.root}>
      <PlannerHeader title="Account" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>{session.user.email}</Text>
        <Text accessibilityRole="alert" style={styles.body}>
          {taskError ??
            plannerSyncProblem(session.user.id) ??
            'Account storage'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sync now"
          disabled={busy}
          onPress={() => void sync()}
          style={styles.search}
        >
          <Feather
            name="refresh-cw"
            size={20}
            color={theme.colors.textPrimary}
          />
          <Text style={styles.body}>{busy ? 'Syncing' : 'Sync now'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import device items"
          disabled={busy}
          style={styles.search}
          onPress={() =>
            Alert.alert(
              'Import device items?',
              `Add this device's guest tasks, notes and goals to ${session.user.email}? Existing account items will not be replaced.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Import', onPress: () => void sync(true) },
              ],
            )
          }
        >
          <Feather name="upload" size={20} color={theme.colors.textPrimary} />
          <Text style={styles.body}>Import device items</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};
