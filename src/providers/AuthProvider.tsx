import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('Error getting session', error);
      }

      if (!active) {
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

    const { data: subscription } = supabaseClient.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      active = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
