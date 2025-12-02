export type TaskGroup = 'today' | 'tomorrow' | 'upcoming' | 'close';

export interface Task {
  id: string;
  user_id: string;
  content: string;
  isComplete: boolean;
  priority: number;
  target_group: TaskGroup;
  date: string;
  inserted_at?: string;
}

/**
 * Task with computed isOverdue flag for UI styling.
 * A task is overdue when:
 * - It's not complete
 * - Its scheduled date is before today
 * - It's still in the 'today' target_group (not moved to tomorrow/upcoming)
 */
export interface TaskWithOverdueFlag extends Task {
  isOverdue: boolean;
}
