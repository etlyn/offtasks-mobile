import React from 'react';
import { Alert } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { AccountScreen } from '../src/screens/AccountScreen';
import { deleteAccount, supabaseClient } from '../src/lib/supabase';
import { plannerSyncProblem } from '../src/lib/plannerSync';
import {
  beginAccountDataDeletion,
  confirmAccountDataDeletion,
  clearRequestedAccountDeletion,
  loadPendingAccountCleanup,
  retryPendingAccountCleanup,
} from '../src/lib/accountDataCleanup';

let mockSession: any;
const mockRefresh = jest.fn();
const mockBack = jest.fn();
const mockCleanup: {
  owner: string | null;
  phase: 'requested' | 'confirmed' | null;
  ready: boolean;
  busy: boolean;
  error: string;
} = {
  owner: null,
  phase: null,
  ready: true,
  busy: false,
  error: '',
};
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: mockSession, finishGuestImportReview: jest.fn() }),
}));
jest.mock('../src/providers/TasksProvider', () => ({
  useTasks: () => ({ refresh: mockRefresh, error: null }),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ canGoBack: () => true, goBack: mockBack }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 62, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    animateLayout: jest.fn(),
    reduceMotion: true,
  }),
}));
jest.mock('../src/lib/plannerSync', () => ({
  readPlanner: jest.fn().mockResolvedValue([]),
  syncPlanner: jest.fn().mockResolvedValue(undefined),
  plannerSyncProblem: jest.fn().mockReturnValue(null),
  subscribePlanner: () => () => {},
}));
jest.mock('../src/lib/localTasks', () => ({
  GUEST_ID: 'device-guest',
  readLocalTasks: jest.fn().mockResolvedValue([]),
}));
jest.mock('../src/lib/supabase', () => ({
  deleteAccount: jest.fn(),
  supabaseClient: { rpc: jest.fn(), auth: { getSession: jest.fn() } },
}));
jest.mock('../src/lib/accountDataCleanup', () => ({
  usePendingAccountCleanup: () => mockCleanup,
  beginAccountDataDeletion: jest.fn(),
  confirmAccountDataDeletion: jest.fn(),
  clearRequestedAccountDeletion: jest.fn(),
  loadPendingAccountCleanup: jest.fn(),
  retryPendingAccountCleanup: jest.fn(),
}));
jest.mock('../src/components/ChatGPTConnection', () => ({
  ChatGPTConnection: () => null,
}));

const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const submitAlert = async (text: string) => {
  const buttons = alert.mock.calls.at(-1)?.[2];
  await act(async () => {
    buttons?.find(button => button.text === text)?.onPress?.();
  });
};
beforeEach(() => {
  jest.clearAllMocks();
  mockCleanup.owner = null;
  mockCleanup.phase = null;
  mockCleanup.ready = true;
  mockCleanup.error = '';
  (loadPendingAccountCleanup as jest.Mock).mockResolvedValue(undefined);
  (clearRequestedAccountDeletion as jest.Mock).mockResolvedValue(undefined);
  mockSession = {
    access_token: 'token-a',
    user: {
      id: 'account-a',
      email: 'alex@example.com',
      user_metadata: { full_name: 'Alex Morgan' },
    },
  };
  mockRefresh.mockResolvedValue(undefined);
  (plannerSyncProblem as jest.Mock).mockReturnValue(null);
  (deleteAccount as jest.Mock).mockResolvedValue(undefined);
  (beginAccountDataDeletion as jest.Mock).mockResolvedValue(undefined);
  (confirmAccountDataDeletion as jest.Mock).mockResolvedValue(undefined);
  (retryPendingAccountCleanup as jest.Mock).mockResolvedValue(undefined);
  (supabaseClient.auth.getSession as jest.Mock).mockImplementation(
    async () => ({ data: { session: mockSession }, error: null }),
  );
  (supabaseClient.rpc as jest.Mock).mockReturnValue({
    setHeader: jest.fn().mockReturnThis(),
    abortSignal: async () => ({ error: null }),
  });
});

test('import requires native confirmation and preserves a confirmed import if subsequent refresh fails', async () => {
  render(<AccountScreen />);
  fireEvent.press(screen.getByLabelText('Import device items'));
  expect(supabaseClient.rpc).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith(
    'Import device items?',
    expect.stringContaining('Your device copy is kept'),
    expect.any(Array),
    { cancelable: true },
  );
  mockRefresh.mockRejectedValueOnce(new Error('offline'));
  await submitAlert('Import');
  await screen.findByText('Device items imported');
  expect(
    screen.getByText(
      'Your device copy is kept. Account changes could not be refreshed. Try Sync now.',
    ),
  ).toBeOnTheScreen();
  expect(mockRefresh).toHaveBeenCalledWith({ throwOnError: true });
  expect(
    (supabaseClient.rpc as jest.Mock).mock.results[0].value.setHeader,
  ).toHaveBeenCalledWith('Authorization', 'Bearer token-a');
});

test('a swallowed planner service failure renders Sync unavailable instead of success', async () => {
  render(<AccountScreen />);
  (plannerSyncProblem as jest.Mock).mockReturnValue('offline');
  fireEvent.press(screen.getByLabelText('Sync now'));
  await screen.findByText('Sync unavailable');
  expect(screen.queryByText('Sync status · Up to date')).toBeNull();
});

test('server-confirmed deletion never submits a second server request when device cleanup is retried', async () => {
  render(<AccountScreen />);
  fireEvent.press(screen.getByLabelText('Delete Offtasks data'));
  expect(deleteAccount).not.toHaveBeenCalled();
  (confirmAccountDataDeletion as jest.Mock).mockRejectedValueOnce(
    new Error('storage unavailable'),
  );
  await submitAlert('Delete');
  await screen.findByText('Offtasks data deleted');
  expect(deleteAccount).toHaveBeenCalledWith('account-a');
  fireEvent.press(screen.getByLabelText('Retry device cleanup'));
  await waitFor(() =>
    expect(retryPendingAccountCleanup).toHaveBeenCalledTimes(1),
  );
  expect(deleteAccount).toHaveBeenCalledTimes(1);
});

test('native confirmation captured for a previous account cannot delete the replacement account', async () => {
  const view = render(<AccountScreen />);
  fireEvent.press(screen.getByLabelText('Delete Offtasks data'));
  mockSession = { user: { id: 'account-b', email: 'other@example.com' } };
  view.rerender(<AccountScreen />);
  await submitAlert('Delete');
  expect(deleteAccount).not.toHaveBeenCalled();
});

test('an identity change while reading guest items blocks the import RPC', async () => {
  render(<AccountScreen />);
  (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: { id: 'account-b' } } },
    error: null,
  });
  fireEvent.press(screen.getByLabelText('Import device items'));
  await submitAlert('Import');
  await screen.findByText('Couldn’t import');
  expect(supabaseClient.rpc).not.toHaveBeenCalled();
});

test('a known pre-deletion rejection clears only the unconfirmed intent and permits a new reviewed attempt', async () => {
  render(<AccountScreen />);
  (deleteAccount as jest.Mock).mockRejectedValueOnce(
    Object.assign(new Error('session expired'), { deletionRejected: true }),
  );
  fireEvent.press(screen.getByLabelText('Delete Offtasks data'));
  await submitAlert('Delete');
  await screen.findByText('Couldn’t delete Offtasks data');
  expect(clearRequestedAccountDeletion).toHaveBeenCalledWith('account-a');
  expect(retryPendingAccountCleanup).not.toHaveBeenCalled();
});

test('uncertain deletion requires explicit account review and sends no deletion request during review', async () => {
  mockCleanup.owner = 'account-a';
  mockCleanup.phase = 'requested';
  render(<AccountScreen />);
  expect(screen.getByText('Deletion not confirmed')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Review deletion'));
  expect(deleteAccount).not.toHaveBeenCalled();
  expect(clearRequestedAccountDeletion).not.toHaveBeenCalled();
  await submitAlert('I checked my account');
  await screen.findByText('Deletion review complete');
  expect(clearRequestedAccountDeletion).toHaveBeenCalledWith('account-a');
  expect(deleteAccount).not.toHaveBeenCalled();
});

test('device status read failure has a read-only retry and enables deletion again after recovery', async () => {
  mockCleanup.ready = false;
  mockCleanup.error = 'Device cleanup status could not be read. Try again.';
  const view = render(<AccountScreen />);
  expect(screen.getByText('Device status unavailable')).toBeOnTheScreen();
  expect(screen.getByText(mockCleanup.error)).toBeOnTheScreen();
  expect(screen.getByLabelText('Delete Offtasks data')).toBeDisabled();
  (loadPendingAccountCleanup as jest.Mock).mockImplementationOnce(async () => {
    mockCleanup.ready = true;
    mockCleanup.error = '';
  });
  fireEvent.press(screen.getByLabelText('Retry device status'));
  await waitFor(() =>
    expect(loadPendingAccountCleanup).toHaveBeenCalledTimes(1),
  );
  view.rerender(<AccountScreen />);
  await waitFor(() =>
    expect(screen.getByLabelText('Delete Offtasks data')).not.toBeDisabled(),
  );
  expect(screen.queryByLabelText('Retry device status')).toBeNull();
  expect(deleteAccount).not.toHaveBeenCalled();
  expect(retryPendingAccountCleanup).not.toHaveBeenCalled();
  expect(clearRequestedAccountDeletion).not.toHaveBeenCalled();
});

test('a confirmed cleanup for another account blocks new deletion and finishes only the previous local cleanup', async () => {
  mockSession = {
    access_token: 'token-b',
    user: { id: 'account-b', email: 'b@example.com' },
  };
  mockCleanup.owner = 'account-a';
  mockCleanup.phase = 'confirmed';
  const onBack = jest.fn();
  const view = render(<AccountScreen onBack={onBack} />);
  expect(
    screen.getByText('Previous account needs device cleanup'),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Delete Offtasks data')).toBeDisabled();
  expect(screen.getByLabelText('Sync now')).not.toBeDisabled();
  expect(screen.getByLabelText('Import device items')).not.toBeDisabled();
  fireEvent.press(screen.getByLabelText('Delete Offtasks data'));
  expect(alert).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Sync now'));
  await waitFor(() =>
    expect(mockRefresh).toHaveBeenCalledWith({ throwOnError: true }),
  );
  (retryPendingAccountCleanup as jest.Mock).mockImplementationOnce(async () => {
    mockCleanup.owner = null;
    mockCleanup.phase = null;
  });
  fireEvent.press(screen.getByLabelText('Finish previous device cleanup'));
  await waitFor(() =>
    expect(retryPendingAccountCleanup).toHaveBeenCalledTimes(1),
  );
  view.rerender(<AccountScreen onBack={onBack} />);
  await waitFor(() =>
    expect(screen.getByLabelText('Delete Offtasks data')).not.toBeDisabled(),
  );
  expect(deleteAccount).not.toHaveBeenCalled();
  expect(beginAccountDataDeletion).not.toHaveBeenCalled();
  expect(clearRequestedAccountDeletion).not.toHaveBeenCalled();
  expect(onBack).not.toHaveBeenCalled();
});

test('an unconfirmed deletion for another account requires that account to review and cannot be cleared by the current account', () => {
  mockSession = {
    access_token: 'token-b',
    user: { id: 'account-b', email: 'b@example.com' },
  };
  mockCleanup.owner = 'account-a';
  mockCleanup.phase = 'requested';
  render(<AccountScreen />);
  expect(screen.getByText('Previous deletion needs review')).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Sign in to the previous account to review its unconfirmed deletion. No deletion has been submitted for this account.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Delete Offtasks data')).toBeDisabled();
  expect(screen.getByLabelText('Sync now')).not.toBeDisabled();
  expect(screen.getByLabelText('Import device items')).not.toBeDisabled();
  expect(screen.queryByLabelText('Review deletion')).toBeNull();
  expect(screen.queryByLabelText('Finish previous device cleanup')).toBeNull();
  fireEvent.press(screen.getByLabelText('Delete Offtasks data'));
  expect(alert).not.toHaveBeenCalled();
  expect(deleteAccount).not.toHaveBeenCalled();
  expect(retryPendingAccountCleanup).not.toHaveBeenCalled();
  expect(clearRequestedAccountDeletion).not.toHaveBeenCalled();
});

test('a native deletion confirmation cannot clean up a different account marker that appeared while it was open', async () => {
  const view = render(<AccountScreen />);
  fireEvent.press(screen.getByLabelText('Delete Offtasks data'));
  mockCleanup.owner = 'other-account';
  mockCleanup.phase = 'confirmed';
  view.rerender(<AccountScreen />);
  await submitAlert('Delete');
  expect(deleteAccount).not.toHaveBeenCalled();
  expect(beginAccountDataDeletion).not.toHaveBeenCalled();
  expect(retryPendingAccountCleanup).not.toHaveBeenCalled();
});
