import { trackTaskCreated } from '@/analytics';
import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import * as cloud from './supabase';
import {
  createLocalTask,
  deleteLocalTask,
  GUEST_ID,
  readLocalTasks,
  updateLocalTask,
} from './localTasks';

export function taskRepository(userId?: string) {
  const owner = userId || GUEST_ID;
  return {
    owner,
    read: () =>
      userId ? cloud.fetchAllUserTasks(userId) : readLocalTasks(owner),
    create: async (
      values: Omit<Parameters<typeof cloud.createTask>[0], 'userId'>,
    ) => {
      if (userId) await cloud.createTask({ ...values, userId });
      else
        await createLocalTask(owner, {
          ...values,
          date: values.date ?? null,
          priority: values.priority ?? 0,
          isComplete: false,
        });
      trackTaskCreated();
    },
    update: async (
      id: string,
      values: Parameters<typeof cloud.updateTask>[1],
    ) => {
      if (userId) await cloud.updateTask(id, values);
      else await updateLocalTask(owner, id, values);
    },
    remove: async (id: string) => {
      if (userId) await cloud.deleteTask(id);
      else await deleteLocalTask(owner, id);
    },
  };
}

export function useTaskRepository() {
  const userId = useAuth().session?.user.id;
  return useMemo(() => taskRepository(userId), [userId]);
}
