import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { publishWidgetTheme } from '@/lib/widgetBridge';
import { fetchUserPreferences, upsertUserPreferences } from '@/lib/supabase';
import { GUEST_ID } from '@/lib/localTasks';
import { useAuth } from './AuthProvider';

type ThemeMode = 'Light' | 'Dark';
type Preferences = {
  themeMode: ThemeMode;
  movePastTasksToLater: boolean;
  setMovePastTasksToLater: (enabled: boolean) => void;
  toggleTheme: () => void;
};
const PreferencesContext = createContext<Preferences>({
  themeMode: 'Light',
  movePastTasksToLater: false,
  setMovePastTasksToLater: () => undefined,
  toggleTheme: () => undefined,
});
const THEME_KEY = 'offtasks:theme-mode';
// Deliberately separate from retired auto-arrange: old consent must not opt in.
const LATER_KEY = 'offtasks:move-past-tasks-to-later';
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const owner = session?.user.id || GUEST_ID;
  const [settings, setSettings] = useState<{
    owner: string;
    themeMode: ThemeMode;
    movePastTasksToLater: boolean;
  } | null>(null);
  const [remoteReady, setRemoteReady] = useState<string | null>(null);
  const ready = settings?.owner === owner;
  const themeMode = ready ? settings.themeMode : 'Light';
  const movePastTasksToLater = ready ? settings.movePastTasksToLater : false;
  useEffect(() => {
    let active = true;
    setRemoteReady(null);
    (async () => {
      let theme: ThemeMode = 'Light';
      let later = false;
      try {
        const values = await AsyncStorage.multiGet([
          `${THEME_KEY}:${owner}`,
          `${LATER_KEY}:${owner}`,
        ]);
        theme = values[0]?.[1] === 'Dark' ? 'Dark' : 'Light';
        later = values[1]?.[1] === 'true';
      } catch (error) {
        console.warn('Failed to hydrate preferences', error);
      }
      if (!active) return;
      setSettings({ owner, themeMode: theme, movePastTasksToLater: later });
      if (owner !== GUEST_ID) {
        try {
          const remote = await fetchUserPreferences(owner);
          if (!active) return;
          if (remote?.theme_mode === 'Dark' || remote?.theme_mode === 'Light')
            setSettings(value =>
              value?.owner === owner
                ? { ...value, themeMode: remote.theme_mode as ThemeMode }
                : value,
            );
        } catch (error) {
          console.warn('Preferences sync unavailable', error);
        }
      }
      if (active) setRemoteReady(owner);
    })();
    return () => {
      active = false;
    };
  }, [owner]);
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.multiSet([
      [`${THEME_KEY}:${owner}`, themeMode],
      [`${LATER_KEY}:${owner}`, String(movePastTasksToLater)],
    ]).catch(error => console.warn('Could not save preferences', error));
  }, [ready, owner, themeMode, movePastTasksToLater]);
  useEffect(() => {
    if (ready) publishWidgetTheme(themeMode).catch(() => undefined);
  }, [ready, themeMode]);
  useEffect(() => {
    if (!ready || remoteReady !== owner || owner === GUEST_ID) return;
    upsertUserPreferences({
      user_id: owner,
      theme_mode: themeMode,
      hide_completed: false,
      advanced_mode: false,
      auto_arrange: false,
    }).catch(error => console.warn('Failed to sync preferences', error));
  }, [ready, remoteReady, owner, themeMode]);
  const toggleTheme = useCallback(() => {
    setSettings(value =>
      value?.owner === owner
        ? {
            ...value,
            themeMode: value.themeMode === 'Light' ? 'Dark' : 'Light',
          }
        : value,
    );
  }, [owner]);
  const setMovePastTasksToLater = useCallback(
    (enabled: boolean) => {
      setSettings(value =>
        value?.owner === owner
          ? { ...value, movePastTasksToLater: enabled }
          : value,
      );
    },
    [owner],
  );
  const value = useMemo(
    () => ({
      themeMode,
      movePastTasksToLater,
      toggleTheme,
      setMovePastTasksToLater,
    }),
    [themeMode, movePastTasksToLater, toggleTheme, setMovePastTasksToLater],
  );
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
export const usePreferences = () => useContext(PreferencesContext);
