import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/theme/colors';
import { getToday } from '@/hooks/useDate';
import { getScheduledDateForTask } from '@/utils/taskScheduling';
import type { Task } from '@/types/task';
import { CalendarYearPicker } from './CalendarYearPicker';
import {
  CALENDAR_TRANSITION_MS,
  useCalendarTransition,
} from './useCalendarTransition';

// Local noon keeps date navigation stable across DST and timezone boundaries.
const dateFor = (day: string) => new Date(`${day}T12:00:00`);
const keyFor = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
const offsetDay = (day: string, offset: number) => {
  const date = dateFor(day);
  date.setDate(date.getDate() + offset);
  return keyFor(date);
};

export const MonthCalendar = ({
  day,
  onChange,
  tasks,
  expanded: expandedProp,
  onExpandedChange,
}: {
  day: string;
  onChange: (day: string) => void;
  tasks: Task[];
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) => {
  const theme = useAppTheme();
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = expandedProp ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;
  const [viewport, setViewport] = useState({
    selectedDay: day,
    visibleDay: day,
  });
  // Derive new selections immediately so reset doesn't produce a second,
  // unanimated render of the previous month/week before the new dates appear.
  const visibleDay =
    !expanded || viewport.selectedDay !== day ? day : viewport.visibleDay;
  const setVisibleDay = (nextDay: string) =>
    setViewport({ selectedDay: day, visibleDay: nextDay });
  const { reduceMotion, animateLayout } = useCalendarTransition();
  const opacity = React.useRef(new Animated.Value(1)).current;
  const lastContent = React.useRef(`${day}:${expanded}`);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  useEffect(() => {
    setViewport(current =>
      current.selectedDay === day
        ? current
        : { selectedDay: day, visibleDay: day },
    );
  }, [day]);
  useEffect(() => {
    if (!expanded) {
      setViewport({ selectedDay: day, visibleDay: day });
      setYearPickerOpen(false);
    }
  }, [expanded, day]);
  useEffect(() => {
    const content = `${day}:${expanded}`;
    const changed = lastContent.current !== content;
    lastContent.current = content;
    if (!changed && !reduceMotion) return;
    opacity.stopAnimation();
    if (reduceMotion || !changed) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0.82);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: CALENDAR_TRANSITION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [day, expanded, opacity, reduceMotion]);

  const date = dateFor(visibleDay);
  const first = expanded
    ? new Date(date.getFullYear(), date.getMonth(), 1, 12)
    : date;
  const start = offsetDay(keyFor(first), -((first.getDay() + 6) % 7));
  const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
  const weeks = expanded
    ? Math.ceil((((first.getDay() + 6) % 7) + lastOfMonth.getDate()) / 7)
    : 1;
  const taskDates = new Set(tasks.map(getScheduledDateForTask).filter(Boolean));
  const foreground = theme.colors.textPrimary;
  const selectedBackground = theme.isDark ? '#D8F3E5' : '#152D25';
  const selectedForeground = theme.isDark ? '#101916' : '#FFFFFF';
  const markerColor = theme.isDark ? '#B2DBCA' : '#42715E';
  const todayBorderColor = theme.isDark ? '#709889' : '#86AD9C';
  const today = getToday();

  const navigate = (direction: number) => {
    setVisibleDay(
      keyFor(new Date(date.getFullYear(), date.getMonth() + direction, 1, 12)),
    );
  };

  return (
    <View testID="calendar-block" style={s.calendarBlock}>
      <Animated.View
        testID={expanded ? 'calendar-month' : 'calendar-week'}
        style={[
          s.card,
          !expanded && s.compactCard,
          theme.isDark ? s.darkCard : s.lightCard,
          { opacity },
        ]}
      >
        {expanded ? (
          <View style={s.toolbar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => navigate(-1)}
              style={({ pressed }) => [s.arrow, pressed && s.pressed]}
            >
              <ChevronLeft size={18} color={foreground} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose calendar year"
              accessibilityHint="Opens the year picker"
              onPress={() => setYearPickerOpen(true)}
              style={({ pressed }) => [s.monthControl, pressed && s.pressed]}
            >
              <Text style={[s.month, { color: foreground }]}>
                {date.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => navigate(1)}
              style={({ pressed }) => [s.arrow, pressed && s.pressed]}
            >
              <ChevronRight size={18} color={foreground} />
            </Pressable>
          </View>
        ) : null}
        <View
          style={s.weekdays}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: 7 }, (_, index) => (
            <Text
              key={index}
              style={[s.weekday, { color: theme.colors.textSecondary }]}
            >
              {dateFor(offsetDay(start, index)).toLocaleDateString(undefined, {
                weekday: 'narrow',
              })}
            </Text>
          ))}
        </View>
        {Array.from({ length: weeks }, (_week, week) => (
          <View key={week} style={s.week}>
            {Array.from({ length: 7 }, (_, index) => {
              const dateKey = offsetDay(start, week * 7 + index);
              const cellDate = dateFor(dateKey);
              const selected = dateKey === day;
              const outside =
                expanded && cellDate.getMonth() !== date.getMonth();
              const hasTask = taskDates.has(dateKey);
              const dotColor = !hasTask
                ? 'transparent'
                : selected
                ? selectedForeground
                : markerColor;
              return (
                <Pressable
                  key={dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={`${cellDate.toLocaleDateString(
                    undefined,
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    },
                  )}${dateKey === today ? ', today' : ''}${
                    hasTask ? ', has tasks' : ''
                  }`}
                  accessibilityState={{ selected }}
                  onPress={() => onChange(dateKey)}
                  style={({ pressed }) => [s.day, pressed && s.pressed]}
                >
                  <View
                    testID={selected ? 'calendar-selected-day' : undefined}
                    style={[
                      s.daySurface,
                      selected && { backgroundColor: selectedBackground },
                      !selected &&
                        dateKey === today && {
                          borderColor: todayBorderColor,
                        },
                    ]}
                  >
                    <Text
                      style={[
                        s.dayText,
                        {
                          color: selected
                            ? selectedForeground
                            : outside
                            ? theme.colors.textMuted
                            : foreground,
                        },
                      ]}
                    >
                      {cellDate.getDate()}
                    </Text>
                    <View
                      testID={selected ? 'calendar-selected-marker' : undefined}
                      style={[
                        s.dot,
                        {
                          backgroundColor: dotColor,
                        },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        <View testID="calendar-grabber-space" style={s.grabberSpace} />
        {yearPickerOpen && expanded ? (
          <CalendarYearPicker
            year={date.getFullYear()}
            reduceMotion={reduceMotion}
            onClose={() => setYearPickerOpen(false)}
            onSelect={year => {
              setVisibleDay(keyFor(new Date(year, date.getMonth(), 1, 12)));
              setYearPickerOpen(false);
            }}
          />
        ) : null}
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse calendar' : 'Expand calendar'}
        accessibilityState={{ expanded }}
        accessibilityHint={
          expanded
            ? 'Show only the selected week'
            : 'Show the full month and date navigation'
        }
        onPress={() => {
          // Controlled calendars animate alongside the surrounding task list.
          if (!onExpandedChange) animateLayout();
          if (expanded) setVisibleDay(day);
          setYearPickerOpen(false);
          setExpanded(!expanded);
        }}
        style={({ pressed }) => [s.expandControl, pressed && s.pressed]}
      >
        <View style={s.grabberVisualArea}>
          <View
            testID="calendar-grabber"
            style={[s.grabber, { backgroundColor: theme.colors.textSecondary }]}
          />
        </View>
      </Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  // Both views use 20 points inside the card and 24 below for the full
  // 44-point target, without covering the date cells or task heading.
  calendarBlock: { paddingBottom: 24, marginBottom: -14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 0,
  },
  compactCard: { paddingTop: 10 },
  lightCard: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderColor: 'rgba(255,255,255,0.95)',
  },
  darkCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  month: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
    flexShrink: 1,
    textAlign: 'center',
  },
  monthControl: {
    minHeight: 44,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabberSpace: { height: 20 },
  expandControl: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
  },
  grabberVisualArea: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabber: { width: 28, height: 3, borderRadius: 1.5 },
  weekdays: { flexDirection: 'row', marginBottom: 2 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500' },
  week: { flexDirection: 'row' },
  day: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySurface: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
  },
  dot: {
    position: 'absolute',
    bottom: 3,
    alignSelf: 'center',
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  arrow: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
