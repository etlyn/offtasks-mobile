import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlannerHeader } from '@/components/navigation/PlannerHeader';
import { useTasks } from '@/providers/TasksProvider';
import {
  normalizeCategory,
  useTaskCategories,
} from '@/hooks/useTaskCategories';
import { goalSummaries } from '@/utils/planner';
import { palette, useAppTheme } from '@/theme/colors';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';
import { plannerStyles } from './Planner.styles';

export const GoalsScreen = () => {
  const theme = useAppTheme();
  const styles = plannerStyles(theme);
  const insets = useSafeAreaInsets();
  const { tasks, refreshing, refresh } = useTasks();
  const { categories, addCategory, removeCategory, loading, error, reload } =
    useTaskCategories();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const goals = goalSummaries(Object.values(tasks).flat(), categories);
  const matches = goals.filter(goal =>
    goal.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

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
      setName('');
      setSelected(created);
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

  if (selected)
    return (
      <DashboardScreen
        key={selected}
        route={{
          params: { view: 'goal', category: selected, group: 'upcoming' },
        }}
        onBack={() => setSelected(null)}
      />
    );

  return (
    <View style={styles.root}>
      <PlannerHeader
        title="Goals"
        actions={[
          {
            icon: 'plus',
            label: 'Add goal',
            disabled: loading || !!error || saving,
            onPress: () => {
              setName('');
              setCreating(true);
            },
          },
        ]}
      />
      <View style={styles.search}>
        <Feather name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          accessibilityLabel="Search goals"
          value={query}
          onChangeText={setQuery}
          placeholder="Search goals"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear goal search"
            style={styles.iconButton}
            onPress={() => setQuery('')}
          >
            <Feather name="x" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
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
        data={error ? [] : matches}
        keyExtractor={goal => goal.name}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={() => refresh({ showRefreshSpinner: true })}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              {loading ? (
                <ActivityIndicator color={palette.mint} />
              ) : (
                <>
                  <Feather
                    name="folder"
                    size={32}
                    color={theme.colors.textMuted}
                  />
                  <Text style={styles.body}>
                    {query ? 'No matching goals' : 'No goals yet'}
                  </Text>
                </>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open goal ${item.name}, ${item.completed} of ${item.total} completed`}
                style={[styles.row, styles.grow]}
                onPress={() => setSelected(item.name)}
              >
                <View style={styles.goalIcon}>
                  <Feather name="folder" size={21} color={palette.mintStrong} />
                </View>
                <View style={styles.grow}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.body}>
                    {item.total - item.completed} remaining
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textMuted}
                />
              </Pressable>
              {!item.total ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove empty goal ${item.name}`}
                  disabled={saving || loading}
                  style={styles.iconButton}
                  onPress={() => remove(item.name)}
                >
                  <Feather
                    name="trash-2"
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: item.total || 1,
                now: item.completed,
              }}
              style={styles.progressTrack}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      item.total ? (item.completed / item.total) * 100 : 0
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.date}>
              {item.completed} / {item.total} completed
            </Text>
          </View>
        )}
      />
      <Modal
        visible={creating}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => {
          if (!busy.current) setCreating(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel new goal"
              disabled={saving}
              style={styles.iconButton}
              onPress={() => setCreating(false)}
            >
              <Feather name="x" size={22} color={theme.colors.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>New goal</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save goal"
              disabled={saving || !name.trim()}
              onPress={create}
              style={[styles.save, (saving || !name.trim()) && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color={palette.mint} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Goal name"
            autoFocus
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
