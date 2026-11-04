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
import { ArrowLeft } from 'lucide-react-native';
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
import { GentlePressable as Pressable } from '@/components/ProductUI';
import {
  FlowButton,
  FlowNotice,
  useDrawerPalette,
} from '@/components/navigation/DrawerFlowUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { completeWelcome } from '@/lib/onboarding';
import { useAuth } from '@/providers/AuthProvider';
import { shouldReviewGuestItems } from '@/lib/guestImportReview';
import { startGoogleSignIn } from '@/lib/googleSignIn';
import { GoogleMark } from '@/components/GoogleMark';

type AuthMode = 'signIn' | 'signUp' | 'reset';
export const LoginScreen = ({ onBack }: { onBack?: () => void } = {}) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute();
  const initialMode = (route.params as { initialMode?: AuthMode } | undefined)
    ?.initialMode;
  const theme = useAppTheme();
  const {
    reviewGuestImport,
    finishGuestImportReview,
    callbackError,
    clearCallbackError,
  } = useAuth();
  const insets = useSafeAreaInsets();
  const { animateLayout } = useCalendarTransition();
  const colors = useDrawerPalette();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState<AuthMode>(
    initialMode === 'signUp' || initialMode === 'reset'
      ? initialMode
      : 'signIn',
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const lock = React.useRef(false);
  const mounted = React.useRef(true);
  const emailInput = React.useRef<TextInput>(null);
  const passwordInput = React.useRef<TextInput>(null);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const back = () => {
    if (lock.current) return;
    if (onBack) onBack();
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };
  const changeMode = (next: AuthMode) => {
    if (lock.current) return;
    animateLayout();
    setMode(next);
    setError('');
    clearCallbackError?.();
    setSent(false);
    setPassword('');
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
    if (mode === 'signUp' && password.length < 10) {
      setError('Use at least 10 characters for your password.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    clearCallbackError?.();
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
              SUPABASE_RESET_REDIRECT_URL || 'offtasks://auth/recovery',
          },
        );
        if (result.error) throw result.error;
        if (mounted.current) {
          animateLayout();
          setSent(true);
        }
      } else if (mode === 'signIn') {
        finishGuestImportReview?.();
        if (await shouldReviewGuestItems()) reviewGuestImport?.();
        const result = await supabaseClient.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (result.error) throw result.error;
      } else {
        finishGuestImportReview?.();
        if (await shouldReviewGuestItems()) reviewGuestImport?.();
        const result = await supabaseClient.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: 'offtasks://auth/callback' },
        });
        if (result.error) throw result.error;
        if (!result.data.session && mounted.current) {
          animateLayout();
          setSent(true);
          setPassword('');
        }
      }
    } catch (reason) {
      finishGuestImportReview?.();
      if (mounted.current) {
        animateLayout();
        setError(authErrorMessage(reason));
      }
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const google = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    clearCallbackError?.();
    try {
      try {
        await completeWelcome();
      } catch {
        /* Sign-in remains available. */
      }
      finishGuestImportReview?.();
      if (await shouldReviewGuestItems()) reviewGuestImport?.();
      const result = await startGoogleSignIn();
      if (result === 'canceled') finishGuestImportReview?.();
    } catch (reason) {
      finishGuestImportReview?.();
      if (mounted.current) setError(authErrorMessage(reason));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const title =
    mode === 'signUp'
      ? 'Create account'
      : mode === 'reset'
      ? 'Reset password'
      : 'Sign in';
  const primaryLabel = mode === 'reset' ? 'Send reset link' : title;
  const failure = error || callbackError;
  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      backgroundColor: colors.soft,
      borderColor: colors.divider,
    },
    (busy || sent) && styles.disabledInput,
  ];
  const clearError = () => {
    setError('');
    clearCallbackError?.();
  };
  const useDifferentEmail = () => {
    animateLayout();
    setSent(false);
    setEmail('');
    setError('');
    requestAnimationFrame(() => emailInput.current?.focus());
  };
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => (mode !== 'signIn' ? changeMode('signIn') : back())}
          style={styles.iconButton}
        >
          <ArrowLeft size={18} strokeWidth={1.7} color={colors.brand} />
        </Pressable>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
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
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.secondary }]}>Email</Text>
          <TextInput
            ref={emailInput}
            accessibilityLabel="Email"
            editable={!busy && !sent}
            value={email}
            onChangeText={value => {
              setEmail(value);
              clearError();
            }}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            selectionColor={colors.brand}
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
        </View>
        {!sent && mode !== 'reset' ? (
          <>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondary }]}>
                Password
              </Text>
              <TextInput
                ref={passwordInput}
                accessibilityLabel="Password"
                editable={!busy}
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  clearError();
                }}
                placeholder={
                  mode === 'signUp' ? 'At least 10 characters' : 'Your password'
                }
                placeholderTextColor={colors.muted}
                selectionColor={colors.brand}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={
                  mode === 'signUp' ? 'new-password' : 'current-password'
                }
                textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
                keyboardAppearance={theme.keyboardAppearance}
                returnKeyType="go"
                onSubmitEditing={submit}
                style={inputStyle}
              />
            </View>
            {mode === 'signUp' ? (
              <Text style={[styles.meta, { color: colors.secondary }]}>
                At least 10 characters
              </Text>
            ) : null}
          </>
        ) : null}
        {mode === 'reset' ? (
          <Text style={[styles.detail, { color: colors.secondary }]}>
            We’ll send a link if this email can receive one.
          </Text>
        ) : null}
        {failure ? (
          <View
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <FlowNotice
              title={
                mode === 'signUp'
                  ? 'Unable to create account'
                  : mode === 'reset'
                  ? 'Unable to send reset link'
                  : 'Unable to sign in'
              }
            >
              {failure}
            </FlowNotice>
          </View>
        ) : null}
        {sent ? (
          <>
            <FlowNotice title="Check your inbox">
              {mode === 'reset'
                ? 'If this email can receive a reset link, one is on its way.'
                : `Confirm ${email.trim()} to finish creating your account.`}
            </FlowNotice>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use a different email"
              onPress={useDifferentEmail}
              style={styles.centerLink}
            >
              <Text style={[styles.centerLinkText, { color: colors.brand }]}>
                Use a different email
              </Text>
            </Pressable>
          </>
        ) : (
          <FlowButton
            title={
              busy
                ? mode === 'signUp'
                  ? 'Creating…'
                  : mode === 'reset'
                  ? 'Sending…'
                  : 'Signing in…'
                : primaryLabel
            }
            accessibilityLabel={primaryLabel}
            disabled={busy}
            onPress={submit}
          />
        )}
        {mode === 'signIn' ? (
          <View style={styles.links}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create an account"
              disabled={busy}
              onPress={() => changeMode('signUp')}
              style={[styles.textLink, styles.splitLink]}
            >
              <Text style={[styles.linkText, { color: colors.brand }]}>
                Create an account
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password?"
              disabled={busy}
              onPress={() => changeMode('reset')}
              style={[styles.textLink, styles.splitLink, styles.rightLink]}
            >
              <Text style={[styles.linkText, { color: colors.brand }]}>
                Forgot password?
              </Text>
            </Pressable>
          </View>
        ) : mode === 'signUp' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Already have an account? Sign in"
            disabled={busy}
            onPress={() => changeMode('signIn')}
            style={styles.textLink}
          >
            <Text style={[styles.linkText, { color: colors.brand }]}>
              Already have an account? Sign in
            </Text>
          </Pressable>
        ) : null}
        {!sent && mode !== 'reset' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            onPress={google}
            style={[
              styles.google,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <GoogleMark />
            <Text style={[styles.googleText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </Pressable>
        ) : null}
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
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600', flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, gap: 16 },
  field: { gap: 4 },
  label: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 25,
  },
  disabledInput: { opacity: 0.6 },
  meta: { fontSize: 12, lineHeight: 16 },
  detail: { fontSize: 13, lineHeight: 20 },
  links: { flexDirection: 'row', gap: 12 },
  textLink: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  splitLink: { flex: 1 },
  rightLink: { alignItems: 'flex-end' },
  linkText: { fontSize: 13, lineHeight: 20 },
  centerLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  centerLinkText: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  google: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  googleText: { fontSize: 14, fontWeight: '500' },
});
