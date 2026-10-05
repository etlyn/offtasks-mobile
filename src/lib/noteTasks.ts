import type { Task } from '@/types/task';
import { readPlanner, writePlanner, syncPlanner } from './plannerSync';
const prefix = 'note-task:';
export const isNoteTaskId = (id: string) => id.startsWith(prefix);
export const noteTaskId = (noteId: string, taskId: string) =>
  `${prefix}${encodeURIComponent(noteId)}:${encodeURIComponent(taskId)}`;
export async function readNoteTasks(owner: string): Promise<Task[]> {
  await syncPlanner(owner, 'note');
  const notes = await readPlanner(owner, 'note');
  return notes.flatMap(note =>
    (note.tasks || []).map(task => ({
      ...task,
      id: noteTaskId(note.id, task.id),
      user_id: owner,
      noteTitle: note.title,
    })),
  );
}
export async function changeNoteTask(
  owner: string,
  id: string,
  updates: Partial<Task> | null,
) {
  const notes = await readPlanner(owner, 'note');
  const note = notes.find(item =>
    item.tasks?.some(task => noteTaskId(item.id, task.id) === id),
  );
  if (!note) throw new Error('This note task no longer exists.');
  const next = notes.map(item =>
    item.id !== note.id
      ? item
      : {
          ...item,
          updatedAt: new Date().toISOString(),
          tasks:
            updates === null
              ? item.tasks!.filter(task => noteTaskId(item.id, task.id) !== id)
              : item.tasks!.map(task =>
                  noteTaskId(item.id, task.id) !== id
                    ? task
                    : {
                        ...task,
                        ...updates,
                        id: task.id,
                      },
                ),
        },
  );
  await writePlanner(owner, 'note', next, notes);
  void syncPlanner(owner, 'note');
}
