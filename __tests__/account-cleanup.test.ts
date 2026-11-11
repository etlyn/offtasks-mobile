import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearPlanner } from '../src/lib/plannerSync';
import { clearWidgetSnapshot } from '../src/lib/widgetBridge';
import { supabaseClient } from '../src/lib/supabase';
import {
  beginAccountDataDeletion,
  confirmAccountDataDeletion,
  clearRequestedAccountDeletion,
  loadPendingAccountCleanup,
  retryPendingAccountCleanup,
} from '../src/lib/accountDataCleanup';

jest.mock('../src/lib/plannerSync', () => ({ clearPlanner: jest.fn() }));
jest.mock('../src/lib/widgetBridge', () => ({
  clearWidgetSnapshot: jest.fn(),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: {
    auth: { getSession: jest.fn(), signOut: jest.fn() },
    functions: { invoke: jest.fn() },
  },
}));

const KEY = 'offtasks:pending-account-data-cleanup:v1';
const session = supabaseClient.auth.getSession as jest.Mock;
const signOut = supabaseClient.auth.signOut as jest.Mock;
const clear = jest.mocked(clearPlanner);
const clearWidget = jest.mocked(clearWidgetSnapshot);

beforeAll(async () => {
  await AsyncStorage.clear();
});
beforeEach(() => {
  jest.clearAllMocks();
  clear.mockResolvedValue(undefined);
  clearWidget.mockResolvedValue(undefined);
  session.mockResolvedValue({
    data: { session: { user: { id: 'account-a' } } },
    error: null,
  });
  signOut.mockResolvedValue({ error: null });
});

test('a transient initial storage read failure can be retried without deleting or cleaning up data', async () => {
  (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
    new Error('storage temporarily locked'),
  );
  await expect(loadPendingAccountCleanup()).rejects.toThrow(
    'Device cleanup status could not be read',
  );
  await expect(loadPendingAccountCleanup()).resolves.toBeUndefined();
  await beginAccountDataDeletion('account-a');
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).phase).toBe(
    'requested',
  );
  await clearRequestedAccountDeletion('account-a');
  expect(clear).not.toHaveBeenCalled();
  expect(clearWidget).not.toHaveBeenCalled();
  expect(signOut).not.toHaveBeenCalled();
  expect(supabaseClient.functions.invoke).not.toHaveBeenCalled();
});

test('durable intent prevents a second deletion while its outcome is uncertain', async () => {
  await beginAccountDataDeletion('account-a');
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).toEqual({
    owner: 'account-a',
    phase: 'requested',
  });
  await expect(beginAccountDataDeletion('account-a')).rejects.toThrow(
    'earlier deletion',
  );
  await expect(retryPendingAccountCleanup()).rejects.toThrow(
    'outcome was confirmed',
  );
  expect(clear).not.toHaveBeenCalled();
  expect(supabaseClient.functions.invoke).not.toHaveBeenCalled();
  await confirmAccountDataDeletion('account-a');
  await retryPendingAccountCleanup();
});

test('confirmed deletion retries local cleanup only and retains its marker on failure', async () => {
  await beginAccountDataDeletion('account-a');
  await confirmAccountDataDeletion('account-a');
  clear.mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(retryPendingAccountCleanup()).rejects.toThrow('Device cleanup');
  expect(signOut).not.toHaveBeenCalled();
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).phase).toBe(
    'confirmed',
  );
  await retryPendingAccountCleanup();
  expect(clear).toHaveBeenLastCalledWith('account-a');
  expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(supabaseClient.functions.invoke).not.toHaveBeenCalled();
  expect(await AsyncStorage.getItem(KEY)).toBeNull();
});

test('retrying an old account cleanup never clears the guest or replacement account widget or session', async () => {
  await beginAccountDataDeletion('account-a');
  await confirmAccountDataDeletion('account-a');
  session.mockResolvedValue({
    data: { session: { user: { id: 'account-b' } } },
    error: null,
  });
  await retryPendingAccountCleanup();
  expect(clear).toHaveBeenCalledWith('account-a');
  expect(clearWidget).not.toHaveBeenCalled();
  expect(signOut).not.toHaveBeenCalled();
  expect(await AsyncStorage.getItem(KEY)).toBeNull();
});

test('sign-out failure retains confirmed deletion for safe cleanup retry', async () => {
  await beginAccountDataDeletion('account-a');
  await confirmAccountDataDeletion('account-a');
  signOut.mockResolvedValueOnce({ error: new Error('keychain unavailable') });
  await expect(retryPendingAccountCleanup()).rejects.toThrow('Device cleanup');
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).phase).toBe(
    'confirmed',
  );
  await retryPendingAccountCleanup();
  expect(supabaseClient.functions.invoke).not.toHaveBeenCalled();
});

test('explicit review can clear an unconfirmed request but can never discard confirmed cleanup', async () => {
  await beginAccountDataDeletion('account-a');
  await expect(clearRequestedAccountDeletion('account-b')).rejects.toThrow();
  await clearRequestedAccountDeletion('account-a');
  expect(await AsyncStorage.getItem(KEY)).toBeNull();
  await beginAccountDataDeletion('account-a');
  await confirmAccountDataDeletion('account-a');
  await expect(clearRequestedAccountDeletion('account-a')).rejects.toThrow(
    'Confirmed deletions',
  );
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).phase).toBe(
    'confirmed',
  );
  await retryPendingAccountCleanup();
});

test('an account switch during deferred native widget cleanup cannot sign out the replacement account', async () => {
  await beginAccountDataDeletion('account-a');
  await confirmAccountDataDeletion('account-a');
  let releaseWidget!: () => void;
  clearWidget.mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        releaseWidget = resolve;
      }),
  );
  const pending = retryPendingAccountCleanup();
  // Allow local planner cleanup and the first owner check to finish.
  while (!releaseWidget) await Promise.resolve();
  session.mockResolvedValue({
    data: { session: { user: { id: 'account-b' } } },
    error: null,
  });
  releaseWidget();
  await pending;
  expect(signOut).not.toHaveBeenCalled();
  expect(await AsyncStorage.getItem(KEY)).toBeNull();
});
