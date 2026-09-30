import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { LoginScreen } from '../src/screens/LoginScreen';
import {
  needsWelcome,
  completeWelcome,
  WELCOME_KEY,
} from '../src/lib/onboarding';
import { supabaseClient } from '../src/lib/supabase';

const mockNavigation = {
  reset: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => false),
  dispatch: jest.fn(),
};
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
}));
let mockSession: object | null = null;
let mockMode = 'signIn';
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: { initialMode: mockMode } }),
}));
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: mockSession }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockSession = null;
  mockMode = 'signIn';
  mockNavigation.canGoBack.mockReturnValue(false);
});

test('welcome is once per device, skips restored sessions, and preserves guest data', async () => {
  await AsyncStorage.setItem('guest-data', 'untouched');
  expect(await needsWelcome(false)).toBe(true);
  await completeWelcome();
  expect(await needsWelcome(false)).toBe(false);
  expect(await AsyncStorage.getItem('guest-data')).toBe('untouched');
  await AsyncStorage.removeItem(WELCOME_KEY);
  expect(await needsWelcome(true)).toBe(false);
  expect(await needsWelcome(false)).toBe(false);
});

test('storage failure cannot block existing app access', async () => {
  (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
    new Error('unavailable'),
  );
  expect(await needsWelcome(false)).toBe(false);
});

test('guest can skip directly to their workspace without contacting auth', async () => {
  const view = render(<WelcomeScreen />);
  fireEvent.press(view.getByLabelText('Skip welcome'));
  await waitFor(() =>
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    }),
  );
  expect(await AsyncStorage.getItem(WELCOME_KEY)).toBe('complete');
  expect(supabaseClient.auth.signUp).not.toHaveBeenCalled();
});

test('three concise steps open the guest workspace without requiring an account', async () => {
  const view = render(<WelcomeScreen />);
  fireEvent.press(view.getByText('Continue'));
  await waitFor(() =>
    expect(view.getByText('Make room for your day.')).toBeTruthy(),
  );
  fireEvent.press(view.getByText('Continue'));
  await waitFor(() =>
    expect(view.getByText('Space for what matters.')).toBeTruthy(),
  );
  expect(view.queryByText('Create account')).toBeNull();
  fireEvent.press(view.getByText('Get started'));
  await waitFor(() =>
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    }),
  );
});

test('progress dots let users revisit a step without leaving welcome', async () => {
  const view = render(<WelcomeScreen />);
  fireEvent.press(view.getByLabelText('Welcome step 3 of 3'));
  await waitFor(() => expect(view.getByText('Get started')).toBeTruthy());
  fireEvent.press(view.getByLabelText('Welcome step 1 of 3'));
  await waitFor(() =>
    expect(view.getByText('A little less on your mind.')).toBeTruthy(),
  );
  expect(mockNavigation.reset).not.toHaveBeenCalled();
  expect(await AsyncStorage.getItem(WELCOME_KEY)).toBeNull();
});

test('returning users can go straight to sign-in', async () => {
  const view = render(<WelcomeScreen />);
  fireEvent.press(view.getByText('Sign in'));
  await waitFor(() =>
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [
        { name: 'Home' },
        { name: 'Account', params: { initialMode: 'signIn' } },
      ],
    }),
  );
});

test('replaying welcome preserves the existing page and never forces a sign-out', async () => {
  mockNavigation.canGoBack.mockReturnValue(true);
  mockSession = { user: { id: 'existing' } };
  const view = render(<WelcomeScreen />);
  expect(view.queryByText('Sign in')).toBeNull();
  fireEvent.press(view.getByLabelText('Close welcome'));
  await waitFor(() => expect(mockNavigation.goBack).toHaveBeenCalledTimes(1));
  expect(mockNavigation.reset).not.toHaveBeenCalled();
});

test('guest sign-in from replay replaces only the welcome screen, retaining the underlying tab', async () => {
  mockNavigation.canGoBack.mockReturnValue(true);
  const view = render(<WelcomeScreen />);
  fireEvent.press(view.getByText('Sign in'));
  await waitFor(() =>
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REPLACE',
        payload: { name: 'Account', params: { initialMode: 'signIn' } },
      }),
    ),
  );
  expect(mockNavigation.reset).not.toHaveBeenCalled();
});

test('sign-up validates password and explains email confirmation without a duplicate field', async () => {
  mockMode = 'signUp';
  (supabaseClient.auth.signUp as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  const view = render(<LoginScreen />);
  expect(view.queryByLabelText('Confirm password')).toBeNull();
  fireEvent.changeText(view.getByLabelText('Email'), '  person@example.com  ');
  fireEvent.changeText(view.getByLabelText('Password'), 'short');
  fireEvent.press(view.getByLabelText('Create account'));
  expect(
    view.getByText('Use at least 8 characters for your password.'),
  ).toBeTruthy();
  expect(supabaseClient.auth.signUp).not.toHaveBeenCalled();
  fireEvent.changeText(view.getByLabelText('Password'), 'a-valid-password');
  fireEvent.press(view.getByLabelText('Create account'));
  await waitFor(() => expect(view.getByText('Check your inbox.')).toBeTruthy());
  expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
    email: 'person@example.com',
    password: 'a-valid-password',
  });
  expect(view.getByText(/Follow the confirmation link/)).toBeTruthy();
});

test('reset has its own email-only form and neutral confirmation', async () => {
  (supabaseClient.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
    error: null,
  });
  const view = render(<LoginScreen />);
  fireEvent.press(view.getByText('Forgot password?'));
  expect(view.queryByLabelText('Password')).toBeNull();
  fireEvent.changeText(view.getByLabelText('Email'), 'person@example.com');
  fireEvent.press(view.getByLabelText('Send reset link'));
  await waitFor(() =>
    expect(
      view.getByText(/If an account uses person@example.com/),
    ).toBeTruthy(),
  );
  fireEvent.press(view.getByText('Back to sign in'));
  expect(view.getByText('Welcome back.')).toBeTruthy();
});

test('a pending sign-in cannot send duplicate requests; server errors stay inline', async () => {
  let finish: (value: unknown) => void = () => {};
  (supabaseClient.auth.signInWithPassword as jest.Mock).mockReturnValue(
    new Promise(resolve => {
      finish = resolve;
    }),
  );
  const view = render(<LoginScreen />);
  fireEvent.changeText(view.getByLabelText('Email'), 'person@example.com');
  fireEvent.changeText(view.getByLabelText('Password'), 'secret-password');
  fireEvent.press(view.getByLabelText('Sign in'));
  fireEvent.press(view.getByLabelText('Sign in'));
  await waitFor(() =>
    expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(1),
  );
  finish({ error: new Error('Invalid login credentials') });
  await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
});
