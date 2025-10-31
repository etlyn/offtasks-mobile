import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/branding/Logo';
import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

import { styles } from './Settings.styles';

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
