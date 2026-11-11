import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/providers/AuthProvider';
import { goalId } from '@/lib/goalAppearance';
import { GUEST_ID } from '@/lib/localTasks';
import {
  readGoalLogos,
  writeGoalLogo,
  type GoalLogo,
  type GoalLogos,
} from '@/lib/goalLogo';

export function useGoalLogos() {
  const owner = useAuth().session?.user.id || GUEST_ID;
  const activeOwner = React.useRef(owner);
  activeOwner.current = owner;
  const request = React.useRef<AbortController | null>(null);
  const mutation = React.useRef<AbortController | null>(null);
  const [state, setState] = React.useState<{
    owner: string;
    logos: GoalLogos;
  }>(() => ({ owner, logos: new Map() }));

  const refresh = React.useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const logos = await readGoalLogos(owner, controller.signal);
      if (!controller.signal.aborted && activeOwner.current === owner)
        setState({ owner, logos });
    } catch {
      // Keep this account's current images while it is offline.
    } finally {
      clearTimeout(timeout);
    }
  }, [owner]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
      return () => request.current?.abort();
    }, [refresh]),
  );

  React.useEffect(() => {
    return () => mutation.current?.abort();
  }, [owner]);

  const save = async (name: string, logo: GoalLogo | null) => {
    if (activeOwner.current !== owner) throw new Error('Account changed.');
    const controller = new AbortController();
    mutation.current?.abort();
    mutation.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      await writeGoalLogo(owner, name, logo, controller.signal);
      if (controller.signal.aborted || activeOwner.current !== owner)
        throw new Error('Account changed.');
      request.current?.abort();
      setState(previous => {
        const logos = new Map(previous.owner === owner ? previous.logos : []);
        if (logo) logos.set(goalId(name), logo);
        else logos.delete(goalId(name));
        return { owner, logos };
      });
      refresh();
    } finally {
      clearTimeout(timeout);
      if (mutation.current === controller) mutation.current = null;
    }
  };

  return {
    owner,
    guest: owner === GUEST_ID,
    get: (name: string) =>
      state.owner === owner ? state.logos.get(goalId(name)) : undefined,
    refresh,
    save,
  };
}
