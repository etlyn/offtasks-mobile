import type { Note } from '@/lib/notes';
import type { Task } from '@/types/task';
import { filterTasksForSearch, getTaskSearchContext } from './taskSearch';
import { goalSummaries } from './planner';

export type SearchResult = {
  key: string;
  title: string;
  subtitle: string;
} & (
  | { kind: 'task'; task: Task }
  | { kind: 'note'; note: Note }
  | { kind: 'goal'; goal: string }
);

const normalize = (value: string) => value.trim().toLocaleLowerCase();

/** All item types share one relevance order, independent of the source page. */
export function searchEverything(
  tasks: Task[],
  notes: Note[],
  goals: string[],
  query: string,
): SearchResult[] {
  const needle = normalize(query);
  if (!needle) return [];
  const taskResults: SearchResult[] = filterTasksForSearch(tasks, needle).map(
    task => ({
      kind: 'task',
      key: `task:${task.id}`,
      task,
      title: task.content,
      subtitle: `Task · ${
        task.isComplete ? 'Completed' : getTaskSearchContext(task)
      }`,
    }),
  );
  const noteResults: SearchResult[] = notes
    .filter(note => normalize(`${note.title}\n${note.body}`).includes(needle))
    .map(note => ({
      kind: 'note',
      key: `note:${note.id}`,
      note,
      title: note.title,
      subtitle: `Note${note.pinned ? ' · Pinned' : ''}${
        note.body ? ` · ${note.body.replace(/\s+/g, ' ').trim()}` : ''
      }`,
    }));
  const goalResults: SearchResult[] = goalSummaries(tasks, goals)
    .filter(goal => normalize(goal.name).includes(needle))
    .map(goal => ({
      kind: 'goal',
      key: `goal:${normalize(goal.name)}`,
      goal: goal.name,
      title: goal.name,
      subtitle: goal.total
        ? `Goal · ${goal.completed}/${goal.total} done`
        : 'Goal',
    }));
  const score = (result: SearchResult) => {
    const title = normalize(result.title);
    return title === needle
      ? 0
      : title.startsWith(needle)
      ? 1
      : title.includes(needle)
      ? 2
      : 3;
  };
  return [...taskResults, ...noteResults, ...goalResults].sort(
    (a, b) =>
      score(a) - score(b) ||
      a.title.localeCompare(b.title) ||
      a.key.localeCompare(b.key),
  );
}
