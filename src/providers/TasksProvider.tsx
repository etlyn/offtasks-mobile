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
  refresh: (options?: RefreshOptions) => Promise<void>;
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
  refreshing: boolean;
}

interface RefreshOptions {
  showRefreshSpinner?: boolean;
}

const emptyState: TasksByGroup = {
  today: [],
  tomorrow: [],
  upcoming: [],
  close: [],
};

const TASK_REFRESH_TIMEOUT_MS = 15_000;

const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  description: string,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const error = new Error(
        `${description} timed out. Check your connection and try again.`,
      );
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);

    promise.then(resolve, reject).finally(() => clearTimeout(timeoutId));
  });

const isTimeoutError = (error: unknown) =>
  error instanceof Error && error.name === 'TimeoutError';

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
  refreshing: false,
});

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const { autoArrange, themeMode } = usePreferences();
  const [tasks, setTasks] = useState<TasksByGroup>(emptyState);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const lastDayRef = useRef(getToday());
  const tasksRef = useRef<TasksByGroup>(emptyState);
  const appStateRef = useRef(AppState.currentState);
  const mountedRef = useRef(true);
  const latestRefreshIdRef = useRef(0);
  const activeRefreshCountRef = useRef(0);
  const visibleRefreshCountRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateRefreshIndicators = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    setLoading(activeRefreshCountRef.current > 0);
    setRefreshing(visibleRefreshCountRef.current > 0);
  }, []);

  const beginRefresh = useCallback(
    (showRefreshSpinner: boolean) => {
      activeRefreshCountRef.current += 1;

      if (showRefreshSpinner) {
        visibleRefreshCountRef.current += 1;
      }

      updateRefreshIndicators();
    },
    [updateRefreshIndicators],
  );

  const endRefresh = useCallback(
    (showRefreshSpinner: boolean) => {
      activeRefreshCountRef.current = Math.max(
        0,
        activeRefreshCountRef.current - 1,
      );

      if (showRefreshSpinner) {
        visibleRefreshCountRef.current = Math.max(
          0,
          visibleRefreshCountRef.current - 1,
        );
      }

      updateRefreshIndicators();
    },
    [updateRefreshIndicators],
  );

  const resetRefreshIndicators = useCallback(() => {
    activeRefreshCountRef.current = 0;
    visibleRefreshCountRef.current = 0;
    updateRefreshIndicators();
  }, [updateRefreshIndicators]);

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
      if (mountedRef.current) {
        setTasks(nextState);
      }
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

  const refresh = useCallback(
    async (options: RefreshOptions = {}) => {
      const showRefreshSpinner = options.showRefreshSpinner === true;
      const userId = session?.user?.id;
      const refreshId = latestRefreshIdRef.current + 1;
      latestRefreshIdRef.current = refreshId;

      if (!userId) {
        tasksRef.current = emptyState;
        if (mountedRef.current) {
          setTasks(emptyState);
        }
        syncWidgetSnapshot(emptyState);
        resetRefreshIndicators();
        return;
      }

      beginRefresh(showRefreshSpinner);

      try {
        // Fetch all tasks at once instead of by group
        const allTasks = await withTimeout(
          fetchAllUserTasks(userId),
          TASK_REFRESH_TIMEOUT_MS,
          'Task refresh',
        );
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
            await withTimeout(
              Promise.all(updates),
              TASK_REFRESH_TIMEOUT_MS,
              'Task auto-arrange',
            );
          }
        }

        const finalTasks = needsRefresh
          ? await withTimeout(
              fetchAllUserTasks(userId),
              TASK_REFRESH_TIMEOUT_MS,
              'Task refresh',
            )
          : allTasks;

        if (refreshId !== latestRefreshIdRef.current || !mountedRef.current) {
          return;
        }

        commitTasksState(buildTasksState(finalTasks));
      } catch (error) {
        if (isTimeoutError(error)) {
          console.warn('Task refresh timed out', error);
        } else {
          console.error('Failed to refresh tasks', error);
        }
      } finally {
        endRefresh(showRefreshSpinner);
      }
    },
    [
      autoArrange,
      beginRefresh,
      buildTasksState,
      commitTasksState,
      endRefresh,
      resetRefreshIndicators,
      session?.user?.id,
      syncWidgetSnapshot,
    ],
  );

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
      refreshing,
    }),
    [applyTaskUpdate, loading, refresh, refreshing, tasks, totals],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
};

export const useTasks = () => useContext(TasksContext);
