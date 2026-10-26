import AsyncStorage from '@react-native-async-storage/async-storage';
import { GUEST_ID } from '../src/lib/localTasks';
import {
  plannerKey,
  plannerSyncProblem,
  readPlanner,
  syncPlanner,
  writePlanner,
} from '../src/lib/plannerSync';
import { supabaseClient } from '../src/lib/supabase';

jest.mock('../src/lib/supabase', () => ({
  supabaseClient: { from: jest.fn() },
}));
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test('guest notes and goals persist without any cloud calls', async () => {
  await writePlanner(GUEST_ID, 'goal', ['Personal']);
  await syncPlanner(GUEST_ID, 'goal');
  expect(await readPlanner(GUEST_ID, 'goal')).toEqual(['Personal']);
  expect(await readPlanner('another-user', 'note')).toEqual([]);
  expect(supabaseClient.from).not.toHaveBeenCalled();
});

test('offline account saves retain a durable outbox and visible sync failure', async () => {
  (supabaseClient.from as jest.Mock).mockImplementation(() => {
    throw new Error('offline');
  });
  await writePlanner('account', 'goal', ['Travel']);
  await syncPlanner('account', 'goal');
  expect(await readPlanner('account', 'goal')).toEqual(['Travel']);
  expect(plannerSyncProblem('account')).toMatch(/Saved on this device/);
  expect(
    JSON.parse(
      (await AsyncStorage.getItem(plannerKey('account', 'goal')))!,
    ).items.some((item: { dirty: boolean }) => item.dirty),
  ).toBe(true);
});

test('corrupt planner data is not replaced by a save', async () => {
  await AsyncStorage.setItem(plannerKey(GUEST_ID, 'goal'), '{broken');
  await expect(writePlanner(GUEST_ID, 'goal', ['New'])).rejects.toThrow();
  expect(await AsyncStorage.getItem(plannerKey(GUEST_ID, 'goal'))).toBe(
    '{broken',
  );
});

test('a stale screen save preserves items added since the screen loaded', async () => {
  const owner = 'concurrent-account';
  await writePlanner(owner, 'goal', ['Travel']);
  const baseline = await readPlanner(owner, 'goal');
  await writePlanner(owner, 'goal', ['Travel', 'Remote Goal']);
  await writePlanner(owner, 'goal', ['Local Goal'], baseline);
  expect(await readPlanner(owner, 'goal')).toEqual([
    'Remote Goal',
    'Local Goal',
  ]);
});

test('fresh account cache does not upload defaults over server deletions', async () => {
  expect(await readPlanner('new-device-account', 'goal')).toEqual([]);
});

test('feature PRDs stay out of Notes and ordinary saves cannot remove or overwrite them', async () => {
  const brief = {
    id: 'offtask-prd:protected',
    title: 'Goal PRD',
    body: 'Requirements',
    pinned: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };
  const note = {
    id: 'ordinary-note',
    title: 'Note',
    body: 'Prose',
    pinned: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };
  await AsyncStorage.setItem(
    plannerKey('brief-owner', 'note'),
    JSON.stringify({
      version: 1,
      items: [{ id: brief.id, value: brief, deleted: false, dirty: false }],
    }),
  );
  expect(await readPlanner('brief-owner', 'note')).toEqual([]);
  await writePlanner('brief-owner', 'note', [note]);
  const state = JSON.parse(
    (await AsyncStorage.getItem(plannerKey('brief-owner', 'note')))!,
  );
  expect(
    state.items.find((item: { id: string }) => item.id === brief.id),
  ).toEqual({ id: brief.id, value: brief, deleted: false, dirty: false });
  await expect(
    writePlanner('brief-owner', 'note', [{ ...brief, body: 'Blind edit' }]),
  ).rejects.toThrow(/Goals/);
});

test('a retained dirty PRD is not uploaded and cannot cause endless outbox resync', async () => {
  const brief = {
    id: 'offtask-prd:old-draft',
    title: 'Goal PRD',
    body: 'Local draft retained',
    pinned: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };
  await AsyncStorage.setItem(
    plannerKey('dirty-brief-owner', 'note'),
    JSON.stringify({
      version: 1,
      items: [{ id: brief.id, value: brief, deleted: false, dirty: true }],
    }),
  );
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockResolvedValue({ data: [], error: null }),
    upsert: jest.fn(),
  };
  (supabaseClient.from as jest.Mock).mockReturnValue(query);
  await syncPlanner('dirty-brief-owner', 'note');
  expect(query.upsert).not.toHaveBeenCalled();
  expect(query.abortSignal).toHaveBeenCalledTimes(1);
  const state = JSON.parse(
    (await AsyncStorage.getItem(plannerKey('dirty-brief-owner', 'note')))!,
  );
  expect(state.items[0].value.body).toBe('Local draft retained');
  expect(state.items[0].dirty).toBe(true);
  expect(await readPlanner('dirty-brief-owner', 'note')).toEqual([]);
});

test('account sync sends owned rows, merges remote records and retains deletion tombstones', async () => {
  let remote: Array<Record<string, unknown>> = [];
  const uploaded: Array<Record<string, unknown>> = [];
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn(async () => ({ data: remote, error: null })),
    upsert: jest.fn((rows: Array<Record<string, unknown>>) => ({
      abortSignal: async () => {
        uploaded.push(...rows);
        for (const row of rows)
          remote = remote
            .filter(item => item.id !== row.id)
            .concat({ id: row.id, value: row.value, deleted: row.deleted });
        return { error: null };
      },
    })),
  };
  (supabaseClient.from as jest.Mock).mockReturnValue(query);
  await writePlanner('sync-account', 'goal', ['Travel']);
  await syncPlanner('sync-account', 'goal');
  expect(
    uploaded.every(
      row => row.user_id === 'sync-account' && row.kind === 'goal',
    ),
  ).toBe(true);
  expect(query.eq).toHaveBeenCalledWith('user_id', 'sync-account');
  remote.push({ id: 'second device', value: 'Second Device', deleted: false });
  await syncPlanner('sync-account', 'goal');
  expect(await readPlanner('sync-account', 'goal')).toEqual([
    'Travel',
    'Second Device',
  ]);
  await writePlanner('sync-account', 'goal', ['Second Device']);
  await syncPlanner('sync-account', 'goal');
  expect(remote.find(item => item.id === 'travel')?.deleted).toBe(true);
  expect(await readPlanner('sync-account', 'goal')).toEqual(['Second Device']);
  expect(plannerSyncProblem('sync-account')).toBeNull();
});
