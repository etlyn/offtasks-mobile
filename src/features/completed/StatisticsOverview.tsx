import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ChevronRight, Flag } from 'lucide-react-native';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAppTheme } from '@/theme/colors';
import { goalSummaries } from '@/utils/planner';
import type { Task } from '@/types/task';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const circumference = 2 * Math.PI * 44;

export function CompletionRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const ratio = total ? Math.min(1, Math.max(0, completed / total)) : 0;
  const value = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    value.stopAnimation();
    if (reduceMotion) {
      value.setValue(ratio);
      return;
    }
    const animation = Animated.timing(value, {
      toValue: ratio,
      duration: 480,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [ratio, reduceMotion, value]);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        total
          ? `${completed} of ${total} tasks completed, ${Math.round(
              ratio * 100,
            )} percent`
          : 'No tasks yet'
      }
      style={s.ring}
    >
      <Svg width={108} height={108} viewBox="0 0 108 108" accessible={false}>
        <Circle
          cx={54}
          cy={54}
          r={44}
          fill="none"
          stroke={theme.isDark ? '#293B33' : '#DEE8E1'}
          strokeWidth={9}
        />
        {ratio > 0 ? (
          <AnimatedCircle
            cx={54}
            cy={54}
            r={44}
            fill="none"
            stroke={theme.isDark ? '#D8F3E5' : '#244C3D'}
            strokeWidth={9}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={value.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, 0],
            })}
            rotation={-90}
            origin="54,54"
          />
        ) : null}
      </Svg>
      <View pointerEvents="none" style={s.ringLabel}>
        <Text style={[s.percent, { color: theme.colors.textPrimary }]}>
          {total ? `${Math.round(ratio * 100)}%` : '—'}
        </Text>
        <Text style={[s.caption, { color: theme.colors.textSecondary }]}>
          {total ? 'done' : 'no tasks'}
        </Text>
      </View>
    </View>
  );
}

export function StatisticsOverview({
  tasks,
  categories,
  onGoal,
  onCelebrate,
}: {
  tasks: Task[];
  categories: string[];
  onGoal: (name?: string) => void;
  onCelebrate: () => void;
}) {
  const theme = useAppTheme();
  const ink = theme.colors.textPrimary;
  const muted = theme.colors.textSecondary;
  const brand = theme.isDark ? '#D8F3E5' : '#244C3D';
  const completed = tasks.filter(task => task.isComplete).length;
  const goals = goalSummaries(tasks, categories).filter(goal => goal.total > 0);
  const finishedGoals = goals.filter(
    goal => goal.total === goal.completed,
  ).length;
  return (
    <View style={s.overview}>
      <View
        style={[
          s.completionCard,
          {
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.68)',
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(21,45,37,0.07)',
          },
        ]}
      >
        <CompletionRing completed={completed} total={tasks.length} />
        <View style={s.legend}>
          <Text style={[s.heading, { color: ink }]}>All-time progress</Text>
          <Text style={[s.legendText, { color: ink }]}>
            {completed} completed
          </Text>
          <Text style={[s.legendText, { color: muted }]}>
            {tasks.length - completed} open
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Celebrate progress"
            accessibilityHint="Play a short emoji celebration"
            disabled={!completed}
            onPress={onCelebrate}
            style={s.celebrateTarget}
          >
            <View
              style={[
                s.celebrate,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(216,243,229,0.08)'
                    : 'rgba(21,45,37,0.05)',
                },
              ]}
            >
              <Text style={s.emoji}>🎉</Text>
              <Text style={[s.caption, { color: ink }]}>Celebrate</Text>
            </View>
          </Pressable>
        </View>
      </View>
      <View>
        <View style={s.goalHeading}>
          <Text accessibilityRole="header" style={[s.heading, { color: ink }]}>
            Goals
          </Text>
          {goals.length ? (
            <Text style={[s.caption, { color: muted }]}>
              {finishedGoals}/{goals.length} complete
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all goals"
            onPress={() => onGoal()}
            style={s.viewAll}
          >
            <Text style={[s.caption, { color: muted }]}>View all</Text>
            <ChevronRight size={13} color={muted} />
          </Pressable>
        </View>
        {goals.length ? (
          goals.slice(0, 3).map(goal => (
            <Pressable
              key={goal.name}
              accessibilityRole="button"
              accessibilityLabel={`Goal ${goal.name}, ${goal.completed} of ${goal.total} completed`}
              onPress={() => onGoal(goal.name)}
              style={s.goalRow}
            >
              <Flag size={16} strokeWidth={1.7} color={brand} />
              <View style={s.goalBody}>
                <View style={s.goalMeta}>
                  <Text numberOfLines={1} style={[s.goalName, { color: ink }]}>
                    {goal.name}
                  </Text>
                  <Text style={[s.caption, { color: muted }]}>
                    {goal.completed}/{goal.total}
                  </Text>
                </View>
                <View
                  style={[
                    s.progressTrack,
                    { backgroundColor: theme.isDark ? '#293B33' : '#DEE8E1' },
                  ]}
                >
                  <View
                    style={{
                      width: `${(goal.completed / goal.total) * 100}%`,
                      height: 3,
                      backgroundColor: brand,
                    }}
                  />
                </View>
              </View>
              <ChevronRight size={14} color={muted} />
            </Pressable>
          ))
        ) : (
          <Text style={[s.emptyGoals, { color: muted }]}>
            No tasks in goals yet
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overview: { gap: 16 },
  completionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 20,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ring: { width: 108, height: 108 },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: { fontSize: 23, fontWeight: '600', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 12, lineHeight: 18 },
  legend: { flex: 1 },
  heading: { fontSize: 13, fontWeight: '600' },
  legendText: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  celebrateTarget: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  celebrate: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 14 },
  goalHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
  },
  viewAll: {
    marginLeft: 'auto',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  goalRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalBody: { flex: 1, gap: 8 },
  goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalName: { flex: 1, fontSize: 13 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  emptyGoals: { fontSize: 13, paddingVertical: 10 },
});
