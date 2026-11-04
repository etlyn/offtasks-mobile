import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearPlanner } from './plannerSync';
import { supabaseClient } from './supabase';
import { clearWidgetSnapshot } from './widgetBridge';

type CleanupRecord = { owner: string; phase: 'requested' | 'confirmed' };
type CleanupState = {
  record: CleanupRecord | null;
  ready: boolean;
  busy: boolean;
  error: string;
};
const KEY = 'offtasks:pending-account-data-cleanup:v1';
const listeners = new Set<() => void>();
let state: CleanupState = {
  record: null,
  ready: false,
  busy: false,
  error: '',
};
let loading: Promise<void> | null = null;
let retrying: Promise<void> | null = null;
const emit = (next: Partial<CleanupState>) => {
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const loadPendingAccountCleanup = () => {
  if (state.ready) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const record = raw ? JSON.parse(raw) : null;
      if (
        record &&
        (typeof record.owner !== 'string' ||
          !['requested', 'confirmed'].includes(record.phase))
      )
        throw new Error('Invalid cleanup record');
      emit({ record, ready: true, error: '' });
    } catch {
      emit({ error: 'Device cleanup status could not be read. Try again.' });
      throw new Error('Device cleanup status could not be read.');
    } finally {
      loading = null;
    }
  })();
  return loading;
};

/** Store intent before calling the server so an interrupted request is never blindly repeated. */
export async function beginAccountDataDeletion(owner: string) {
  await loadPendingAccountCleanup();
  if (state.record)
    throw new Error('An earlier deletion needs review or device cleanup.');
  const record: CleanupRecord = { owner, phase: 'requested' };
  await AsyncStorage.setItem(KEY, JSON.stringify(record));
  emit({ record, error: '' });
}

/** Call only after the server has explicitly confirmed app-scoped deletion. */
export async function confirmAccountDataDeletion(owner: string) {
  if (state.record?.owner !== owner)
    throw new Error('Deletion account changed.');
  const record: CleanupRecord = { owner, phase: 'confirmed' };
  // Retain confirmation in memory even when persisting it fails. The durable
  // requested marker still prevents another server deletion after a relaunch.
  emit({ record });
  await AsyncStorage.setItem(KEY, JSON.stringify(record));
}

/** Only clear an unconfirmed request after a known rejection or explicit user review. */
export async function clearRequestedAccountDeletion(owner: string) {
  await loadPendingAccountCleanup();
  if (state.record?.owner !== owner || state.record.phase !== 'requested')
    throw new Error('Confirmed deletions can only retry device cleanup.');
  await AsyncStorage.removeItem(KEY);
  emit({ record: null, error: '' });
}

/** This operation never calls delete-account and never removes device guest items. */
export const retryPendingAccountCleanup = (): Promise<void> => {
  if (retrying) return retrying;
  const operation = (async () => {
    await loadPendingAccountCleanup();
    const record = state.record;
    if (!record) return;
    if (record.phase !== 'confirmed')
      throw new Error(
        'Deletion was interrupted before its outcome was confirmed. Check your account before submitting deletion again.',
      );
    emit({ busy: true, error: '' });
    try {
      await clearPlanner(record.owner);
      const { data, error: sessionError } =
        await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      // The widget store has no owner field. Never clear a replacement account
      // or guest snapshot when retrying cleanup from an earlier account.
      if (data.session?.user.id === record.owner) {
        await clearWidgetSnapshot();
        const { data: latest, error: latestSessionError } =
          await supabaseClient.auth.getSession();
        if (latestSessionError) throw latestSessionError;
        if (latest.session?.user.id === record.owner) {
          const { error } = await supabaseClient.auth.signOut({
            scope: 'local',
          });
          if (error) throw error;
        }
      }
      await AsyncStorage.removeItem(KEY);
      emit({ record: null, error: '' });
    } catch {
      emit({
        error: 'Retry only device cleanup; don’t submit deletion again.',
      });
      throw new Error('Device cleanup could not be completed.');
    } finally {
      emit({ busy: false });
    }
  })();
  retrying = operation;
  operation
    .finally(() => {
      if (retrying === operation) retrying = null;
    })
    .catch(() => undefined);
  return operation;
};

export function usePendingAccountCleanup() {
  const value = React.useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
  React.useEffect(() => {
    loadPendingAccountCleanup().catch(() => undefined);
  }, []);
  return {
    owner: value.record?.owner ?? null,
    phase: value.record?.phase ?? null,
    ready: value.ready,
    busy: value.busy,
    error: value.error,
    retry: retryPendingAccountCleanup,
  };
}
