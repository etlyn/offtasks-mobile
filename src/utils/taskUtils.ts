import type { Task, TaskGroup, TaskWithOverdueFlag } from '@/types/task';
import { getToday } from '@/hooks/useDate';

/**
 * Determines if a task is overdue based on its date and completion status.
 * A task is overdue if:
 * - It is not complete
 * - Its date is before today
 * - It's still in the 'today' target_group
 */
export const isTaskOverdue = (task: Task): boolean => {
  if (task.isComplete) {
    return false;
  }

  const today = getToday();
  return task.date < today && task.target_group === 'today';
};

/**
 * Determines if a task was originally scheduled for a past date
 * (regardless of which group it's currently in)
 */
export const isTaskFromPast = (task: Task): boolean => {
  const today = getToday();
  return task.date < today;
};

/**
 * Checks if a task should be shown in the Today section.
 * Today section shows:
 * 1. Tasks completed today
 * 2. Incomplete tasks whose scheduled date is today or earlier
 */
export const shouldShowInToday = (task: Task): boolean => {
  const today = getToday();
  
  if (task.isComplete) {
    return task.completed_at === today;
  }

  return task.date <= today;
};

/**
 * Checks if a task should be shown in the Tomorrow section.
 * Tomorrow section shows:
 * - Incomplete tasks with target_group = 'tomorrow'
 * - Never shows completed tasks (they move to Today)
 */
export const shouldShowInTomorrow = (task: Task): boolean => {
  // Never show completed tasks in Tomorrow
  if (task.isComplete) {
    return false;
  }
  
  return task.target_group === 'tomorrow';
};

/**
 * Checks if a task should be shown in the Upcoming section.
 * Upcoming section shows:
 * - Incomplete tasks with target_group = 'upcoming'
 * - Never shows completed tasks (they move to Today)
 */
export const shouldShowInUpcoming = (task: Task): boolean => {
  // Never show completed tasks in Upcoming
  if (task.isComplete) {
    return false;
  }
  
  return task.target_group === 'upcoming';
};

/**
 * Categorizes all tasks into their appropriate sections based on business rules.
 */
export interface CategorizedTasks {
  today: Task[];
  tomorrow: Task[];
  upcoming: Task[];
  close: Task[];
}

export const categorizeTasks = (allTasks: Task[]): CategorizedTasks => {
  const today = getToday();
  
  const result: CategorizedTasks = {
    today: [],
    tomorrow: [],
    upcoming: [],
    close: [],
  };
  
  for (const task of allTasks) {
    // Rule 1: Completed tasks show in Today only if completed today, otherwise go to Close.
    if (task.isComplete) {
      if (task.completed_at === today) {
        result.today.push(task);
      } else {
        result.close.push(task);
      }
      continue;
    }

    // Rule 2: Incomplete tasks due today or earlier always show in Today.
    if (task.date <= today) {
      result.today.push(task);
      continue;
    }
    
    // Normal categorization based on target_group
    switch (task.target_group) {
      case 'today':
        result.today.push(task);
        break;
      case 'tomorrow':
        result.tomorrow.push(task);
        break;
      case 'upcoming':
        result.upcoming.push(task);
        break;
      case 'close':
        result.close.push(task);
        break;
      default:
        result.today.push(task);
    }
  }
  
  return result;
};

/**
 * Marks a task with an isOverdue flag for UI styling purposes.
 * Used to determine if task should be shown in red.
 */
export const addOverdueFlag = (task: Task): TaskWithOverdueFlag => {
  const today = getToday();
  
  // A task is overdue if:
  // 1. It's not complete
  // 2. Its scheduled date is before today
  // 3. It's still in the 'today' target_group
  const isOverdue = !task.isComplete && task.date < today && task.target_group === 'today';
  
  return {
    ...task,
    isOverdue,
  };
};

/**
 * Process tasks for a specific section with overdue flags
 */
export const processTasksForSection = (tasks: Task[]): TaskWithOverdueFlag[] => {
  return tasks.map(addOverdueFlag);
};
