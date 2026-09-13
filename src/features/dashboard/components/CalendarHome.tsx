import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Menu,
  CalendarDays,
  CircleCheck,
  RotateCcw,
} from 'lucide-react-native';
export { CalendarBackdrop } from '@/components/PageBackdrop';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/GlassSurface';
import { useAppTheme } from '@/theme/colors';
import { getToday } from '@/hooks/useDate';
import { TaskSearchButton } from './TaskSearch';
import { HeaderSlot, useSharedHeader } from '@/navigation/SharedHeader';

export function CalendarHomeHeader({
  onMenu,
  onSearch,
}: {
  onMenu: () => void;
  onSearch: () => void;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const sharedHeader = useSharedHeader();
  if (sharedHeader)
    return (
      <>
        <HeaderSlot
          onMenu={onMenu}
          onSearch={onSearch}
          searchLabel="Search tasks"
        />
        <View style={{ height: insets.top + 58 }} />
      </>
    );
  return (
    <View style={[s.header, { paddingTop: insets.top + 4 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open navigation menu"
        onPress={onMenu}
        style={({ pressed }) => [s.headerTouchArea, pressed && s.pressed]}
      >
        <GlassSurface testID="calendar-menu-surface" style={s.iconButton}>
          <Menu size={18} color={theme.colors.textPrimary} strokeWidth={1.8} />
        </GlassSurface>
      </Pressable>
      <Text style={[s.wordmark, { color: theme.colors.textPrimary }]}>
        offtasks<Text style={s.brandDot}>.</Text>
      </Text>
      <TaskSearchButton onPress={onSearch} />
    </View>
  );
}

export function CalendarPlanHeading({
  completed,
  total,
  day,
  onReset,
}: {
  completed: number;
  total: number;
  day: string;
  onReset: () => void;
}) {
  const theme = useAppTheme();
  const title =
    day === getToday()
      ? 'Today'
      : new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
  return (
    <View testID="calendar-plan-heading" style={s.planHeading}>
      <View testID="calendar-plan-summary" style={s.planSummary}>
        <Text
          accessibilityRole="header"
          style={[s.planTitle, { color: theme.colors.textPrimary }]}
        >
          {title}
        </Text>
        {total > 0 ? (
          <Text
            accessibilityLabel={`${completed} of ${total} tasks completed`}
            style={[s.progressLabel, { color: theme.colors.textSecondary }]}
          >
            {completed}/{total}
          </Text>
        ) : null}
      </View>
      {day !== getToday() ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to today"
          accessibilityHint="Resets the calendar selection to today's date"
          onPress={onReset}
          style={({ pressed }) => [s.headerTouchArea, pressed && s.pressed]}
        >
          <RotateCcw
            size={16}
            strokeWidth={1.8}
            color={theme.isDark ? '#D8F3E5' : '#152D25'}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export function CalendarEmptyPlan({ allComplete }: { allComplete: boolean }) {
  const theme = useAppTheme();
  const Icon = allComplete ? CircleCheck : CalendarDays;
  return (
    <View style={[s.empty, theme.isDark ? s.emptyDark : s.emptyLight]}>
      <Icon
        size={24}
        strokeWidth={1.4}
        color={theme.isDark ? '#A9D9C7' : '#628476'}
      />
      <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>
        {allComplete ? 'All done' : 'No tasks planned'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTouchArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontSize: 20, fontWeight: '700', letterSpacing: -0.7 },
  brandDot: { color: '#009689' },
  planHeading: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
    // Align the 44-point reset with the dock's 46-point plus center:
    // 24 + 4 - 7 + 22 = 20 + 23 points from the screen's right edge.
    marginRight: -7,
  },
  planSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  progressLabel: { fontSize: 12, fontVariant: ['tabular-nums'] },
  empty: {
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 72,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyLight: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(255,255,255,0.8)',
  },
  emptyDark: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: { fontSize: 13, lineHeight: 20 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
});
