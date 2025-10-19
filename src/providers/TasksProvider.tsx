import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchTasksByGroup } from '@/lib/supabase';
import type { Task, TaskGroup } from '@/types/task';

import { useAuth } from './AuthProvider';

const groups: TaskGroup[] = ['today', 'tomorrow', 'upcoming', 'close'];

type TasksByGroup = Record<TaskGroup, Task[]>;

interface TasksContextValue {
  tasks: TasksByGroup;
  totals: {
    all: number;
    completed: number;
    pending: number;
  };
  refresh: () => Promise<void>;
  loading: boolean;
}

const emptyState: TasksByGroup = {
  today: [],
  tomorrow: [],
  upcoming: [],
  close: [],
};

const TasksContext = createContext<TasksContextValue>({
  tasks: emptyState,
  totals: {
    all: 0,
    completed: 0,
    pending: 0,
  },
  refresh: async () => undefined,
  loading: false,
});

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<TasksByGroup>(emptyState);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      setTasks(emptyState);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(
        groups.map((group) => fetchTasksByGroup(group, session.user.id))
      );

      const nextState = groups.reduce<TasksByGroup>((acc, group, index) => {
        acc[group] = results[index] ?? [];
        return acc;
      }, {
        today: [],
        tomorrow: [],
        upcoming: [],
        close: [],
      });

      setTasks(nextState);
    } catch (error) {
      console.error('Failed to refresh tasks', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = useMemo(() => {
    const allTasks = groups.flatMap((group) => tasks[group]);
    const completed = allTasks.filter((task) => task.isComplete).length;
    return {
      all: allTasks.length,
      completed,
      pending: allTasks.length - completed,
    };
  }, [tasks]);

  const value = useMemo(
    () => ({
      tasks,
      totals,
      refresh,
      loading,
    }),
    [loading, refresh, tasks, totals]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export const useTasks = () => useContext(TasksContext);
