import { RecoveryPasswordModal } from './RecoveryPasswordModal';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, Linking } from 'react-native';
import { completeNativeSignIn } from '@/lib/googleSignIn';
import type { Session } from '@supabase/supabase-js';

import { supabaseClient } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  pendingGuestImport: boolean;
  reviewGuestImport: () => void;
  finishGuestImportReview: () => void;
  callbackError: string;
  clearCallbackError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  pendingGuestImport: false,
  reviewGuestImport: () => {},
  finishGuestImportReview: () => {},
  callbackError: '',
  clearCallbackError: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingGuestImport, setPendingGuestImport] = useState(false);
  const [callbackError, setCallbackError] = useState('');
  const clearCallbackError = React.useCallback(() => setCallbackError(''), []);
  const reviewGuestImport = React.useCallback(
    () => setPendingGuestImport(true),
    [],
  );
  const finishGuestImportReview = React.useCallback(
    () => setPendingGuestImport(false),
    [],
  );

  useEffect(() => {
    let active = true;
    let revision = 0;
    const restoredRevision = revision;
    const onUrl = (url: string) => {
      void completeNativeSignIn(url)
        .then(handled => {
          if (!active || !handled) return;
          setCallbackError('');
          if (/^offtasks:\/\/auth\/recovery(?:[?#]|$)/.test(url))
            setRecovering(true);
        })
        .catch(() => {
          if (active)
            setCallbackError(
              'The sign-in link is invalid or expired. Please try signing in again.',
            );
        });
    };
    void Linking.getInitialURL().then(url => {
      if (url) onUrl(url);
    });
    const linking = Linking.addEventListener('url', ({ url }) => onUrl(url));
    const lifecycle = AppState.addEventListener('change', state => {
      if (state === 'active') supabaseClient.auth.startAutoRefresh();
      else supabaseClient.auth.stopAutoRefresh();
    });
    if (AppState.currentState === 'active')
      supabaseClient.auth.startAutoRefresh();

    const hydrate = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
          console.error('Error getting session', error);
        }

        if (!active || revision !== restoredRevision) {
          return;
        }

        setSession(data.session ?? null);
      } catch (error) {
        console.warn('Session unavailable; opening device workspace', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    hydrate();

    const { data: subscription } = supabaseClient.auth.onAuthStateChange(
      (_, nextSession) => {
        ++revision;
        setSession(nextSession ?? null);
      },
    );

    return () => {
      active = false;
      linking.remove();
      lifecycle.remove();
      supabaseClient.auth.stopAutoRefresh();
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      pendingGuestImport,
      reviewGuestImport,
      finishGuestImportReview,
      callbackError,
      clearCallbackError,
    }),
    [
      session,
      loading,
      pendingGuestImport,
      reviewGuestImport,
      finishGuestImportReview,
      callbackError,
      clearCallbackError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <RecoveryPasswordModal
        visible={recovering}
        onComplete={() => setRecovering(false)}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
