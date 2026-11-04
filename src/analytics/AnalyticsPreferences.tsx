import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Settings } from 'lucide-react-native';
import {
  DrawerDestination,
  FlowButton,
  FlowNotice,
  useDrawerPalette,
} from '@/components/navigation/DrawerFlowUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { analytics } from './index';

const collected =
  'Screen names, successful task creation, event times, version/platform and approximate country/city. No task text, notes, goals, email or account identifiers.';
const retention =
  'A random installation ID and offline queue stay on this device. Events: 400 days; queued events expire after 7 days. Turning off clears the device queue and ID and stops future collection; received events remain until retention expires. Development builds do not collect.';

export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  return (
    <DrawerDestination title="Privacy & analytics" onBack={onBack}>
      <AnalyticsPreferences />
    </DrawerDestination>
  );
}

export function AnalyticsPreferences() {
  const palette = useDrawerPalette();
  const { animateLayout } = useCalendarTransition();
  const [enabled, setEnabled] = React.useState(analytics?.isEnabled() ?? false);
  const [busy, setBusy] = React.useState(false);
  const [failedChoice, setFailedChoice] = React.useState<boolean | null>(null);
  const mounted = React.useRef(true);
  const lock = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    const tracker = analytics;
    const unsubscribe = tracker?.subscribe(() => {
      if (mounted.current) setEnabled(tracker.isEnabled());
    });
    return () => {
      mounted.current = false;
      unsubscribe?.();
    };
  }, []);
  const update = async (value: boolean) => {
    if (!analytics || lock.current) return;
    lock.current = true;
    setBusy(true);
    setFailedChoice(null);
    try {
      await analytics.setEnabled(value);
    } catch {
      if (mounted.current) {
        animateLayout();
        setFailedChoice(value);
      }
    } finally {
      lock.current = false;
      if (mounted.current) {
        setEnabled(analytics.isEnabled());
        setBusy(false);
      }
    }
  };
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: palette.soft }]}>
          <Settings size={18} strokeWidth={1.7} color={palette.brand} />
        </View>
        <Text style={[styles.label, { color: palette.text }]}>
          Product analytics
        </Text>
        <View style={styles.switchTarget}>
          <Switch
            accessibilityLabel="Product analytics"
            accessibilityState={{ busy, disabled: busy || !analytics }}
            value={enabled}
            disabled={busy || !analytics}
            onValueChange={value => void update(value)}
            trackColor={{ false: palette.divider, true: palette.brand }}
            style={styles.switch}
          />
        </View>
      </View>
      <FlowNotice title="What is collected">{collected}</FlowNotice>
      <Text style={[styles.detail, { color: palette.secondary }]}>
        {retention}
      </Text>
      {failedChoice !== null ? (
        <View accessibilityLiveRegion="polite" accessibilityRole="alert">
          <FlowNotice title="Couldn’t save preference">
            {failedChoice === false && !enabled
              ? 'Analytics are off for this session. Try again to save your choice.'
              : 'Your previous setting is unchanged. Try again.'}
          </FlowNotice>
          <View style={styles.retry}>
            <FlowButton
              title="Retry saving preference"
              secondary
              disabled={busy}
              onPress={() => void update(failedChoice)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 15, fontWeight: '500', lineHeight: 20 },
  switchTarget: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: { width: 51, height: 31, transform: [{ scale: 0.78 }] },
  detail: { fontSize: 13, lineHeight: 20 },
  retry: { marginTop: 12 },
});
