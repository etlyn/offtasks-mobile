import {
  Platform,
  requireNativeComponent,
  UIManager,
  type ViewProps,
} from 'react-native';

// Keep registration isolated from theme and component modules. Fast Refresh
// can re-evaluate those modules, but a native view name must register only once.
export const OfftasksBlurNative =
  Platform.OS === 'ios' && UIManager.getViewManagerConfig('OfftasksBlur')
    ? requireNativeComponent<ViewProps & { dark: boolean; intensity?: number }>(
        'OfftasksBlur',
      )
    : null;
