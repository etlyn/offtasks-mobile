import React from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useAppTheme } from '@/theme/colors';
import { analytics } from './index';

export function AnalyticsPreferences() {
  const theme = useAppTheme();
  const [enabled, setEnabled] = React.useState(analytics?.isEnabled() ?? false);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => analytics?.subscribe(() => setEnabled(analytics?.isEnabled() ?? false)), []);
  const update = async (value: boolean) => {
    setBusy(true);
    try { await analytics?.setEnabled(value); }
    catch { Alert.alert('Preference could not be saved', 'Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Product analytics</Text>
        <Switch accessibilityLabel="Product analytics" value={enabled} disabled={busy || !analytics}
          onValueChange={value => void update(value)} trackColor={{true: theme.colors.switchTrackOn}} />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="About product analytics"
        onPress={() => Alert.alert('Product analytics', 'Etlyn Analytics records screen names, successful task creation, event times, app version and platform, and approximate country/city from uploads. It never sends task text, notes, goals, email or account identifiers. A random installation ID and offline queue are stored on this device. Events are retained for 400 days; queued events expire after 7 days. Disabling clears the local queue and installation ID and stops future collection. Previously received events remain until retention expires. Development builds do not collect analytics.')}>
        <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>What is collected</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { paddingVertical: 12 }, row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:12 },
  label: { fontSize:14, fontWeight:'500' }, detail: {fontSize:12, paddingVertical:12},
});
