import type { Task, TaskWithOverdueFlag } from '@/types/task';
import { getToday, getAdjacentDay } from '@/hooks/useDate';
import {
  getScheduledDateForTask,
  isTaskOverdue as getIsTaskOverdue,
} from '@/utils/taskScheduling';
export const isTaskOverdue = (task: Task) => getIsTaskOverdue(task);
export const isTaskFromPast = (task: Task) => {
  const date = getScheduledDateForTask(task);
  return !!date && date < getToday();
};
export const shouldShowInToday = (task: Task) =>
  getScheduledDateForTask(task) === getToday();
export const shouldShowInTomorrow = (task: Task) =>
  getScheduledDateForTask(task) === getAdjacentDay(1);
export const shouldShowInUpcoming = (task: Task) => {
  const date = getScheduledDateForTask(task);
  return !date || date > getAdjacentDay(1);
};
export interface CategorizedTasks {
  today: Task[];
  tomorrow: Task[];
  upcoming: Task[];
  close: Task[];
}
/** Group for display without ever rewriting assigned dates or hiding completed items. */
export const categorizeTasks = (allTasks: Task[]): CategorizedTasks => {
  const result: CategorizedTasks = {
    today: [],
    tomorrow: [],
    upcoming: [],
    close: [],
  };
  const today = getToday(),
    tomorrow = getAdjacentDay(1);
  for (const task of allTasks) {
    const date = getScheduledDateForTask(task);
    if (date === today) result.today.push(task);
    else if (date === tomorrow) result.tomorrow.push(task);
    else if (!date || date > tomorrow) result.upcoming.push(task);
    else result.close.push(task);
  }
  return result;
};
// Retain the informational field for data consumers, never for warning colors.
export const addOverdueFlag = (task: Task): TaskWithOverdueFlag => ({
  ...task,
  isOverdue: getIsTaskOverdue(task),
});
export const processTasksForSection = (tasks: Task[]) =>
  tasks.map(addOverdueFlag);
