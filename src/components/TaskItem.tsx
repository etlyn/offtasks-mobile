import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { deleteTask, updateTask } from '@/lib/supabase';
import { useDateHelpers } from '@/hooks/useDate';
import { useTasks } from '@/providers/TasksProvider';
import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

interface TaskItemProps {
  task: Task;
}

export const TaskItem = ({ task }: TaskItemProps) => {
  const { refresh } = useTasks();
  const { yesterday } = useDateHelpers();
  const [submitting, setSubmitting] = useState(false);

  const isOverdue = !task.isComplete && task.date < yesterday;

  const handleToggle = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await updateTask(task.id, {
        isComplete: !task.isComplete,
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
    <View style={[styles.container, submitting && styles.disabled]}>
      <Pressable style={[styles.check, task.isComplete && styles.checkActive]} onPress={handleToggle}>
        <Text style={[styles.checkText, task.isComplete && styles.checkTextActive]}>
          {task.isComplete ? '✓' : ''}
        </Text>
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
        <Text style={styles.meta}>Due {task.date}</Text>
      </View>

      <Pressable style={styles.delete} onPress={handleDelete} disabled={submitting}>
        <Text style={styles.deleteText}>×</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  disabled: {
    opacity: 0.6,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginRight: 14,
  },
  checkActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  checkText: {
    color: 'transparent',
    fontSize: 14,
    fontWeight: '700',
  },
  checkTextActive: {
    color: palette.textPrimary,
  },
  content: {
    flex: 1,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: palette.textSecondary,
  },
  titleOverdue: {
    color: palette.danger,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  delete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteText: {
    color: palette.textSecondary,
    fontSize: 20,
    lineHeight: 20,
  },
});
