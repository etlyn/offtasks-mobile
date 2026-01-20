export type TaskGroup = 'today' | 'tomorrow' | 'upcoming' | 'close';

export interface Task {
  id: string;
  user_id: string;
  content: string;
  isComplete: boolean;
  priority: number;
  target_group: TaskGroup;
  date: string;
  completed_at?: string | null;
  inserted_at?: string;
}

/**
 * Task with computed isOverdue flag for UI styling.
 * A task is overdue when:
 * - It's not complete
 * - Its scheduled date is before today
 */
export interface TaskWithOverdueFlag extends Task {
  isOverdue: boolean;
}
