import AsyncStorage from '@react-native-async-storage/async-storage';

export const WELCOME_KEY = '@offtasks/welcome:v1';

// This flag is device-wide, not tied to an account. Never touch guest items.
export async function needsWelcome(signedIn: boolean): Promise<boolean> {
  try {
    if (signedIn) {
      await completeWelcome();
      return false;
    }
    return (await AsyncStorage.getItem(WELCOME_KEY)) !== 'complete';
  } catch {
    // A storage failure must not lock people out of their existing workspace.
    return false;
  }
}

export async function completeWelcome() {
  await AsyncStorage.setItem(WELCOME_KEY, 'complete');
}
