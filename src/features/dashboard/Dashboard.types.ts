import type { Task, TaskGroup } from '@/types/task';

export type DashboardGroup = Exclude<TaskGroup, 'close'>;

export interface DashboardScreenRouteParams {
  group?: DashboardGroup;
  view?: 'calendar' | 'goal';
  category?: string;
  searchToggleRequestId?: number;
  openTaskRequest?: { id: string; requestId: number };
}

export interface DashboardScreenProps {
  composerOnly?: boolean;
  initialDate?: string | null;
  initialCategory?: string;
  onComposerClose?: () => void;
  onBack?: () => void;
  route?: {
    params?: DashboardScreenRouteParams;
  };
}

export interface GroupSegment {
  key: DashboardGroup;
  label: string;
}

export interface PriorityOption {
  value: number;
  label: string;
  description: string;
  icon: 'minus-circle' | 'minus' | 'arrow-up-left' | 'alert-triangle';
  tint: string;
  background: string;
}

export type DashboardTask = Task;
