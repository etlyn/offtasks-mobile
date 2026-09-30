import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabaseClient } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  pendingGuestImport: boolean;
  reviewGuestImport: () => void;
  finishGuestImportReview: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  pendingGuestImport: false,
  reviewGuestImport: () => {},
  finishGuestImportReview: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingGuestImport, setPendingGuestImport] = useState(false);
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

    const { data: subscription } = supabaseClient.auth.onAuthStateChange(
      (_, nextSession) => {
        setSession(nextSession ?? null);
      },
    );

    return () => {
      active = false;
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
    }),
    [
      session,
      loading,
      pendingGuestImport,
      reviewGuestImport,
      finishGuestImportReview,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
