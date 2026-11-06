import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ellipsis } from 'lucide-react-native';
import { GentlePressable } from '@/components/ProductUI';
import { useAppTheme } from '@/theme/colors';
import {
  defaultGoalAppearance,
  goalColors,
  type GoalAppearance,
} from '@/lib/goalAppearance';
import { GoalAvatar } from './GoalAvatar';
import { GoalProgress } from './GoalProgress';
import { SwipeDeleteRow, SwipeRowContents } from '@/components/SwipeDeleteRow';

export function GoalRow({
  goal,
  appearance = defaultGoalAppearance(goal.name),
  onOpen,
  onOptions,
  onRemove,
  disabled,
}: {
  goal: { name: string; total: number; completed: number };
  appearance?: GoalAppearance;
  onOpen: () => void;
  onOptions: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const swipeGuard = React.useRef(false);
  const color = goalColors[appearance.color] ?? goalColors[0];
  return (
    <SwipeDeleteRow
      label={`Remove goal ${goal.name}`}
      onDelete={onRemove}
      disabled={disabled}
      style={s.swipe}
      pressGuard={swipeGuard}
    >
      <View
        testID="goal-row"
        style={[
          s.row,
          {
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.035)'
              : 'rgba(255,255,255,0.56)',
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(21,45,37,0.045)',
          },
        ]}
      >
        <SwipeRowContents style={s.rowContents}>
          <GentlePressable
            accessibilityRole="button"
            accessibilityLabel={`Open goal ${goal.name}, ${goal.completed} of ${goal.total} completed`}
            disabled={disabled}
            onPress={() => {
              if (!swipeGuard.current) onOpen();
            }}
            accessibilityActions={[{ name: 'delete', label: 'Remove goal' }]}
            onAccessibilityAction={({ nativeEvent }) => {
              if (!disabled && nativeEvent.actionName === 'delete') onRemove();
            }}
            style={s.main}
          >
            <GoalAvatar name={goal.name} appearance={appearance} />
            <View style={s.copy}>
              <Text
                style={[s.title, { color: theme.colors.textPrimary }]}
                numberOfLines={2}
              >
                {goal.name}
              </Text>
              <Text style={[s.meta, { color: theme.colors.textSecondary }]}>
                {goal.total
                  ? `${goal.completed}/${goal.total} done`
                  : 'Ready for a first step'}
              </Text>
              {goal.total > 0 ? (
                <GoalProgress
                  completed={goal.completed}
                  total={goal.total}
                  color={theme.isDark ? color.light : color.ink}
                />
              ) : null}
            </View>
          </GentlePressable>
          <GentlePressable
            accessibilityRole="button"
            accessibilityLabel={`Options for ${goal.name}`}
            accessibilityHint="Personalize this goal"
            disabled={disabled}
            onPress={() => {
              if (!swipeGuard.current) onOptions();
            }}
            style={s.options}
          >
            <Ellipsis
              size={18}
              strokeWidth={1.6}
              color={theme.colors.textSecondary}
            />
          </GentlePressable>
        </SwipeRowContents>
      </View>
    </SwipeDeleteRow>
  );
}
const s = StyleSheet.create({
  swipe: { marginBottom: 10, borderRadius: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 4,
  },
  rowContents: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  main: {
    flex: 1,
    minHeight: 88,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copy: { flex: 1, gap: 6 },
  title: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  meta: { fontSize: 12, lineHeight: 17 },
  options: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
