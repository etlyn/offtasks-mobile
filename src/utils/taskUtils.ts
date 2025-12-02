import type { Task, TaskGroup, TaskWithOverdueFlag } from '@/types/task';
import { getToday, getAdjacentDay } from '@/hooks/useDate';

/**
 * Determines if a task is overdue based on its date and completion status.
 * A task is overdue if:
 * - It is not complete
 * - Its date is before today
 * - Its target_group is 'today' (meaning user hasn't moved it to tomorrow/upcoming)
 */
export const isTaskOverdue = (task: Task): boolean => {
  if (task.isComplete) {
    return false;
  }

  const today = getToday();
  // Task is overdue if its date is before today and it's still in 'today' group
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
 * 1. Tasks with target_group = 'today' (including overdue ones)
 * 2. Completed tasks from tomorrow/upcoming (completion date is today)
 * 3. Tasks from tomorrow where the day has changed
 */
export const shouldShowInToday = (task: Task): boolean => {
  const today = getToday();
  
  // Show if target_group is 'today'
  if (task.target_group === 'today') {
    return true;
  }
  
  // Show completed tasks from tomorrow/upcoming (they should appear in Today)
  if (task.isComplete && (task.target_group === 'tomorrow' || task.target_group === 'upcoming')) {
    return true;
  }
  
  // Tasks from tomorrow that are now due (day has changed)
  if (task.target_group === 'tomorrow' && task.date <= today) {
    return true;
  }
  
  return false;
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
  const tomorrow = getAdjacentDay(1);
  
  const result: CategorizedTasks = {
    today: [],
    tomorrow: [],
    upcoming: [],
    close: [],
  };
  
  for (const task of allTasks) {
    // Rule 4: Completed tasks from Tomorrow/Upcoming should go to Today
    if (task.isComplete && (task.target_group === 'tomorrow' || task.target_group === 'upcoming')) {
      result.today.push(task);
      continue;
    }
    
    // Rule 2 & 3: Overdue incomplete tasks from 'today' group go to Today section (shown in red)
    // Also handles tasks whose date has passed (day change logic)
    if (!task.isComplete && task.target_group === 'today' && task.date < today) {
      result.today.push(task);
      continue;
    }
    
    // Rule 3: Tasks from 'tomorrow' that are now today (day has changed)
    if (task.target_group === 'tomorrow' && task.date <= today) {
      result.today.push(task);
      continue;
    }
    
    // Normal categorization based on target_group
    switch (task.target_group) {
      case 'today':
        result.today.push(task);
        break;
      case 'tomorrow':
        // Rule 4: Don't show completed tasks
        if (!task.isComplete) {
          result.tomorrow.push(task);
        } else {
          result.today.push(task);
        }
        break;
      case 'upcoming':
        // Rule 4: Don't show completed tasks
        if (!task.isComplete) {
          result.upcoming.push(task);
        } else {
          result.today.push(task);
        }
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
  // 3. It's still in the 'today' target_group (user hasn't moved it)
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
