/* eslint-env jest */

import 'react-native-gesture-handler/jestSetup';
import {AccessibilityInfo} from 'react-native';

// Match the native promise contract; individual accessibility tests may override it.
AccessibilityInfo.isReduceMotionEnabled = jest.fn().mockResolvedValue(false);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    getVersion: jest.fn(() => '1.06'),
    getBuildNumber: jest.fn(() => '2'),
  },
}));

// Product telemetry is isolated from UI and repository tests.
jest.mock('@/analytics', () => ({analytics: null, trackTaskCreated: jest.fn()}));


jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly'},
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));
