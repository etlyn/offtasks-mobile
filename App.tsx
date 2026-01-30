import React from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { PreferencesProvider } from '@/providers/PreferencesProvider';
import { TasksProvider } from '@/providers/TasksProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { palette } from '@/theme/colors';
import { LoginScreen } from '@/screens/LoginScreen';
import { AppNavigator } from '@/navigation/AppNavigator';

enableScreens();

const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.surface,
    primary: palette.accent,
  },
};

const LoadingScreen = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: palette.background,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <ActivityIndicator size="large" color={palette.accent} />
  </View>
);

const RootNavigator = () => {
  const { session, loading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle="light-content" />
      {session ? (
        <PreferencesProvider>
          <TasksProvider>
            <AppNavigator />
          </TasksProvider>
        </PreferencesProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default App;
