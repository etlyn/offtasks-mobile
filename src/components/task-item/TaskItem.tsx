import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { deleteTask, updateTask } from '@/lib/supabase';
import { getToday } from '@/hooks/useDate';
import { useTasks } from '@/providers/TasksProvider';
import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

import { styles } from './TaskItem.styles';

export interface TaskItemProps {
  task: Task;
}

export const TaskItem = ({ task }: TaskItemProps) => {
  const { refresh } = useTasks();
  const [submitting, setSubmitting] = useState(false);

  const today = getToday();
  const isOverdue = !task.isComplete && task.date < today && task.target_group === 'today';

  const handleToggle = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const nextComplete = !task.isComplete;
      await updateTask(task.id, {
        isComplete: nextComplete,
        completed_at: nextComplete ? getToday() : null,
      });
      await refresh();
    } catch (error) {
      Alert.alert('Update failed', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) {
      return;
    }

    Alert.alert('Delete task', 'Are you sure you want to remove this task?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await deleteTask(task.id);
            await refresh();
          } catch (error) {
            Alert.alert('Delete failed', (error as Error).message);
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, isOverdue && styles.containerPriority, submitting && styles.disabled]}>
      <Pressable
        style={({ pressed }) => [
          styles.check,
          isOverdue && styles.checkPriority,
          task.isComplete && styles.checkActive,
          pressed && !task.isComplete && styles.checkPressed,
        ]}
        onPress={handleToggle}
      >
        {submitting ? (
          <ActivityIndicator
            size="small"
            color={task.isComplete ? palette.lightSurface : isOverdue ? palette.danger : palette.mintStrong}
          />
        ) : task.isComplete ? (
          <Feather name="check" size={16} color={palette.lightSurface} />
        ) : null}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            task.isComplete && styles.titleCompleted,
            isOverdue && styles.titleOverdue,
          ]}
          numberOfLines={2}
        >
          {task.content}
        </Text>
        <Text style={[styles.meta, task.isComplete && styles.metaDone]}>Due {task.date}</Text>
      </View>

      <Pressable style={styles.delete} onPress={handleDelete} disabled={submitting}>
        <Text style={styles.deleteText}>×</Text>
      </Pressable>
    </View>
  );
};
