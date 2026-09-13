import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type KeyboardEvent,
} from 'react-native';
import { OfftasksBlurNative } from '@/components/OfftasksBlurNative';
import { GlassSurface } from '@/components/GlassSurface';
import { useAppTheme } from '@/theme/colors';

/** A content-sized sheet, separately lifted above the system keyboard. */
export function DetachedSheet({
  visible,
  onClose,
  onDismiss,
  onShow,
  reduceMotion,
  insetTop,
  insetBottom,
  children,
  dismissLabel = 'Dismiss sheet',
  coordinateKeyboard = false,
}: {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onShow?: () => void;
  dismissLabel?: string;
  reduceMotion: boolean;
  insetTop: number;
  insetBottom: number;
  children: React.ReactNode;
  coordinateKeyboard?: boolean;
}) {
  const theme = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const coordinated = coordinateKeyboard && Platform.OS === 'ios';
  const restingGap = Math.max(insetBottom, 12) + 12;
  const initialGap = Math.max(
    restingGap,
    windowHeight - (Keyboard.metrics()?.screenY ?? windowHeight) + 12,
  );
  const keyboardGap = React.useRef(new Animated.Value(initialGap)).current;
  const keyboardTarget = React.useRef(initialGap);
  const [reduceTransparency, setReduceTransparency] = React.useState(true);
  React.useEffect(() => {
    if (!OfftasksBlurNative) return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => {
      if (active) setReduceTransparency(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  const progress = React.useRef(new Animated.Value(0)).current;
  const [present, setPresent] = React.useState(visible);
  const [shown, setShown] = React.useState(false);
  const [keyboardVisible, setKeyboardVisible] = React.useState(
    Keyboard.isVisible(),
  );
  const dismissed = React.useRef(onDismiss);
  dismissed.current = onDismiss;

  React.useEffect(() => {
    const updateKeyboard = (event: KeyboardEvent, showing: boolean) => {
      if (coordinated) {
        // Do not mix KeyboardAvoidingView's LayoutAnimation with composer
        // resizing. Retarget this value from its current presentation instead.
        const target = showing
          ? Math.max(
              windowHeight - event.endCoordinates.screenY + 12,
              restingGap,
            )
          : restingGap;
        keyboardTarget.current = target;
        keyboardGap.stopAnimation();
        if (reduceMotion) keyboardGap.setValue(target);
        else
          Animated.timing(keyboardGap, {
            toValue: target,
            duration: Math.max(event.duration || 0, 320),
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
            isInteraction: false,
          }).start();
      }
      setKeyboardVisible(showing);
    };
    const show = !coordinated
      ? Keyboard.addListener(
          Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
          event => updateKeyboard(event, true),
        )
      : null;
    const hide = !coordinated
      ? Keyboard.addListener(
          Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
          event => updateKeyboard(event, false),
        )
      : null;
    const frame = coordinated
      ? Keyboard.addListener('keyboardWillChangeFrame', event =>
          updateKeyboard(event, event.endCoordinates.screenY < windowHeight),
        )
      : null;
    return () => {
      show?.remove();
      hide?.remove();
      frame?.remove();
      keyboardGap.stopAnimation();
    };
  }, [coordinated, reduceMotion, windowHeight, restingGap, keyboardGap]);

  React.useEffect(() => {
    if (reduceMotion) {
      keyboardGap.stopAnimation();
      keyboardGap.setValue(keyboardTarget.current);
    }
  }, [reduceMotion, keyboardGap]);

  React.useEffect(() => {
    if (visible) setPresent(true);
    if (!shown) return;
    if (!visible) Keyboard.dismiss();
    const finish = () => {
      if (!visible) {
        setPresent(false);
        setShown(false);
        dismissed.current?.();
      }
    };
    progress.stopAnimation();
    if (reduceMotion) {
      progress.setValue(visible ? 1 : 0);
      finish();
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 360 : 280,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start(({ finished }) => {
      if (finished) finish();
    });
    return () => animation.stop();
  }, [visible, shown, reduceMotion, progress]);

  return (
    <Modal
      visible={visible || present}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => {
        setShown(true);
        onShow?.();
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: progress }]}
      >
        {OfftasksBlurNative && !reduceTransparency ? (
          <OfftasksBlurNative
            testID="sheet-backdrop-blur"
            dark={theme.isDark}
            intensity={0.015}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.isDark
                ? 'rgba(0,0,0,0.18)'
                : 'rgba(17,29,24,0.08)',
            },
          ]}
        />
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dismissLabel}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={s.avoidKeyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={!coordinated}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[
            s.position,
            {
              paddingTop: insetTop + 12,
              paddingBottom: coordinated
                ? keyboardGap
                : keyboardVisible
                ? 12
                : Math.max(insetBottom, 12) + 12,
            },
          ]}
          testID="detached-sheet-position"
        >
          <Animated.View
            accessibilityViewIsModal
            onAccessibilityEscape={onClose}
            pointerEvents={visible ? 'auto' : 'none'}
            testID="detached-task-sheet"
            style={[
              s.shadow,
              {
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <GlassSurface style={s.surface}>
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(16,25,22,0.76)'
                      : 'rgba(248,251,249,0.80)',
                  },
                ]}
              />
              {children}
            </GlassSurface>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  avoidKeyboard: { flex: 1 },
  position: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12 },
  shadow: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    maxHeight: '100%',
    flexShrink: 1,
    borderRadius: 28,
    shadowColor: '#102019',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    shadowOpacity: 0.14,
    elevation: 8,
  },
  surface: {
    flexShrink: 1,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
