import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

import type { Task, TaskGroup } from '@/types/task';

const runtimeEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const supabaseUrl = SUPABASE_URL || runtimeEnv.SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY || runtimeEnv.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL. Add it to OfftasksMobile/.env.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY. Add it to OfftasksMobile/.env.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

const selectBaseQuery = (group: TaskGroup) =>
  supabaseClient
    .from('tasks')
    .select('*')
    .eq('target_group', group)
    .order('priority', { ascending: true });

export const fetchTasksByGroup = async (group: TaskGroup, userId: string) => {
  const { data, error } = await selectBaseQuery(group).eq('user_id', userId);

  if (error) {
    console.error('Error fetching tasks', error);
    return [] as Task[];
  }

  return (data as Task[] | null) ?? [];
};

export const createTask = async (params: {
  content: string;
  target_group: TaskGroup;
  userId: string;
  date: string;
  priority?: number;
  label?: string | null;
}) => {
  const { content, target_group, userId, date, priority = 0, label } = params;

  const payload: Record<string, unknown> = {
    content,
    target_group,
    user_id: userId,
    date,
    priority,
    isComplete: false,
  };

  if (typeof label !== 'undefined') {
    payload.label = label;
  }
  const insertTask = async (data: Record<string, unknown>) =>
    supabaseClient.from('tasks').insert([data]);

  let attempt = await insertTask(payload);

  if (!attempt.error) {
    return;
  }

  const message = attempt.error.message?.toLowerCase() ?? '';
  if (message.includes('label') && Object.prototype.hasOwnProperty.call(payload, 'label')) {
    const { label: _label, ...retryPayload } = payload;
    attempt = await insertTask(retryPayload);
  }

  if (attempt.error) {
    console.error('Error creating task', attempt.error);
    throw attempt.error;
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Pick<Task, 'content' | 'isComplete' | 'priority' | 'target_group' | 'date' | 'completed_at' | 'label'>>
) => {
  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => typeof value !== 'undefined')
  );

  const attemptUpdate = async (payload: Record<string, unknown>) =>
    supabaseClient.from('tasks').update(payload).eq('id', taskId);

  const payload = { ...sanitizedUpdates } as Record<string, unknown>;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await attemptUpdate(payload);

    if (!error) {
      return;
    }

    const message = error.message?.toLowerCase() ?? '';
    let updated = false;

    if (message.includes('completed_at') && Object.prototype.hasOwnProperty.call(payload, 'completed_at')) {
      delete payload.completed_at;
      updated = true;
    }

    if (message.includes('label') && Object.prototype.hasOwnProperty.call(payload, 'label')) {
      delete payload.label;
      updated = true;
    }

    if (!updated) {
      console.error('Error updating task', error);
      throw error;
    }
  }
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);

  if (error) {
    console.error('Error deleting task', error);
    throw error;
  }
};

/**
 * Fetch all tasks for a user (needed for proper categorization based on business rules)
 */
export const fetchAllUserTasks = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Error fetching all tasks', error);
    return [];
  }

  return (data as Task[] | null) ?? [];
};
