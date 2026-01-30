import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { deleteTask, updateTask } from '@/lib/supabase';
import { getToday } from '@/hooks/useDate';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useTasks } from '@/providers/TasksProvider';
import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { palette } from '@/theme/colors';

interface TaskItemProps {
  task: Task | TaskWithOverdueFlag;
}

/**
 * Helper to check if task has the isOverdue flag (TaskWithOverdueFlag type)
 */
const hasOverdueFlag = (task: Task | TaskWithOverdueFlag): task is TaskWithOverdueFlag => {
  return 'isOverdue' in task;
};

export const TaskItem = ({ task }: TaskItemProps) => {
  const { refresh } = useTasks();
  const { advancedMode } = usePreferences();
  const [submitting, setSubmitting] = useState(false);
  const priorityLabel = ['None', 'Low', 'Medium', 'High'][task.priority ?? 0] ?? 'None';
  const priorityPalette = [
    { color: '#64748b', background: 'rgba(100, 116, 139, 0.18)' },
    { color: '#0891b2', background: 'rgba(8, 145, 178, 0.18)' },
    { color: '#6366f1', background: 'rgba(99, 102, 241, 0.18)' },
    { color: '#f97316', background: 'rgba(249, 115, 22, 0.18)' },
  ];
  const priorityMeta = priorityPalette[task.priority ?? 0] ?? priorityPalette[0];
  const categoryLabel = task.label?.trim() || 'None';

  // Use the isOverdue flag if available, otherwise compute it
  // A task is overdue if it's not complete, date is before today, and still in Today
  const today = getToday();
  const isOverdue = hasOverdueFlag(task) 
    ? task.isOverdue 
    : (!task.isComplete && task.date < today && task.target_group === 'today');

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
        {advancedMode ? (
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: priorityMeta.background }]}
            >
              <Text style={[styles.badgeText, { color: priorityMeta.color }]}>
                {`Priority: ${priorityLabel}`}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{`Category: ${categoryLabel}`}</Text>
            </View>
          </View>
        ) : null}
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
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  containerPriority: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 212, 216, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 14,
    shadowColor: 'rgba(255, 255, 255, 0.4)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  checkPressed: {
    transform: [{ scale: 0.96 }],
  },
  checkPriority: {
    borderColor: 'rgba(255, 100, 103, 0.7)',
    backgroundColor: 'rgba(255, 214, 214, 0.25)',
    shadowColor: 'rgba(255, 100, 103, 0.3)',
  },
  checkActive: {
    backgroundColor: palette.mint,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(0, 118, 111, 0.28)',
  },
  content: {
    flex: 1,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9f9fa9',
  },
  titleOverdue: {
    color: '#ff6467',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(244, 244, 245, 0.6)',
    fontWeight: '500',
  },
  metaDone: {
    color: '#9f9fa9',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(244, 244, 245, 0.8)',
  },
  delete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1f1f24',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteText: {
    color: 'rgba(244, 244, 245, 0.65)',
    fontSize: 20,
    lineHeight: 20,
  },
});
