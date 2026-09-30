import type { Task } from '@/types/task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { noteTones, type NoteTone } from './noteAppearance';

export type NoteTask = Omit<Task, 'user_id' | 'noteTitle'>;

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: string;
  tone?: NoteTone;
  tasks?: NoteTask[];
}

export const notesStorageKey = (userId: string) => {
  if (!userId) throw new Error('Sign in to open notes.');
  return `@offtasks/notes:v1:${encodeURIComponent(userId)}`;
};

export function parseNotes(raw: string | null): Note[] {
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      note =>
        note &&
        typeof note.id === 'string' &&
        typeof note.title === 'string' &&
        typeof note.body === 'string' &&
        typeof note.pinned === 'boolean' &&
        (note.tone === undefined ||
          noteTones.some(tone => tone.id === note.tone)) &&
        (note.tasks === undefined || validNoteTasks(note.tasks)) &&
        typeof note.updatedAt === 'string' &&
        Number.isFinite(Date.parse(note.updatedAt)),
    ) ||
    new Set(parsed.map(note => note.id)).size !== parsed.length
  ) {
    throw new Error(
      'Saved notes could not be read. Your stored data has not been changed.',
    );
  }
  return parsed;
}

export const readNotes = async (userId: string) =>
  parseNotes(await AsyncStorage.getItem(notesStorageKey(userId)));
export const writeNotes = (userId: string, notes: Note[]) =>
  AsyncStorage.setItem(notesStorageKey(userId), JSON.stringify(notes));
export const clearNotes = (userId: string) =>
  AsyncStorage.removeItem(notesStorageKey(userId));

export function filterNotes(notes: Note[], query: string, pinnedOnly: boolean) {
  const search = query.trim().toLocaleLowerCase();
  return notes
    .filter(
      note =>
        (!pinnedOnly || note.pinned) &&
        `${note.title}\n${note.body}\n${(note.tasks || []).map(task => task.content).join('\n')}`.toLocaleLowerCase().includes(search),
    )
    .sort(
      (left, right) =>
        Number(right.pinned) - Number(left.pinned) ||
        right.updatedAt.localeCompare(left.updatedAt),
    );
}

export function saveNote(
  notes: Note[],
  draft: Pick<Note, 'title' | 'body' | 'tasks'>,
  id?: string,
  now = new Date().toISOString(),
) {
  const title = draft.title.trim();
  const body = draft.body.trim();
  if (!title && !body && !draft.tasks?.length)
    throw new Error('Add a title or note before saving.');
  const previous = notes.find(note => note.id === id);
  if (id && !previous) throw new Error('This note no longer exists.');
  const note: Note = {
    id:
      id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    title: title || 'Untitled note',
    body,
    updatedAt: now,
    pinned: previous?.pinned ?? false,
    ...(draft.tasks ?? previous?.tasks
      ? { tasks: draft.tasks ?? previous?.tasks }
      : {}),
    ...(previous?.tone ? { tone: previous.tone } : {}),
  };
  return previous
    ? notes.map(item => (item.id === id ? note : item))
    : [note, ...notes];
}

function validNoteTasks(value: unknown): value is NoteTask[] {
  return (
    Array.isArray(value) &&
    value.every(
      task =>
        task &&
        typeof task.id === 'string' &&
        task.id.length > 0 &&
        typeof task.content === 'string' &&
        task.content.trim().length > 0 &&
        typeof task.isComplete === 'boolean' &&
        Number.isInteger(task.priority) &&
        task.priority >= 0 &&
        task.priority <= 3 &&
        ['today', 'tomorrow', 'upcoming', 'close'].includes(
          task.target_group,
        ) &&
        (task.date === null ||
          (typeof task.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(task.date))) &&
        (task.label === undefined ||
          task.label === null ||
          typeof task.label === 'string'),
    ) &&
    new Set(value.map(task => task.id)).size === value.length
  );
}
