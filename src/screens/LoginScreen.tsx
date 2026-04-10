import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SUPABASE_RESET_REDIRECT_URL } from '@env';

import { supabaseClient } from '@/lib/supabase';
import { palette, useAppTheme } from '@/theme/colors';

const redirectUrl =
  SUPABASE_RESET_REDIRECT_URL || 'https://offtasks.com/reset-password';

type AuthMode = 'signIn' | 'signUp';

export const LoginScreen = () => {
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [loading, setLoading] = useState(false);
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const toggleMode = () => {
    setMode(prev => (prev === 'signIn' ? 'signUp' : 'signIn'));
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
      Alert.alert(
        'Passwords do not match',
        'Ensure both password fields are identical.',
      );
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
          'Confirm your email address to complete the signup, then sign in here.',
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

      Alert.alert(
        'Reset link sent',
        'Check your email to finish resetting your password.',
      );
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
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Offtasks</Text>
        <Text style={styles.subtitle}>
          {mode === 'signIn'
            ? 'Welcome back. Sign in to continue.'
            : 'Create an account to get started.'}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            keyboardAppearance={theme.keyboardAppearance}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textContentType="password"
            keyboardAppearance={theme.keyboardAppearance}
          />
        </View>

        {mode === 'signUp' ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              textContentType="password"
              keyboardAppearance={theme.keyboardAppearance}
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={toggleMode}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>
            {mode === 'signIn'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.linkButtonText}>Forgot your password?</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
      padding: 24,
      paddingTop: 100,
      paddingBottom: 48,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 32,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
    },
    primaryButton: {
      backgroundColor: theme.isDark
        ? 'rgba(0, 150, 137, 0.22)'
        : 'rgba(6, 182, 212, 0.15)',
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 8,
      borderWidth: 1,
      borderColor: palette.accent,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    secondaryButton: {
      alignItems: 'center',
      marginTop: 24,
    },
    secondaryButtonText: {
      color: palette.accentMuted,
      fontSize: 15,
    },
    linkButton: {
      alignItems: 'center',
      marginTop: 16,
    },
    linkButtonText: {
      color: theme.colors.textSecondary,
      textDecorationLine: 'underline',
      fontSize: 14,
    },
  });
