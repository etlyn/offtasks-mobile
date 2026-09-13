import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { GUEST_ID } from '@/lib/localTasks';
import { readPlanner, writePlanner, syncPlanner } from '@/lib/plannerSync';

export const DEFAULT_TASK_CATEGORIES: string[] = [];

export const normalizeCategory = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\w/g, match => match.toUpperCase());

const sanitizeCategories = (values: string[]) =>
  Array.from(new Set(values.map(normalizeCategory).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right),
  );

const applyCategoryUpdate = (
  previous: string[],
  updater: (current: string[]) => string[],
) => sanitizeCategories(updater(previous));

export const useTaskCategories = () => {
  const userId = useAuth().session?.user.id || GUEST_ID;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<string[]>(
    DEFAULT_TASK_CATEGORIES,
  );
  const categoriesRef = React.useRef(categories);
  const hydratedUser = React.useRef<string | null>(null);
  const currentUser = React.useRef(userId);
  const loadVersion = React.useRef(0);
  currentUser.current = userId;
  React.useEffect(
    () => () => {
      loadVersion.current += 1;
    },
    [],
  );

  React.useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const loadCategories = React.useCallback(async () => {
    const version = ++loadVersion.current;
    // Refocusing a loaded page refreshes quietly instead of replacing its
    // rows with a spinner (and re-registering the dock action mid-slide).
    setLoading(hydratedUser.current !== userId);
    setError(null);
    try {
      const next = await readPlanner(userId, 'goal');
      if (version !== loadVersion.current || currentUser.current !== userId)
        return;
      hydratedUser.current = userId;
      categoriesRef.current = next;
      setCategories(previous =>
        previous.length === next.length &&
        previous.every((value, index) => value === next[index])
          ? previous
          : next,
      );
    } catch {
      if (version !== loadVersion.current || currentUser.current !== userId)
        return;
      setError('Saved goals could not be loaded. Try again before editing.');
    } finally {
      if (version === loadVersion.current && currentUser.current === userId)
        setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      loadCategories().catch(() => {});
      let active = true;
      void syncPlanner(userId, 'goal').then(() => {
        if (active) void loadCategories();
      });
      return () => {
        active = false;
      };
    }, [loadCategories, userId]),
  );

  const updateCategories = React.useCallback(
    async (updater: (previous: string[]) => string[]) => {
      if (!userId || loading || error)
        throw new Error('Goals are not ready. Please try again.');
      loadVersion.current += 1;
      const nextCategories = applyCategoryUpdate(
        categoriesRef.current,
        updater,
      );

      await writePlanner(userId, 'goal', nextCategories, categoriesRef.current);
      const saved = await readPlanner(userId, 'goal');
      loadVersion.current += 1;
      void syncPlanner(userId, 'goal');
      categoriesRef.current = saved;
      setCategories(saved);

      return nextCategories;
    },
    [userId, loading, error],
  );

  const addCategory = React.useCallback(
    async (value: string) => {
      const normalizedValue = normalizeCategory(value);
      if (!normalizedValue) {
        return null;
      }

      await updateCategories(previous => [...previous, normalizedValue]);
      return normalizedValue;
    },
    [updateCategories],
  );

  const removeCategory = React.useCallback(
    async (value: string) => {
      const normalizedValue = normalizeCategory(value);
      if (!normalizedValue) {
        return;
      }

      await updateCategories(previous =>
        previous.filter(category => category !== normalizedValue),
      );
    },
    [updateCategories],
  );

  return {
    categories,
    addCategory,
    removeCategory,
    loading,
    error,
    reload: loadCategories,
  };
};
