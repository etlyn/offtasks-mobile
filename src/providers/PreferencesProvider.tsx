import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'Light' | 'Dark';

interface PreferencesContextValue {
  hideCompleted: boolean;
  advancedMode: boolean;
  themeMode: ThemeMode;
  setHideCompleted: (value: boolean) => void;
  setAdvancedMode: (value: boolean) => void;
  toggleTheme: () => void;
}

const HIDE_COMPLETED_KEY = 'offtasks:hide-completed';
const ADVANCED_MODE_KEY = 'offtasks:advanced-mode';
const THEME_MODE_KEY = 'offtasks:theme-mode';

const PreferencesContext = createContext<PreferencesContextValue>({
  hideCompleted: false,
  advancedMode: false,
  themeMode: 'Light',
  setHideCompleted: () => undefined,
  setAdvancedMode: () => undefined,
  toggleTheme: () => undefined,
});

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [hideCompleted, setHideCompleted] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('Light');

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const [hideEntry, advancedEntry, themeEntry] = await AsyncStorage.multiGet([
          HIDE_COMPLETED_KEY,
          ADVANCED_MODE_KEY,
          THEME_MODE_KEY,
        ]);

        if (!isMounted) {
          return;
        }

        const hideValue = hideEntry?.[1];
        const advancedValue = advancedEntry?.[1];
        const themeValue = themeEntry?.[1];

        setHideCompleted(hideValue === 'true');
        setAdvancedMode(advancedValue === 'true');
        if (themeValue === 'Light' || themeValue === 'Dark') {
          setThemeMode(themeValue);
        }
      } catch (error) {
        console.warn('Failed to hydrate preferences', error);
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(HIDE_COMPLETED_KEY, hideCompleted ? 'true' : 'false');
  }, [hideCompleted]);

  useEffect(() => {
    AsyncStorage.setItem(ADVANCED_MODE_KEY, advancedMode ? 'true' : 'false');
  }, [advancedMode]);

  useEffect(() => {
    AsyncStorage.setItem(THEME_MODE_KEY, themeMode);
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'Light' ? 'Dark' : 'Light'));
  }, []);

  const value = useMemo(
    () => ({
      hideCompleted,
      advancedMode,
      themeMode,
      setHideCompleted,
      setAdvancedMode,
      toggleTheme,
    }),
    [advancedMode, hideCompleted, themeMode, toggleTheme]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);
