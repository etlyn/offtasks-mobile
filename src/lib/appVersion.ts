import DeviceInfo from 'react-native-device-info';

const fallbackVersion = require('../../package.json')?.version ?? '0.0.0';

const nativeVersion = DeviceInfo.getVersion();
const nativeBuildNumber = DeviceInfo.getBuildNumber?.();

const releaseVersion =
	nativeVersion && nativeBuildNumber && !nativeVersion.endsWith(`.${nativeBuildNumber}`)
		? `${nativeVersion}.${nativeBuildNumber}`
		: nativeVersion;

export const appVersion = releaseVersion || fallbackVersion;
