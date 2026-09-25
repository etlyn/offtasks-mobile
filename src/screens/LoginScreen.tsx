import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react-native';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUPABASE_RESET_REDIRECT_URL } from '@env';
import { supabaseClient } from '@/lib/supabase';
import { authErrorMessage } from '@/utils/authErrors';
import { useAppTheme } from '@/theme/colors';
import {
  GentlePressable as Pressable,
  PageBackdrop,
} from '@/components/ProductUI';
import { OfftasksLoader } from '@/components/OfftasksLoader';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { completeWelcome } from '@/lib/onboarding';

type AuthMode = 'signIn' | 'signUp' | 'reset';
export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute();
  const initialMode = (route.params as { initialMode?: AuthMode } | undefined)
    ?.initialMode;
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { animateLayout } = useCalendarTransition();
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [visible, setVisible] = React.useState(false);
  const [mode, setMode] = React.useState<AuthMode>(
    initialMode === 'signUp' ? 'signUp' : 'signIn',
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const lock = React.useRef(false);
  const mounted = React.useRef(true);
  const passwordInput = React.useRef<TextInput>(null);
  React.useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const back = () =>
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home');
  const changeMode = (next: AuthMode) => {
    if (lock.current) return;
    animateLayout();
    setMode(next);
    setError('');
    setSent(false);
    setPassword('');
    setVisible(false);
  };
  const submit = async () => {
    if (lock.current) return;
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode !== 'reset' && !password) {
      setError('Enter your password.');
      return;
    }
    if (mode === 'signUp' && password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      // Finish welcome before auth can remount the account-scoped workspace.
      try {
        await completeWelcome();
      } catch {
        /* Auth remains available without this flag. */
      }
      if (mode === 'reset') {
        const result = await supabaseClient.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo:
              SUPABASE_RESET_REDIRECT_URL ||
              'https://offtasks.com/reset-password',
          },
        );
        if (result.error) throw result.error;
        if (mounted.current) {
          animateLayout();
          setSent(true);
        }
      } else if (mode === 'signIn') {
        const result = await supabaseClient.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (result.error) throw result.error;
      } else {
        const result = await supabaseClient.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (result.error) throw result.error;
        if (!result.data.session && mounted.current) {
          animateLayout();
          setSent(true);
          setPassword('');
        }
      }
    } catch (reason) {
      if (mounted.current) {
        animateLayout();
        setError(authErrorMessage(reason));
      }
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const foreground = { color: theme.colors.textPrimary };
  const secondary = { color: theme.colors.textSecondary };
  const buttonText = { color: theme.isDark ? '#152D25' : '#FFFFFF' };
  const inputStyle = [
    styles.input,
    foreground,
    {
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.65)',
      borderColor: theme.colors.border,
    },
  ];
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PageBackdrop />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          disabled={busy}
          onPress={() => (mode === 'reset' ? changeMode('signIn') : back())}
          style={styles.iconButton}
        >
          <ArrowLeft size={20} color={brand} />
        </Pressable>
        <Text style={[styles.wordmark, foreground]}>
          offtasks<Text style={{ color: '#009689' }}>.</Text>
        </Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          {sent ? (
            <Mail
              size={30}
              strokeWidth={1.3}
              color={brand}
              style={styles.mail}
            />
          ) : null}
          <Text accessibilityRole="header" style={[styles.title, foreground]}>
            {sent
              ? 'Check your inbox.'
              : mode === 'signUp'
              ? 'A space that goes with you.'
              : mode === 'reset'
              ? 'Let’s get you back in.'
              : 'Welcome back.'}
          </Text>
          <Text style={[styles.description, secondary]}>
            {sent
              ? mode === 'reset'
                ? `If an account uses ${email.trim()}, you’ll receive a link to reset your password.`
                : `Follow the confirmation link sent to ${email.trim()}, then come back to sign in.`
              : mode === 'signUp'
              ? 'Keep your tasks, goals and notes in sync across devices.'
              : mode === 'reset'
              ? 'Enter your email. We’ll send a password reset link.'
              : 'Sign in to pick up where you left off.'}
          </Text>
        </View>
        {sent ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => changeMode('signIn')}
              style={[styles.primary, { backgroundColor: brand }]}
            >
              <Text style={[styles.primaryText, buttonText]}>
                Back to sign in
              </Text>
              <Check size={17} color={buttonText.color} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                animateLayout();
                setSent(false);
              }}
              style={styles.textButton}
            >
              <Text style={[styles.link, secondary]}>
                Use a different email
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={back}
              style={styles.textButton}
            >
              <Text style={[styles.link, { color: brand }]}>
                Continue without an account
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.label, secondary]}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              editable={!busy}
              value={email}
              onChangeText={value => {
                setEmail(value);
                setError('');
              }}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textMuted}
              selectionColor={brand}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardAppearance={theme.keyboardAppearance}
              returnKeyType={mode === 'reset' ? 'go' : 'next'}
              onSubmitEditing={() =>
                mode === 'reset' ? submit() : passwordInput.current?.focus()
              }
              style={inputStyle}
            />
            {mode !== 'reset' ? (
              <>
                <Text style={[styles.label, secondary]}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordInput}
                    accessibilityLabel="Password"
                    editable={!busy}
                    value={password}
                    onChangeText={value => {
                      setPassword(value);
                      setError('');
                    }}
                    placeholder={
                      mode === 'signUp'
                        ? 'At least 8 characters'
                        : 'Your password'
                    }
                    placeholderTextColor={theme.colors.textMuted}
                    selectionColor={brand}
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={
                      mode === 'signUp' ? 'new-password' : 'current-password'
                    }
                    textContentType={
                      mode === 'signUp' ? 'newPassword' : 'password'
                    }
                    keyboardAppearance={theme.keyboardAppearance}
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    style={[inputStyle, styles.passwordInput]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      visible ? 'Hide password' : 'Show password'
                    }
                    disabled={busy}
                    onPress={() => setVisible(value => !value)}
                    style={styles.eye}
                  >
                    {visible ? (
                      <EyeOff size={17} color={brand} />
                    ) : (
                      <Eye size={17} color={brand} />
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}
            {mode === 'signIn' ? (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => changeMode('reset')}
                style={[styles.textButton, styles.alignRight]}
              >
                <Text style={[styles.link, { color: brand }]}>
                  Forgot password?
                </Text>
              </Pressable>
            ) : null}
            {error ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[
                  styles.error,
                  { color: theme.isDark ? '#F3B8A7' : '#943F2B' },
                ]}
              >
                {error}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'signUp'
                  ? 'Create account'
                  : mode === 'reset'
                  ? 'Send reset link'
                  : 'Sign in'
              }
              accessibilityState={{ busy, disabled: busy }}
              disabled={busy}
              onPress={submit}
              style={[
                styles.primary,
                {
                  backgroundColor: brand,
                  marginTop: mode === 'signIn' ? 4 : 24,
                  opacity: busy ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.primaryText, buttonText]}>
                {busy
                  ? 'One moment…'
                  : mode === 'signUp'
                  ? 'Create account'
                  : mode === 'reset'
                  ? 'Send reset link'
                  : 'Sign in'}
              </Text>
              {!busy ? <ArrowRight size={17} color={buttonText.color} /> : null}
            </Pressable>
            {busy ? (
              <View style={styles.loading}>
                <OfftasksLoader compact />
              </View>
            ) : null}
            {mode !== 'reset' ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() =>
                    changeMode(mode === 'signIn' ? 'signUp' : 'signIn')
                  }
                  style={[styles.textButton, styles.switchMode]}
                >
                  <Text style={[styles.link, secondary]}>
                    {mode === 'signIn'
                      ? 'New here? '
                      : 'Already have an account? '}
                    <Text style={{ color: brand }}>
                      {mode === 'signIn' ? 'Create account' : 'Sign in'}
                    </Text>
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={back}
                  style={styles.textButton}
                >
                  <Text style={[styles.link, { color: brand }]}>
                    Continue without an account
                  </Text>
                </Pressable>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontSize: 20, fontWeight: '700', letterSpacing: -0.7 },
  body: { flexGrow: 1, paddingHorizontal: 28 },
  intro: { marginTop: 46, marginBottom: 32 },
  title: {
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.8,
    fontWeight: '600',
    maxWidth: 330,
  },
  description: { fontSize: 15, lineHeight: 23, marginTop: 12 },
  mail: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 9, marginTop: 12 },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eye: {
    position: 'absolute',
    right: 2,
    top: 3,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  link: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
  alignRight: { alignSelf: 'flex-end' },
  primary: {
    minHeight: 50,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  primaryText: { fontSize: 15, fontWeight: '600' },
  switchMode: { marginTop: 14 },
  error: { fontSize: 13, lineHeight: 20, marginVertical: 12 },
  loading: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
