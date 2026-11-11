import AsyncStorage from '@react-native-async-storage/async-storage';
import { goalId } from './goalAppearance';
import { GUEST_ID } from './localTasks';
import { syncPlanner } from './plannerSync';
import { supabaseClient } from './supabase';

const maxLogoBytes = 128 * 1024;
const guestPrefix = '@offtasks/goal-logo:v1:guest:';
const guestKey = (name: string) =>
  guestPrefix + encodeURIComponent(goalId(name));

export type GoalLogo = {
  mimeType: 'image/jpeg' | 'image/png';
  base64: string;
};
export type GoalLogos = Map<string, GoalLogo>;

export function parseGoalLogo(
  mimeType: unknown,
  base64: unknown,
): GoalLogo | null {
  if (
    (mimeType !== 'image/jpeg' && mimeType !== 'image/png') ||
    typeof base64 !== 'string' ||
    base64.length > Math.ceil(maxLogoBytes / 3) * 4 ||
    base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
  )
    return null;

  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const signature = mimeType === 'image/jpeg' ? '/9j/' : 'iVBORw0KGgo';
  if (
    (base64.length / 4) * 3 - padding > maxLogoBytes ||
    !base64.startsWith(signature)
  )
    return null;

  return { mimeType, base64 };
}

export const goalLogoUri = (logo: GoalLogo) =>
  `data:${logo.mimeType};base64,${logo.base64}`;

async function readGuestLogos(): Promise<GoalLogos> {
  const keys = (await AsyncStorage.getAllKeys()).filter(key =>
    key.startsWith(guestPrefix),
  );
  const logos: GoalLogos = new Map();
  if (!keys.length) return logos;
  for (const [key, raw] of await AsyncStorage.multiGet(keys)) {
    if (!raw) continue;
    try {
      const { mimeType, base64 } = JSON.parse(raw);
      const logo = parseGoalLogo(mimeType, base64);
      if (logo)
        logos.set(decodeURIComponent(key.slice(guestPrefix.length)), logo);
    } catch {
      // A damaged logo should not hide the goal or other saved logos.
    }
  }
  return logos;
}

export async function readGoalLogos(
  owner: string,
  signal: AbortSignal,
): Promise<GoalLogos> {
  if (owner === GUEST_ID) return readGuestLogos();

  const logos: GoalLogos = new Map();
  const pageSize = 20;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabaseClient
      .from('offtask_goal_logos')
      .select(
        'goal_id,mime_type,image_base64,offtask_goals!inner(legacy_goal_id)',
      )
      .eq('offtask_goals.user_id', owner)
      .eq('offtask_goals.status', 'active')
      .order('goal_id')
      .range(offset, offset + pageSize - 1)
      .abortSignal(signal);
    if (error) throw error;

    for (const row of data ?? []) {
      // PostgREST relationship cardinality is derived from the live FK.
      const goal = Array.isArray(row.offtask_goals)
        ? row.offtask_goals[0]
        : row.offtask_goals;
      const logo = parseGoalLogo(row.mime_type, row.image_base64);
      if (goal && logo) logos.set(goalId(goal.legacy_goal_id), logo);
    }
    if (!data || data.length < pageSize) return logos;
  }
}

async function findGoalId(owner: string, name: string, signal: AbortSignal) {
  const { data, error } = await supabaseClient
    .from('offtask_goals')
    .select('id')
    .eq('user_id', owner)
    .eq('legacy_goal_id', goalId(name))
    .eq('status', 'active')
    .abortSignal(signal)
    .maybeSingle();
  if (error) throw error;
  return data?.id as string | undefined;
}

export async function writeGoalLogo(
  owner: string,
  name: string,
  logo: GoalLogo | null,
  signal: AbortSignal,
) {
  if (signal.aborted) throw new Error('Goal logo change canceled.');
  if (owner === GUEST_ID) {
    const key = guestKey(name);
    if (logo) await AsyncStorage.setItem(key, JSON.stringify(logo));
    else await AsyncStorage.removeItem(key);
    return;
  }

  let id = await findGoalId(owner, name, signal);
  if (!id && logo && !signal.aborted) {
    // A just-created goal can still be waiting in the planner outbox.
    await syncPlanner(owner, 'goal');
    id = await findGoalId(owner, name, signal);
  }
  if (signal.aborted) throw new Error('Goal logo change canceled.');
  if (!id) {
    if (!logo) return;
    throw new Error('Sync this goal before saving its logo.');
  }

  const { error } = await supabaseClient
    .rpc('offtask_set_goal_logo', {
      goal_id: id,
      mime_type: logo?.mimeType ?? null,
      image_base64: logo?.base64 ?? null,
    })
    .abortSignal(signal);
  if (error) throw error;
}
