import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Feather from 'react-native-vector-icons/Feather';
import { palette, useAppTheme } from '@/theme/colors';
import { getToday } from '@/hooks/useDate';
import { getScheduledDateForTask } from '@/utils/taskScheduling';
import type { Task } from '@/types/task';

export const MonthCalendar = ({
  day,
  onChange,
  tasks,
}: {
  day: string;
  onChange: (day: string) => void;
  tasks: Task[];
}) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(true);
  const [month, setMonth] = useState(day);
  const markedDates: Record<
    string,
    {
      marked?: boolean;
      dotColor?: string;
      selected?: boolean;
      selectedColor?: string;
    }
  > = {};
  for (const task of tasks) {
    const date = getScheduledDateForTask(task);
    if (date) markedDates[date] = { marked: true, dotColor: palette.mint };
  }
  markedDates[day] = {
    ...markedDates[day],
    selected: true,
    selectedColor: palette.mint,
  };
  return (
    <View style={styles.section}>
      {expanded ? (
        <Calendar
          key={`${theme.mode}-${month.slice(0, 7)}`}
          current={month}
          onMonthChange={date => setMonth(date.dateString)}
          onDayPress={date => onChange(date.dateString)}
          markedDates={markedDates}
          enableSwipeMonths
          showSixWeeks
          style={[
            styles.calendar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          theme={{
            backgroundColor: theme.colors.background,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.textSecondary,
            dayTextColor: theme.colors.textPrimary,
            monthTextColor: theme.colors.textPrimary,
            textDisabledColor: theme.colors.textMuted,
            todayTextColor: palette.mintStrong,
            arrowColor: palette.mintStrong,
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 11,
          }}
        />
      ) : null}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to today"
          onPress={() => {
            const today = getToday();
            setMonth(today);
            onChange(today);
          }}
          style={styles.today}
        >
          <Text style={{ color: palette.mintStrong, fontWeight: '600' }}>
            Today
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? 'Collapse calendar' : 'Expand calendar'
          }
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(!expanded)}
          style={styles.collapse}
        >
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            color={theme.colors.textSecondary}
            size={22}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 10 },
  calendar: {
    borderWidth: 1,
    borderRadius: 20,
    paddingBottom: 8,
    minHeight: 340,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  today: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  collapse: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
