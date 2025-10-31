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
}) => {
  const { content, target_group, userId, date, priority = 0 } = params;

  const { error } = await supabaseClient.from('tasks').insert([
    {
      content,
      target_group,
      user_id: userId,
      date,
  priority,
      isComplete: false,
    },
  ]);

  if (error) {
    console.error('Error creating task', error);
    throw error;
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Pick<Task, 'content' | 'isComplete' | 'priority' | 'target_group' | 'date'>>
) => {
  const { error } = await supabaseClient
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);

  if (error) {
    console.error('Error deleting task', error);
    throw error;
  }
};
