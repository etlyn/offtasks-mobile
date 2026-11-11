import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { PrivacyScreen } from '../src/analytics/AnalyticsPreferences';
import { RecoveryPasswordModal } from '../src/providers/RecoveryPasswordModal';
import { analytics } from '../src/analytics';
import { supabaseClient } from '../src/lib/supabase';

let mockEnabled = true;
let mockListener: (() => void) | undefined;
jest.mock('../src/analytics', () => ({
  analytics: {
    isEnabled: () => mockEnabled,
    subscribe: (listener: () => void) => {
      mockListener = listener;
      return () => {
        mockListener = undefined;
      };
    },
    setEnabled: jest.fn(),
  },
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: {
    auth: {
      getSession: jest.fn(),
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

beforeEach(() => {
  jest.clearAllMocks();
  mockEnabled = true;
  mockListener = undefined;
  (analytics!.setEnabled as jest.Mock).mockImplementation(
    async (value: boolean) => {
      mockEnabled = value;
      mockListener?.();
    },
  );
  (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
    data: {
      session: { user: { id: 'recovering-user', email: 'person@example.com' } },
    },
  });
  (supabaseClient.auth.updateUser as jest.Mock).mockResolvedValue({
    error: null,
  });
  (supabaseClient.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
  (supabaseClient.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
    error: null,
  });
});

test('privacy reflects the saved SDK preference and preserves the collection disclosure', async () => {
  const onBack = jest.fn();
  const screen = render(<PrivacyScreen onBack={onBack} />);
  expect(screen.getByLabelText('Product analytics').props.value).toBe(true);
  fireEvent(screen.getByLabelText('Product analytics'), 'valueChange', false);
  await waitFor(() =>
    expect(screen.getByLabelText('Product analytics').props.value).toBe(false),
  );
  expect(analytics!.setEnabled).toHaveBeenCalledWith(false);
  expect(
    screen.getByText(/Events: 400 days; queued events expire after 7 days/),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Back'));
  expect(onBack).toHaveBeenCalledTimes(1);
});

test('a failed opt-out reports collection already stopped and retries persistence', async () => {
  (analytics!.setEnabled as jest.Mock).mockImplementationOnce(async () => {
    mockEnabled = false;
    mockListener?.();
    throw new Error('storage unavailable');
  });
  const screen = render(<PrivacyScreen onBack={jest.fn()} />);
  fireEvent(screen.getByLabelText('Product analytics'), 'valueChange', false);
  await waitFor(() =>
    expect(screen.getByText('Couldn’t save preference')).toBeTruthy(),
  );
  expect(screen.getByLabelText('Product analytics').props.value).toBe(false);
  expect(
    screen.getByText(
      'Analytics are off for this session. Try again to save your choice.',
    ),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Retry saving preference'));
  await waitFor(() =>
    expect(screen.queryByText('Couldn’t save preference')).toBeNull(),
  );
  expect(analytics!.setEnabled).toHaveBeenLastCalledWith(false);
});

function fillPassword(screen: ReturnType<typeof render>) {
  fireEvent.changeText(screen.getByLabelText('New password'), 'a-new-password');
  fireEvent.changeText(
    screen.getByLabelText('Confirm password'),
    'a-new-password',
  );
}

test('recovery validates matching passwords and saves once before local sign-out', async () => {
  const onComplete = jest.fn();
  const screen = render(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible
      onComplete={onComplete}
    />,
  );
  await waitFor(() =>
    expect(supabaseClient.auth.getSession).toHaveBeenCalled(),
  );
  fireEvent.changeText(screen.getByLabelText('New password'), 'a-new-password');
  fireEvent.changeText(screen.getByLabelText('Confirm password'), 'mismatch');
  expect(
    screen.getByLabelText('Save password').props.accessibilityState.disabled,
  ).toBe(true);
  fireEvent.press(screen.getByLabelText('Save password'));
  expect(supabaseClient.auth.updateUser).not.toHaveBeenCalled();
  fireEvent.changeText(
    screen.getByLabelText('Confirm password'),
    'a-new-password',
  );
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  expect(supabaseClient.auth.updateUser).toHaveBeenCalledTimes(1);
  expect(supabaseClient.auth.updateUser).toHaveBeenCalledWith({
    password: 'a-new-password',
  });
  expect(supabaseClient.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
});

test('expired recovery opens a working request-link form and only reports sent after success', async () => {
  (supabaseClient.auth.updateUser as jest.Mock).mockResolvedValue({
    error: { code: 'session_not_found', message: 'Session expired' },
  });
  const screen = render(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible
      onComplete={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(screen.getByLabelText('New password')).toBeTruthy(),
  );
  fillPassword(screen);
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() =>
    expect(screen.getByText('This link has expired')).toBeTruthy(),
  );
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Request new link'));
  await waitFor(() =>
    expect(screen.getByLabelText('Recovery email').props.value).toBe(
      'person@example.com',
    ),
  );
  expect(supabaseClient.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Send reset link'));
  await waitFor(() =>
    expect(screen.getByText('Check your inbox')).toBeTruthy(),
  );
  expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
    'person@example.com',
    {
      redirectTo: 'offtasks://auth/recovery',
    },
  );
});

test('network errors do not falsely expire a recovery link and dismissal clears passwords', async () => {
  (supabaseClient.auth.updateUser as jest.Mock).mockResolvedValue({
    error: new Error('Network request failed'),
  });
  const onComplete = jest.fn();
  const screen = render(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible
      onComplete={onComplete}
    />,
  );
  fillPassword(screen);
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() =>
    expect(
      screen.getByText(/Offtasks could not reach the sign-in service/),
    ).toBeTruthy(),
  );
  expect(screen.queryByText('This link has expired')).toBeNull();
  fireEvent.press(screen.getByLabelText('Cancel'));
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('New password').props.value).toBe('');
  screen.rerender(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible={false}
      onComplete={onComplete}
    />,
  );
  screen.rerender(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible
      onComplete={onComplete}
    />,
  );
  expect(screen.getByLabelText('Confirm password').props.value).toBe('');
  await act(async () => {});
});

test('retrying local sign-out after password success never submits the password again', async () => {
  (supabaseClient.auth.signOut as jest.Mock).mockResolvedValueOnce({
    error: new Error('Offline'),
  });
  const onComplete = jest.fn();
  const screen = render(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible
      onComplete={onComplete}
    />,
  );
  fillPassword(screen);
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() =>
    expect(screen.getByLabelText('Finish sign-out')).toBeTruthy(),
  );
  expect(screen.getByText('Password saved')).toBeTruthy();
  expect(onComplete).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Finish sign-out'));
  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  expect(supabaseClient.auth.updateUser).toHaveBeenCalledTimes(1);
  expect(supabaseClient.auth.signOut).toHaveBeenCalledTimes(2);
});

test('recovery refuses to update a different session from the callback owner', async () => {
  const screen = render(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible
      onComplete={jest.fn()}
    />,
  );
  await act(async () => {});
  (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
    data: {
      session: { user: { id: 'other-user', email: 'other@example.com' } },
    },
  });
  fillPassword(screen);
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() =>
    expect(screen.getByText('Recovery session changed')).toBeTruthy(),
  );
  expect(
    screen.getByText(/Close this screen and open a fresh recovery link/),
  ).toBeTruthy();
  expect(supabaseClient.auth.updateUser).not.toHaveBeenCalled();
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});

test('a session change after saving never signs out the replacement account', async () => {
  (supabaseClient.auth.updateUser as jest.Mock).mockImplementation(async () => {
    (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: { user: { id: 'other-user', email: 'other@example.com' } },
      },
    });
    return { error: null };
  });
  const onComplete = jest.fn();
  const screen = render(
    <RecoveryPasswordModal
      expectedOwner="recovering-user"
      visible
      onComplete={onComplete}
    />,
  );
  fillPassword(screen);
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() =>
    expect(screen.getByText('Recovery session changed')).toBeTruthy(),
  );
  expect(supabaseClient.auth.updateUser).toHaveBeenCalledTimes(1);
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
  expect(onComplete).not.toHaveBeenCalled();
});

test('without a callback owner, recovery freezes the opening session instead of inferring a new one at save', async () => {
  const screen = render(
    <RecoveryPasswordModal visible onComplete={jest.fn()} />,
  );
  await act(async () => {});
  (supabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
    data: {
      session: { user: { id: 'other-user', email: 'other@example.com' } },
    },
  });
  fillPassword(screen);
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() =>
    expect(screen.getByText('Recovery session changed')).toBeTruthy(),
  );
  expect(supabaseClient.auth.updateUser).not.toHaveBeenCalled();
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});

test('switching a visible Ready presentation to request-only invalidates its pending password operation', async () => {
  let resolveUpdate: (value: { error: null }) => void = () => {};
  (supabaseClient.auth.updateUser as jest.Mock).mockImplementation(
    () =>
      new Promise(resolve => {
        resolveUpdate = resolve;
      }),
  );
  const screen = render(
    <RecoveryPasswordModal
      visible
      expectedOwner="recovering-user"
      onComplete={jest.fn()}
    />,
  );
  fillPassword(screen);
  fireEvent.press(screen.getByLabelText('Save password'));
  await waitFor(() =>
    expect(supabaseClient.auth.updateUser).toHaveBeenCalledTimes(1),
  );
  const readsBeforeFailure = (supabaseClient.auth.getSession as jest.Mock).mock
    .calls.length;
  screen.rerender(
    <RecoveryPasswordModal visible requestOnly onComplete={jest.fn()} />,
  );
  await act(async () => {
    resolveUpdate({ error: null });
  });
  expect(screen.getByText('This link couldn’t be opened')).toBeTruthy();
  expect(screen.queryByLabelText('New password')).toBeNull();
  expect(supabaseClient.auth.getSession).toHaveBeenCalledTimes(
    readsBeforeFailure,
  );
  expect(supabaseClient.auth.signOut).not.toHaveBeenCalled();
});
