import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { fetchAllUserTasks, updateTask } from '@/lib/supabase';
import type { Task, TaskGroup, TaskWithOverdueFlag } from '@/types/task';
import { categorizeTasks, addOverdueFlag } from '@/utils/taskUtils';
import { getToday } from '@/hooks/useDate';
import { publishWidgetSnapshot } from '@/lib/widgetBridge';
import { shouldAutoMoveTaskToToday } from '@/utils/taskScheduling';

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
  applyTaskUpdate: (
    taskId: string,
    updates: Partial<
      Pick<
        Task,
        | 'content'
        | 'isComplete'
        | 'priority'
        | 'target_group'
        | 'date'
        | 'completed_at'
        | 'label'
      >
    >,
  ) => void;
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
  applyTaskUpdate: () => undefined,
  loading: false,
});

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const { autoArrange, themeMode } = usePreferences();
  const [tasks, setTasks] = useState<TasksByGroup>(emptyState);
  const [loading, setLoading] = useState(false);
  const lastDayRef = useRef(getToday());
  const tasksRef = useRef<TasksByGroup>(emptyState);
  const appStateRef = useRef(AppState.currentState);

  const syncWidgetSnapshot = useCallback(
    (nextState: TasksByGroup) => {
      const todayTasks = nextState.today;
      const pendingTodayTasks = todayTasks.filter(task => !task.isComplete);
      const mapWidgetTask = (task: TaskWithOverdueFlag) => ({
        id: task.id,
        content: task.content,
        date: task.date,
        targetGroup: task.target_group,
        isComplete: task.isComplete,
      });

      const payload: Parameters<typeof publishWidgetSnapshot>[0] = {
        generatedAt: new Date().toISOString(),
        themeMode,
        todayTotalCount: todayTasks.length,
        todayCompletedCount: todayTasks.length - pendingTodayTasks.length,
        today: pendingTodayTasks.slice(0, 5).map(mapWidgetTask),
        tomorrow: nextState.tomorrow
          .filter(task => !task.isComplete)
          .slice(0, 3)
          .map(mapWidgetTask),
        upcoming: nextState.upcoming
          .filter(task => !task.isComplete)
          .slice(0, 3)
          .map(mapWidgetTask),
      };

      publishWidgetSnapshot(payload).catch(() => undefined);
    },
    [themeMode],
  );

  const commitTasksState = useCallback(
    (nextState: TasksByGroup) => {
      tasksRef.current = nextState;
      setTasks(nextState);
      syncWidgetSnapshot(nextState);
    },
    [syncWidgetSnapshot],
  );

  const buildTasksState = useCallback((sourceTasks: Task[]): TasksByGroup => {
    const categorized = categorizeTasks(sourceTasks);

    const applyOverdue = (task: Task): TaskWithOverdueFlag =>
      addOverdueFlag(task);

    return {
      today: categorized.today.map(applyOverdue),
      tomorrow: categorized.tomorrow.map(applyOverdue),
      upcoming: categorized.upcoming.map(applyOverdue),
      close: categorized.close.map(applyOverdue),
    };
  }, []);

  const applyTaskUpdate = useCallback(
    (
      taskId: string,
      updates: Partial<
        Pick<
          Task,
          | 'content'
          | 'isComplete'
          | 'priority'
          | 'target_group'
          | 'date'
          | 'completed_at'
          | 'label'
        >
      >,
    ) => {
      const currentTasks = groups.flatMap(group =>
        tasksRef.current[group].map(
          ({ isOverdue: _isOverdue, ...task }) => task,
        ),
      );

      if (!currentTasks.some(task => task.id === taskId)) {
        return;
      }

      const nextTasks = currentTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
            }
          : task,
      );

      commitTasksState(buildTasksState(nextTasks));
    },
    [buildTasksState, commitTasksState],
  );

  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      tasksRef.current = emptyState;
      setTasks(emptyState);
      syncWidgetSnapshot(emptyState);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all tasks at once instead of by group
      const allTasks = await fetchAllUserTasks(session.user.id);
      let needsRefresh = false;

      if (autoArrange) {
        const updates: Promise<void>[] = [];

        for (const task of allTasks) {
          if (shouldAutoMoveTaskToToday(task)) {
            needsRefresh = true;
            updates.push(
              updateTask(task.id, {
                target_group: 'today',
                date: getToday(),
              }),
            );
          }
        }

        if (updates.length > 0) {
          await Promise.all(updates);
        }
      }

      const finalTasks = needsRefresh
        ? await fetchAllUserTasks(session.user.id)
        : allTasks;

      commitTasksState(buildTasksState(finalTasks));
    } catch (error) {
      console.error('Failed to refresh tasks', error);
    } finally {
      setLoading(false);
    }
  }, [
    autoArrange,
    buildTasksState,
    commitTasksState,
    session?.user?.id,
    syncWidgetSnapshot,
  ]);

  useEffect(() => {
    syncWidgetSnapshot(tasksRef.current);
  }, [syncWidgetSnapshot]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasInBackground =
        appStateRef.current === 'inactive' ||
        appStateRef.current === 'background';

      appStateRef.current = nextAppState;

      if (wasInBackground && nextAppState === 'active') {
        refresh();
      }
    });

    return () => subscription.remove();
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
    const allTasks = groups.flatMap(group => tasks[group]);
    const completed = allTasks.filter(task => task.isComplete).length;
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
      applyTaskUpdate,
      loading,
    }),
    [applyTaskUpdate, loading, refresh, tasks, totals],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
};

export const useTasks = () => useContext(TasksContext);
