import type { Task, TaskGroup } from '@/types/task';

export type DashboardGroup = Exclude<TaskGroup, 'close'>;

export interface DashboardScreenRouteParams {
  group?: DashboardGroup;
}

export interface DashboardScreenProps {
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
  icon: 'minus-circle' | 'minus' | 'arrow-down-left' | 'alert-triangle';
  tint: string;
  background: string;
}

export type DashboardTask = Task;
