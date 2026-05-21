import DeviceInfo from 'react-native-device-info';

const fallbackVersion = require('../../package.json')?.version ?? '0.0.0';

const nativeVersion = DeviceInfo.getVersion();

export const appVersion = nativeVersion || fallbackVersion;
