import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Linking } from 'react-native';

import { GUEST_ID } from '@/lib/localTasks';
import {
  getReminderPermission,
  isReminderSchedulingSupported,
  replaceScheduledReminders,
  requestReminderPermission,
} from '@/lib/reminderScheduler';
import {
  isUpcoming,
  readReminders,
  reconcileReminders,
  reminderTime,
  toScheduledReminders,
  writeReminders,
  type ReminderMap,
} from '@/lib/reminders';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';

interface RemindersContextValue {
  supported: boolean;
  /** Upcoming reminder time (ISO) for a task, if one is set. */
  getReminder: (taskId: string) => string | null;
  setReminder: (
    taskId: string,
    at: string | null,
    content: string,
  ) => Promise<void>;
  /** Asks for notification permission when needed; false if unavailable. */
  ensurePermission: () => Promise<boolean>;
}

const RemindersContext = createContext<RemindersContextValue>({
  supported: false,
  getReminder: () => null,
  setReminder: async () => undefined,
  ensurePermission: async () => false,
});

const MAX_TIMER_MS = 2 ** 31 - 1;

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const owner = useAuth().session?.user.id || GUEST_ID;
  const { tasks, loaded } = useTasks();
  const supported = isReminderSchedulingSupported();
  const [reminders, setReminders] = useState<ReminderMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [clock, setClock] = useState(0);
  const remindersRef = useRef(reminders);
  remindersRef.current = reminders;

  const hydration = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    hydration.current = readReminders(owner).then(stored => {
      if (!active) return;
      remindersRef.current = stored;
      setReminders(stored);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [owner]);

  const commit = useCallback(
    async (next: ReminderMap) => {
      remindersRef.current = next;
      setReminders(next);
      await writeReminders(owner, next);
    },
    [owner],
  );

  useEffect(() => {
    if (!hydrated || !loaded) return;
    const allTasks = Object.values(tasks).flat();
    const next = reconcileReminders(remindersRef.current, allTasks);
    if (next !== remindersRef.current) {
      commit(next).catch(error =>
        console.warn('Reminders could not be saved', error),
      );
    }
  }, [commit, hydrated, loaded, tasks]);

  useEffect(() => {
    if (!hydrated || !supported) return;
    replaceScheduledReminders(toScheduledReminders(reminders)).catch(error =>
      console.warn('Reminders could not be scheduled', error),
    );
  }, [hydrated, reminders, supported]);

  // Re-render rows and prune once the next reminder has fired.
  useEffect(() => {
    const upcoming = Object.values(reminders)
      .filter(entry => isUpcoming(entry))
      .map(reminderTime);
    if (upcoming.length === 0) return;
    const delay = Math.min(
      Math.min(...upcoming) - Date.now() + 1000,
      MAX_TIMER_MS,
    );
    const timer = setTimeout(() => {
      const next = reconcileReminders(
        remindersRef.current,
        Object.values(tasks).flat(),
      );
      if (next !== remindersRef.current) {
        commit(next).catch(() => undefined);
      }
      setClock(value => value + 1);
    }, Math.max(delay, 0));
    return () => clearTimeout(timer);
  }, [commit, reminders, tasks]);

  const getReminder = useCallback(
    (taskId: string) => {
      const entry = reminders[taskId];
      return entry && isUpcoming(entry) ? entry.at : null;
    },
    // `clock` ticks when a reminder fires so rows stop showing it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reminders, clock],
  );

  const setReminder = useCallback(
    async (taskId: string, at: string | null, content: string) => {
      // Never overwrite stored reminders that have not been read yet.
      await hydration.current;
      const next = { ...remindersRef.current };
      if (at) next[taskId] = { at, content, touchedAt: Date.now() };
      else delete next[taskId];
      await commit(next);
    },
    [commit],
  );

  const ensurePermission = useCallback(async () => {
    if (!supported) return false;
    let status = await getReminderPermission();
    if (status === 'undetermined') status = await requestReminderPermission();
    if (status === 'granted') return true;
    Alert.alert(
      'Notifications are off',
      'Allow notifications for Offtasks in Settings to get reminders.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }, [supported]);

  const value = useMemo(
    () => ({ supported, getReminder, setReminder, ensurePermission }),
    [supported, getReminder, setReminder, ensurePermission],
  );

  return (
    <RemindersContext.Provider value={value}>
      {children}
    </RemindersContext.Provider>
  );
}

export const useReminders = () => useContext(RemindersContext);
