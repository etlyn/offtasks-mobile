import {RecoveryPasswordModal} from './RecoveryPasswordModal';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {AppState, Linking} from 'react-native';
import {createDeepLinkHandler} from '@etlyn/etlyn-auth/react-native';
import type { Session } from '@supabase/supabase-js';

import { supabaseClient } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const restoredRevision = revision;
    const deepLink = createDeepLinkHandler({supabase: supabaseClient,
      validateUrl: url => /^offtasks:\/\/auth\/(?:callback|recovery)(?:[?#]|$)/.test(url.toString())});
    const onUrl = (url: string) => { void deepLink(url).then(handled => {if (handled && /^offtasks:\/\/auth\/recovery(?:[?#]|$)/.test(url)) setRecovering(true);}).catch(() => undefined); };
    void Linking.getInitialURL().then(url => { if (url) onUrl(url); });
    const linking = Linking.addEventListener('url', ({url}) => onUrl(url));
    const lifecycle = AppState.addEventListener('change', state => {
      if (state === 'active') supabaseClient.auth.startAutoRefresh();
      else supabaseClient.auth.stopAutoRefresh();
    });
    if (AppState.currentState === 'active') supabaseClient.auth.startAutoRefresh();

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
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}<RecoveryPasswordModal visible={recovering} onComplete={() => setRecovering(false)} /></AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
