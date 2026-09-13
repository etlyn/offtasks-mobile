import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { v4 as randomUUID } from 'uuid';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { createReactNativeAnalytics } from '@etlyn/analytics/react-native';
import config from './production.json';

export const mobileScreens = ['calendar', 'notes', 'goals', 'later', 'statistics'] as const;
// Public collection keys identify the application; they are not account credentials.
// Development builds never send production analytics.
const nativePlatform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;
export const analytics = !__DEV__ && nativePlatform
  ? createReactNativeAnalytics({
      applicationKey: config.keys[nativePlatform],
      apiBaseUrl: config.apiBaseUrl,
      appVersion: DeviceInfo.getVersion(),
      platform: nativePlatform,
      randomUUID,
      storage: AsyncStorage,
      appState: AppState,
      screens: mobileScreens,
      allowedEvents: { screen_view: ['screen'], task_created: [] },
    })
  : null;

export function trackTaskCreated() {
  // Call only after the task repository confirms its write. Never pass task data.
  void analytics?.track('task_created');
}
