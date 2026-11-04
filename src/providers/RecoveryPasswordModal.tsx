import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SUPABASE_RESET_REDIRECT_URL } from '@env';
import {
  DrawerDestination,
  FlowButton,
  FlowNotice,
  useDrawerPalette,
} from '@/components/navigation/DrawerFlowUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAppTheme } from '@/theme/colors';
import { authErrorMessage } from '@/utils/authErrors';
import { supabaseClient } from '../lib/supabase';

function expiredRecovery(error: unknown) {
  const failure = error as { status?: number; code?: string; message?: string };
  return (
    failure?.status === 401 ||
    failure?.status === 403 ||
    /expired|session_not_found|session_missing|bad_jwt|invalid.*token|refresh_token_not_found/i.test(
      `${failure?.code ?? ''} ${failure?.message ?? ''}`,
    )
  );
}

class RecoverySessionChanged extends Error {
  constructor() {
    super(
      'Your recovery session changed. Close this screen and open a fresh recovery link to continue.',
    );
  }
}

export function RecoveryPasswordModal({
  visible,
  onComplete,
  expectedOwner,
  requestOnly = false,
}: {
  visible: boolean;
  onComplete: () => void;
  expectedOwner?: string;
  requestOnly?: boolean;
}) {
  const palette = useDrawerPalette();
  const theme = useAppTheme();
  const { reduceMotion, animateLayout } = useCalendarTransition();
  const [password, setPassword] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [expired, setExpired] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [identityChanged, setIdentityChanged] = React.useState(false);
  const recoveryOwner = React.useRef<Promise<string | null>>(
    Promise.resolve(null),
  );
  const lock = React.useRef(false);
  const generation = React.useRef(0);
  const active = React.useRef(visible);
  const confirmationInput = React.useRef<TextInput>(null);

  React.useEffect(() => {
    const current = ++generation.current;
    active.current = visible;
    lock.current = false;
    setBusy(false);
    setPassword('');
    setConfirmation('');
    setEmail('');
    setError('');
    setExpired(false);
    setRequesting(false);
    setSent(false);
    setSaved(false);
    setIdentityChanged(false);
    recoveryOwner.current = Promise.resolve(null);
    if (visible && !requestOnly) {
      // Freeze this presentation to the callback owner (or the opening session).
      // Later session reads verify that identity; they never choose a new owner.
      recoveryOwner.current = supabaseClient.auth
        .getSession()
        .then(({ data }) => {
          if (
            active.current &&
            current === generation.current &&
            (!expectedOwner || data.session?.user.id === expectedOwner)
          )
            setEmail(value => value || data.session?.user.email || '');
          return expectedOwner ?? data.session?.user.id ?? null;
        })
        .catch(() => expectedOwner ?? null);
    }
    return () => {
      active.current = false;
    };
  }, [visible, expectedOwner, requestOnly]);

  const currentAttempt = () => {
    const attempt = generation.current;
    return () => active.current && attempt === generation.current;
  };
  const close = () => {
    if (lock.current) return;
    setPassword('');
    setConfirmation('');
    setEmail('');
    setError('');
    onComplete();
  };
  const verifyOwner = async (
    owner: string | null,
    isCurrent: () => boolean,
  ) => {
    const result = await supabaseClient.auth.getSession();
    if (!isCurrent()) return false;
    if (result.error) throw result.error;
    if (!owner || result.data.session?.user.id !== owner)
      throw new RecoverySessionChanged();
    return true;
  };
  const finish = async () => {
    if (lock.current || !visible || identityChanged || requestOnly) return;
    if (!saved && (password.length < 10 || password !== confirmation)) {
      setError(
        password.length < 10
          ? 'Use at least 10 characters for your password.'
          : 'The passwords do not match.',
      );
      return;
    }
    lock.current = true;
    const isCurrent = currentAttempt();
    const openingOwner = recoveryOwner.current;
    setBusy(true);
    setError('');
    let passwordWasSaved = saved;
    try {
      const owner = await openingOwner;
      if (!isCurrent()) return;
      if (!passwordWasSaved) {
        if (!(await verifyOwner(owner, isCurrent))) return;
        const result = await supabaseClient.auth.updateUser({ password });
        if (result.error) throw result.error;
        passwordWasSaved = true;
        if (!isCurrent()) return;
        setSaved(true);
        setPassword('');
        setConfirmation('');
      }
      if (!isCurrent() || !(await verifyOwner(owner, isCurrent))) return;
      const result = await supabaseClient.auth.signOut({ scope: 'local' });
      if (result.error) throw result.error;
      if (isCurrent()) onComplete();
    } catch (caught) {
      if (isCurrent()) {
        animateLayout();
        if (caught instanceof RecoverySessionChanged) {
          setIdentityChanged(true);
          setPassword('');
          setConfirmation('');
          setError(caught.message);
        } else if (passwordWasSaved) {
          setError(
            'Your password was saved. Please try again to finish signing out on this device.',
          );
        } else if (expiredRecovery(caught)) {
          setExpired(true);
          setError('');
        } else {
          setError(authErrorMessage(caught));
        }
      }
    } finally {
      if (isCurrent()) {
        lock.current = false;
        setBusy(false);
      }
    }
  };
  const requestLink = async () => {
    if (lock.current) return;
    if (!requesting) {
      animateLayout();
      setRequesting(true);
      setPassword('');
      setConfirmation('');
      return;
    }
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    lock.current = true;
    const isCurrent = currentAttempt();
    setBusy(true);
    setError('');
    try {
      const result = await supabaseClient.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: SUPABASE_RESET_REDIRECT_URL || 'offtasks://auth/recovery',
        },
      );
      if (result.error) throw result.error;
      if (isCurrent()) {
        animateLayout();
        setSent(true);
      }
    } catch (caught) {
      if (isCurrent()) setError(authErrorMessage(caught));
    } finally {
      if (isCurrent()) {
        lock.current = false;
        setBusy(false);
      }
    }
  };
  const input = [
    styles.input,
    {
      backgroundColor: palette.soft,
      borderColor: palette.divider,
      color: palette.text,
    },
  ];
  const label = [styles.label, { color: palette.secondary }];
  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={close}
      presentationStyle="fullScreen"
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <DrawerDestination
          title={requesting ? 'Reset password' : 'New password'}
          onBack={close}
          footer={
            <FlowButton
              title="Cancel"
              secondary
              disabled={busy}
              onPress={close}
            />
          }
        >
          <View style={styles.content}>
            {sent ? (
              <FlowNotice title="Check your inbox">
                If an account uses this email, a reset link is on its way.
              </FlowNotice>
            ) : requesting ? (
              <>
                <Text style={label}>Email</Text>
                <TextInput
                  accessibilityLabel="Recovery email"
                  value={email}
                  onChangeText={value => {
                    setEmail(value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  keyboardAppearance={theme.keyboardAppearance}
                  selectionColor={palette.brand}
                  returnKeyType="send"
                  onSubmitEditing={() => void requestLink()}
                  editable={!busy}
                  style={input}
                />
              </>
            ) : !saved && !requestOnly ? (
              <>
                <Text style={label}>New password</Text>
                <TextInput
                  accessibilityLabel="New password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={password}
                  onChangeText={value => {
                    setPassword(value);
                    setError('');
                  }}
                  editable={!busy && !expired && !identityChanged}
                  keyboardAppearance={theme.keyboardAppearance}
                  selectionColor={palette.brand}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmationInput.current?.focus()}
                  style={input}
                />
                <Text style={label}>Confirm password</Text>
                <TextInput
                  ref={confirmationInput}
                  accessibilityLabel="Confirm password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  value={confirmation}
                  onChangeText={value => {
                    setConfirmation(value);
                    setError('');
                  }}
                  editable={!busy && !expired && !identityChanged}
                  keyboardAppearance={theme.keyboardAppearance}
                  selectionColor={palette.brand}
                  returnKeyType="go"
                  onSubmitEditing={() => void finish()}
                  style={input}
                />
                <Text style={[styles.meta, { color: palette.secondary }]}>
                  At least 10 characters
                </Text>
              </>
            ) : null}
            {requestOnly && !requesting ? (
              <FlowNotice title="This link couldn’t be opened">
                Request a fresh link to reset your password. Your current
                account is unchanged.
              </FlowNotice>
            ) : null}
            {expired && !requesting ? (
              <FlowNotice title="This link has expired">
                Request a fresh link to reset your password.
              </FlowNotice>
            ) : null}
            {error ? (
              <View accessibilityRole="alert" accessibilityLiveRegion="polite">
                <FlowNotice
                  title={
                    identityChanged
                      ? 'Recovery session changed'
                      : saved
                      ? 'Password saved'
                      : 'Couldn’t continue'
                  }
                >
                  {error}
                </FlowNotice>
              </View>
            ) : null}
            {!sent ? (
              <FlowButton
                title={
                  busy
                    ? requesting
                      ? 'Sending…'
                      : saved
                      ? 'Signing out…'
                      : 'Saving…'
                    : requesting
                    ? 'Send reset link'
                    : expired || identityChanged || requestOnly
                    ? 'Request new link'
                    : saved
                    ? 'Finish sign-out'
                    : 'Save password'
                }
                disabled={
                  busy ||
                  (!requesting &&
                    !expired &&
                    !identityChanged &&
                    !requestOnly &&
                    !saved &&
                    (password.length < 10 || password !== confirmation))
                }
                onPress={() => {
                  void (expired || identityChanged || requestOnly || requesting
                    ? requestLink()
                    : finish());
                }}
              />
            ) : null}
          </View>
        </DrawerDestination>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 16 },
  label: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 25,
  },
  meta: { fontSize: 12, lineHeight: 16 },
});
