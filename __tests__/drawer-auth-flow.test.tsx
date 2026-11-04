import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../src/screens/LoginScreen';
import { supabaseClient } from '../src/lib/supabase';
import { startGoogleSignIn } from '../src/lib/googleSignIn';

const mockNavigate = jest.fn();
const mockReview = jest.fn();
const mockFinishReview = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, canGoBack: () => false }),
  useRoute: () => ({ params: {} }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 62, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({
    reviewGuestImport: mockReview,
    finishGuestImportReview: mockFinishReview,
    callbackError: '',
    clearCallbackError: jest.fn(),
  }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));
jest.mock('../src/lib/onboarding', () => ({ completeWelcome: jest.fn() }));
jest.mock('../src/lib/guestImportReview', () => ({
  shouldReviewGuestItems: jest.fn().mockResolvedValue(true),
}));
jest.mock('../src/lib/googleSignIn', () => ({ startGoogleSignIn: jest.fn() }));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (supabaseClient.auth.signUp as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  (supabaseClient.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
    error: null,
  });
  (startGoogleSignIn as jest.Mock).mockResolvedValue('canceled');
});

test('creation validates password before contacting auth, then shows a real inbox result', async () => {
  const ui = render(<LoginScreen />);
  fireEvent.changeText(ui.getByLabelText('Email'), ' alex@example.com ');
  fireEvent.press(ui.getByRole('button', { name: 'Create an account' }));
  expect(ui.queryByLabelText('Confirm password')).toBeNull();
  fireEvent.changeText(ui.getByLabelText('Password'), 'ninechars');
  fireEvent.press(ui.getByRole('button', { name: 'Create account' }));
  expect(
    ui.getByText('Use at least 10 characters for your password.'),
  ).toBeOnTheScreen();
  expect(supabaseClient.auth.signUp).not.toHaveBeenCalled();
  fireEvent.changeText(ui.getByLabelText('Password'), 'a-long-password');
  fireEvent.press(ui.getByRole('button', { name: 'Create account' }));
  await waitFor(() =>
    expect(ui.getByText('Check your inbox')).toBeOnTheScreen(),
  );
  expect(supabaseClient.auth.signUp).toHaveBeenCalledTimes(1);
  expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
    email: 'alex@example.com',
    password: 'a-long-password',
    options: { emailRedirectTo: 'offtasks://auth/callback' },
  });
  expect(ui.queryByLabelText('Password')).toBeNull();
  expect(
    ui.getByText('Confirm alex@example.com to finish creating your account.'),
  ).toBeOnTheScreen();
  expect(mockReview).toHaveBeenCalledTimes(1);
});

test('pending sign in blocks duplicate submits, mode changes and back; failure retains editable credentials', async () => {
  let resolve!: (value: unknown) => void;
  (supabaseClient.auth.signInWithPassword as jest.Mock).mockImplementation(
    () =>
      new Promise(done => {
        resolve = done;
      }),
  );
  const onBack = jest.fn();
  const ui = render(<LoginScreen onBack={onBack} />);
  fireEvent.changeText(ui.getByLabelText('Email'), 'alex@example.com');
  fireEvent.changeText(ui.getByLabelText('Password'), 'a-long-password');
  fireEvent.press(ui.getByRole('button', { name: 'Sign in' }));
  await waitFor(() =>
    expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(1),
  );
  fireEvent.press(ui.getByRole('button', { name: 'Sign in' }));
  fireEvent.press(ui.getByRole('button', { name: 'Back' }));
  fireEvent.press(ui.getByRole('button', { name: 'Create an account' }));
  expect(onBack).not.toHaveBeenCalled();
  expect(ui.getByText('Signing in…')).toBeOnTheScreen();
  expect(ui.queryByLabelText('Confirm password')).toBeNull();
  await act(async () =>
    resolve({
      error: new Error('Check your details and connection, then try again.'),
    }),
  );
  expect(ui.getByText('Unable to sign in')).toBeOnTheScreen();
  expect(ui.getByLabelText('Email').props.value).toBe('alex@example.com');
  expect(ui.getByLabelText('Password').props.value).toBe('a-long-password');
  expect(ui.getByLabelText('Password').props.editable).toBe(true);
});

test('reset uses the app recovery callback and only shows sent state after the service succeeds', async () => {
  const ui = render(<LoginScreen />);
  fireEvent.changeText(ui.getByLabelText('Email'), 'alex@example.com');
  fireEvent.press(ui.getByRole('button', { name: 'Forgot password?' }));
  fireEvent.press(ui.getByRole('button', { name: 'Send reset link' }));
  await waitFor(() =>
    expect(ui.getByText('Check your inbox')).toBeOnTheScreen(),
  );
  expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
    'alex@example.com',
    {
      redirectTo: 'offtasks://auth/recovery',
    },
  );
  expect(ui.getByLabelText('Email').props.editable).toBe(false);
  fireEvent.press(ui.getByRole('button', { name: 'Use a different email' }));
  expect(ui.getByLabelText('Email').props.value).toBe('');
  expect(ui.getByLabelText('Email').props.editable).toBe(true);
  expect(ui.queryByText('Check your inbox')).toBeNull();
});

test('Google stays reachable and a canceled browser session clears import review', async () => {
  const ui = render(<LoginScreen />);
  fireEvent.press(ui.getByRole('button', { name: 'Continue with Google' }));
  await waitFor(() => expect(startGoogleSignIn).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(mockFinishReview).toHaveBeenCalledTimes(2));
  expect(mockReview).toHaveBeenCalledTimes(1);
});

test('embedded Back returns to its parent without changing application routes', () => {
  const onBack = jest.fn();
  const ui = render(<LoginScreen onBack={onBack} />);
  fireEvent.press(ui.getByRole('button', { name: 'Back' }));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(mockNavigate).not.toHaveBeenCalled();
});
