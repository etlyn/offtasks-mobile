import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { PreferencesProvider } from '@/providers/PreferencesProvider';
import { TasksProvider } from '@/providers/TasksProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { palette, useAppTheme } from '@/theme/colors';
import { LoginScreen } from '@/screens/LoginScreen';
import { AppNavigator } from '@/navigation/AppNavigator';

enableScreens();

const Stack = createNativeStackNavigator();

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
      {session ? (
        <TasksProvider>
          <AppNavigator />
        </TasksProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const App = () => (
  <GestureHandlerRootView style={styles.appRoot}>
    <SafeAreaProvider>
      <AuthProvider>
        <PreferencesProvider>
          <RootNavigator />
        </PreferencesProvider>
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
