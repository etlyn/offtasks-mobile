import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { publishWidgetTheme } from '@/lib/widgetBridge';
import { fetchUserPreferences, upsertUserPreferences } from '@/lib/supabase';
import {GUEST_ID} from '@/lib/localTasks';
import { useAuth } from './AuthProvider';

type ThemeMode = 'Light' | 'Dark';

interface PreferencesContextValue {
  hideCompleted: boolean;
  advancedMode: boolean;
  themeMode: ThemeMode;
  autoArrange: boolean;
  redTasks: boolean;
  setHideCompleted: (value: boolean) => void;
  setAdvancedMode: (value: boolean) => void;
  setAutoArrange: (value: boolean) => void;
  setRedTasks: (value: boolean) => void;
  toggleTheme: () => void;
}

const HIDE_COMPLETED_KEY = 'offtasks:hide-completed';
const ADVANCED_MODE_KEY = 'offtasks:advanced-mode';
const THEME_MODE_KEY = 'offtasks:theme-mode';
const AUTO_ARRANGE_KEY = 'offtasks:auto-arrange';
const RED_TASKS_KEY = 'offtasks:red-tasks';

const PreferencesContext = createContext<PreferencesContextValue>({
  hideCompleted: false,
  advancedMode: false,
  themeMode: 'Light',
  autoArrange: false,
  redTasks: false,
  setHideCompleted: () => undefined,
  setAdvancedMode: () => undefined,
  setAutoArrange: () => undefined,
  setRedTasks: () => undefined,
  toggleTheme: () => undefined,
});

export const PreferencesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { session } = useAuth();
  const owner = session?.user.id || GUEST_ID;
  const [hideCompleted, setHideCompleted] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('Light');
  const [autoArrange, setAutoArrange] = useState(false);
  const [redTasks, setRedTasks] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const initialRemote = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setHydrated(false);
    hydratedRef.current = false;

    const hydrate = async () => {
      try {
        const [hideEntry, advancedEntry, themeEntry, autoEntry, redEntry] =
          await AsyncStorage.multiGet([
            HIDE_COMPLETED_KEY,
            ADVANCED_MODE_KEY,
            THEME_MODE_KEY,
            AUTO_ARRANGE_KEY,
            RED_TASKS_KEY,
          ].map(key => `${key}:${owner}`));

        if (!isMounted) {
          return;
        }

        const hideValue = hideEntry?.[1];
        const advancedValue = advancedEntry?.[1];
        const themeValue = themeEntry?.[1];
        const autoValue = autoEntry?.[1];
        const redValue = redEntry?.[1];

        setHideCompleted(hideValue === 'true');
        setAdvancedMode(advancedValue === 'true');
        setAutoArrange(autoValue === 'true');
        setRedTasks(redValue === 'true');
        if (themeValue === 'Light' || themeValue === 'Dark') {
          setThemeMode(themeValue);
        }
      } catch (error) {
        console.warn('Failed to hydrate preferences', error);
      } finally {
        hydratedRef.current = true;
        if (isMounted) {
          setHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [owner]);

  useEffect(() => {
    setRemoteReady(false);
    initialRemote.current = null;
    if (!hydrated || !session?.user?.id) {
      return;
    }

    let active = true;

    const hydrateRemote = async () => {
      const prefs = await fetchUserPreferences(session.user.id);
      if (!active) {
        return;
      }
      if (prefs) {
      initialRemote.current = JSON.stringify([!!prefs.hide_completed, !!prefs.advanced_mode, !!prefs.auto_arrange, prefs.theme_mode]);
      setHideCompleted(!!prefs.hide_completed);
      setAdvancedMode(!!prefs.advanced_mode);
      setAutoArrange(!!prefs.auto_arrange);
      if (prefs.theme_mode === 'Light' || prefs.theme_mode === 'Dark') {
        setThemeMode(prefs.theme_mode);
      }
      }
      setRemoteReady(true);
    };

    hydrateRemote().catch(error => console.warn('Preferences sync unavailable', error));

    return () => {
      active = false;
    };
  }, [session?.user?.id, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(`${HIDE_COMPLETED_KEY}:${owner}`, hideCompleted ? 'true' : 'false').catch(() => undefined);
  }, [hideCompleted, hydrated, owner]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(`${ADVANCED_MODE_KEY}:${owner}`, advancedMode ? 'true' : 'false').catch(() => undefined);
  }, [advancedMode, hydrated, owner]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(`${THEME_MODE_KEY}:${owner}`, themeMode).catch(() => undefined);
  }, [hydrated, themeMode, owner]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(`${AUTO_ARRANGE_KEY}:${owner}`, autoArrange ? 'true' : 'false').catch(() => undefined);
  }, [autoArrange, hydrated, owner]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(`${RED_TASKS_KEY}:${owner}`, redTasks ? 'true' : 'false').catch(() => undefined);
  }, [hydrated, redTasks, owner]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    publishWidgetTheme(themeMode).catch(error => {
      console.warn('Failed to sync widget theme', error);
    });
  }, [hydrated, themeMode]);

  useEffect(() => {
    if (!hydratedRef.current || !remoteReady || !session?.user?.id) {
      return;
    }
    const snapshot = JSON.stringify([hideCompleted, advancedMode, autoArrange, themeMode]);
    if (initialRemote.current === snapshot) return;

    upsertUserPreferences({
      user_id: session.user.id,
      hide_completed: hideCompleted,
      advanced_mode: advancedMode,
      theme_mode: themeMode,
      auto_arrange: autoArrange,
    }).then(() => {initialRemote.current = snapshot;}).catch(error => {
      console.warn('Failed to sync preferences', error);
    });
  }, [advancedMode, autoArrange, hideCompleted, session?.user?.id, themeMode, remoteReady]);

  const toggleTheme = useCallback(() => {
    setThemeMode(prev => (prev === 'Light' ? 'Dark' : 'Light'));
  }, []);

  const value = useMemo(
    () => ({
      hideCompleted,
      advancedMode,
      themeMode,
      autoArrange,
      redTasks,
      setHideCompleted,
      setAdvancedMode,
      setAutoArrange,
      setRedTasks,
      toggleTheme,
    }),
    [
      advancedMode,
      autoArrange,
      hideCompleted,
      redTasks,
      themeMode,
      toggleTheme,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
