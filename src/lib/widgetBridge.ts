import { NativeModules, Platform } from 'react-native';

interface WidgetSharedStoreNative {
  setSnapshot: (snapshot: string) => Promise<boolean>;
  clearSnapshot: () => Promise<boolean>;
}

const nativeModule = NativeModules.WidgetSharedStore as WidgetSharedStoreNative | undefined;

interface WidgetTaskSnapshot {
  id: string;
  content: string;
  date: string;
  targetGroup: string;
  isComplete: boolean;
}

interface WidgetSnapshotPayload {
  generatedAt: string;
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

export const clearWidgetSnapshot = async () => {
  if (Platform.OS !== 'ios' || !nativeModule?.clearSnapshot) {
    return;
  }

  await nativeModule.clearSnapshot();
};
