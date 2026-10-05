const replaceReminders = jest.fn();

const load = (os: 'ios' | 'android', native: unknown) => {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    Platform: { OS: os },
    NativeModules: { OfftasksReminders: native },
  }));
  return require('../src/lib/reminderScheduler');
};

beforeEach(() => {
  replaceReminders.mockReset().mockResolvedValue(0);
});

test('scheduling is unavailable without the iOS native module', async () => {
  const android = load('android', { replaceReminders });
  expect(android.isReminderSchedulingSupported()).toBe(false);
  await android.replaceScheduledReminders([
    { id: 'a', title: 'Reminder', body: 'x', fireAt: 1 },
  ]);
  expect(replaceReminders).not.toHaveBeenCalled();
  expect(await android.getReminderPermission()).toBe('denied');
  expect(load('ios', undefined).isReminderSchedulingSupported()).toBe(false);
});

test('only the soonest reminders fit the iOS pending limit, in order', async () => {
  const scheduler = load('ios', { replaceReminders });
  const items = Array.from({ length: 70 }, (_, index) => ({
    id: String(index),
    title: 'Reminder',
    body: 'x',
    fireAt: 70 - index,
  }));
  await scheduler.replaceScheduledReminders(items);
  const sent = replaceReminders.mock.calls[0][0];
  expect(sent).toHaveLength(scheduler.MAX_SCHEDULED_REMINDERS);
  expect(sent[0].fireAt).toBe(1);
  expect(sent[59].fireAt).toBe(60);
});

test('replacements run one at a time and survive an earlier failure', async () => {
  const scheduler = load('ios', { replaceReminders });
  const order: string[] = [];
  let release: () => void = () => undefined;
  replaceReminders
    .mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          order.push('first-start');
          release = () => {
            order.push('first-fail');
            reject(new Error('native'));
          };
        }),
    )
    .mockImplementationOnce(async () => {
      order.push('second');
      return 1;
    });
  const first = scheduler.replaceScheduledReminders([]);
  const second = scheduler.replaceScheduledReminders([]);
  await new Promise<void>(resolve => setImmediate(resolve));
  expect(order).toEqual(['first-start']);
  release();
  await expect(first).rejects.toThrow('native');
  await second;
  expect(order).toEqual(['first-start', 'first-fail', 'second']);
});
