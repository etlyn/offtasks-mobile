import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {authStorage} from '../src/lib/authStorage';

const key = 'sb-nqsclqtpnosuhoobgyxc-auth-token';
beforeEach(async () => {
  await AsyncStorage.clear();
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
  (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({service: 'stored'});
});

test('migration retains the complete legacy session and planner data when Keychain rejects a write', async () => {
  const session = JSON.stringify({refresh_token: 'r'.repeat(6000)});
  await AsyncStorage.setItem(key, session);
  await AsyncStorage.setItem('planner-fixture', 'guest-data');
  (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(false);
  await expect(authStorage.getItem(key)).rejects.toThrow('Unable to save');
  expect(await AsyncStorage.getItem(key)).toBe(session);
  expect(await AsyncStorage.getItem('planner-fixture')).toBe('guest-data');
});

test('migration removes only the legacy auth value after a successful full Keychain write', async () => {
  const session = JSON.stringify({refresh_token: 'r'.repeat(6000)});
  await AsyncStorage.setItem(key, session);
  await AsyncStorage.setItem('planner-fixture', 'guest-data');
  expect(await authStorage.getItem(key)).toBe(session);
  expect(Keychain.setGenericPassword).toHaveBeenLastCalledWith('session', session,
    {service: `etlyn.offtasks.auth.${key}`, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
  expect(await AsyncStorage.getItem(key)).toBeNull();
  expect(await AsyncStorage.getItem('planner-fixture')).toBe('guest-data');
});
