import React from 'react';
import { AppState, Linking, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { RecoveryPasswordModal } from '../src/providers/RecoveryPasswordModal';
import { completeNativeSignIn } from '../src/lib/googleSignIn';
import { supabaseClient } from '../src/lib/supabase';

let mockLink: ((event: { url: string }) => void) | undefined;
let mockAuthChange: ((event: string, session: any) => void) | undefined;
const otherSession = { user: { id: 'signed-in-B', email: 'b@example.com' } };
const recoverySession = {
  user: { id: 'recovering-A', email: 'a@example.com' },
};

jest.mock('../src/lib/googleSignIn', () => ({
  completeNativeSignIn: jest.fn(),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 62, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));

function RecoveryHost() {
  const auth = useAuth();
  return (
    <>
      <Text>{`account:${auth.session?.user.id ?? 'guest'}`}</Text>
      <Text>{`verified:${auth.recoveryOwner ?? 'none'}`}</Text>
      <Text>{auth.callbackError}</Text>
      <RecoveryPasswordModal
        visible={auth.recovering}
        expectedOwner={auth.recoveryOwner ?? undefined}
        requestOnly={auth.requestOnlyRecovery}
        onComplete={auth.finishRecovery}
      />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLink = undefined;
  mockAuthChange = undefined;
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest
    .spyOn(Linking, 'addEventListener')
    .mockImplementation((_type, listener) => {
      mockLink = listener;
      return { remove: jest.fn() } as unknown as ReturnType<
        typeof Linking.addEventListener
      >;
    });
  jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: otherSession },
    error: null,
  });
  (supabaseClient.auth.onAuthStateChange as jest.Mock).mockImplementation(
    listener => {
      mockAuthChange = listener;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    },
  );
  (supabaseClient.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
    error: null,
  });
  (completeNativeSignIn as jest.Mock).mockRejectedValue(
    new Error('Invalid or expired code'),
  );
});

test('an initial dead recovery link gives signed-in B visible request-only help without using B as recovery identity', async () => {
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue('offtasks://auth/recovery?code=expired');
  const screen = render(
    <AuthProvider>
      <RecoveryHost />
    </AuthProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText('This link couldn’t be opened')).toBeTruthy(),
  );
  expect(screen.getByText('account:signed-in-B')).toBeTruthy();
  expect(screen.getByText('verified:none')).toBeTruthy();
  expect(screen.queryByLabelText('New password')).toBeNull();
  expect(screen.queryByLabelText('Save password')).toBeNull();
  // The only session read is provider hydration, never failed-link inference.
  expect(supabaseClient.auth.getSession).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByLabelText('Request new link'));
  expect(screen.getByLabelText('Recovery email').props.value).toBe('');
  fireEvent.press(screen.getByLabelText('Send reset link'));
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(supabaseClient.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  fireEvent.changeText(
    screen.getByLabelText('Recovery email'),
    'recover@example.com',
  );
  fireEvent.press(screen.getByLabelText('Send reset link'));
  await waitFor(() =>
    expect(screen.getByText('Check your inbox')).toBeTruthy(),
  );
  expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
    'recover@example.com',
    { redirectTo: 'offtasks://auth/recovery' },
  );
  expect(supabaseClient.auth.updateUser).not.toHaveBeenCalled();
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});

test('an older failed recovery attempt cannot replace newer verified Ready recovery', async () => {
  let rejectOld: (reason: Error) => void = () => {};
  (completeNativeSignIn as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('old'))
      return new Promise((_resolve, reject) => {
        rejectOld = reject;
      });
    (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: recoverySession },
      error: null,
    });
    mockAuthChange?.('SIGNED_IN', recoverySession);
    return Promise.resolve(true);
  });
  const screen = render(
    <AuthProvider>
      <RecoveryHost />
    </AuthProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText('account:signed-in-B')).toBeTruthy(),
  );
  await act(async () => {
    mockLink?.({ url: 'offtasks://auth/recovery?code=old' });
  });
  await act(async () => {
    mockLink?.({ url: 'offtasks://auth/recovery?code=fresh' });
  });
  await waitFor(() =>
    expect(screen.getByText('verified:recovering-A')).toBeTruthy(),
  );
  expect(screen.getByLabelText('New password')).toBeTruthy();
  await act(async () => {
    rejectOld(new Error('Expired old code'));
  });
  expect(screen.getByText('verified:recovering-A')).toBeTruthy();
  expect(screen.queryByText('This link couldn’t be opened')).toBeNull();
  expect(screen.getByLabelText('Save password')).toBeTruthy();
  expect(supabaseClient.auth.updateUser).not.toHaveBeenCalled();
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});

test('general OAuth errors retain sign-in feedback without opening recovery', async () => {
  const screen = render(
    <AuthProvider>
      <RecoveryHost />
    </AuthProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText('account:signed-in-B')).toBeTruthy(),
  );
  await act(async () => {
    mockLink?.({ url: 'offtasks://auth/callback?code=invalid' });
  });
  expect(
    screen.getByText(
      'The sign-in link is invalid or expired. Please try signing in again.',
    ),
  ).toBeTruthy();
  expect(screen.queryByText('This link couldn’t be opened')).toBeNull();
});
