import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

import { palette } from '@/theme/colors';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const fallbackTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    fallbackTimeout.current = setTimeout(onFinish, 2000);

    return () => {
      if (fallbackTimeout.current) {
        clearTimeout(fallbackTimeout.current);
      }
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/splash-offtasks.json')}
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        style={styles.video}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b6c72',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: 220,
    height: 220,
  },
});
