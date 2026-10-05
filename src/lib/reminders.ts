import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Task } from '@/types/task';

import type { ScheduledReminder } from './reminderScheduler';

export interface ReminderEntry {
  /** ISO timestamp the reminder should fire at. */
  at: string;
  /** Task text shown in the notification. */
  content: string;
  /** When the entry was written; protects tasks that are still syncing. */
  touchedAt: number;
}

export type ReminderMap = Record<string, ReminderEntry>;

export const NEW_REMINDER_GRACE_MS = 60_000;

export const remindersKey = (owner: string) =>
  `@offtasks/reminders:v1:${encodeURIComponent(owner)}`;

const isEntry = (value: unknown): value is ReminderEntry =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as ReminderEntry).at === 'string' &&
  !Number.isNaN(Date.parse((value as ReminderEntry).at)) &&
  typeof (value as ReminderEntry).content === 'string' &&
  typeof (value as ReminderEntry).touchedAt === 'number';

export async function readReminders(owner: string): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(remindersKey(owner));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(([, entry]) => isEntry(entry)),
    );
  } catch (error) {
    console.warn('Reminders could not be read', error);
    return {};
  }
}

export const writeReminders = (owner: string, reminders: ReminderMap) =>
  AsyncStorage.setItem(remindersKey(owner), JSON.stringify(reminders));

export const reminderTime = (entry: ReminderEntry) => Date.parse(entry.at);

export const isUpcoming = (entry: ReminderEntry, now = Date.now()) =>
  reminderTime(entry) > now;

/**
 * Drops reminders that have fired, belong to finished or deleted tasks, and
 * refreshes the notification text when a task was renamed. Returns the same
 * object when nothing changed so callers can skip a write.
 */
export function reconcileReminders(
  reminders: ReminderMap,
  tasks: Pick<Task, 'id' | 'content' | 'isComplete'>[],
  now = Date.now(),
): ReminderMap {
  const byId = new Map(tasks.map(task => [task.id, task]));
  let changed = false;
  const next: ReminderMap = {};
  for (const [taskId, entry] of Object.entries(reminders)) {
    const task = byId.get(taskId);
    const syncing = !task && now - entry.touchedAt < NEW_REMINDER_GRACE_MS;
    if (!isUpcoming(entry, now) || task?.isComplete || (!task && !syncing)) {
      changed = true;
      continue;
    }
    if (task && task.content !== entry.content) {
      changed = true;
      next[taskId] = { ...entry, content: task.content };
    } else {
      next[taskId] = entry;
    }
  }
  return changed ? next : reminders;
}

export const toScheduledReminders = (
  reminders: ReminderMap,
  now = Date.now(),
): ScheduledReminder[] =>
  Object.entries(reminders)
    .filter(([, entry]) => isUpcoming(entry, now))
    .map(([id, entry]) => ({
      id,
      title: 'Reminder',
      body: entry.content,
      fireAt: reminderTime(entry),
    }));

const roundUpToQuarterHour = (value: Date) => {
  const result = new Date(value);
  result.setSeconds(0, 0);
  const remainder = result.getMinutes() % 15;
  result.setMinutes(result.getMinutes() + (remainder ? 15 - remainder : 0));
  return result;
};

/**
 * Starting point for the picker: a calm morning slot on the task's day, or the
 * next hour for today and undated tasks.
 */
export function defaultReminderDate(
  taskDate: string | null | undefined,
  now = new Date(),
): Date {
  const soon = roundUpToQuarterHour(new Date(now.getTime() + 60 * 60 * 1000));
  if (taskDate) {
    const morning = new Date(`${taskDate}T09:00:00`);
    if (!Number.isNaN(morning.getTime()) && morning.getTime() > now.getTime()) {
      return morning;
    }
  }
  return soon;
}

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

export function formatReminder(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  const dayOffset = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );
  if (dayOffset === 0) return `Today, ${time}`;
  if (dayOffset === 1) return `Tomorrow, ${time}`;
  const day = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  }).format(date);
  return `${day}, ${time}`;
}
