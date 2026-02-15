import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Swipeable } from 'react-native-gesture-handler';

import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { getToday } from '@/hooks/useDate';
import { usePreferences } from '@/providers/PreferencesProvider';
import { palette } from '@/theme/colors';
import { getCategoryBadgeColors } from '@/utils/categoryColors';

import { styles } from './TaskQuickList.styles';

type TaskType = Task | TaskWithOverdueFlag;

/**
 * Helper to check if task has the isOverdue flag (TaskWithOverdueFlag type)
 */
const hasOverdueFlag = (task: TaskType): task is TaskWithOverdueFlag => {
  return 'isOverdue' in task;
};

interface TaskQuickListProps {
  tasks: TaskType[];
  onToggle: (task: TaskType) => Promise<void>;
  onPress?: (task: TaskType) => void;
  onLongPress?: (task: TaskType) => void;
  onDelete?: (task: TaskType) => void;
  loading?: boolean;
}

export const TaskQuickList = ({ tasks, onToggle, onPress, onLongPress, onDelete, loading }: TaskQuickListProps) => {
  const { advancedMode } = usePreferences();
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
          onPress={onPress}
          onLongPress={onLongPress}
          onDelete={onDelete}
          showBadges={advancedMode}
        />
      ))}
    </View>
  );
};

interface TaskQuickRowProps {
  task: TaskType;
  isLast: boolean;
  onToggle: (task: TaskType) => Promise<void>;
  onPress?: (task: TaskType) => void;
  onLongPress?: (task: TaskType) => void;
  onDelete?: (task: TaskType) => void;
  showBadges: boolean;
}

const TaskQuickRow = ({ task, isLast, onToggle, onPress, onLongPress, onDelete, showBadges }: TaskQuickRowProps) => {
  const [pending, setPending] = React.useState(false);
  const swipeableRef = React.useRef<Swipeable | null>(null);
  const priorityLabel = ['None', 'Low', 'Medium', 'High'][task.priority ?? 0] ?? 'None';
  const priorityPalette = [
    { color: '#64748b', background: 'rgba(100, 116, 139, 0.18)' },
    { color: '#0891b2', background: 'rgba(8, 145, 178, 0.18)' },
    { color: '#6366f1', background: 'rgba(99, 102, 241, 0.18)' },
    { color: '#f97316', background: 'rgba(249, 115, 22, 0.18)' },
  ];
  const priorityMeta = priorityPalette[task.priority ?? 0] ?? priorityPalette[0];
  const categoryLabel = task.label?.trim() || 'None';
  const hasCategory = !!task.label?.trim();
  const categoryColors = hasCategory ? getCategoryBadgeColors(categoryLabel) : null;
  const dueDateLabel = React.useMemo(() => {
    const date = new Date(`${task.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return task.date;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, [task.date]);

  // Check for overdue status - use flag if available, otherwise compute
  const today = getToday();
  const isOverdue = hasOverdueFlag(task) 
    ? task.isOverdue 
    : (!task.isComplete && task.date < today && task.target_group === 'today');

  const closeSwipeable = React.useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  // Handle checkbox toggle (complete/uncomplete task)
  const handleCheckboxPress = React.useCallback(async () => {
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

  // Handle row press (open task info modal)
  const handleRowPress = React.useCallback(() => {
    if (pending) {
      return;
    }
    onPress?.(task);
  }, [onPress, pending, task]);

  // Handle long press (show task details like priority, category)
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
          <Feather name="trash-2" size={20} color={palette.danger} />
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
      rightThreshold={24}
      overshootRight={false}
    >
      <View
        style={[
          styles.row,
          isOverdue && styles.rowPriority,
          isLast && styles.lastRow,
        ]}
      >
        {/* Checkbox area - separate pressable for toggle */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.isComplete }}
          accessibilityLabel={task.isComplete ? 'Mark as incomplete' : 'Mark as complete'}
          onPress={handleCheckboxPress}
          style={({ pressed }) => [
            styles.checkboxTouchArea,
            pressed && styles.checkboxPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
        >
          <View
            style={[
              styles.checkbox, 
              isOverdue && styles.checkboxPriority, 
              task.isComplete && styles.checkboxDone
            ]}
          >
            {pending ? (
              <ActivityIndicator
                size="small"
                color={task.isComplete ? palette.lightSurface : isOverdue ? palette.danger : palette.mintStrong}
              />
            ) : task.isComplete ? (
              <Feather name="check" size={16} color={palette.lightSurface} />
            ) : null}
          </View>
        </Pressable>

        {/* Task content area - pressable for opening modal, long press for details */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Task: ${task.content}`}
          accessibilityHint="Tap to edit, long press for details"
          onPress={handleRowPress}
          onLongPress={handleLongPress}
          style={({ pressed }) => [
            styles.contentArea,
            pressed && styles.contentAreaPressed,
          ]}
        >
          <Text
            style={[
              styles.rowLabel,
              isOverdue && styles.rowLabelPriority,
              task.isComplete && styles.rowLabelDone,
            ]}
            numberOfLines={2}
          >
            {task.content}
          </Text>
          {showBadges ? (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: priorityMeta.background }]}> 
                <Text style={[styles.badgeText, { color: priorityMeta.color }]}> {priorityLabel} </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: categoryColors?.background ?? 'rgba(100, 116, 139, 0.18)',
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: categoryColors?.color ?? '#64748b' }]}> {categoryLabel} </Text>
              </View>
              <View style={[styles.badge, isOverdue && !task.isComplete ? styles.dueBadgeOverdue : styles.dueBadge]}> 
                <Text style={[styles.badgeText, isOverdue && !task.isComplete ? styles.dueBadgeTextOverdue : styles.dueBadgeText]}> {dueDateLabel} </Text>
              </View>
            </View>
          ) : null}
        </Pressable>
      </View>
    </Swipeable>
  );
};
