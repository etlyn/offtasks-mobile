import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

import { LogoWordmark } from '@/components/branding/LogoWordmark';
import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import { palette } from '@/theme/colors';

export const DashboardHeader = () => {
  const { session } = useAuth();
  const { totals } = useTasks();
  const navigation = useNavigation();

  const handleToggleDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  }, [navigation]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert('Sign out failed', (error as Error).message);
    }
  };

  const metrics = [
    { label: 'Open', value: totals.pending },
    { label: 'Completed', value: totals.completed },
    { label: 'Total', value: totals.all },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.menuButton} />
        <View style={styles.centerBrand}>
          <LogoWordmark width={140} height={32} />
        </View>
        <TouchableOpacity
          onPress={handleToggleDrawer}
          accessibilityRole="button"
          accessibilityLabel="Toggle navigation menu"
          style={styles.glassButton}
        >
          <Feather name="menu" size={22} color={palette.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>Hi, {session?.user?.email?.split('@')[0] ?? 'there'}</Text>
        <Text style={styles.caption}>Your task overview</Text>
      </View>

      <View style={styles.metricsCard}>
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metricItem}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  menuButton: {
    width: 44,
    height: 44,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  centerBrand: {
    flex: 1,
    alignItems: 'center',
  },
  greetingSection: {
    marginBottom: 24,
  },
  greeting: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  caption: {
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  metricsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  metricLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
