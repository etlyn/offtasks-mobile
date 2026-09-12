import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { PreferencesProvider } from '@/providers/PreferencesProvider';
import { TasksProvider } from '@/providers/TasksProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { palette, useAppTheme } from '@/theme/colors';
import { GUEST_ID } from '@/lib/localTasks';
import { AppNavigator } from '@/navigation/AppNavigator';

enableScreens();

const LoadingScreen = ({ backgroundColor }: { backgroundColor: string }) => (
  <View style={[styles.loadingScreen, { backgroundColor }]}>
    <ActivityIndicator size="large" color={palette.mint} />
  </View>
);

const RootNavigator = () => {
  const { session, loading } = useAuth();
  const theme = useAppTheme();
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <LoadingScreen backgroundColor={theme.colors.background} />;
  }

  return (
    <NavigationContainer theme={theme.navigationTheme}>
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
  const {session} = useAuth();
  return <PreferencesProvider key={session?.user.id || GUEST_ID}><RootNavigator /></PreferencesProvider>;
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
