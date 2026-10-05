import { NativeModules, Platform } from 'react-native';

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

export interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  fireAt: number;
}

interface OfftasksRemindersNative {
  getPermissionStatus: () => Promise<ReminderPermission>;
  requestPermission: () => Promise<ReminderPermission>;
  replaceReminders: (items: ScheduledReminder[]) => Promise<number>;
}

const nativeModule = NativeModules.OfftasksReminders as
  | OfftasksRemindersNative
  | undefined;

// iOS caps an app at 64 pending local notifications; keep headroom.
export const MAX_SCHEDULED_REMINDERS = 60;

export const isReminderSchedulingSupported = () =>
  Platform.OS === 'ios' && !!nativeModule?.replaceReminders;

export const getReminderPermission = async (): Promise<ReminderPermission> => {
  if (!isReminderSchedulingSupported() || !nativeModule) return 'denied';
  return nativeModule.getPermissionStatus();
};

export const requestReminderPermission =
  async (): Promise<ReminderPermission> => {
    if (!isReminderSchedulingSupported() || !nativeModule) return 'denied';
    return nativeModule.requestPermission();
  };

// Native replacement is not transactional, so calls are serialized.
let queue: Promise<unknown> = Promise.resolve();

export const replaceScheduledReminders = (
  items: ScheduledReminder[],
): Promise<void> => {
  if (!isReminderSchedulingSupported() || !nativeModule) {
    return Promise.resolve();
  }
  const upcoming = [...items]
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, MAX_SCHEDULED_REMINDERS);
  const operation = queue
    .catch(() => undefined)
    .then(() => nativeModule.replaceReminders(upcoming))
    .then(() => undefined);
  queue = operation;
  return operation;
};
