import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

import { styles } from './TaskQuickList.styles';

interface TaskQuickListProps {
  tasks: Task[];
  onToggle: (task: Task) => Promise<void>;
  onLongPress?: (task: Task) => void;
  loading?: boolean;
}

export const TaskQuickList = ({ tasks, onToggle, onLongPress, loading }: TaskQuickListProps) => {
  const orderedTasks = React.useMemo(() => {
    const next = [...tasks];
    next.sort((a, b) => Number(a.isComplete) - Number(b.isComplete));
    return next;
  }, [tasks]);

  if (loading) {
    return (
      <View style={[styles.card, styles.centeredCard]}>
        <ActivityIndicator size="small" color={palette.mint} />
      </View>
    );
  }

  if (orderedTasks.length === 0) {
    return (
      <View style={[styles.card, styles.centeredCard]}>
        <Text style={styles.emptyState}>Nothing planned yet. Tap + to queue a new task.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {orderedTasks.map((task, index) => (
        <TaskQuickRow
          key={task.id}
          task={task}
          isLast={index === orderedTasks.length - 1}
          onToggle={onToggle}
          onLongPress={onLongPress}
        />
      ))}
    </View>
  );
};

interface TaskQuickRowProps {
  task: Task;
  isLast: boolean;
  onToggle: (task: Task) => Promise<void>;
  onLongPress?: (task: Task) => void;
}

const TaskQuickRow = ({ task, isLast, onToggle, onLongPress }: TaskQuickRowProps) => {
  const [pending, setPending] = React.useState(false);
  const isHighPriority = !task.isComplete && task.priority >= 3;

  const handleToggle = React.useCallback(async () => {
    if (pending) {
      return;
    }

    setPending(true);
    try {
      await onToggle(task);
    } finally {
      setPending(false);
    }
  }, [onToggle, pending, task]);

  const handleLongPress = React.useCallback(() => {
    if (pending) {
      return;
    }
    onLongPress?.(task);
  }, [onLongPress, pending, task]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: task.isComplete }}
      onPress={handleToggle}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.row,
        isHighPriority && styles.rowPriority,
        isLast && styles.lastRow,
        pressed && styles.rowPressed,
      ]}
    >
      <View
        style={[styles.checkbox, isHighPriority && styles.checkboxPriority, task.isComplete && styles.checkboxDone]}
      >
        {pending ? (
          <ActivityIndicator
            size="small"
            color={task.isComplete ? palette.lightSurface : isHighPriority ? palette.danger : palette.mintStrong}
          />
        ) : task.isComplete ? (
          <Feather name="check" size={16} color={palette.lightSurface} />
        ) : null}
      </View>

      <Text
        style={[
          styles.rowLabel,
          isHighPriority && styles.rowLabelPriority,
          task.isComplete && styles.rowLabelDone,
        ]}
        numberOfLines={2}
      >
        {task.content}
      </Text>
    </Pressable>
  );
};
