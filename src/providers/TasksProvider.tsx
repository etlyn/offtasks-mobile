import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { fetchAllUserTasks } from '@/lib/supabase';
import type { Task, TaskGroup, TaskWithOverdueFlag } from '@/types/task';
import { categorizeTasks, addOverdueFlag } from '@/utils/taskUtils';
import { getToday } from '@/hooks/useDate';

import { useAuth } from './AuthProvider';

const groups: TaskGroup[] = ['today', 'tomorrow', 'upcoming', 'close'];

type TasksByGroup = Record<TaskGroup, TaskWithOverdueFlag[]>;

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
  const lastDayRef = useRef(getToday());

  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      setTasks(emptyState);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all tasks at once instead of by group
      const allTasks = await fetchAllUserTasks(session.user.id);
      
      // Categorize tasks based on our business rules
      const categorized = categorizeTasks(allTasks);
      
      // Add overdue flags to tasks for UI styling
      const nextState: TasksByGroup = {
        today: categorized.today.map(addOverdueFlag),
        tomorrow: categorized.tomorrow.map(addOverdueFlag),
        upcoming: categorized.upcoming.map(addOverdueFlag),
        close: categorized.close.map(addOverdueFlag),
      };

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

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDay = getToday();
      if (currentDay !== lastDayRef.current) {
        lastDayRef.current = currentDay;
        refresh();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
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
