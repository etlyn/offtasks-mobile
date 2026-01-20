import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateTask } from '@/lib/supabase';
import { useTasks } from '@/providers/TasksProvider';
import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

type CategoryKey = 'Health' | 'Shopping' | 'Work' | 'Personal' | 'Finance' | 'General';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const categoryStyles: Record<CategoryKey, { label: string; text: string; background: string; border: string }> = {
  Health: {
    label: 'Health',
    text: '#ec003f',
    background: 'rgba(255, 32, 86, 0.1)',
    border: 'rgba(255, 32, 86, 0.3)',
  },
  Shopping: {
    label: 'Shopping',
    text: '#f54900',
    background: 'rgba(255, 105, 0, 0.1)',
    border: 'rgba(255, 105, 0, 0.3)',
  },
  Work: {
    label: 'Work',
    text: '#155dfc',
    background: 'rgba(43, 127, 255, 0.1)',
    border: 'rgba(43, 127, 255, 0.3)',
  },
  Personal: {
    label: 'Personal',
    text: '#9810fa',
    background: 'rgba(173, 70, 255, 0.1)',
    border: 'rgba(173, 70, 255, 0.3)',
  },
  Finance: {
    label: 'Finance',
    text: '#d08700',
    background: 'rgba(240, 177, 0, 0.1)',
    border: 'rgba(240, 177, 0, 0.3)',
  },
  General: {
    label: 'General',
    text: palette.slate600,
    background: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.25)',
  },
};

const detectCategory = (task: Task): CategoryKey => {
  const content = task.content.toLowerCase();

  if (/(dentist|health|doctor|medical|appointment)/.test(content)) {
    return 'Health';
  }
  if (/(shop|grocery|purchase|order|store)/.test(content)) {
    return 'Shopping';
  }
  if (/(gift|birthday|family|mom|personal)/.test(content)) {
    return 'Personal';
  }
  if (/(budget|finance|bill|insurance|tax)/.test(content)) {
    return 'Finance';
  }
  if (/(project|review|meeting|team|update|deploy|report|prepare|contract|build|hire)/.test(content)) {
    return 'Work';
  }
  return 'General';
};

const formatTaskDate = (value: string) => {
  const [year, month, day] = value.split('-');
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);

  if (!year || Number.isNaN(monthIndex) || Number.isNaN(dayNumber) || monthIndex < 0 || monthIndex > 11) {
    return value;
  }

  return `${dayNumber} ${monthLabels[monthIndex]}, ${year}`;
};

export const CompletedScreen = () => {
  const { tasks, totals, loading, refresh } = useTasks();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const allTasks = React.useMemo(() => Object.values(tasks).flat(), [tasks]);
  const completedTasks = React.useMemo(
    () =>
      allTasks
        .filter((task) => task.isComplete)
        .sort((a, b) => {
          const aDate = a.completed_at ?? a.date;
          const bDate = b.completed_at ?? b.date;
          return aDate < bDate ? 1 : -1;
        }),
    [allTasks]
  );

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

  const handleOpenDrawer = React.useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleRestore = React.useCallback(
    async (task: Task) => {
      if (pendingId) {
        return;
      }
      setPendingId(task.id);
      try {
        await updateTask(task.id, { isComplete: false, completed_at: null });
        await refresh();
      } finally {
        setPendingId(null);
      }
    },
    [pendingId, refresh]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={palette.mint} colors={[palette.mint]} />
        }
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name="arrow-left" size={20} color={palette.slate900} />
          </Pressable>
          <Text style={styles.screenTitle}>Completed</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            onPress={handleOpenDrawer}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Feather name="menu" size={20} color={palette.slate900} />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>{totals.completed} tasks completed</Text>

        <View style={styles.list}>
          {completedTasks.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateLabel}>
                Nothing wrapped up yet. Once you check something off, it will land here.
              </Text>
            </View>
          ) : (
            completedTasks.map((task) => {
              const category = detectCategory(task);
              const swatch = categoryStyles[category];
              const isPending = pendingId === task.id;

              return (
                <Pressable
                  key={task.id}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => handleRestore(task)}
                  disabled={isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`Restore ${task.content}`}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.checkmark}> 
                      {isPending ? (
                        <ActivityIndicator size="small" color={palette.mint} />
                      ) : (
                        <Feather name="check" size={16} color={palette.mint} />
                      )}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {task.content}
                    </Text>
                    <Feather name="corner-up-left" size={18} color={palette.slate600} />
                  </View>

                  <View style={styles.cardMeta}>
                    <View
                      style={[
                        styles.tag,
                        {
                          backgroundColor: swatch.background,
                          borderColor: swatch.border,
                        },
                      ]}
                    >
                      <Text style={[styles.tagLabel, { color: swatch.text }]}>{swatch.label}</Text>
                    </View>
                    <Text style={styles.cardDate}>{formatTaskDate(task.completed_at ?? task.date)}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.lightBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
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
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  iconButtonPressed: {
    opacity: 0.85,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  subtitle: {
    fontSize: 14,
    color: palette.slate600,
    marginBottom: 8,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: palette.lightSurface,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
    gap: 14,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 150, 137, 0.1)',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate600,
    textDecorationLine: 'line-through',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 12,
    color: palette.slate600,
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: palette.lightSurface,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    shadowColor: palette.lightShadow,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  emptyStateLabel: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slate600,
    textAlign: 'center',
  },
});
