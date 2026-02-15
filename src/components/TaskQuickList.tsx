import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { getToday } from '@/hooks/useDate';
import { usePreferences } from '@/providers/PreferencesProvider';
import { palette } from '@/theme/colors';
import { getCategoryBadgeColors } from '@/utils/categoryColors';

type TaskType = Task | TaskWithOverdueFlag;

interface TaskQuickListProps {
  tasks: TaskType[];
  onToggle: (task: TaskType) => Promise<void>;
  onPress?: (task: TaskType) => void;
  onLongPress?: (task: TaskType) => void;
  onDelete?: (task: TaskType) => void;
  loading?: boolean;
}

/**
 * Helper to check if task has the isOverdue flag (TaskWithOverdueFlag type)
 */
const hasOverdueFlag = (task: TaskType): task is TaskWithOverdueFlag => {
  return 'isOverdue' in task;
};

export const TaskQuickList = ({ tasks, onToggle, onPress, onLongPress, onDelete, loading }: TaskQuickListProps) => {
  const { advancedMode } = usePreferences();
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
          onPress={onPress}
          onLongPress={onLongPress}
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
  showBadges: boolean;
}

const TaskQuickRow = ({ task, isLast, onToggle, onPress, onLongPress, showBadges }: TaskQuickRowProps) => {
  const [pending, setPending] = React.useState(false);
  const isHighPriority = !task.isComplete && task.priority >= 3;
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

  // Handle checkbox toggle (complete/uncomplete task)
  const handleCheckboxPress = React.useCallback(async () => {
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

  return (
    <View
      style={[
        styles.row,
        (isHighPriority || isOverdue) && styles.rowPriority,
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
            (isHighPriority || isOverdue) && styles.checkboxPriority, 
            task.isComplete && styles.checkboxDone
          ]}
        >
          {pending ? (
            <ActivityIndicator
              size="small"
              color={task.isComplete ? palette.lightSurface : (isHighPriority || isOverdue) ? palette.danger : palette.mintStrong}
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
            (isHighPriority || isOverdue) && styles.rowLabelPriority,
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
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: palette.lightSurface,
    borderWidth: 1,
    borderColor: palette.lightBorder,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: palette.lightShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 18,
  },
  centeredCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: 32,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 15,
    color: palette.slate600,
    fontWeight: '500',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e7e8ef',
  },
  rowPriority: {
    backgroundColor: 'rgba(255, 100, 103, 0.08)',
    borderRadius: 16,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderBottomColor: 'rgba(255, 100, 103, 0.25)',
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  rowPressed: {
    opacity: 0.88,
  },
  checkboxTouchArea: {
    padding: 4,
    borderRadius: 8,
  },
  checkboxPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 212, 216, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  checkboxPriority: {
    borderColor: 'rgba(255, 100, 103, 0.7)',
    backgroundColor: 'rgba(255, 214, 214, 0.4)',
    shadowColor: 'rgba(255, 100, 103, 0.3)',
  },
  checkboxDone: {
    backgroundColor: palette.mint,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(0, 118, 111, 0.28)',
  },
  contentArea: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  contentAreaPressed: {
    opacity: 0.7,
  },
  rowLabel: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slate900,
    fontWeight: '600',
  },
  rowLabelPriority: {
    color: '#ff6467',
  },
  rowLabelDone: {
    color: '#9f9fa9',
    textDecorationLine: 'line-through',
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
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dueBadge: {
    backgroundColor: 'rgba(71, 85, 105, 0.16)',
  },
  dueBadgeText: {
    color: '#334155',
  },
  dueBadgeOverdue: {
    backgroundColor: 'rgba(255, 100, 103, 0.16)',
  },
  dueBadgeTextOverdue: {
    color: '#d93434',
  },
});
