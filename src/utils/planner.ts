import { getToday } from '@/hooks/useDate';
import { getScheduledDateForTask } from '@/utils/taskScheduling';
import type { Task } from '@/types/task';

export function tasksForDay<T extends Task>(
  tasks: T[],
  day: string,
  today = getToday(),
): T[] {
  return tasks.filter(task => {
    const date = getScheduledDateForTask(task);
    return (
      date === day ||
      (day === today && !!date && date < today && !task.isComplete)
    );
  });
}

export function tasksForGoal<T extends Task>(
  tasks: T[],
  category: string,
): T[] {
  return tasks.filter(
    task =>
      task.label?.trim().toLocaleLowerCase() ===
      category.trim().toLocaleLowerCase(),
  );
}

export function goalSummaries(tasks: Task[], categories: string[]) {
  const names = new Map<string, string>();
  for (const category of [
    ...categories,
    ...tasks.map(task => task.label || ''),
  ]) {
    const label = category.trim();
    if (label) names.set(label.toLocaleLowerCase(), label);
  }
  return [...names.values()]
    .sort((left, right) => left.localeCompare(right))
    .map(name => {
      const matches = tasksForGoal(tasks, name);
      return {
        name,
        total: matches.length,
        completed: matches.filter(task => task.isComplete).length,
      };
    });
}
