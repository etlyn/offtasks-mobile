import React from 'react';
import { analyticsNavigation } from '@/analytics/navigation';
import { StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { PreferencesProvider } from '@/providers/PreferencesProvider';
import { TasksProvider } from '@/providers/TasksProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { useAppTheme } from '@/theme/colors';
import { OfftasksLoader } from '@/components/OfftasksLoader';
import { GUEST_ID } from '@/lib/localTasks';
import { AppNavigator } from '@/navigation/AppNavigator';

enableScreens();

const LoadingScreen = ({ backgroundColor }: { backgroundColor: string }) => (
  <View style={[styles.loadingScreen, { backgroundColor }]}>
    <OfftasksLoader />
  </View>
);

const RootNavigator = ({
  showSplash,
  onSplashFinish,
}: {
  showSplash: boolean;
  onSplashFinish: () => void;
}) => {
  const { session, loading } = useAuth();
  const theme = useAppTheme();

  if (showSplash) {
    return <SplashScreen onFinish={onSplashFinish} />;
  }

  if (loading) {
    return <LoadingScreen backgroundColor={theme.colors.background} />;
  }

  return (
    <NavigationContainer {...analyticsNavigation} theme={theme.navigationTheme}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
      />
      <TasksProvider key={session?.user.id || GUEST_ID}>
        <AppNavigator />
      </TasksProvider>
    </NavigationContainer>
  );
};

const AccountWorkspace = () => {
  const { session } = useAuth();
  // Account changes remount preferences, not the launch experience.
  const [showSplash, setShowSplash] = React.useState(true);
  const finishSplash = React.useCallback(() => setShowSplash(false), []);
  return (
    <PreferencesProvider key={session?.user.id || GUEST_ID}>
      <RootNavigator showSplash={showSplash} onSplashFinish={finishSplash} />
    </PreferencesProvider>
  );
};

const App = () => (
  <GestureHandlerRootView style={styles.appRoot}>
    <SafeAreaProvider>
      <AuthProvider>
        <AccountWorkspace />
      </AuthProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
