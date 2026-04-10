import React from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Logo } from '@/components/branding/Logo';
import { palette } from '@/theme/colors';

interface SplashScreenProps {
  onFinish: () => void;
}

interface TaskChipProps {
  accentColor: string;
  label: string;
  done?: boolean;
}

const MAX_SPLASH_DURATION_MS = 2200;
const POST_SEQUENCE_HOLD_MS = 90;

const TaskChip = ({ accentColor, label, done = false }: TaskChipProps) => (
  <View style={styles.taskChipContent}>
    <View
      style={[styles.taskChipIndicator, { backgroundColor: accentColor }]}
    />
    <View style={styles.taskChipCopy}>
      <Text style={styles.taskChipLabel}>{label}</Text>
      <View style={styles.taskChipMetaRow}>
        <View style={styles.taskChipMetaLine} />
        <View style={[styles.taskChipMetaLine, styles.taskChipMetaLineShort]} />
      </View>
    </View>
    {done ? <View style={styles.taskChipDoneBadge} /> : null}
  </View>
);

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const backgroundOpacity = React.useRef(new Animated.Value(0)).current;
  const haloScale = React.useRef(new Animated.Value(0.82)).current;
  const haloDrift = React.useRef(new Animated.Value(0)).current;
  const diskOpacity = React.useRef(new Animated.Value(0)).current;
  const diskScale = React.useRef(new Animated.Value(0.72)).current;
  const ringOpacity = React.useRef(new Animated.Value(0)).current;
  const ringScale = React.useRef(new Animated.Value(0.86)).current;
  const centerOpacity = React.useRef(new Animated.Value(0)).current;
  const centerScale = React.useRef(new Animated.Value(0.9)).current;
  const centerTranslateY = React.useRef(new Animated.Value(0)).current;
  const centerRotate = React.useRef(new Animated.Value(0)).current;
  const orbitRotate = React.useRef(new Animated.Value(0)).current;
  const taskOneOpacity = React.useRef(new Animated.Value(0)).current;
  const taskOneX = React.useRef(new Animated.Value(-132)).current;
  const taskOneY = React.useRef(new Animated.Value(20)).current;
  const taskOneScale = React.useRef(new Animated.Value(0.9)).current;
  const taskTwoOpacity = React.useRef(new Animated.Value(0)).current;
  const taskTwoX = React.useRef(new Animated.Value(132)).current;
  const taskTwoY = React.useRef(new Animated.Value(-12)).current;
  const taskTwoScale = React.useRef(new Animated.Value(0.9)).current;
  const taskThreeOpacity = React.useRef(new Animated.Value(0)).current;
  const taskThreeY = React.useRef(new Animated.Value(72)).current;
  const taskThreeScale = React.useRef(new Animated.Value(0.92)).current;
  const pulseScale = React.useRef(new Animated.Value(1)).current;
  const screenOpacity = React.useRef(new Animated.Value(1)).current;
  const screenTranslateY = React.useRef(new Animated.Value(0)).current;
  const screenScale = React.useRef(new Animated.Value(1)).current;
  const exitStartedRef = React.useRef(false);
  const idlePulseRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const orbitLoopRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const forceExitTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const postSequenceTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const centerRotation = centerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '0deg'],
  });

  const haloTranslateY = haloDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const orbitRotation = orbitRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const startExit = React.useCallback(() => {
    if (exitStartedRef.current) {
      return;
    }

    exitStartedRef.current = true;
    idlePulseRef.current?.stop();

    if (forceExitTimeoutRef.current) {
      clearTimeout(forceExitTimeoutRef.current);
    }

    if (postSequenceTimeoutRef.current) {
      clearTimeout(postSequenceTimeoutRef.current);
    }

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: -14,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 0.985,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });
  }, [onFinish, screenOpacity, screenScale, screenTranslateY]);

  React.useEffect(() => {
    forceExitTimeoutRef.current = setTimeout(startExit, MAX_SPLASH_DURATION_MS);

    // Start orbit rotation immediately – use a single long timing
    // instead of Animated.loop to avoid resetBeforeIteration native driver bugs.
    orbitRotate.setValue(0);
    orbitLoopRef.current = Animated.timing(orbitRotate, {
      toValue: 1000,
      duration: 780 * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    orbitLoopRef.current.start();

    const taskEnter = (
      opacity: Animated.Value,
      translateX: Animated.Value | null,
      translateY: Animated.Value,
      scale: Animated.Value,
      xTarget: number,
    ) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 13,
          stiffness: 250,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 13,
          stiffness: 250,
          mass: 0.9,
          useNativeDriver: true,
        }),
        ...(translateX
          ? [
              Animated.spring(translateX, {
                toValue: xTarget,
                damping: 13,
                stiffness: 250,
                mass: 0.9,
                useNativeDriver: true,
              }),
            ]
          : []),
      ]);

    const settleTasks = Animated.parallel([
      Animated.timing(taskOneX, {
        toValue: -24,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taskTwoX, {
        toValue: 24,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taskThreeY, {
        toValue: 36,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taskOneOpacity, {
        toValue: 0.84,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taskTwoOpacity, {
        toValue: 0.84,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taskThreeOpacity, {
        toValue: 0.9,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0.88,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(haloDrift, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(diskOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(diskScale, {
          toValue: 1,
          damping: 16,
          stiffness: 160,
          mass: 0.94,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0.56,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          damping: 17,
          stiffness: 150,
          mass: 0.94,
          useNativeDriver: true,
        }),
        Animated.timing(centerOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(centerScale, {
          toValue: 1,
          damping: 14,
          stiffness: 210,
          mass: 0.95,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.stagger(14, [
          taskEnter(taskOneOpacity, taskOneX, taskOneY, taskOneScale, -54),
          taskEnter(taskTwoOpacity, taskTwoX, taskTwoY, taskTwoScale, 54),
          taskEnter(taskThreeOpacity, null, taskThreeY, taskThreeScale, 0),
        ]),
        Animated.timing(centerRotate, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      settleTasks,
    ]).start(({ finished }) => {
      if (!finished || exitStartedRef.current) {
        return;
      }

      idlePulseRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.03,
              duration: 600,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      idlePulseRef.current.start();
      postSequenceTimeoutRef.current = setTimeout(
        startExit,
        POST_SEQUENCE_HOLD_MS,
      );
    });

    return () => {
      idlePulseRef.current?.stop();
      orbitLoopRef.current?.stop();

      if (forceExitTimeoutRef.current) {
        clearTimeout(forceExitTimeoutRef.current);
      }

      if (postSequenceTimeoutRef.current) {
        clearTimeout(postSequenceTimeoutRef.current);
      }
    };
  }, [
    backgroundOpacity,
    centerOpacity,
    centerRotate,
    centerScale,
    centerTranslateY,
    diskOpacity,
    diskScale,
    haloDrift,
    haloScale,
    orbitRotate,
    pulseScale,
    ringOpacity,
    ringScale,
    startExit,
    taskOneOpacity,
    taskOneScale,
    taskOneX,
    taskOneY,
    taskThreeOpacity,
    taskThreeScale,
    taskThreeY,
    taskTwoOpacity,
    taskTwoScale,
    taskTwoX,
    taskTwoY,
  ]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ translateY: screenTranslateY }, { scale: screenScale }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      <Animated.View
        style={[
          styles.backgroundGlowPrimary,
          {
            opacity: backgroundOpacity,
            transform: [{ scale: haloScale }, { translateY: haloTranslateY }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundGlowSecondary,
          {
            opacity: backgroundOpacity,
            transform: [
              { scale: haloScale },
              { translateY: Animated.multiply(haloTranslateY, -0.65) },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundLightBeam,
          {
            opacity: Animated.multiply(backgroundOpacity, 0.9),
            transform: [
              { rotate: '28deg' },
              { scale: haloScale },
              { translateY: haloTranslateY },
            ],
          },
        ]}
      />

      <View style={styles.stage}>
        <View style={styles.heroGroup}>
          <View style={styles.animationField}>
            <Animated.View
              style={[
                styles.diskRing,
                {
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.diskOrbitTrack,
                {
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }, { rotate: orbitRotation }],
                },
              ]}
            >
              <View style={styles.diskOrbitDotPrimary} />
              <View style={styles.diskOrbitDotSecondary} />
            </Animated.View>

            <Animated.View
              style={[
                styles.diskShell,
                {
                  opacity: diskOpacity,
                  transform: [
                    { scale: diskScale },
                    { translateY: haloTranslateY },
                  ],
                },
              ]}
            >
              <View style={styles.diskOuterGlow} />
              <View style={styles.diskSurface}>
                <View style={styles.diskInnerRing} />
                <View style={styles.diskHighlightLarge} />
                <View style={styles.diskHighlightSmall} />
                <View style={styles.diskAccentOrb} />
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.taskCard,
                styles.taskCardLeft,
                {
                  opacity: taskOneOpacity,
                  transform: [
                    { translateX: taskOneX },
                    { translateY: taskOneY },
                    { scale: taskOneScale },
                  ],
                },
              ]}
            >
              <View style={styles.taskCardGlass} />
              <TaskChip accentColor="#ff8a65" label="Today" />
            </Animated.View>

            <Animated.View
              style={[
                styles.taskCard,
                styles.taskCardRight,
                {
                  opacity: taskTwoOpacity,
                  transform: [
                    { translateX: taskTwoX },
                    { translateY: taskTwoY },
                    { scale: taskTwoScale },
                  ],
                },
              ]}
            >
              <View style={styles.taskCardGlass} />
              <TaskChip accentColor={palette.mint} label="Later" />
            </Animated.View>

            <Animated.View
              style={[
                styles.taskCard,
                styles.taskCardBottom,
                {
                  opacity: taskThreeOpacity,
                  transform: [
                    { translateY: taskThreeY },
                    { scale: taskThreeScale },
                  ],
                },
              ]}
            >
              <View style={styles.taskCardGlass} />
              <TaskChip accentColor="#67e8f9" label="Done" done />
            </Animated.View>

            <Animated.View
              style={[
                styles.centerMarkWrap,
                {
                  opacity: centerOpacity,
                  transform: [
                    { translateY: centerTranslateY },
                    { rotate: centerRotation },
                    { scale: Animated.multiply(centerScale, pulseScale) },
                  ],
                },
              ]}
            >
              <Logo size={104} />
            </Animated.View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06191d',
  },
  backgroundGlowPrimary: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(0, 150, 137, 0.2)',
    top: 74,
    alignSelf: 'center',
  },
  backgroundGlowSecondary: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    bottom: 92,
    right: -52,
  },
  backgroundLightBeam: {
    position: 'absolute',
    width: 240,
    height: 520,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -72,
    left: -18,
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 96,
    paddingBottom: 56,
    paddingHorizontal: 24,
  },
  heroGroup: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationField: {
    width: 330,
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diskShell: {
    position: 'absolute',
    width: 248,
    height: 248,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diskOuterGlow: {
    position: 'absolute',
    width: 248,
    height: 248,
    borderRadius: 124,
    backgroundColor: 'rgba(167, 243, 208, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.06)',
  },
  diskSurface: {
    width: 212,
    height: 212,
    borderRadius: 106,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#020617',
    shadowOpacity: 0.36,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 22,
    },
    elevation: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  diskInnerRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  diskHighlightLarge: {
    position: 'absolute',
    width: 118,
    height: 52,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    top: 28,
    left: 26,
    transform: [{ rotate: '-18deg' }],
  },
  diskHighlightSmall: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: 56,
    right: 34,
  },
  diskAccentOrb: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(0, 150, 137, 0.18)',
    bottom: 16,
    right: 16,
  },
  diskRing: {
    position: 'absolute',
    width: 284,
    height: 284,
    borderRadius: 142,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diskOrbitTrack: {
    position: 'absolute',
    width: 284,
    height: 284,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diskOrbitDotPrimary: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(167, 243, 208, 0.78)',
    top: 14,
    right: 74,
    borderWidth: 3,
    borderColor: 'rgba(6, 25, 29, 0.72)',
  },
  diskOrbitDotSecondary: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(103, 232, 249, 0.9)',
    bottom: 34,
    left: 48,
  },
  centerMarkWrap: {
    width: 136,
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCard: {
    position: 'absolute',
    minWidth: 142,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#001114',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    elevation: 12,
    overflow: 'hidden',
  },
  taskCardLeft: {
    top: 52,
    left: 18,
  },
  taskCardRight: {
    top: 78,
    right: 18,
  },
  taskCardBottom: {
    bottom: 30,
    alignSelf: 'center',
    minWidth: 156,
  },
  taskCardGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  taskChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskChipIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskChipCopy: {
    flex: 1,
  },
  taskChipLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  taskChipMetaRow: {
    flexDirection: 'row',
    marginTop: 7,
  },
  taskChipMetaLine: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(226, 232, 240, 0.2)',
    width: 52,
    marginRight: 6,
  },
  taskChipMetaLineShort: {
    width: 24,
  },
  taskChipDoneBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: palette.mint,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
});
