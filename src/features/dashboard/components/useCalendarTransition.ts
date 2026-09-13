import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, LayoutAnimation } from 'react-native';

export const CALENDAR_TRANSITION_MS = 320;

export function useCalendarTransition() {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const animateLayout = useCallback(() => {
    if (reduceMotion) return;
    LayoutAnimation.configureNext({
      duration: CALENDAR_TRANSITION_MS,
      update: { type: 'easeInEaseOut' },
      create: { type: 'easeInEaseOut', property: 'opacity', duration: 220 },
      delete: { type: 'easeInEaseOut', property: 'opacity', duration: 180 },
    });
  }, [reduceMotion]);

  return { reduceMotion, animateLayout };
}
