import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Flag,
  Heart,
  House,
  BriefcaseBusiness,
  ShoppingBag,
  Wallet,
  UserRound,
  ChevronRight,
  Ellipsis,
  type LucideIcon,
} from 'lucide-react-native';
import { GentlePressable } from '@/components/ProductUI';
import { useAppTheme } from '@/theme/colors';

const icons: Record<string, LucideIcon> = {
  finance: Wallet,
  health: Heart,
  home: House,
  work: BriefcaseBusiness,
  shopping: ShoppingBag,
  personal: UserRound,
};

export function GoalRow({
  goal,
  onOpen,
  onOptions,
  disabled,
}: {
  goal: { name: string; total: number; completed: number };
  onOpen: () => void;
  onOptions: () => void;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const Icon = icons[goal.name.toLowerCase()] ?? Flag;
  return (
    <View
      testID="goal-row"
      style={[
        s.row,
        {
          borderBottomColor: theme.isDark
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(21,45,37,0.07)',
        },
      ]}
    >
      <GentlePressable
        accessibilityRole="button"
        accessibilityLabel={`Open goal ${goal.name}, ${goal.completed} of ${goal.total} completed`}
        onPress={onOpen}
        style={s.main}
      >
        <View
          style={[
            s.icon,
            {
              backgroundColor: theme.isDark
                ? 'rgba(216,243,229,0.07)'
                : 'rgba(21,45,37,0.04)',
            },
          ]}
        >
          <Icon size={18} strokeWidth={1.6} color={brand} />
        </View>
        <View style={s.copy}>
          <Text
            style={[s.title, { color: theme.colors.textPrimary }]}
            numberOfLines={2}
          >
            {goal.name}
          </Text>
          {goal.total > 0 ? (
            <>
              <Text style={[s.meta, { color: theme.colors.textSecondary }]}>
                {goal.completed === goal.total
                  ? 'Completed'
                  : `${goal.total - goal.completed} remaining`}
              </Text>
              <View
                style={[
                  s.track,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(216,243,229,0.10)'
                      : 'rgba(21,45,37,0.06)',
                  },
                ]}
              >
                <View
                  style={[
                    s.fill,
                    {
                      backgroundColor: brand,
                      width: `${(goal.completed / goal.total) * 100}%`,
                    },
                  ]}
                />
              </View>
            </>
          ) : null}
        </View>
        {goal.total > 0 ? (
          <Text style={[s.count, { color: theme.colors.textSecondary }]}>
            {goal.completed}/{goal.total}
          </Text>
        ) : null}
        {goal.total > 0 ? (
          <ChevronRight
            size={16}
            strokeWidth={1.6}
            color={theme.colors.textMuted}
          />
        ) : null}
      </GentlePressable>
      {goal.total === 0 ? (
        <GentlePressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${goal.name}`}
          accessibilityHint="Open or remove this empty goal"
          disabled={disabled}
          onPress={onOptions}
          style={s.options}
        >
          <Ellipsis
            size={18}
            strokeWidth={1.6}
            color={theme.colors.textSecondary}
          />
        </GentlePressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: {
    flex: 1,
    minHeight: 68,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  meta: { fontSize: 12, lineHeight: 17 },
  count: { fontSize: 11, fontVariant: ['tabular-nums'] },
  track: { height: 3, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
  options: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
