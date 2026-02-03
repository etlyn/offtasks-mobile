import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { fetchAllUserTasks, updateTask } from '@/lib/supabase';
import type { Task, TaskGroup, TaskWithOverdueFlag } from '@/types/task';
import { categorizeTasks, addOverdueFlag } from '@/utils/taskUtils';
import { getToday } from '@/hooks/useDate';

import { useAuth } from './AuthProvider';
import { usePreferences } from './PreferencesProvider';

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
  const { autoArrange } = usePreferences();
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
      const today = getToday();
      let needsRefresh = false;

      if (autoArrange) {
        for (const task of allTasks) {
          if (task.isComplete) {
            continue;
          }

          if (task.target_group === 'tomorrow' && task.date <= today) {
            needsRefresh = true;
            await updateTask(task.id, {
              target_group: 'today',
            });
          }
        }
      }

      const finalTasks = needsRefresh ? await fetchAllUserTasks(session.user.id) : allTasks;
      
      // Categorize tasks based on our business rules
      const categorized = categorizeTasks(finalTasks);

      const applyOverdue = (task: Task): TaskWithOverdueFlag => {
        if (!autoArrange) {
          return addOverdueFlag(task);
        }
        const isOverdue = !task.isComplete && task.target_group === 'today' && task.date !== today;
        return {
          ...task,
          isOverdue,
        };
      };
      
      // Add overdue flags to tasks for UI styling
      const nextState: TasksByGroup = {
        today: categorized.today.map(applyOverdue),
        tomorrow: categorized.tomorrow.map(applyOverdue),
        upcoming: categorized.upcoming.map(applyOverdue),
        close: categorized.close.map(applyOverdue),
      };

      setTasks(nextState);
    } catch (error) {
      console.error('Failed to refresh tasks', error);
    } finally {
      setLoading(false);
    }
  }, [autoArrange, session?.user?.id]);

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
