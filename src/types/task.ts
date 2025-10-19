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
