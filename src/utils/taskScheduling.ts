import { getAdjacentDay, getToday } from '@/hooks/useDate';
import type { Task, TaskGroup } from '@/types/task';

export type SchedulableTaskGroup = Exclude<TaskGroup, 'close'>;

type TaskScheduleShape = Pick<Task, 'target_group' | 'date'>;
type TaskOverdueShape = Pick<Task, 'isComplete' | 'target_group' | 'date'>;

export const getDefaultDateForGroup = (
  group: SchedulableTaskGroup,
): string | null => {
  switch (group) {
    case 'today':
      return getToday();
    case 'tomorrow':
      return getAdjacentDay(1);
    case 'upcoming':
      return null;
    default:
      return null;
  }
};

export const normalizeScheduledDate = (date: string | null): string | null => {
  if (!date) {
    return null;
  }

  const today = getToday();
  return date < today ? today : date;
};

export const getTargetGroupForDate = (
  date: string | null,
): SchedulableTaskGroup => {
  const normalizedDate = normalizeScheduledDate(date);

  if (!normalizedDate) {
    return 'upcoming';
  }

  if (normalizedDate <= getToday()) {
    return 'today';
  }

  if (normalizedDate === getAdjacentDay(1)) {
    return 'tomorrow';
  }

  return 'upcoming';
};

export const formatScheduledDate = (
  scheduledDate: string | null,
  backlogLabel = 'Backlog',
): string => {
  if (!scheduledDate) {
    return backlogLabel;
  }

  const date = new Date(`${scheduledDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return scheduledDate;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const getScheduledDateForTask = (
  task: TaskScheduleShape,
): string | null => {
  if (task.date) {
    return task.date;
  }

  return getDefaultDateForGroup(task.target_group as SchedulableTaskGroup);
};

export const describeTaskSchedule = (
  task: TaskScheduleShape,
  backlogLabel = 'Backlog',
): string => {
  return getScheduledDateForTask(task) ?? backlogLabel;
};

export const formatTaskScheduleBadge = (
  task: TaskScheduleShape,
  backlogLabel = 'Backlog',
): string => {
  return formatScheduledDate(getScheduledDateForTask(task), backlogLabel);
};

export const isTaskOverdue = (task: TaskOverdueShape): boolean => {
  if (task.isComplete || task.target_group !== 'today') {
    return false;
  }

  const scheduledDate = getScheduledDateForTask(task);
  return !!scheduledDate && scheduledDate < getToday();
};

export const shouldAutoMoveTaskToToday = (
  task: TaskOverdueShape,
): boolean => {
  if (task.isComplete || task.target_group !== 'tomorrow' || !task.date) {
    return false;
  }

  return task.date <= getToday();
};