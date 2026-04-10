import type { Task, TaskGroup } from '@/types/task';

const groupLabels: Record<TaskGroup, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Later',
  close: 'Closed',
};

export const getTaskGroupLabel = (group: TaskGroup) => groupLabels[group];

export const getTaskSearchContext = (task: Task) => {
  const parts = [getTaskGroupLabel(task.target_group)];

  if (task.label?.trim()) {
    parts.push(task.label.trim());
  }

  if (task.isComplete) {
    parts.push('Closed');
  }

  return parts.join(' • ');
};

export const filterTasksForSearch = <T extends Task>(tasks: T[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return tasks;
  }

  return tasks.filter(task => {
    const searchParts = [
      task.content,
      task.label ?? '',
      getTaskGroupLabel(task.target_group),
      task.target_group === 'upcoming' ? 'later' : '',
      task.isComplete ? 'closed complete done' : 'open active pending',
      task.date ?? '',
    ];

    return searchParts.some(part =>
      part.toLowerCase().includes(normalizedQuery),
    );
  });
};