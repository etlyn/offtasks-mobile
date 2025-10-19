import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/branding/Logo';
import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { palette } from '@/theme/colors';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

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

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Logo size={64} />
        <Text style={styles.heroTitle}>Offtasks preferences</Text>
        <Text style={styles.heroSubtitle}>
          Tune the mobile experience and manage your account.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{session?.user?.email ?? 'Unknown user'}</Text>
          </View>
        </View>
        <View style={[styles.row, styles.rowSpacing]}>
          <View>
            <Text style={styles.rowLabel}>Sync status</Text>
            <Text style={styles.rowValue}>Connected to Supabase</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignOut}>
          <Text style={styles.primaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Support</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Need a hand?</Text>
            <Text style={styles.rowValue}>Email hello@offtasks.com</Text>
          </View>
        </View>
      </View>

      <Text style={styles.versionText}>Version 0.1.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowSpacing: {
    marginTop: 16,
  },
  rowLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  rowValue: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.accent,
  },
  primaryButtonText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  versionText: {
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
