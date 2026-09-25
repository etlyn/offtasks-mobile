import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from '../src/screens/LoginScreen';
import { importGuestItems } from '../src/screens/AccountScreen';
import { supabaseClient } from '../src/lib/supabase';
import {
  GUEST_ID,
  createLocalTask,
  readLocalTasks,
} from '../src/lib/localTasks';

const mockNavigate = jest.fn();
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, canGoBack: () => false }),
  useRoute: () => ({ params: {} }),
}));
jest.mock('../src/components/navigation/PlannerHeader', () => {
  const { Pressable, Text } = require('react-native');
  return {
    PlannerHeader: ({ onBack }: { onBack: () => void }) => (
      <Pressable accessibilityLabel="Back" onPress={onBack}>
        <Text>Back</Text>
      </Pressable>
    ),
  };
});

test('Account returns to existing app navigation without requiring back history', async () => {
  const screen = render(<LoginScreen />);
  await waitFor(() => expect(screen.getByLabelText('Back')).toBeTruthy());
  fireEvent.press(screen.getByLabelText('Back'));
  expect(mockNavigate).toHaveBeenCalledWith('Home');
});
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: {
    rpc: jest.fn(),
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

test('guest auth validation does not contact the backend', async () => {
  const screen = render(<LoginScreen />);
  await waitFor(() => expect(screen.getByText('Sign in')).toBeTruthy());
  fireEvent.press(screen.getByText('Sign in'));
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(supabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
});

test('import sends device data without deleting it, including when the backend fails', async () => {
  await AsyncStorage.clear();
  await createLocalTask(GUEST_ID, {
    content: 'Keep on device',
    target_group: 'upcoming',
    isComplete: false,
    priority: 0,
    date: null,
  });
  const fixture = await readLocalTasks(GUEST_ID);
  const abortSignal = jest.fn().mockResolvedValue({ error: null });
  (supabaseClient.rpc as jest.Mock).mockReturnValue({ abortSignal });
  await importGuestItems();
  expect(supabaseClient.rpc).toHaveBeenCalledWith('import_device_items', {
    payload: { tasks: fixture, notes: [], goals: expect.any(Array) },
  });
  expect(await readLocalTasks(GUEST_ID)).toEqual(fixture);
  abortSignal.mockResolvedValue({ error: { message: 'offline' } });
  await expect(importGuestItems()).rejects.toThrow(
    'Device items are unchanged',
  );
  await waitFor(async () =>
    expect(await readLocalTasks(GUEST_ID)).toEqual(fixture),
  );
});
