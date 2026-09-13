import { createNavigationContainerRef } from '@react-navigation/native';
import { analytics } from './index';
const ref = createNavigationContainerRef();
const screens: Record<string, string> = {
  Calendar: 'calendar', Notes: 'notes', Goals: 'goals', Later: 'later', Statistics: 'statistics',
};
const changed = () => {
  const route = ref.getCurrentRoute();
  void analytics?.screen(route ? screens[route.name] : undefined);
};
export const analyticsNavigation = {
  ref,
  onReady: () => { void analytics?.start().then(changed); },
  onStateChange: changed,
};
