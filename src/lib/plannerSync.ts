import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseClient } from './supabase';
import { clearGoalAppearances } from './goalAppearance';
import { GUEST_ID } from './localTasks';
import { notesStorageKey, parseNotes, type Note } from './notes';

export type Collection = 'note' | 'goal';
type Item = {
  id: string;
  value: Note | string;
  deleted: boolean;
  dirty: boolean;
};
type State = { version: 1; items: Item[] };
const queues = new Map<string, Promise<unknown>>();
const syncs = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
const problems = new Map<string, string>();
export const plannerKey = (owner: string, kind: Collection) =>
  `@offtasks/planner:v1:${owner}:${kind}`;
export const subscribePlanner = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const emit = () => listeners.forEach(listener => listener());
export const plannerSyncProblem = (owner: string) =>
  problems.get(plannerKey(owner, 'note')) ??
  problems.get(plannerKey(owner, 'goal')) ??
  null;

const serial = <Result>(
  key: string,
  action: () => Promise<Result>,
): Promise<Result> => {
  const operation = (queues.get(key) ?? Promise.resolve())
    .catch(() => undefined)
    .then(action);
  queues.set(key, operation);
  void operation
    .finally(() => {
      if (queues.get(key) === operation) queues.delete(key);
    })
    .catch(() => undefined);
  return operation;
};

async function readState(owner: string, kind: Collection): Promise<State> {
  const raw = await AsyncStorage.getItem(plannerKey(owner, kind));
  if (raw !== null) {
    const state = JSON.parse(raw);
    if (
      state.version !== 1 ||
      !Array.isArray(state.items) ||
      !state.items.every(
        (item: Item) =>
          typeof item.id === 'string' &&
          typeof item.dirty === 'boolean' &&
          typeof item.deleted === 'boolean' &&
          (kind === 'goal'
            ? typeof item.value === 'string'
            : parseNotes(JSON.stringify([item.value])).length === 1),
      )
    )
      throw new Error(
        'Saved planner data could not be read. Nothing was erased.',
      );
    return state;
  }
  const legacy = await AsyncStorage.getItem(
    kind === 'note'
      ? notesStorageKey(owner)
      : `@offtasks/task-categories:v1:${encodeURIComponent(owner)}`,
  );
  const values: Array<Note | string> =
    kind === 'note'
      ? parseNotes(legacy)
      : legacy === null
      ? []
      : JSON.parse(legacy);
  if (
    !Array.isArray(values) ||
    (kind === 'goal' && !values.every(value => typeof value === 'string'))
  )
    throw new Error('Saved goals could not be read.');
  return {
    version: 1,
    items: values.map(value => ({
      id: typeof value === 'string' ? value.toLocaleLowerCase() : value.id,
      value,
      deleted: false,
      dirty: true,
    })),
  };
}

export async function readPlanner<Kind extends Collection>(
  owner: string,
  kind: Kind,
): Promise<Kind extends 'note' ? Note[] : string[]> {
  const state = await readState(owner, kind);
  return state.items
    .filter(item => !item.deleted)
    .map(item => item.value) as Kind extends 'note' ? Note[] : string[];
}

export async function writePlanner(
  owner: string,
  kind: Collection,
  values: Note[] | string[],
  baseline?: Note[] | string[],
) {
  const key = plannerKey(owner, kind);
  await serial(key, async () => {
    const state = await readState(owner, kind);
    const itemId = (value: Note | string) =>
      typeof value === 'string' ? value.toLocaleLowerCase() : value.id;
    const before =
      baseline ??
      state.items.filter(item => !item.deleted).map(item => item.value);
    const removed = before
      .filter(value => !values.some(next => itemId(next) === itemId(value)))
      .map(itemId);
    const changed = values.filter(
      value =>
        !before.some(
          previous =>
            itemId(previous) === itemId(value) &&
            JSON.stringify(previous) === JSON.stringify(value),
        ),
    );
    const next = state.items.map(item =>
      removed.includes(item.id)
        ? { ...item, deleted: true, dirty: true }
        : item,
    );
    for (const value of changed) {
      const item = { id: itemId(value), value, deleted: false, dirty: true };
      const index = next.findIndex(previous => previous.id === item.id);
      if (index < 0) next.push(item);
      else next[index] = item;
    }
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ version: 1, items: next }),
    );
  });
  emit();
}

export function syncPlanner(owner: string, kind: Collection): Promise<void> {
  if (owner === GUEST_ID) return Promise.resolve();
  const key = plannerKey(owner, kind);
  const existing = syncs.get(key);
  if (existing) return existing;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const operation = (async () => {
    const snapshot = await readState(owner, kind);
    const pending = snapshot.items.filter(item => item.dirty);
    if (pending.length) {
      const { error } = await supabaseClient
        .from('planner_items')
        .upsert(
          pending.map(item => ({
            user_id: owner,
            kind,
            id: item.id,
            value: item.value,
            deleted: item.deleted,
          })),
          { onConflict: 'user_id,kind,id' },
        )
        .abortSignal(controller.signal);
      if (error) throw error;
    }
    const remote: Item[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabaseClient
        .from('planner_items')
        .select('id,value,deleted')
        .eq('user_id', owner)
        .eq('kind', kind)
        .order('id')
        .range(offset, offset + 999)
        .abortSignal(controller.signal);
      if (error) throw error;
      for (const row of data ?? []) {
        if (
          typeof row.id !== 'string' ||
          typeof row.deleted !== 'boolean' ||
          (kind === 'goal'
            ? typeof row.value !== 'string'
            : parseNotes(JSON.stringify([row.value]))[0].id !== row.id)
        )
          throw new Error('Invalid sync response');
        remote.push({ ...row, dirty: false });
      }
      if (!data || data.length < 1000) break;
    }
    await serial(key, async () => {
      const current = await readState(owner, kind);
      const changed = current.items.filter(
        item =>
          item.dirty &&
          !pending.some(sent => JSON.stringify(sent) === JSON.stringify(item)),
      );
      const merged = remote
        .filter(item => !changed.some(local => local.id === item.id))
        .concat(changed);
      await AsyncStorage.setItem(
        key,
        JSON.stringify({ version: 1, items: merged }),
      );
    });
    problems.delete(key);
  })()
    .catch(() => {
      problems.set(
        key,
        'Saved on this device. Sync unavailable; retry from Account.',
      );
    })
    .finally(async () => {
      clearTimeout(timeout);
      syncs.delete(key);
      emit();
      if (
        !problems.has(key) &&
        (await readState(owner, kind)).items.some(item => item.dirty)
      )
        await syncPlanner(owner, kind);
    });
  syncs.set(key, operation);
  return operation;
}

export async function clearPlanner(owner: string) {
  await Promise.all([
    syncs.get(plannerKey(owner, 'note')),
    syncs.get(plannerKey(owner, 'goal')),
  ]);
  await clearGoalAppearances(owner);
  await AsyncStorage.multiRemove([
    plannerKey(owner, 'note'),
    plannerKey(owner, 'goal'),
    notesStorageKey(owner),
    `@offtasks/task-categories:v1:${encodeURIComponent(owner)}`,
  ]);
  problems.delete(plannerKey(owner, 'note'));
  problems.delete(plannerKey(owner, 'goal'));
  emit();
}
