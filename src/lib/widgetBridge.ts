import { NativeModules, Platform } from 'react-native';

import type { ThemeMode } from '@/theme/colors';

interface WidgetSharedStoreNative {
  setSnapshot: (snapshot: string) => Promise<boolean>;
  setThemeMode: (themeMode: ThemeMode) => Promise<boolean>;
  clearSnapshot: () => Promise<boolean>;
}

const nativeModule = NativeModules.WidgetSharedStore as WidgetSharedStoreNative | undefined;

interface WidgetTaskSnapshot {
  id: string;
  content: string;
  date: string | null;
  targetGroup: string;
  isComplete: boolean;
}

interface WidgetSnapshotPayload {
  generatedAt: string;
  themeMode: ThemeMode;
  todayTotalCount: number;
  todayCompletedCount: number;
  today: WidgetTaskSnapshot[];
  tomorrow: WidgetTaskSnapshot[];
  upcoming: WidgetTaskSnapshot[];
}

export const publishWidgetSnapshot = async (payload: WidgetSnapshotPayload) => {
  if (Platform.OS !== 'ios' || !nativeModule?.setSnapshot) {
    return;
  }

  await nativeModule.setSnapshot(JSON.stringify(payload));
};

export const publishWidgetTheme = async (themeMode: ThemeMode) => {
  if (Platform.OS !== 'ios' || !nativeModule?.setThemeMode) {
    return;
  }

  await nativeModule.setThemeMode(themeMode);
};

export const clearWidgetSnapshot = async () => {
  if (Platform.OS !== 'ios' || !nativeModule?.clearSnapshot) {
    return;
  }

  await nativeModule.clearSnapshot();
};
