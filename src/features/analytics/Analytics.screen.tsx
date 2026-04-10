import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {
  DrawerActions,
  NavigationProp,
  ParamListBase,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTasks } from '@/providers/TasksProvider';
import { palette, useAppTheme } from '@/theme/colors';

const celebrationItems = [
  {
    label: 'Nice work!',
    kind: 'greeting' as const,
    spreadX: -48,
    driftX: -36,
    liftY: -146,
    spinEnd: 6,
    baseOffsetX: -58,
    baseOffsetY: -8,
    backgroundColor: '#ffffff',
    borderColor: 'rgba(15, 23, 42, 0.08)',
    textColor: palette.slate900,
  },
  {
    label: '🎉',
    kind: 'badge' as const,
    spreadX: 58,
    driftX: 44,
    liftY: -118,
    spinEnd: 22,
    baseOffsetX: -14,
    baseOffsetY: -12,
    backgroundColor: '#fff7ed',
    borderColor: 'rgba(251, 146, 60, 0.18)',
    textColor: '#f97316',
  },
  {
    label: '✨',
    kind: 'badge' as const,
    spreadX: -72,
    driftX: -54,
    liftY: -102,
    spinEnd: -18,
    baseOffsetX: -10,
    baseOffsetY: -10,
    backgroundColor: '#fef3c7',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    textColor: '#d97706',
  },
  {
    label: '🥳',
    kind: 'badge' as const,
    spreadX: 4,
    driftX: -12,
    liftY: -160,
    spinEnd: 14,
    baseOffsetX: -12,
    baseOffsetY: -18,
    backgroundColor: '#fce7f3',
    borderColor: 'rgba(236, 72, 153, 0.18)',
    textColor: '#db2777',
  },
  {
    label: '★',
    kind: 'badge' as const,
    spreadX: 82,
    driftX: 36,
    liftY: -88,
    spinEnd: 26,
    baseOffsetX: -8,
    baseOffsetY: 2,
    backgroundColor: '#dcfce7',
    borderColor: 'rgba(34, 197, 94, 0.16)',
    textColor: '#16a34a',
  },
  {
    label: '✓',
    kind: 'badge' as const,
    spreadX: -22,
    driftX: 18,
    liftY: -90,
    spinEnd: -10,
    baseOffsetX: -9,
    baseOffsetY: 6,
    backgroundColor: '#ccfbf1',
    borderColor: 'rgba(13, 148, 136, 0.18)',
    textColor: '#0f766e',
  },
];

const sectionLabels = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Later',
  close: 'Close',
};

const getPlural = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

const getCompletionMood = (
  totalCompleted: number,
  completedToday: number,
  completionRate: number,
) => {
  if (totalCompleted === 0) {
    return 'Finish a few tasks and this screen starts feeling like a tiny parade.';
  }

  if (completedToday >= 3 || completionRate >= 75) {
    return 'You are clearing work with real momentum today.';
  }

  if (completedToday > 0) {
    return 'Today already has a few wins. Keep the streak warm.';
  }

  if (completionRate >= 50) {
    return 'More than half of your list is already behind you.';
  }

  return 'Each completed task is moving the whole board into a lighter place.';
};

const getHeroTitle = (
  totalCompleted: number,
  completedToday: number,
  completionRate: number,
) => {
  if (totalCompleted === 0) {
    return 'Your win board is ready.';
  }

  if (completedToday >= 3) {
    return `${completedToday} fresh ${getPlural(completedToday, 'win')} today.`;
  }

  if (completionRate >= 70) {
    return 'You are in the done zone.';
  }

  return `${totalCompleted} ${getPlural(totalCompleted, 'task')} completed.`;
};

export const AnalyticsScreen = () => {
  const { tasks, totals, loading, refresh } = useTasks();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const completedCardRef = React.useRef<View | null>(null);
  const contentReveal = React.useRef(new Animated.Value(0)).current;
  const celebrationAnimations = React.useRef(
    celebrationItems.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.45),
      rotate: new Animated.Value(0),
    })),
  ).current;
  const launchOriginRef = React.useRef({
    x: windowWidth * 0.55,
    y: 220,
  });
  const [launchOrigin, setLaunchOrigin] = React.useState({
    x: windowWidth * 0.55,
    y: 220,
  });

  const groupCounts = React.useMemo(
    () => ({
      today: tasks.today.length,
      tomorrow: tasks.tomorrow.length,
      upcoming: tasks.upcoming.length,
      close: tasks.close.length,
    }),
    [tasks],
  );

  const allTasks = React.useMemo(
    () => [
      ...tasks.today,
      ...tasks.tomorrow,
      ...tasks.upcoming,
      ...tasks.close,
    ],
    [tasks],
  );

  const completedTasks = React.useMemo(
    () =>
      allTasks
        .filter(task => task.isComplete)
        .sort((left, right) => {
          const leftDate = left.completed_at ?? left.date ?? '';
          const rightDate = right.completed_at ?? right.date ?? '';

          return rightDate.localeCompare(leftDate);
        }),
    [allTasks],
  );

  const todayKey = React.useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  const completedToday = React.useMemo(
    () =>
      completedTasks.filter(task => (task.completed_at ?? task.date) === todayKey)
        .length,
    [completedTasks, todayKey],
  );

  const completionRate = React.useMemo(() => {
    if (totals.all === 0) {
      return 0;
    }

    return Math.round((totals.completed / totals.all) * 100);
  }, [totals.all, totals.completed]);

  const dominantSection = React.useMemo(() => {
    const entries = Object.entries(groupCounts) as Array<
      [keyof typeof groupCounts, number]
    >;

    return entries.reduce((currentBest, nextEntry) =>
      nextEntry[1] > currentBest[1] ? nextEntry : currentBest,
    );
  }, [groupCounts]);

  const recentWins = React.useMemo(
    () => completedTasks.slice(0, 3),
    [completedTasks],
  );

  const measureCompletedCard = React.useCallback(() => {
    requestAnimationFrame(() => {
      completedCardRef.current?.measureInWindow((x, y, width, height) => {
        if (!width || !height) {
          return;
        }

        const nextOrigin = {
          x: x + width / 2,
          y: y + height / 2,
        };

        launchOriginRef.current = nextOrigin;
        setLaunchOrigin(nextOrigin);
      });
    });
  }, []);

  const resetCelebrationAnimations = React.useCallback(() => {
    celebrationAnimations.forEach(animation => {
      animation.opacity.stopAnimation();
      animation.translateX.stopAnimation();
      animation.translateY.stopAnimation();
      animation.scale.stopAnimation();
      animation.rotate.stopAnimation();

      animation.opacity.setValue(0);
      animation.translateX.setValue(0);
      animation.translateY.setValue(0);
      animation.scale.setValue(0.45);
      animation.rotate.setValue(0);
    });
  }, [celebrationAnimations]);

  const playEntryAnimation = React.useCallback(() => {
    contentReveal.stopAnimation();
    contentReveal.setValue(0);
    resetCelebrationAnimations();

    Animated.timing(contentReveal, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const dropDistance = Math.max(
      windowHeight - launchOriginRef.current.y + 56,
      180,
    );

    celebrationAnimations.forEach((animation, index) => {
      const item = celebrationItems[index];

      Animated.sequence([
        Animated.delay(120 + index * 95),
        Animated.parallel([
          Animated.timing(animation.opacity, {
            toValue: 1,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(animation.scale, {
            toValue: item.kind === 'greeting' ? 1 : 1.08,
            friction: 7,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(animation.translateX, {
            toValue: item.spreadX,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animation.translateY, {
            toValue: item.liftY,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animation.rotate, {
            toValue: item.spinEnd * 0.45,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(animation.translateX, {
            toValue: item.spreadX + item.driftX,
            duration: 1180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animation.translateY, {
            toValue: dropDistance,
            duration: 1180,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animation.scale, {
            toValue: item.kind === 'greeting' ? 0.94 : 0.9,
            duration: 1180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animation.rotate, {
            toValue: item.spinEnd,
            duration: 1180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(760),
            Animated.timing(animation.opacity, {
              toValue: 0,
              duration: 260,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  }, [
    celebrationAnimations,
    contentReveal,
    resetCelebrationAnimations,
    windowHeight,
  ]);

  React.useEffect(() => {
    if (!isFocused) {
      return;
    }

    const timeout = setTimeout(() => {
      measureCompletedCard();
      playEntryAnimation();
    }, 140);

    return () => clearTimeout(timeout);
  }, [isFocused, measureCompletedCard, playEntryAnimation]);

  React.useEffect(() => {
    launchOriginRef.current = {
      x: windowWidth * 0.55,
      y: launchOriginRef.current.y,
    };

    setLaunchOrigin(currentOrigin => ({
      x: windowWidth * 0.55,
      y: currentOrigin.y,
    }));
  }, [windowWidth]);

  const handleRefresh = React.useCallback(() => {
    refresh();
  }, [refresh]);

  const handleBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(DrawerActions.closeDrawer());
  }, [navigation]);

  const heroTitle = React.useMemo(
    () => getHeroTitle(totals.completed, completedToday, completionRate),
    [completedToday, completionRate, totals.completed],
  );

  const heroSubtitle = React.useMemo(
    () => getCompletionMood(totals.completed, completedToday, completionRate),
    [completedToday, completionRate, totals.completed],
  );

  const heroTranslateY = contentReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const secondaryTranslateY = contentReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const delayedOpacity = contentReveal.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const scrollContentStyle = React.useMemo(
    () => [
      styles.content,
      { paddingTop: 12, paddingBottom: insets.bottom + 40 },
    ],
    [insets.bottom, styles.content],
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
      />

      <View style={[styles.topBarShell, { paddingTop: insets.top + 8 }]}> 
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Feather
              name="arrow-left"
              size={20}
              color={theme.colors.iconPrimary}
            />
          </Pressable>

          <Text style={styles.screenTitle}>Analytics</Text>

          <View style={styles.titleBadge}>
            <Feather name="smile" size={16} color={palette.mintStrong} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={palette.mint}
            colors={[palette.mint]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: contentReveal,
              transform: [{ translateY: heroTranslateY }],
            },
          ]}
        >
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <View style={styles.heroEyebrow}>
                <Feather name="star" size={14} color={palette.mintStrong} />
                <Text style={styles.heroEyebrowText}>Victory snapshot</Text>
              </View>

              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
            </View>

            <View style={styles.heroIllustration}>
              <View style={styles.illustrationHalo} />
              <View style={styles.illustrationMainBadge}>
                <Feather
                  name="check-circle"
                  size={32}
                  color={theme.colors.textInverse}
                />
              </View>
              <View style={styles.illustrationChipTop}>
                <Text style={styles.illustrationEmoji}>🎉</Text>
              </View>
              <View style={styles.illustrationChipBottom}>
                <Text style={styles.illustrationEmoji}>✨</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryDeck}>
            <View
              ref={completedCardRef}
              onLayout={measureCompletedCard}
              style={styles.completedHighlightCard}
            >
              <View style={styles.metricIconBubble}>
                <Feather name="award" size={18} color={palette.mintStrong} />
              </View>
              <Text style={styles.completedHighlightLabel}>Completed</Text>
              <Text style={styles.completedHighlightValue}>
                {totals.completed}
              </Text>
              <Text style={styles.completedHighlightHint}>
                {completedToday > 0
                  ? `${completedToday} ${getPlural(
                      completedToday,
                      'task',
                    )} wrapped today`
                  : 'Every finished task lands here'}
              </Text>
            </View>

            <View style={styles.summaryStack}>
              <View style={styles.summaryAccentCard}>
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>Completion rate</Text>
                  <Text style={styles.factValue}>{completionRate}%</Text>
                </View>
                <View style={styles.factDivider} />
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>Wins today</Text>
                  <Text style={styles.factValue}>{completedToday}</Text>
                </View>
                <View style={styles.factDivider} />
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>Most active</Text>
                  <Text style={styles.factValue}>
                    {sectionLabels[dominantSection[0]]}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.compactOverview,
            {
              opacity: delayedOpacity,
              transform: [{ translateY: secondaryTranslateY }],
            },
          ]}
        >
          <View style={styles.overviewPill}>
            <Feather
              name="clock"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.overviewPillText}>{totals.pending} still open</Text>
          </View>
          <View style={styles.overviewPill}>
            <Feather
              name="layers"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.overviewPillText}>
              {dominantSection[1]} in {sectionLabels[dominantSection[0]]}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            styles.recentSection,
            {
              opacity: delayedOpacity,
              transform: [{ translateY: secondaryTranslateY }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recent wins</Text>
              <Text style={styles.sectionSubtitle}>
                The latest finished tasks that earned their confetti.
              </Text>
            </View>
          </View>

          {recentWins.length === 0 ? (
            <View style={styles.emptyWinsCard}>
              <Text style={styles.emptyWinsEmoji}>🌱</Text>
              <Text style={styles.emptyWinsTitle}>Nothing completed yet</Text>
              <Text style={styles.emptyWinsDescription}>
                Once tasks start getting checked off, this area turns into your
                little hall of wins.
              </Text>
            </View>
          ) : (
            recentWins.map((task, index) => (
              <View
                key={task.id}
                style={[
                  styles.winRow,
                  index === recentWins.length - 1 && styles.winRowLast,
                ]}
              >
                <View style={styles.winBadge}>
                  <Text style={styles.winBadgeText}>#{index + 1}</Text>
                </View>

                <View style={styles.winCopy}>
                  <Text style={styles.winTitle} numberOfLines={2}>
                    {task.content}
                  </Text>
                  <Text style={styles.winMeta}>
                    {task.label?.trim()
                      ? task.label
                      : `${sectionLabels[task.target_group]} section`}
                  </Text>
                </View>

                <Text style={styles.winCelebration}>✓</Text>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      <View pointerEvents="none" style={styles.celebrationLayer}>
        {celebrationItems.map((item, index) => {
          const animation = celebrationAnimations[index];

          return (
            <Animated.View
              key={`${item.label}-${index}`}
              style={[
                styles.celebrationItem,
                item.kind === 'greeting'
                  ? styles.greetingPill
                  : styles.celebrationBadge,
                {
                  top: launchOrigin.y + item.baseOffsetY,
                  left: launchOrigin.x + item.baseOffsetX,
                  backgroundColor: item.backgroundColor,
                  borderColor: item.borderColor,
                  opacity: animation.opacity,
                  transform: [
                    { translateX: animation.translateX },
                    { translateY: animation.translateY },
                    { scale: animation.scale },
                    {
                      rotate: animation.rotate.interpolate({
                        inputRange: [-180, 180],
                        outputRange: ['-180deg', '180deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.celebrationLabel,
                  item.kind === 'greeting' && styles.greetingLabel,
                  { color: item.textColor },
                ]}
              >
                {item.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      gap: 20,
    },
    topBarShell: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 20,
      zIndex: 2,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 4,
    },
    iconButtonPressed: {
      opacity: 0.85,
    },
    titleBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    screenTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    heroCard: {
      overflow: 'hidden',
      borderRadius: 28,
      padding: 20,
      backgroundColor: theme.isDark ? '#132033' : '#f8fffd',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(153, 246, 228, 0.18)'
        : 'rgba(0, 150, 137, 0.12)',
      shadowColor: theme.colors.shadow,
      shadowOpacity: theme.isDark ? 0.36 : 0.18,
      shadowOffset: { width: 0, height: 16 },
      shadowRadius: 28,
      elevation: 6,
    },
    heroGlowOne: {
      position: 'absolute',
      top: -28,
      right: -16,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.isDark
        ? 'rgba(45, 212, 191, 0.16)'
        : 'rgba(94, 234, 212, 0.34)',
    },
    heroGlowTwo: {
      position: 'absolute',
      bottom: -70,
      left: -40,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.isDark
        ? 'rgba(45, 212, 191, 0.08)'
        : 'rgba(191, 219, 254, 0.36)',
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
    },
    heroCopy: {
      flex: 1,
      gap: 10,
    },
    heroEyebrow: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.72)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(15, 23, 42, 0.06)',
    },
    heroEyebrowText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    heroTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.6,
    },
    heroSubtitle: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textSecondary,
      maxWidth: 250,
    },
    heroIllustration: {
      width: 104,
      height: 104,
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationHalo: {
      position: 'absolute',
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.8)',
    },
    illustrationMainBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: palette.mint,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: palette.mintStrong,
      shadowOpacity: 0.28,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 18,
      elevation: 4,
    },
    illustrationChipTop: {
      position: 'absolute',
      top: 10,
      right: 2,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#fff7ed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationChipBottom: {
      position: 'absolute',
      bottom: 10,
      left: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#fef3c7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationEmoji: {
      fontSize: 16,
    },
    summaryDeck: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 22,
    },
    completedHighlightCard: {
      flex: 1.15,
      borderRadius: 24,
      padding: 18,
      backgroundColor: theme.isDark ? 'rgba(0, 150, 137, 0.18)' : '#ffffff',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(153, 246, 228, 0.2)'
        : 'rgba(15, 23, 42, 0.06)',
      minHeight: 168,
    },
    metricIconBubble: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#d1fae5',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    completedHighlightLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    completedHighlightValue: {
      marginTop: 10,
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -1,
    },
    completedHighlightHint: {
      marginTop: 10,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      maxWidth: 132,
    },
    summaryStack: {
      flex: 0.92,
    },
    summaryAccentCard: {
      borderRadius: 22,
      padding: 16,
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.82)',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(15, 23, 42, 0.05)',
      minHeight: 168,
    },
    factRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    factLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    factValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    factDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
    compactOverview: {
      gap: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    overviewPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    overviewPillText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
    },
    recentSection: {
      marginBottom: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionSubtitle: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      maxWidth: 240,
    },
    emptyWinsCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 26,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyWinsEmoji: {
      fontSize: 28,
    },
    emptyWinsTitle: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    emptyWinsDescription: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    winRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    winRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    winBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.isDark ? 'rgba(13, 148, 136, 0.2)' : '#d1fae5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    winBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: palette.mintStrong,
    },
    winCopy: {
      flex: 1,
      gap: 3,
    },
    winTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    winMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    winCelebration: {
      fontSize: 18,
      color: palette.mintStrong,
      fontWeight: '700',
    },
    celebrationLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    celebrationItem: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    celebrationBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    greetingPill: {
      minWidth: 116,
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 19,
    },
    celebrationLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    greetingLabel: {
      fontSize: 13,
      fontWeight: '800',
    },
  });
