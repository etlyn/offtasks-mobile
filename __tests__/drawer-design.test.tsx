import React from 'react';
import { Alert } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SideDrawerContent } from '../src/components/navigation/SideDrawerContent';
import { supabaseClient } from '../src/lib/supabase';

let mockSession: any = null;
let mockDrawerStatus = 'open';
const mockPreferences = {
  themeMode: 'Light',
  movePastTasksToLater: false,
  setMovePastTasksToLater: jest.fn(),
  toggleTheme: jest.fn(),
};
const mockCleanup = {
  phase: null as string | null,
  busy: false,
  retry: jest.fn(),
};
jest.mock('../src/lib/accountDataCleanup', () => ({
  usePendingAccountCleanup: () => mockCleanup,
}));
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: mockSession }),
}));
jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({ totals: { all: 5, completed: 1 } }),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => mockPreferences,
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: { auth: { signOut: jest.fn(), getSession: jest.fn() } },
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({ reduceMotion: true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 62, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/drawer', () => ({
  useDrawerStatus: () => mockDrawerStatus,
}));
jest.mock('../src/screens/AccountScreen', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AccountScreen: ({ onBack }: { onBack: () => void }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back from account"
        onPress={onBack}
      >
        <Text>Account destination</Text>
      </Pressable>
    ),
  };
});
jest.mock('../src/analytics/AnalyticsPreferences', () => {
  const { Pressable, Text } = require('react-native');
  return {
    PrivacyScreen: ({ onBack }: { onBack: () => void }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back from privacy"
        onPress={onBack}
      >
        <Text>Privacy destination</Text>
      </Pressable>
    ),
  };
});
const navigation = { navigate: jest.fn(), closeDrawer: jest.fn() };
const props = { navigation, state: {}, descriptors: {} } as any;
beforeEach(() => {
  jest.clearAllMocks();
  mockSession = null;
  mockDrawerStatus = 'open';
  mockPreferences.themeMode = 'Light';
  mockCleanup.phase = null;
});

test('account and privacy stay local to the drawer; back retains the menu', () => {
  render(<SideDrawerContent {...props} />);
  expect(screen.getByText('On this device')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Sign in for sync' }));
  expect(screen.getByText('Account destination')).toBeOnTheScreen();
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(navigation.closeDrawer).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Back from account'));
  fireEvent.press(screen.getByRole('button', { name: 'Privacy & analytics' }));
  expect(screen.getByText('Privacy destination')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Back from privacy'));
  fireEvent.press(screen.getByRole('button', { name: 'Statistics' }));
  expect(navigation.navigate).toHaveBeenCalledWith('Dashboard', {
    screen: 'Statistics',
  });
  fireEvent.press(screen.getByLabelText('Close menu'));
  expect(navigation.closeDrawer).toHaveBeenCalledTimes(2);
});

test('return to Later consent stays off when canceled and cannot apply to another owner', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const view = render(<SideDrawerContent {...props} />);
  fireEvent(
    screen.getByLabelText('Automatically return past tasks to Later'),
    'valueChange',
    true,
  );
  expect(mockPreferences.setMovePastTasksToLater).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2];
  expect(alert.mock.calls[0][1]).toContain(
    'Turning this off won’t restore those dates',
  );
  buttons?.find(button => button.text === 'Cancel')?.onPress?.();
  expect(mockPreferences.setMovePastTasksToLater).not.toHaveBeenCalled();
  mockSession = { user: { id: 'new-owner', email: 'new@example.com' } };
  view.rerender(<SideDrawerContent {...props} />);
  buttons?.find(button => button.text === 'Enable')?.onPress?.();
  expect(mockPreferences.setMovePastTasksToLater).not.toHaveBeenCalled();
  fireEvent(
    screen.getByLabelText('Automatically return past tasks to Later'),
    'valueChange',
    true,
  );
  alert.mock.calls[1][2]?.find(button => button.text === 'Enable')?.onPress?.();
  expect(mockPreferences.setMovePastTasksToLater).toHaveBeenCalledWith(true);
  alert.mockRestore();
});

test('appearance offers explicit light and dark selection; deletion lives inside account', () => {
  mockSession = {
    user: {
      id: 'owner',
      email: 'person@example.com',
      user_metadata: { full_name: 'Person' },
    },
  };
  render(<SideDrawerContent {...props} />);
  expect(screen.getByText('Person')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Light mode'));
  expect(mockPreferences.toggleTheme).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Dark mode'));
  expect(mockPreferences.toggleTheme).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole('button', { name: 'Delete Offtasks data' }),
  ).toBeNull();
  fireEvent.press(screen.getByLabelText('Account and sync'));
  expect(screen.getByText('Account destination')).toBeOnTheScreen();
});

test('failed sign-out is inline, retryable, and keeps the drawer open', async () => {
  mockSession = { user: { id: 'owner', email: 'person@example.com' } };
  (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: mockSession },
    error: null,
  });
  (supabaseClient.auth.signOut as jest.Mock)
    .mockResolvedValueOnce({ error: new Error('Offline') })
    .mockResolvedValueOnce({ error: null });
  render(<SideDrawerContent {...props} />);
  fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() =>
    expect(screen.getByText('Couldn’t sign out')).toBeOnTheScreen(),
  );
  expect(navigation.closeDrawer).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(navigation.closeDrawer).toHaveBeenCalledTimes(1));
});

test('a changed authenticated account is never signed out by a stale action', async () => {
  mockSession = { user: { id: 'owner', email: 'person@example.com' } };
  (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: { id: 'other-owner' } } },
    error: null,
  });
  render(<SideDrawerContent {...props} />);
  fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() =>
    expect(screen.getByText('Couldn’t sign out')).toBeOnTheScreen(),
  );
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});

test('guest cleanup retries only cleanup and gates sign-in until finished', async () => {
  mockCleanup.phase = 'confirmed';
  mockCleanup.retry.mockResolvedValue(undefined);
  render(<SideDrawerContent {...props} />);
  expect(screen.getByText('Offtasks data deleted')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Sign in for sync' }),
  ).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Retry device cleanup' }));
  await waitFor(() => expect(mockCleanup.retry).toHaveBeenCalledTimes(1));
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});

test('a session change while sign-out preflight is pending blocks the stale sign-out', async () => {
  mockSession = { user: { id: 'owner', email: 'person@example.com' } };
  const original = mockSession;
  let resolve: (value: unknown) => void = () => {};
  (supabaseClient.auth.getSession as jest.Mock).mockReturnValue(
    new Promise(done => {
      resolve = done;
    }),
  );
  const view = render(<SideDrawerContent {...props} />);
  fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  mockSession = {
    user: { id: 'replacement', email: 'replacement@example.com' },
  };
  view.rerender(<SideDrawerContent {...props} />);
  resolve({ data: { session: original }, error: null });
  await waitFor(() =>
    expect(screen.getByText('replacement@example.com')).toBeOnTheScreen(),
  );
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});
