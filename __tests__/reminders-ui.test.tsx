import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, Text } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { TaskComposerModal } from '../src/features/dashboard/components/TaskComposerModal';
import {
  RemindersProvider,
  useReminders,
} from '../src/providers/RemindersProvider';
import { TaskList } from '../src/components/task-quick-list';
import { remindersKey } from '../src/lib/reminders';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: null }),
}));
let mockTasks: { id: string; content: string; isComplete: boolean }[] = [];
let mockLoaded = true;
jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({
    tasks: { today: mockTasks, tomorrow: [], upcoming: [], close: [] },
    loaded: mockLoaded,
  }),
}));
const mockReplace = jest.fn().mockResolvedValue(undefined);
const mockPermission = jest.fn();
jest.mock('../src/lib/reminderScheduler', () => ({
  isReminderSchedulingSupported: () => true,
  replaceScheduledReminders: (...args: unknown[]) => mockReplace(...args),
  getReminderPermission: () => mockPermission(),
  requestReminderPermission: async () => 'granted',
}));

const renderSettled = async (ui: React.ReactElement) => {
  const view = render(ui);
  await act(async () => {
    await new Promise<void>(resolve => setImmediate(resolve));
  });
  return view;
};

const future = (hours: number) => new Date(Date.now() + hours * 3_600_000);

let api: ReturnType<typeof useReminders>;
const Probe = () => {
  api = useReminders();
  return <Text>{api.getReminder('t1') ?? 'none'}</Text>;
};
const mountProvider = () =>
  renderSettled(
    <RemindersProvider>
      <Probe />
    </RemindersProvider>,
  );
const lastSchedule = () => mockReplace.mock.calls.at(-1)?.[0];

beforeEach(async () => {
  await AsyncStorage.clear();
  mockReplace.mockClear();
  mockPermission.mockReset().mockResolvedValue('granted');
  mockTasks = [{ id: 't1', content: 'Call Sam', isComplete: false }];
  mockLoaded = true;
});
afterEach(() => jest.restoreAllMocks());

test('setting a reminder persists it, schedules it natively, and shows it to rows', async () => {
  const view = await mountProvider();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith([]));
  const at = future(2).toISOString();
  await act(() => api.setReminder('t1', at, 'Call Sam'));
  expect(lastSchedule()).toEqual([
    expect.objectContaining({ id: 't1', body: 'Call Sam' }),
  ]);
  expect(screen.getByText(at)).toBeTruthy();
  view.unmount();

  await mountProvider();
  await waitFor(() => expect(screen.getByText(at)).toBeTruthy());
});

test('completing or renaming a task updates its scheduled reminder', async () => {
  const at = future(2).toISOString();
  const view = await mountProvider();
  await act(() => api.setReminder('t1', at, 'Call Sam'));

  mockTasks = [{ id: 't1', content: 'Call Samuel', isComplete: false }];
  view.rerender(
    <RemindersProvider>
      <Probe />
    </RemindersProvider>,
  );
  await waitFor(() =>
    expect(lastSchedule()).toEqual([
      expect.objectContaining({ body: 'Call Samuel' }),
    ]),
  );

  mockTasks = [{ id: 't1', content: 'Call Samuel', isComplete: true }];
  view.rerender(
    <RemindersProvider>
      <Probe />
    </RemindersProvider>,
  );
  await waitFor(() => expect(lastSchedule()).toEqual([]));
  expect(screen.getByText('none')).toBeTruthy();
});

test('deleting a task cancels its reminder once it is no longer syncing', async () => {
  const at = future(2).toISOString();
  await AsyncStorage.setItem(
    remindersKey('device-guest'),
    JSON.stringify({ t1: { at, content: 'Call Sam', touchedAt: 0 } }),
  );
  mockTasks = [];
  await mountProvider();
  await waitFor(() => expect(lastSchedule()).toEqual([]));
  expect(screen.getByText('none')).toBeTruthy();
});

test('nothing is pruned or cancelled before the first task load finishes', async () => {
  mockTasks = [];
  mockLoaded = false;
  const at = future(2).toISOString();
  const view = await mountProvider();
  await act(() => api.setReminder('t1', at, 'Call Sam'));
  mockLoaded = true;
  view.rerender(
    <RemindersProvider>
      <Probe />
    </RemindersProvider>,
  );
  // Fresh reminders for a task that has not synced yet survive a load.
  expect(screen.getByText(at)).toBeTruthy();
});

test('permission is requested only when needed and denial opens Settings help', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await mountProvider();
  expect(await api.ensurePermission()).toBe(true);
  mockPermission.mockResolvedValue('denied');
  expect(await api.ensurePermission()).toBe(false);
  expect(alert).toHaveBeenCalledWith(
    'Notifications are off',
    expect.any(String),
    expect.arrayContaining([
      expect.objectContaining({ text: 'Open Settings' }),
    ]),
  );
});

test('task rows show an upcoming reminder quietly and hide it once complete', async () => {
  const at = future(3).toISOString();
  const rows = (isComplete: boolean) => (
    <RemindersProvider>
      <TaskList
        tasks={
          [
            {
              id: 't1',
              user_id: 'u',
              content: 'Call Sam',
              isComplete,
              priority: 0,
              target_group: 'today',
              date: null,
            },
          ] as never
        }
        onToggle={async () => undefined}
      />
      <Probe />
    </RemindersProvider>
  );
  const view = await renderSettled(rows(false));
  expect(screen.queryByTestId('task-reminder-t1')).toBeNull();
  await act(() => api.setReminder('t1', at, 'Call Sam'));
  expect(screen.getByTestId('task-reminder-t1')).toBeTruthy();
  view.rerender(rows(true));
  expect(screen.queryByTestId('task-reminder-t1')).toBeNull();
});

describe('composer reminder step', () => {
  const composer = (
    props: Partial<React.ComponentProps<typeof TaskComposerModal>> = {},
  ) => ({
    visible: true,
    onClose: jest.fn(),
    insetTop: 48,
    insetBottom: 34,
    newTaskContent: 'Plan trip',
    onChangeTaskContent: jest.fn(),
    onChangeGroup: jest.fn(),
    priorityOptions: [],
    onSelectPriority: jest.fn(),
    selectedPriority: 0,
    selectedCategory: null,
    onClearCategory: jest.fn(),
    submitting: false,
    onSubmit: jest.fn(),
    categoryQuery: '',
    onCategoryQueryChange: jest.fn(),
    filteredCategories: [],
    canCreateCategory: false,
    onCreateCategory: jest.fn(),
    onSelectCategory: jest.fn(),
    onDeleteCategory: jest.fn(),
    categoryPendingDelete: null,
    onCancelDeleteCategory: jest.fn(),
    onConfirmDeleteCategory: jest.fn(),
    selectedDate: '2099-03-18',
    onChangeDate: jest.fn(),
    onChangeReminder: jest.fn(),
    ...props,
  });
  const open = async (props: ReturnType<typeof composer>) => {
    const view = await renderSettled(
      <RemindersProvider>
        <TaskComposerModal {...props} />
      </RemindersProvider>,
    );
    fireEvent.press(screen.getByLabelText('Choose task reminder'));
    return view;
  };

  test('is optional and hidden when the page does not support reminders', async () => {
    await renderSettled(
      <RemindersProvider>
        <TaskComposerModal {...composer({ onChangeReminder: undefined })} />
      </RemindersProvider>,
    );
    expect(screen.queryByLabelText('Choose task reminder')).toBeNull();
  });

  test('starts at 9 AM on the task day and stages changes until Done', async () => {
    const props = composer();
    const view = await open(props);
    const wheel = view.UNSAFE_getByType(DateTimePicker);
    expect(wheel.props.mode).toBe('datetime');
    expect(wheel.props.display).toBe('spinner');
    expect(wheel.props.value).toEqual(new Date(2099, 2, 18, 9, 0));
    const chosen = future(5);
    fireEvent(wheel, 'change', { type: 'set' }, chosen);
    expect(props.onChangeReminder).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Set reminder'));
    await waitFor(() =>
      expect(props.onChangeReminder).toHaveBeenCalledWith(chosen.toISOString()),
    );
    expect(screen.getByLabelText('Task content').props.value).toBe('Plan trip');
  });

  test('rejects a time in the past and does not ask for permission', async () => {
    const alert = jest
      .spyOn(Alert, 'alert')
      .mockImplementation(() => undefined);
    const props = composer();
    const view = await open(props);
    fireEvent(
      view.UNSAFE_getByType(DateTimePicker),
      'change',
      { type: 'set' },
      new Date(Date.now() - 60_000),
    );
    fireEvent.press(screen.getByLabelText('Set reminder'));
    expect(alert).toHaveBeenCalledWith(
      'Choose a later time',
      expect.any(String),
    );
    expect(props.onChangeReminder).not.toHaveBeenCalled();
    expect(mockPermission).not.toHaveBeenCalled();
  });

  test('stays in the step when notifications are denied', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockPermission.mockResolvedValue('denied');
    const props = composer();
    await open(props);
    fireEvent.press(screen.getByLabelText('Set reminder'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(props.onChangeReminder).not.toHaveBeenCalled();
    expect(screen.getByTestId('task-reminder-step')).toBeTruthy();
  });

  test('shows an existing reminder on the chip and can remove it', async () => {
    const at = future(26).toISOString();
    const props = composer({ selectedReminder: at });
    await open(props);
    fireEvent.press(screen.getByLabelText('No reminder'));
    expect(props.onChangeReminder).toHaveBeenCalledWith(null);
    expect(screen.queryByTestId('task-reminder-step')).toBeNull();
  });
});
