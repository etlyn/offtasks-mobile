import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import Feather from 'react-native-vector-icons/Feather';
import { Swipeable } from 'react-native-gesture-handler';

import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { getToday } from '@/hooks/useDate';
import { usePreferences } from '@/providers/PreferencesProvider';
import { palette, useAppTheme } from '@/theme/colors';
import { getCategoryBadgeColors } from '@/utils/categoryColors';

import { createStyles } from './TaskQuickList.styles';

type TaskType = Task | TaskWithOverdueFlag;

const PRIORITY_META = [
  { count: 0, color: '#94a3b8' },
  { count: 1, color: '#4f86ff' },
  { count: 2, color: '#f59e0b' },
  { count: 3, color: '#ff4d6d' },
] as const;

const PriorityChevronIcon = ({
  count,
  color,
}: {
  count: number;
  color: string;
}) => {
  if (count <= 0) {
    return null;
  }

  const rows = [1.5, 5.5, 9.5].slice(0, count);

  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      {rows.map(y => (
        <Polyline
          key={y}
          points={`2 ${y + 3} 7 ${y} 12 ${y + 3}`}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
};

const hasOverdueFlag = (task: TaskType): task is TaskWithOverdueFlag => {
  return 'isOverdue' in task;
};

export interface TaskListProps {
  tasks: TaskType[];
  onToggle: (task: TaskType) => Promise<void>;
  onPress?: (task: TaskType) => void;
  onLongPress?: (task: TaskType) => void;
  onDelete?: (task: TaskType) => void;
  getSecondaryText?: (task: TaskType) => string | undefined;
  loading?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const TaskList = ({
  tasks,
  onToggle,
  onPress,
  onLongPress,
  onDelete,
  getSecondaryText,
  loading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: TaskListProps) => {
  const { advancedMode } = usePreferences();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
        {emptyIcon ? (
          <View style={styles.emptyIconShell}>
            <Feather
              name={emptyIcon}
              size={20}
              color={theme.colors.iconMuted}
            />
          </View>
        ) : null}
        <Text style={styles.emptyTitleText}>
          {emptyTitle ?? 'Nothing planned yet.'}
        </Text>
        <Text style={styles.emptyState}>
          {emptyDescription ?? 'Tap + to queue a new task.'}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {orderedTasks.map((task, index) => (
        <TaskListRow
          key={task.id}
          styles={styles}
          theme={theme}
          task={task}
          isLast={index === orderedTasks.length - 1}
          onToggle={onToggle}
          onPress={onPress}
          onLongPress={onLongPress}
          onDelete={onDelete}
          getSecondaryText={getSecondaryText}
          showBadges={advancedMode}
        />
      ))}
    </View>
  );
};

interface TaskListRowProps {
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useAppTheme>;
  task: TaskType;
  isLast: boolean;
  onToggle: (task: TaskType) => Promise<void>;
  onPress?: (task: TaskType) => void;
  onLongPress?: (task: TaskType) => void;
  onDelete?: (task: TaskType) => void;
  getSecondaryText?: (task: TaskType) => string | undefined;
  showBadges: boolean;
}

const TaskListRow = ({
  styles,
  theme,
  task,
  isLast,
  onToggle,
  onPress,
  onLongPress,
  onDelete,
  getSecondaryText,
  showBadges,
}: TaskListRowProps) => {
  const [pending, setPending] = React.useState(false);
  const swipeableRef = React.useRef<Swipeable | null>(null);
  const categoryLabel = task.label?.trim() || 'None';
  const hasCategory = !!task.label?.trim();
  const categoryColors = hasCategory
    ? getCategoryBadgeColors(categoryLabel)
    : null;
  const priorityMeta = PRIORITY_META[task.priority ?? 0] ?? PRIORITY_META[0];
  const secondaryText = getSecondaryText?.(task);

  const today = getToday();
  const isOverdue = hasOverdueFlag(task)
    ? task.isOverdue
    : !task.isComplete &&
      !!task.date &&
      task.date < today &&
      task.target_group === 'today';

  const closeSwipeable = React.useCallback(() => {
    swipeableRef.current?.close();
  }, []);

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

  const handleRowPress = React.useCallback(() => {
    if (pending) {
      return;
    }
    onPress?.(task);
  }, [onPress, pending, task]);

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
          style={({ pressed }) => [
            styles.deleteAction,
            pressed && styles.deleteActionPressed,
          ]}
        >
          <Feather name="trash-2" size={20} color={palette.danger} />
        </Pressable>
      </View>
    ),
    [
      handleDelete,
      styles.deleteAction,
      styles.deleteActionContainer,
      styles.deleteActionPressed,
    ],
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
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.isComplete }}
          accessibilityLabel={
            task.isComplete ? 'Mark as incomplete' : 'Mark as complete'
          }
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
              task.isComplete && styles.checkboxDone,
            ]}
          >
            {pending ? (
              <ActivityIndicator
                size="small"
                color={
                  task.isComplete
                    ? theme.colors.textInverse
                    : isOverdue
                    ? palette.danger
                    : palette.mintStrong
                }
              />
            ) : task.isComplete ? (
              <Feather
                name="check"
                size={16}
                color={theme.colors.textInverse}
              />
            ) : null}
          </View>
        </Pressable>

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
          >
            {task.content}
          </Text>

          {secondaryText ? (
            <Text style={styles.rowMeta}>{secondaryText}</Text>
          ) : null}

          {showBadges && (hasCategory || task.priority) ? (
            <View style={styles.badgeRow}>
              {hasCategory && categoryColors ? (
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      borderColor: categoryColors.color,
                      backgroundColor: categoryColors.background,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryBadgeDot,
                      { backgroundColor: categoryColors.color },
                    ]}
                  />
                  <Text style={styles.badgeText}>{categoryLabel}</Text>
                </View>
              ) : null}

              {task.priority ? (
                <View style={styles.priorityIndicatorWrap}>
                  <PriorityChevronIcon
                    count={priorityMeta.count}
                    color={priorityMeta.color}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </View>
    </Swipeable>
  );
};
