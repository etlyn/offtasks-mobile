import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Swipeable } from 'react-native-gesture-handler';

import type { Task } from '@/types/task';
import { palette } from '@/theme/colors';

import { styles } from './TaskQuickList.styles';

interface TaskQuickListProps {
  tasks: Task[];
  onToggle: (task: Task) => Promise<void>;
  onLongPress?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  loading?: boolean;
}

export const TaskQuickList = ({ tasks, onToggle, onLongPress, onDelete, loading }: TaskQuickListProps) => {
  const orderedTasks = React.useMemo(() => {
    const next = [...tasks];
    next.sort((a, b) => Number(a.isComplete) - Number(b.isComplete));
    return next;
  }, [tasks]);

  if (loading) {
    return (
      <View style={styles.centeredCard}>
        <ActivityIndicator size="small" color={palette.mint} />
      </View>
    );
  }

  if (orderedTasks.length === 0) {
    return (
      <View style={styles.centeredCard}>
        <Text style={styles.emptyState}>Nothing planned yet. Tap + to queue a new task.</Text>
      </View>
    );
  }

  return (
    <View>
      {orderedTasks.map((task, index) => (
        <TaskQuickRow
          key={task.id}
          task={task}
          isLast={index === orderedTasks.length - 1}
          onToggle={onToggle}
          onLongPress={onLongPress}
          onDelete={onDelete}
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
  onDelete?: (task: Task) => void;
}

const TaskQuickRow = ({ task, isLast, onToggle, onLongPress, onDelete }: TaskQuickRowProps) => {
  const [pending, setPending] = React.useState(false);
  const swipeableRef = React.useRef<Swipeable | null>(null);
  const isHighPriority = !task.isComplete && task.priority >= 3;

  const closeSwipeable = React.useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleToggle = React.useCallback(async () => {
    if (pending) {
      return;
    }

    closeSwipeable();
    setPending(true);
    try {
      await onToggle(task);
    } finally {
      setPending(false);
    }
  }, [closeSwipeable, onToggle, pending, task]);

  const handleLongPress = React.useCallback(() => {
    if (pending) {
      return;
    }
    onLongPress?.(task);
  }, [onLongPress, pending, task]);

  const handleDelete = React.useCallback(() => {
    if (pending) {
      return;
    }
    closeSwipeable();
    onDelete?.(task);
  }, [closeSwipeable, onDelete, pending, task]);

  const renderRightActions = React.useCallback(
    () => (
      <View style={styles.deleteActionContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete task"
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}
        >
          <Feather name="trash-2" size={20} color={palette.lightSurface} />
        </Pressable>
      </View>
    ),
    [handleDelete]
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={48}
      overshootRight={false}
    >
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
    </Swipeable>
  );
};
