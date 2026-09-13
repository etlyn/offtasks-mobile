import React from 'react';
import { Alert } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SideDrawerContent } from '../src/components/navigation/SideDrawerContent';
import { createStyles } from '../src/components/navigation/SideDrawerContent.styles';
import { getAppTheme } from '../src/theme/colors';
import { deleteAccount, supabaseClient } from '../src/lib/supabase';

let mockSession: any = null;
let mockTotals = { all: 5, completed: 1 };
const mockPreferences = {
  themeMode: 'Light',
  hideCompleted: false,
  advancedMode: false,
  autoArrange: false,
  movePastTasksToLater: false,
  setMovePastTasksToLater: jest.fn(),
  toggleTheme: jest.fn(),
  setHideCompleted: jest.fn(),
  setAdvancedMode: jest.fn(),
  setAutoArrange: jest.fn(),
};
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: mockSession }),
}));
jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({ totals: mockTotals }),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => mockPreferences,
}));
jest.mock('../src/lib/supabase', () => ({
  deleteAccount: jest.fn(),
  supabaseClient: { auth: { signOut: jest.fn() } },
}));
jest.mock('../src/lib/plannerSync', () => ({ clearPlanner: jest.fn() }));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({ reduceMotion: true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/drawer', () => ({
  DrawerContentScrollView: require('react-native').ScrollView,
}));

const navigation = { navigate: jest.fn(), closeDrawer: jest.fn() };
const props = { navigation, state: {}, descriptors: {} } as any;
beforeEach(() => {
  jest.clearAllMocks();
  mockSession = null;
  mockTotals = { all: 5, completed: 1 };
  mockPreferences.themeMode = 'Light';
});

test('single sign-in row opens Account; statistics opens its destination; close preserves the page', () => {
  render(<SideDrawerContent {...props} />);
  fireEvent.press(screen.getByRole('button', { name: 'Sign in for sync' }));
  expect(navigation.navigate).toHaveBeenLastCalledWith('Dashboard', {
    screen: 'Account',
  });
  expect(
    screen.getAllByRole('button', { name: 'Sign in for sync' }),
  ).toHaveLength(1);
  fireEvent.press(screen.getByRole('button', { name: 'Statistics' }));
  expect(navigation.navigate).toHaveBeenLastCalledWith('Dashboard', {
    screen: 'Statistics',
  });
  expect(screen.getByText('1/5')).toBeOnTheScreen();
  navigation.navigate.mockClear();
  fireEvent.press(screen.getByRole('button', { name: 'Close menu' }));
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(navigation.closeDrawer).toHaveBeenCalledTimes(3);
  expect(screen.queryByRole('button', { name: 'Delete account' })).toBeNull();
});

test('drawer has only icon theme controls and a confirmed opt-in return to Later', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<SideDrawerContent {...props} />);
  for (const label of [
    'Hide completed',
    'Advanced mode',
    'Auto-move due tasks',
  ])
    expect(screen.queryByText(label)).toBeNull();
  expect(screen.queryByText('Dark mode')).toBeNull();
  fireEvent.press(screen.getByLabelText('Dark mode'));
  expect(mockPreferences.toggleTheme).toHaveBeenCalledTimes(1);
  fireEvent(
    screen.getByLabelText('Automatically return past tasks to Later'),
    'valueChange',
    true,
  );
  expect(mockPreferences.setMovePastTasksToLater).not.toHaveBeenCalled();
  alert.mock.calls[0][2]?.find(button => button.text === 'Enable')?.onPress?.();
  expect(mockPreferences.setMovePastTasksToLater).toHaveBeenCalledWith(true);
  alert.mockRestore();
});

test('dark mode uses the approved brand and empty statistics do not display a misleading fraction', () => {
  mockPreferences.themeMode = 'Dark';
  mockTotals = { all: 0, completed: 0 };
  render(<SideDrawerContent {...props} />);
  expect(
    screen.getByLabelText('Dark mode').props.accessibilityState.checked,
  ).toBe(true);
  expect(screen.queryByText('0/0')).toBeNull();
  const styles = createStyles(getAppTheme('Dark'));
  expect(styles.rowLabel.fontSize).toBe(15);
  expect(styles.closeTarget).toMatchObject({ width: 44, height: 44 });
  expect(styles.rowBody).not.toHaveProperty('height');
  expect(styles.controlsSurface).not.toHaveProperty('backgroundColor');
});

test('signed-in account remains reachable and deletion still requires explicit destructive confirmation', () => {
  mockSession = {
    user: {
      id: 'test-user',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    },
  };
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<SideDrawerContent {...props} />);
  expect(screen.getByText('Test User')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Account and sync' }));
  expect(navigation.navigate).toHaveBeenCalledWith('Dashboard', {
    screen: 'Account',
  });
  fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
  expect(alert).toHaveBeenCalledWith(
    'Delete account',
    expect.stringContaining('cannot be undone'),
    expect.arrayContaining([
      expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
      expect.objectContaining({ text: 'Delete Account', style: 'destructive' }),
    ]),
    { cancelable: true },
  );
  expect(deleteAccount).not.toHaveBeenCalled();
  alert.mockRestore();
});

test('failed sign-out reports an error without dismissing the drawer', async () => {
  mockSession = { user: { id: 'test-user', email: 'test@example.com' } };
  (supabaseClient.auth.signOut as jest.Mock).mockResolvedValue({
    error: new Error('Offline'),
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<SideDrawerContent {...props} />);
  fireEvent.press(screen.getByRole('button', { name: 'Log out' }));
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith('Sign out failed', 'Offline'),
  );
  expect(navigation.closeDrawer).not.toHaveBeenCalled();
  alert.mockRestore();
});

test('compact drawer has top appearance controls, no wordmark, and account actions below', () => {
  render(<SideDrawerContent {...props} />);
  const controls = screen
    .getAllByRole('button')
    .map(node => node.props.accessibilityLabel);
  expect(controls.indexOf('Statistics')).toBeLessThan(
    controls.indexOf('Sign in for sync'),
  );
  expect(screen.queryByText('Preferences')).toBeNull();
  expect(screen.queryByText('offtasks.')).toBeNull();
  expect(screen.getByText('Sign in for sync')).toBeOnTheScreen();
  expect(screen.getByText('Unfinished past tasks')).toBeOnTheScreen();
  const styles = createStyles(getAppTheme('Light'));
  expect(styles.themeTarget).toMatchObject({ width: 44, height: 44 });
  expect(screen.getByTestId('drawer-theme-track')).toHaveStyle({
    height: 32,
    width: 88,
  });
  expect(styles.themeSelected).toMatchObject({
    height: 28,
    width: 40,
    top: 8,
    left: 2,
  });
  expect(styles.accountAction).toMatchObject({ minHeight: 44 });
  expect(styles.switchTarget).toMatchObject({ width: 44, minHeight: 44 });
  expect(styles.rowBody).not.toHaveProperty('borderBottomWidth');
});
