import type { Task } from '@/types/task';

type CategoryKey = 'Health' | 'Shopping' | 'Work' | 'Personal' | 'Finance' | 'General';

export interface CategoryStyle {
  label: string;
  text: string;
  background: string;
  border: string;
}

export type CategoryStyles = Record<CategoryKey, CategoryStyle>;

export interface CompletedScreenProps {
  onBack?: () => void;
}

export type CompletedTask = Task;
