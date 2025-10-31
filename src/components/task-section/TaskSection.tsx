import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { createTask } from '@/lib/supabase';
import { getToday } from '@/hooks/useDate';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task, TaskGroup } from '@/types/task';
import { palette } from '@/theme/colors';

import { TaskItem } from '@/components/task-item';

import { styles } from './TaskSection.styles';

interface TaskSectionProps {
  title: string;
  group: TaskGroup;
  tasks: Task[];
  highlight?: string;
  allowNewTask?: boolean;
  emptyMessage?: string;
}

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
        date: getToday(),
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
