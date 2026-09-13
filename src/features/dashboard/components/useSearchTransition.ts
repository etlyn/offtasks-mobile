import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

export const SEARCH_OPEN_MS = 420;
export const SEARCH_CLOSE_MS = 340;

/** Retain the overlay through exit, and reverse from its current presentation. */
export function useSearchTransition(
  visible: boolean,
  reduceMotion: boolean,
  onClosed: () => void,
) {
  const progress = useRef(new Animated.Value(0)).current;
  const fieldProgress = useRef(new Animated.Value(0)).current;
  const [present, setPresent] = useState(false);
  const [ready, setReady] = useState(false);
  const closed = useRef(onClosed);
  closed.current = onClosed;
  const wasPresented = useRef(false);

  useEffect(() => {
    if (!visible && !wasPresented.current) return;
    if (visible) {
      wasPresented.current = true;
      setPresent(true);
    }
    setReady(false);
    const finish = () => {
      if (visible) setReady(true);
      else {
        setPresent(false);
        wasPresented.current = false;
        closed.current();
      }
    };
    if (reduceMotion) {
      progress.setValue(visible ? 1 : 0);
      fieldProgress.setValue(visible ? 1 : 0);
      finish();
      return;
    }
    const config = {
      toValue: visible ? 1 : 0,
      duration: visible ? SEARCH_OPEN_MS : SEARCH_CLOSE_MS,
      easing: Easing.inOut(Easing.cubic),
      isInteraction: false,
    };
    const animation = Animated.parallel([
      // Page compositing remains native-driven. Only the field's real width
      // uses the layout driver, avoiding stretched text, icons or glass edges.
      Animated.timing(progress, { ...config, useNativeDriver: true }),
      Animated.timing(fieldProgress, { ...config, useNativeDriver: false }),
    ]);
    animation.start(({ finished }) => {
      if (finished) finish();
    });
    return () => animation.stop();
  }, [visible, reduceMotion, progress, fieldProgress]);

  return {
    mounted: visible || present,
    ready: visible && ready,
    progress,
    fieldProgress,
  };
}
