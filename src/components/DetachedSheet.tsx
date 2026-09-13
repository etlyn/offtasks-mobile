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
}) {
  const theme = useAppTheme();
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
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.isDark
                ? 'rgba(0,0,0,0.28)'
                : 'rgba(17,29,24,0.12)',
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
      >
        <View
          pointerEvents="box-none"
          style={[
            s.position,
            {
              paddingTop: insetTop + 12,
              paddingBottom: keyboardVisible
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
        </View>
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
