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
  View,
} from 'react-native';

import { SUPABASE_RESET_REDIRECT_URL } from '@env';

import { supabaseClient } from '@/lib/supabase';
import { authErrorMessage } from '@/utils/authErrors';
import { useAppTheme } from '@/theme/colors';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { PlannerHeader } from '@/components/navigation/PlannerHeader';

import {
  GentlePressable as TouchableOpacity,
  PageBackdrop,
} from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';

const redirectUrl =
  SUPABASE_RESET_REDIRECT_URL || 'https://offtasks.com/reset-password';

type AuthMode = 'signIn' | 'signUp';

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useAppTheme();
  const { animateLayout } = useCalendarTransition();
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [loading, setLoading] = useState(false);
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const toggleMode = () => {
    if (loading) return;
    animateLayout();
    setMode(prev => (prev === 'signIn' ? 'signUp' : 'signIn'));
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    if (loading) return;
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
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          Alert.alert(
            'Account created',
            'Check your email to confirm your account, then sign in for sync.',
          );
          setMode('signIn');
        }
      }
    } catch (error) {
      Alert.alert('Authentication error', authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;
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
      Alert.alert('Reset failed', authErrorMessage(error));
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
      <PageBackdrop />
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
      />
      <PlannerHeader
        title="Account"
        onBack={() => navigation.navigate('Calendar')}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          offtasks<Text style={{ color: brand }}>.</Text>
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'signIn'
            ? 'Sign in for cross-device sync.'
            : 'Create your sync account.'}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            editable={!loading}
            selectionColor={brand}
            accessibilityLabel="Email"
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
            editable={!loading}
            selectionColor={brand}
            accessibilityLabel="Password"
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
            keyboardAppearance={theme.keyboardAppearance}
          />
        </View>

        {mode === 'signUp' ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              editable={!loading}
              selectionColor={brand}
              accessibilityLabel="Confirm password"
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
              keyboardAppearance={theme.keyboardAppearance}
            />
          </View>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.isDark ? '#101916' : '#FFFFFF'} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
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
          accessibilityRole="button"
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
      paddingTop: 24,
      paddingBottom: 144,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 28,
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
      minHeight: 44,
      paddingVertical: 12,
      fontSize: 16,
    },
    primaryButton: {
      backgroundColor: theme.isDark ? '#D8F3E5' : '#152D25',
      minHeight: 44,
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.isDark ? '#101916' : '#FFFFFF',
    },
    secondaryButton: {
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    secondaryButtonText: {
      color: theme.isDark ? '#D8F3E5' : '#152D25',
      fontSize: 15,
    },
    linkButton: {
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
    },
    linkButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
  });
