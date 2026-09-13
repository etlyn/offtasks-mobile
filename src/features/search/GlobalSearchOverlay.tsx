import React from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FileText, Flag, Search, SquareCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GentlePressable,
  PageBackdrop,
  QuietEmpty,
} from '@/components/ProductUI';
import { TaskSearchHeader } from '@/features/dashboard/components/TaskSearch';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import { GUEST_ID } from '@/lib/localTasks';
import { readPlanner, subscribePlanner, syncPlanner } from '@/lib/plannerSync';
import type { Note } from '@/lib/notes';
import { searchEverything, type SearchResult } from '@/utils/globalSearch';
import { useAppTheme } from '@/theme/colors';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';

export function GlobalSearchOverlay({
  transition,
  onClose,
  onSelect,
}: {
  transition: {
    progress: Animated.Value;
    fieldProgress: Animated.Value;
    ready: boolean;
  };
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
}) {
  const userId = useAuth().session?.user.id || GUEST_ID;
  const { tasks, error: taskError, refresh } = useTasks();
  const theme = useAppTheme();
  const { animateLayout } = useCalendarTransition();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState('');
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [goals, setGoals] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [revision, retry] = React.useReducer(value => value + 1, 0);
  React.useEffect(() => setQuery(''), [userId]);
  React.useEffect(() => {
    let active = true;
    let request = 0;
    setNotes([]);
    setGoals([]);
    setLoading(true);
    const load = async () => {
      const current = ++request;
      const [savedNotes, savedGoals] = await Promise.allSettled([
        readPlanner(userId, 'note'),
        readPlanner(userId, 'goal'),
      ]);
      if (!active || current !== request) return;
      setError(
        savedNotes.status === 'rejected' || savedGoals.status === 'rejected',
      );
      if (savedNotes.status === 'fulfilled') setNotes(savedNotes.value);
      if (savedGoals.status === 'fulfilled') setGoals(savedGoals.value);
      setLoading(false);
    };
    void load();
    const unsubscribe = subscribePlanner(() => {
      void load();
    });
    void Promise.allSettled([
      syncPlanner(userId, 'note'),
      syncPlanner(userId, 'goal'),
    ]).then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId, revision]);
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onClose]);
  const results = React.useMemo(
    () => searchEverything(Object.values(tasks).flat(), notes, goals, query),
    [tasks, notes, goals, query],
  );
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  return (
    <View
      testID="global-search-overlay"
      style={styles.overlay}
      onAccessibilityEscape={onClose}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.colors.background,
            opacity: transition.progress,
          },
        ]}
      >
        <PageBackdrop />
      </Animated.View>
      <TaskSearchHeader
        registerHeader={false}
        scope="items"
        topInset={insets.top}
        value={query}
        onChange={value => {
          animateLayout();
          setQuery(value);
        }}
        onClose={onClose}
        progress={transition.progress}
        fieldProgress={transition.fieldProgress}
        ready={transition.ready}
        resultCount={results.length}
      />
      <Animated.View
        style={[
          styles.list,
          {
            opacity: transition.progress,
            transform: [
              {
                translateY: transition.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <FlatList
          data={results}
          keyExtractor={item => item.key}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 110 },
          ]}
          ListHeaderComponent={
            error || taskError ? (
              <View style={styles.notice}>
                <Text
                  style={[
                    styles.caption,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Some items couldn’t be loaded.
                </Text>
                <GentlePressable
                  accessibilityRole="button"
                  onPress={() => {
                    retry();
                    void refresh({ showRefreshSpinner: false });
                  }}
                  style={styles.retry}
                >
                  <Text style={{ color: brand }}>Retry</Text>
                </GentlePressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={brand} style={styles.empty} />
            ) : (
              <View style={styles.empty}>
                <QuietEmpty
                  icon={Search}
                  label={query.trim() ? 'No matches' : 'Tasks, notes and goals'}
                />
              </View>
            )
          }
          renderItem={({ item }) => {
            const Icon =
              item.kind === 'task'
                ? SquareCheck
                : item.kind === 'note'
                ? FileText
                : Flag;
            return (
              <GentlePressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.kind} ${item.title}`}
                onPress={() => onSelect(item)}
                style={[
                  styles.result,
                  {
                    borderBottomColor: theme.isDark
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(21,45,37,0.055)',
                  },
                ]}
              >
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.icon}
                >
                  <Icon size={20} strokeWidth={1.6} color={brand} />
                </View>
                <View style={styles.text}>
                  <Text
                    numberOfLines={2}
                    style={[styles.title, { color: theme.colors.textPrimary }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.caption,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </GentlePressable>
            );
          }}
        />
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 30 },
  list: { flex: 1 },
  content: { paddingHorizontal: 24 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: { width: 24, alignItems: 'center' },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 15, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 18 },
  empty: { paddingTop: 16 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retry: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
});
