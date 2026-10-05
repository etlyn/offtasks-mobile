import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NEW_REMINDER_GRACE_MS,
  defaultReminderDate,
  formatReminder,
  readReminders,
  reconcileReminders,
  remindersKey,
  toScheduledReminders,
  writeReminders,
  type ReminderMap,
} from '../src/lib/reminders';

const NOW = new Date(2027, 2, 18, 10, 20).getTime();
const entry = (
  minutesFromNow: number,
  content = 'Call Sam',
  touchedAt = 0,
) => ({
  at: new Date(NOW + minutesFromNow * 60_000).toISOString(),
  content,
  touchedAt,
});
const task = (id: string, content = 'Call Sam', isComplete = false) => ({
  id,
  content,
  isComplete,
});

beforeEach(() => AsyncStorage.clear());

test('reconcile keeps upcoming reminders for open tasks and returns the same object', () => {
  const reminders: ReminderMap = { a: entry(30) };
  expect(reconcileReminders(reminders, [task('a')], NOW)).toBe(reminders);
});

test('reconcile drops fired, completed, and deleted-task reminders', () => {
  const reminders: ReminderMap = {
    fired: entry(-5),
    done: entry(30),
    gone: entry(30),
    open: entry(30),
  };
  const next = reconcileReminders(
    reminders,
    [task('fired'), task('done', 'x', true), task('open')],
    NOW,
  );
  expect(Object.keys(next)).toEqual(['open']);
});

test('reconcile follows task renames and spares a task that is still syncing', () => {
  const reminders: ReminderMap = {
    renamed: entry(30, 'Old name'),
    syncing: entry(30, 'New', NOW - 1000),
    stale: entry(30, 'Old', NOW - NEW_REMINDER_GRACE_MS - 1),
  };
  const next = reconcileReminders(
    reminders,
    [task('renamed', 'New name')],
    NOW,
  );
  expect(next.renamed.content).toBe('New name');
  expect(next.syncing).toBeDefined();
  expect(next.stale).toBeUndefined();
});

test('only upcoming reminders are scheduled, using the task text', () => {
  expect(
    toScheduledReminders({ a: entry(30, 'Pay rent'), b: entry(-1) }, NOW),
  ).toEqual([
    {
      id: 'a',
      title: 'Reminder',
      body: 'Pay rent',
      fireAt: NOW + 30 * 60_000,
    },
  ]);
});

test('default reminder suggests 9 AM on a future task day, else the next quarter hour after an hour', () => {
  const now = new Date(2027, 2, 18, 10, 20);
  expect(defaultReminderDate('2027-03-20', now)).toEqual(
    new Date(2027, 2, 20, 9, 0),
  );
  expect(defaultReminderDate('2027-03-18', now)).toEqual(
    new Date(2027, 2, 18, 11, 30),
  );
  expect(defaultReminderDate(null, now)).toEqual(new Date(2027, 2, 18, 11, 30));
});

test('reminders read as today, tomorrow, or a dated label', () => {
  const now = new Date(2027, 2, 18, 10, 20);
  const time = (value: Date) =>
    new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(value);
  const today = new Date(2027, 2, 18, 17, 5);
  const tomorrow = new Date(2027, 2, 19, 8, 0);
  const later = new Date(2027, 3, 2, 8, 0);
  expect(formatReminder(today.toISOString(), now)).toBe(
    `Today, ${time(today)}`,
  );
  expect(formatReminder(tomorrow.toISOString(), now)).toBe(
    `Tomorrow, ${time(tomorrow)}`,
  );
  expect(formatReminder(later.toISOString(), now)).toContain(time(later));
  expect(formatReminder(later.toISOString(), now)).not.toMatch(
    /Today|Tomorrow/,
  );
});

test('storage is scoped per workspace and ignores corrupt data', async () => {
  const reminders: ReminderMap = { a: entry(30) };
  await writeReminders('owner-1', reminders);
  expect(await readReminders('owner-1')).toEqual(reminders);
  expect(await readReminders('owner-2')).toEqual({});
  await AsyncStorage.setItem(remindersKey('owner-1'), '{not json');
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  expect(await readReminders('owner-1')).toEqual({});
  await AsyncStorage.setItem(
    remindersKey('owner-1'),
    JSON.stringify({ ok: entry(30), bad: { at: 'nope' } }),
  );
  expect(Object.keys(await readReminders('owner-1'))).toEqual(['ok']);
});
