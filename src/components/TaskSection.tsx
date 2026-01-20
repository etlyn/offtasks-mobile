import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { createTask } from '@/lib/supabase';
import { getAdjacentDay, getToday } from '@/hooks/useDate';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task, TaskGroup, TaskWithOverdueFlag } from '@/types/task';
import { palette } from '@/theme/colors';

import { TaskItem } from './TaskItem';

interface TaskSectionProps {
  title: string;
  group: TaskGroup;
  tasks: (Task | TaskWithOverdueFlag)[];
  highlight?: string;
  allowNewTask?: boolean;
  emptyMessage?: string;
}

const dateForGroup = (group: TaskGroup) => {
  switch (group) {
    case 'tomorrow':
      return getAdjacentDay(1);
    case 'upcoming':
      return getAdjacentDay(3);
    case 'today':
    case 'close':
    default:
      return getToday();
  }
};

export const TaskSection = ({
  title,
  group,
  tasks,
  highlight,
  allowNewTask = true,
  emptyMessage = 'No tasks yet. Plan something!',
}: TaskSectionProps) => {
  const { session } = useAuth();
  const { refresh } = useTasks();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddTask = async () => {
    if (!allowNewTask || !session?.user?.id || submitting || !content.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      await createTask({
        content: content.trim(),
        target_group: group,
        userId: session.user.id,
        date: dateForGroup(group),
      });
      setContent('');
      await refresh();
    } catch (error) {
      console.error('Failed to create task', error);
      Alert.alert('Could not create task', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {highlight ? <View style={[styles.pill, { backgroundColor: highlight }]} /> : null}
      </View>

      {allowNewTask ? (
        <View style={styles.newTaskContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={content}
              onChangeText={setContent}
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
              editable={!submitting}
              keyboardAppearance="dark"
            />
            <TouchableOpacity
              style={[
                styles.addButtonInline,
                (!content.trim() || submitting) && styles.addButtonDisabled,
              ]}
              onPress={handleAddTask}
              disabled={!content.trim() || submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={palette.accent} />
              ) : (
                <Feather name="plus-circle" size={24} color={palette.accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.list}>
        {tasks.length === 0 ? (
          <Text style={styles.emptyState}>{emptyMessage}</Text>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  newTaskContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingRight: 56,
    borderRadius: 20,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    fontSize: 15,
    fontWeight: '500',
  },
  addButtonInline: {
    position: 'absolute',
    right: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  addButtonDisabled: {
    opacity: 0.3,
  },
  list: {
    marginTop: 4,
  },
  emptyState: {
    color: palette.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
