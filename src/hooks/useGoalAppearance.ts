import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { GUEST_ID } from '@/lib/localTasks';
import {
  defaultGoalAppearance,
  goalId,
  readGoalAppearances,
  subscribeGoalAppearance,
  writeGoalAppearance,
  type GoalAppearance,
  type GoalAppearances,
} from '@/lib/goalAppearance';

export function useGoalAppearance() {
  const owner = useAuth().session?.user.id || GUEST_ID;
  const [state, setState] = React.useState<{
    owner: string;
    values: GoalAppearances;
    ready: boolean;
    error: string | null;
  }>({ owner, values: {}, ready: false, error: null });
  React.useEffect(() => {
    let active = true;
    let version = 0;
    const load = async () => {
      const current = ++version;
      try {
        const values = await readGoalAppearances(owner);
        if (active && current === version)
          setState({ owner, values, ready: true, error: null });
      } catch {
        if (active && current === version)
          setState({
            owner,
            values: {},
            ready: true,
            error: 'Appearance could not be loaded. Please try again.',
          });
      }
    };
    void load();
    const unsubscribe = subscribeGoalAppearance(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [owner]);
  const ready = state.owner === owner && state.ready;
  return {
    ready,
    error: state.owner === owner ? state.error : null,
    get: (name: string) =>
      (ready && Object.prototype.hasOwnProperty.call(state.values, goalId(name))
        ? state.values[goalId(name)]
        : undefined) ?? defaultGoalAppearance(name),
    save: (name: string, appearance: GoalAppearance | null) => {
      if (!ready || state.error)
        return Promise.reject(
          new Error(
            'Appearance is not ready. Please reopen Goals and try again.',
          ),
        );
      return writeGoalAppearance(owner, name, appearance);
    },
  };
}
