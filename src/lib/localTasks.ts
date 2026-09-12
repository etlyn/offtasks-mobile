import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '@/types/task';

export const GUEST_ID = 'device-guest';
const queues = new Map<string, Promise<unknown>>();
export const localTasksKey = (owner: string) => `@offtasks/tasks:v1:${encodeURIComponent(owner)}`;

export async function readLocalTasks(owner: string): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(localTasksKey(owner));
  if (raw === null) return [];
  const tasks: unknown = JSON.parse(raw);
  if (!Array.isArray(tasks) || !tasks.every(task =>
    task && typeof task.id === 'string' && task.user_id === owner &&
    typeof task.content === 'string' && typeof task.isComplete === 'boolean' &&
    typeof task.priority === 'number' && Number.isFinite(task.priority) &&
    ['today', 'tomorrow', 'upcoming', 'close'].includes(task.target_group) &&
    (task.date === null || typeof task.date === 'string'),
  ) || new Set(tasks.map(task => task.id)).size !== tasks.length) {
    throw new Error('Local tasks could not be read. Stored data has not been changed.');
  }
  return tasks;
}

export function changeLocalTasks(owner: string, change: (tasks: Task[]) => Task[]) {
  const previous = queues.get(owner) ?? Promise.resolve();
  const operation = previous.catch(() => undefined).then(async () => {
    const next = change(await readLocalTasks(owner));
    await AsyncStorage.setItem(localTasksKey(owner), JSON.stringify(next));
    return next;
  });
  queues.set(owner, operation);
  void operation.finally(() => {
    if (queues.get(owner) === operation) queues.delete(owner);
  }).catch(() => undefined);
  return operation;
}

export const createLocalTask = async (owner: string, values: Omit<Task, 'id' | 'user_id'>) => {
  const task: Task = {...values, id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, user_id: owner};
  await changeLocalTasks(owner, tasks => [...tasks, task]);
  return task;
};

export const updateLocalTask = (owner: string, id: string, updates: Partial<Task>) =>
  changeLocalTasks(owner, tasks => {
    if (!tasks.some(task => task.id === id)) throw new Error('Task no longer exists.');
    return tasks.map(task => task.id === id ? {...task, ...updates, id, user_id: owner} : task);
  });

export const deleteLocalTask = (owner: string, id: string) =>
  changeLocalTasks(owner, tasks => tasks.filter(task => task.id !== id));