import React from 'react';
import { Alert, AppState, Linking, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import {
  readChatGPTStatus,
  revokeChatGPT,
  type ChatGPTStatus,
} from '@/lib/chatgptConnection';
import { integrationRequestKey } from '@/lib/goalIntegration';
import { useAppTheme } from '@/theme/colors';

/** Account authorization is shared; ChatGPT still owns installation and linking. */
export const ChatGPTConnection = ({ owner }: { owner: string }) => {
  const theme = useAppTheme();
  const [state, setState] = React.useState<ChatGPTStatus | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const active = React.useRef(false);
  const sequence = React.useRef(0);
  const lock = React.useRef(false);
  const retry = React.useRef<{ revision: string; key: string } | null>(null);
  const invalidateRequests = React.useCallback(() => {
    sequence.current++;
  }, []);

  const refresh = React.useCallback(async () => {
    const request = ++sequence.current;
    try {
      const result = await readChatGPTStatus();
      if (active.current && request === sequence.current) {
        setState(result);
        setFailed(false);
      }
    } catch {
      if (active.current && request === sequence.current) {
        setState(null);
        setFailed(true);
      }
    }
  }, []);

  React.useEffect(() => {
    active.current = true;
    setState(null);
    setFailed(false);
    void refresh();
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') void refresh();
    });
    return () => {
      active.current = false;
      invalidateRequests();
      subscription.remove();
    };
  }, [owner, refresh, invalidateRequests]);

  const disconnect = () => {
    const revision = state?.revision;
    if (!revision || busy || lock.current) return;
    Alert.alert(
      'Disconnect ChatGPT?',
      'ChatGPT will no longer have access to your Offtasks account. Your tasks and goals stay in Offtasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            if (lock.current) return;
            lock.current = true;
            if (retry.current?.revision !== revision)
              retry.current = { revision, key: integrationRequestKey() };
            setBusy(true);
            void revokeChatGPT(owner, revision, retry.current.key)
              .then(refresh)
              .catch(async () => {
                await refresh();
                if (active.current)
                  Alert.alert(
                    'Disconnect not confirmed',
                    'Check the connection status before trying again.',
                  );
              })
              .finally(() => {
                lock.current = false;
                if (active.current) setBusy(false);
              });
          },
        },
      ],
    );
  };

  const open = () => {
    if (!state?.installUrl) return;
    void Linking.openURL(state.installUrl).catch(() =>
      Alert.alert('Couldn’t open ChatGPT', 'Please try again.'),
    );
  };
  const detail = failed
    ? 'Status unavailable'
    : !state
    ? 'Checking…'
    : state.status === 'authorized'
    ? state.permissions.includes('write')
      ? 'Read and edit access'
      : 'Read-only access'
    : state.status === 'reconnect'
    ? 'Reconnect to continue'
    : state.installUrl
    ? 'Not connected'
    : 'Coming soon';

  return (
    <View style={{ marginTop: 8 }}>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 8,
        }}
      >
        CONNECTED APPS
      </Text>
      <View
        style={{
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Feather
          name="message-circle"
          size={19}
          color={theme.colors.textPrimary}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            ChatGPT
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {detail}
          </Text>
        </View>
        {failed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry ChatGPT connection status"
            onPress={() => void refresh()}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: theme.isDark ? '#D8F3E5' : '#285A43',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              Retry
            </Text>
          </Pressable>
        ) : state?.status === 'authorized' ||
          (state?.status === 'reconnect' && state.revision) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Disconnect ChatGPT"
            disabled={busy}
            onPress={disconnect}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              {busy ? 'Disconnecting…' : 'Disconnect'}
            </Text>
          </Pressable>
        ) : state?.installUrl ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Connect ChatGPT"
            onPress={open}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: theme.isDark ? '#D8F3E5' : '#285A43',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              Connect
            </Text>
          </Pressable>
        ) : null}
      </View>
      {state?.status === 'reconnect' && state.installUrl ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reconnect in ChatGPT"
          onPress={open}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text
            style={{
              color: theme.isDark ? '#D8F3E5' : '#285A43',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            Reconnect in ChatGPT
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};
