import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { DashboardTabBar } from './DashboardTabBar';

function createDockStore() {
  let snapshot: BottomTabBarProps | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    set: (props: BottomTabBarProps | null) => {
      snapshot = props;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
const DockContext = React.createContext<ReturnType<
  typeof createDockStore
> | null>(null);
export function SharedDockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = React.useMemo(createDockStore, []);
  return <DockContext.Provider value={store}>{children}</DockContext.Provider>;
}
/** Navigation supplies state; the dock remains above page/search layers. */
export function DockRegistration(props: BottomTabBarProps) {
  const store = React.useContext(DockContext);
  React.useLayoutEffect(() => {
    store?.set(props);
  }, [store, props]);
  React.useEffect(() => () => store?.set(null), [store]);
  return null;
}
export function SharedDockHost({ onNavigate }: { onNavigate: () => void }) {
  // Home remains mounted underneath root-stack Welcome and Account screens.
  // Its floating dock must only exist while the planner itself is focused.
  const focused = useIsFocused();
  const store = React.useContext(DockContext)!;
  const props = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return focused && props ? (
    <View pointerEvents="box-none" style={styles.host}>
      <DashboardTabBar {...props} onNavigate={onNavigate} />
    </View>
  ) : null;
}
const styles = StyleSheet.create({
  host: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
});
