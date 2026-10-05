import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createMigratingSecureStorageAdapter} from '@etlyn/etlyn-auth/react-native';

const service = (key: string) => `etlyn.offtasks.auth.${key}`;
export const authStorage = createMigratingSecureStorageAdapter({
  async getItem(key) {
    const credentials = await Keychain.getGenericPassword({service: service(key)});
    return credentials ? credentials.password : null;
  },
  async setItem(key, value) {
    const stored = await Keychain.setGenericPassword('session', value, {
      service: service(key), accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    if (!stored) throw new Error('Unable to save the managed session in Keychain.');
  },
  async removeItem(key) {
    await Keychain.resetGenericPassword({service: service(key)});
  },
}, AsyncStorage);
