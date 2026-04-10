import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';

const CATEGORY_STORAGE_KEY = '@offtasks/task-categories:v1';

export const DEFAULT_TASK_CATEGORIES = [
  'Work',
  'Personal',
  'Home',
  'Shopping',
  'Health',
  'Finance',
];

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

const readStoredCategories = async () => {
  const storedValue = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);

  if (!storedValue) {
    return DEFAULT_TASK_CATEGORIES;
  }

  const parsed = JSON.parse(storedValue);
  if (!Array.isArray(parsed)) {
    return DEFAULT_TASK_CATEGORIES;
  }

  return sanitizeCategories(parsed.filter(value => typeof value === 'string'));
};

export const useTaskCategories = () => {
  const [categories, setCategories] = React.useState<string[]>(
    DEFAULT_TASK_CATEGORIES,
  );
  const categoriesRef = React.useRef(categories);

  React.useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const loadCategories = React.useCallback(async () => {
    try {
      setCategories(await readStoredCategories());
    } catch {
      setCategories(DEFAULT_TASK_CATEGORIES);
    }
  }, []);

  React.useEffect(() => {
    loadCategories().catch(() => {});
  }, [loadCategories]);

  useFocusEffect(
    React.useCallback(() => {
      loadCategories().catch(() => {});
    }, [loadCategories]),
  );

  const updateCategories = React.useCallback(
    async (updater: (previous: string[]) => string[]) => {
      const nextCategories = applyCategoryUpdate(categoriesRef.current, updater);

      categoriesRef.current = nextCategories;
      setCategories(nextCategories);

      await AsyncStorage.setItem(
        CATEGORY_STORAGE_KEY,
        JSON.stringify(nextCategories),
      );

      return nextCategories;
    },
    [],
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
  };
};