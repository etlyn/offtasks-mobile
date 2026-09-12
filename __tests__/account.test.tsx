import React from 'react';
import {Alert} from 'react-native';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LoginScreen} from '../src/screens/LoginScreen';
import {importGuestItems} from '../src/screens/AccountScreen';
import {supabaseClient} from '../src/lib/supabase';
import {GUEST_ID, createLocalTask, readLocalTasks} from '../src/lib/localTasks';

jest.mock('@react-navigation/native', () => ({...jest.requireActual('@react-navigation/native'), useNavigation: () => ({goBack: jest.fn()})}));
jest.mock('../src/components/navigation/PlannerHeader', () => ({PlannerHeader: () => null}));
jest.mock('../src/lib/supabase', () => ({supabaseClient: {rpc: jest.fn(), auth: {signInWithPassword: jest.fn(), signUp: jest.fn(), resetPasswordForEmail: jest.fn()}}}));

test('guest auth validation does not contact the backend', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const screen = render(<LoginScreen />);
  fireEvent.press(screen.getByText('Sign in'));
  expect(alert).toHaveBeenCalledWith('Missing details', 'Provide both email and password.');
  expect(supabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
  alert.mockRestore();
});

test('import sends device data without deleting it, including when the backend fails', async () => {
  await AsyncStorage.clear();
  await createLocalTask(GUEST_ID, {content: 'Keep on device', target_group: 'upcoming', isComplete: false, priority: 0, date: null});
  const fixture = await readLocalTasks(GUEST_ID);
  const abortSignal = jest.fn().mockResolvedValue({error: null});
  (supabaseClient.rpc as jest.Mock).mockReturnValue({abortSignal});
  await importGuestItems();
  expect(supabaseClient.rpc).toHaveBeenCalledWith('import_device_items', {payload: {tasks: fixture, notes: [], goals: expect.any(Array)}});
  expect(await readLocalTasks(GUEST_ID)).toEqual(fixture);
  abortSignal.mockResolvedValue({error: {message: 'offline'}});
  await expect(importGuestItems()).rejects.toThrow('Device items are unchanged');
  await waitFor(async () => expect(await readLocalTasks(GUEST_ID)).toEqual(fixture));
});