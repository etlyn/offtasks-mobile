import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

import type { Task, TaskGroup } from '@/types/task';

export interface UserPreferences {
  user_id: string;
  hide_completed: boolean;
  advanced_mode: boolean;
  theme_mode: 'Light' | 'Dark';
  auto_arrange: boolean;
  updated_at?: string;
}

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

type CategoryColumn = 'label' | 'category';
const CATEGORY_COLUMNS: CategoryColumn[] = ['label', 'category'];
let detectedCategoryColumn: CategoryColumn | null = null;

const ensureCategoryColumn = async (userId?: string): Promise<CategoryColumn | null> => {
  if (detectedCategoryColumn) {
    return detectedCategoryColumn;
  }

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data } = await supabaseClient.auth.getUser();
    resolvedUserId = data.user?.id;
  }

  if (!resolvedUserId) {
    return null;
  }

  for (const column of CATEGORY_COLUMNS) {
    const { error } = await supabaseClient
      .from('tasks')
      .select(column)
      .eq('user_id', resolvedUserId)
      .limit(1);

    if (!error) {
      detectedCategoryColumn = column;
      return detectedCategoryColumn;
    }

    const message = error.message?.toLowerCase() ?? '';
    if (!message.includes(column)) {
      return null;
    }
  }

  return null;
};

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

  const rows = (data as (Task & { category?: string | null })[] | null) ?? [];
  return rows.map((row) => ({
    ...row,
    label: row.label ?? row.category ?? null,
  }));
};

export const createTask = async (params: {
  content: string;
  target_group: TaskGroup;
  userId: string;
  date?: string | null;
  priority?: number;
  label?: string | null;
}) => {
  const { content, target_group, userId, date, priority = 0, label } = params;

  const payload: Record<string, unknown> = {
    content,
    target_group,
    user_id: userId,
    date: date ?? null,
    priority,
    isComplete: false,
  };

  if (typeof label !== 'undefined') {
    const categoryColumn = await ensureCategoryColumn(userId);
    if (categoryColumn) {
      payload[categoryColumn] = label;
    } else {
      payload.label = label;
    }
  }
  const insertTask = async (data: Record<string, unknown>) =>
    supabaseClient.from('tasks').insert([data]);

  let attempt = await insertTask(payload);

  if (!attempt.error) {
    return;
  }

  const message = attempt.error.message?.toLowerCase() ?? '';
  if (message.includes('label') && Object.prototype.hasOwnProperty.call(payload, 'label')) {
    const retryPayload = { ...payload };
    delete retryPayload.label;
    if (typeof label !== 'undefined') {
      attempt = await insertTask({ ...retryPayload, category: label });
    } else {
      attempt = await insertTask(retryPayload);
    }
  }

  if (attempt.error) {
    const retryMessage = attempt.error.message?.toLowerCase() ?? '';
    if (retryMessage.includes('category') && Object.prototype.hasOwnProperty.call(payload, 'label')) {
      const retryPayload = { ...payload };
      delete retryPayload.label;
      attempt = await insertTask(retryPayload);
    }
  }

  if (attempt.error) {
    console.error('Error creating task', attempt.error);
    throw attempt.error;
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<
    Pick<
      Task,
      'content' | 'isComplete' | 'priority' | 'target_group' | 'date' | 'completed_at' | 'label'
    >
  >
) => {
  const { label, ...restUpdates } = updates;
  const sanitizedUpdates = Object.fromEntries(
    Object.entries(restUpdates).filter(([, value]) => typeof value !== 'undefined')
  );

  const attemptUpdate = async (payload: Record<string, unknown>) =>
    supabaseClient.from('tasks').update(payload).eq('id', taskId);

  const payload = { ...sanitizedUpdates } as Record<string, unknown>;
  if (typeof label !== 'undefined') {
    const categoryColumn = await ensureCategoryColumn();
    if (categoryColumn) {
      payload[categoryColumn] = label;
    } else {
      payload.label = label;
    }
  }

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
      const labelValue = payload.label;
      delete payload.label;
      if (typeof labelValue !== 'undefined') {
        payload.category = labelValue;
      }
      updated = true;
    }

    if (message.includes('category') && Object.prototype.hasOwnProperty.call(payload, 'category')) {
      delete payload.category;
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

interface DeleteAccountResponse {
  success?: boolean;
  error?: string;
}

const getFunctionErrorMessage = async (error: unknown): Promise<string> => {
  const response = (error as { context?: { clone?: () => { json?: () => Promise<unknown> }; json?: () => Promise<unknown> } })
    ?.context;

  try {
    const responseBodyReader = typeof response?.clone === 'function' ? response.clone() : response;
    const payload = await responseBodyReader?.json?.();

    if (
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
    ) {
      return payload.error;
    }
  } catch {
    // Fall through to the default error message.
  }

  return error instanceof Error
    ? error.message
    : 'Unable to delete account right now. Please try again.';
};

export const deleteAccount = async (): Promise<void> => {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('You need to be signed in to delete your account.');
  }

  const { data, error } = await supabaseClient.functions.invoke<DeleteAccountResponse>('delete-account', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {},
  });

  if (error) {
    console.error('Error deleting account', error);
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.success) {
    throw new Error('Account deletion did not complete.');
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

  const rows = (data as (Task & { category?: string | null })[] | null) ?? [];
  return rows.map((row) => ({
    ...row,
    date: row.date ?? null,
    label: row.label ?? row.category ?? null,
  }));
};

export const fetchUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const { data, error } = await supabaseClient
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user preferences', error);
    return null;
  }

  return (data as UserPreferences | null) ?? null;
};

export const upsertUserPreferences = async (prefs: UserPreferences) => {
  const { error } = await supabaseClient
    .from('user_preferences')
    .upsert(
      {
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Error updating user preferences', error);
    throw error;
  }
};
