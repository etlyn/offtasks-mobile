import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabaseClient } from '@/lib/supabase';
import { palette } from '@/theme/colors';

import { styles } from './Login.styles';
import type { AuthMode } from './Login.types';

const redirectUrl = 'https://offtasks.com/reset-password';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Provide both email and password.');
      return;
    }

    if (mode === 'signUp' && password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Ensure both password fields are identical.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signIn') {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabaseClient.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        Alert.alert(
          'Check your inbox',
          'Confirm your email address to complete the signup, then sign in here.'
        );
        setMode('signIn');
      }
    } catch (error) {
      Alert.alert('Authentication error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Email required', 'Enter your account email first.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Reset link sent', 'Check your email to finish resetting your password.');
    } catch (error) {
      Alert.alert('Reset failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={24}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Offtasks</Text>
        <Text style={styles.subtitle}>
          {mode === 'signIn' ? 'Welcome back. Sign in to continue.' : 'Create an account to get started.'}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            keyboardAppearance="dark"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={palette.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textContentType="password"
            keyboardAppearance="dark"
          />
        </View>

        {mode === 'signUp' ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={palette.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              textContentType="password"
              keyboardAppearance="dark"
            />
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={palette.textPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={toggleMode} disabled={loading}>
          <Text style={styles.secondaryButtonText}>
            {mode === 'signIn'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleResetPassword} disabled={loading}>
          <Text style={styles.linkButtonText}>Forgot your password?</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
