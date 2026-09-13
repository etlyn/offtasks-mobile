import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Animated,
  StyleSheet,
  Alert,
  FlatList,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DetachedSheet } from '@/components/DetachedSheet';
import { SheetHeader } from '@/components/SheetHeader';
import { Flag } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  GentlePressable as Pressable,
  PageBackdrop,
  QuietEmpty,
} from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useSearchTransition } from '@/features/dashboard/components/useSearchTransition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlannerHeader } from '@/components/navigation/PlannerHeader';
import { useTasks } from '@/providers/TasksProvider';
import {
  normalizeCategory,
  useTaskCategories,
} from '@/hooks/useTaskCategories';
import { goalSummaries } from '@/utils/planner';
import { useAppTheme } from '@/theme/colors';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';
import { GoalRow } from './GoalRow';
import { HeaderLayer } from '@/navigation/SharedHeader';
import { useTaskCreation } from '@/navigation/TaskCreationContext';
import { TaskSearchHeader } from '@/features/dashboard/components/TaskSearch';
import { plannerStyles } from './Planner.styles';

export const GoalsScreen = ({
  route,
}: {
  route?: { params?: { openGoalRequest?: { id: string; requestId: number } } };
}) => {
  const theme = useAppTheme();
  const { reduceMotion, animateLayout } = useCalendarTransition();
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const styles = plannerStyles(theme);
  const insets = useSafeAreaInsets();
  const { tasks, refreshing, refresh } = useTasks();
  const { categories, addCategory, removeCategory, loading, error, reload } =
    useTaskCategories();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const detail = useSearchTransition(detailVisible, reduceMotion, () =>
    setSelected(null),
  );
  const [searchVisible, setSearchVisible] = useState(false);
  const search = useSearchTransition(searchVisible, reduceMotion, () =>
    setQuery(''),
  );
  const closeSearch = React.useCallback(() => {
    Keyboard.dismiss();
    setSearchVisible(false);
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        if (detailVisible) {
          setDetailVisible(false);
          return true;
        }
        if (searchVisible) {
          closeSearch();
          return true;
        }
        return false;
      });
      return () => back.remove();
    }, [detailVisible, searchVisible, closeSearch]),
  );
  const nameInput = useRef<TextInput>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const creation = useTaskCreation();
  const setGoalAction = creation?.setGoalAction;
  const openTask = creation?.openTask;
  React.useEffect(() => {
    setGoalAction?.({
      label: detail.mounted ? 'Add task' : 'Add goal',
      disabled: loading || !!error || saving || creating,
      onPress: () => {
        Keyboard.dismiss();
        if (detail.mounted && selected) {
          openTask?.(undefined, selected);
          return;
        }
        setName('');
        setCreating(true);
      },
    });
    return () => setGoalAction?.(null);
  }, [
    setGoalAction,
    openTask,
    loading,
    error,
    saving,
    creating,
    detail.mounted,
    selected,
  ]);
  const goals = goalSummaries(Object.values(tasks).flat(), categories);
  const handledRequest = useRef<number | null>(null);
  const openRequest = route?.params?.openGoalRequest;
  React.useEffect(() => {
    if (
      !openRequest ||
      loading ||
      error ||
      handledRequest.current === openRequest.requestId
    )
      return;
    handledRequest.current = openRequest.requestId;
    const goal = goals.find(
      item =>
        item.name.toLocaleLowerCase() === openRequest.id.toLocaleLowerCase(),
    );
    if (goal) {
      setSelected(goal.name);
      setDetailVisible(true);
    } else Alert.alert('Goal unavailable', 'This goal may have been removed.');
  }, [openRequest, loading, error, goals]);
  const matches = goals.filter(goal =>
    goal.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  const closeCreate = () => {
    if (busy.current) return;
    if (!name.trim()) {
      setCreating(false);
      return;
    }
    Alert.alert('Discard changes?', 'Your unsaved goal will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => setCreating(false),
      },
    ]);
  };

  const create = async () => {
    if (busy.current || !name.trim()) return;
    const normalized = normalizeCategory(name);
    if (
      goals.some(
        goal =>
          goal.name.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
      )
    ) {
      Alert.alert('Goal already exists', 'Choose a different name.');
      return;
    }
    busy.current = true;
    setSaving(true);
    try {
      const created = await addCategory(normalized);
      setCreating(false);
      setSelected(created);
      setDetailVisible(true);
    } catch {
      Alert.alert('Could not save goal', 'Please try again.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const remove = (goal: string) => {
    Alert.alert('Remove empty goal?', 'Tasks will not be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (busy.current) return;
          busy.current = true;
          setSaving(true);
          try {
            await removeCategory(goal);
          } catch {
            Alert.alert('Could not remove goal', 'Please try again.');
          } finally {
            busy.current = false;
            setSaving(false);
          }
        },
      },
    ]);
  };

  const openGoal = (goal: string) => {
    Keyboard.dismiss();
    setSelected(goal);
    setDetailVisible(true);
  };
  const renderList = (searchPage: boolean) => (
    <>
      {error ? (
        <View style={styles.empty}>
          <Text style={styles.body}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={reload}
            style={styles.save}
          >
            <Text style={styles.saveText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        testID={searchPage ? 'goals-search-results' : 'goals-list'}
        data={error ? [] : searchPage ? matches : goals}
        keyExtractor={goal => goal.name}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => refresh({ showRefreshSpinner: true })}
        contentContainerStyle={[
          { paddingHorizontal: 24, paddingTop: 4 },
          { paddingBottom: insets.bottom + 110 },
        ]}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              {loading ? (
                <ActivityIndicator color={brand} />
              ) : (
                <>
                  <QuietEmpty
                    icon={Flag}
                    label={
                      searchPage && query ? 'No matching goals' : 'No goals yet'
                    }
                  />
                </>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <GoalRow
            goal={item}
            disabled={saving || loading}
            onOpen={() => openGoal(item.name)}
            onOptions={() =>
              Alert.alert(item.name, undefined, [
                { text: 'Open goal', onPress: () => openGoal(item.name) },
                {
                  text: 'Remove empty goal',
                  style: 'destructive',
                  onPress: () => remove(item.name),
                },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
        )}
      />
    </>
  );

  return (
    <View style={styles.root}>
      <PageBackdrop />
      <View
        style={styles.grow}
        testID="goals-underlay"
        pointerEvents={detail.mounted || search.mounted ? 'none' : 'auto'}
        accessibilityElementsHidden={detail.mounted || search.mounted}
        importantForAccessibility={
          detail.mounted || search.mounted ? 'no-hide-descendants' : 'auto'
        }
      >
        <PlannerHeader
          title="Goals"
          actions={[
            {
              icon: 'search',
              label: 'Search goals',
              onPress: () => setSearchVisible(true),
            },
          ]}
        />
        {renderList(false)}
      </View>
      {search.mounted ? (
        <View
          style={StyleSheet.absoluteFill}
          testID="goals-search-overlay"
          pointerEvents={detail.mounted ? 'none' : 'auto'}
          accessibilityElementsHidden={detail.mounted}
          importantForAccessibility={
            detail.mounted ? 'no-hide-descendants' : 'auto'
          }
          accessibilityViewIsModal
          onAccessibilityEscape={closeSearch}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.colors.background,
                opacity: search.progress,
              },
            ]}
          >
            <PageBackdrop />
          </Animated.View>
          <TaskSearchHeader
            scope="goals"
            topInset={insets.top}
            value={query}
            onChange={value => {
              animateLayout();
              setQuery(value);
            }}
            onClose={closeSearch}
            progress={search.progress}
            fieldProgress={search.fieldProgress}
            ready={search.ready && !creating && !detail.mounted}
            resultCount={matches.length}
          />
          <Animated.View
            style={[
              styles.grow,
              {
                opacity: search.progress,
                transform: [
                  {
                    translateY: search.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {renderList(true)}
          </Animated.View>
        </View>
      ) : null}
      {detail.mounted && selected ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: detail.progress,
              transform: [
                {
                  translateX: detail.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <HeaderLayer.Provider value={10}>
            <DashboardScreen
              key={selected}
              route={{
                params: { view: 'goal', category: selected, group: 'upcoming' },
              }}
              onBack={() => setDetailVisible(false)}
            />
          </HeaderLayer.Provider>
        </Animated.View>
      ) : null}
      <DetachedSheet
        visible={creating}
        reduceMotion={reduceMotion}
        insetTop={insets.top}
        insetBottom={insets.bottom}
        dismissLabel="Dismiss goal editor"
        onClose={closeCreate}
        onShow={() => nameInput.current?.focus()}
        onDismiss={() => setName('')}
      >
        <SheetHeader
          onClose={closeCreate}
          onSave={create}
          closeLabel="Cancel new goal"
          saveLabel="Save goal"
          action="Add"
          busy={saving}
          disabled={!name.trim()}
        />
        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <TextInput
            selectionColor={brand}
            keyboardAppearance={theme.keyboardAppearance}
            accessibilityLabel="Goal name"
            ref={nameInput}
            maxLength={80}
            value={name}
            onChangeText={setName}
            placeholder="Goal name"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.editorTitle}
            returnKeyType="done"
            onSubmitEditing={create}
            editable={!saving}
          />
        </ScrollView>
      </DetachedSheet>
    </View>
  );
};
