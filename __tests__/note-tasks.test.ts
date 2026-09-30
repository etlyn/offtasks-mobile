import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveNote, parseNotes } from '../src/lib/notes';
import { readPlanner, writePlanner } from '../src/lib/plannerSync';
import { readNoteTasks, changeNoteTask } from '../src/lib/noteTasks';
import { taskRepository } from '../src/lib/taskRepository';
import { GUEST_ID } from '../src/lib/localTasks';
jest.mock('../src/lib/supabase', () => ({
  fetchAllUserTasks: jest.fn(async () => []),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  supabaseClient: {
    from: jest.fn(() => {
      throw new Error('Offline test');
    }),
  },
}));
beforeEach(async () => {
  await AsyncStorage.clear();
});
const task = {
  id: 'bullet-1',
  content: 'Prepare a sketch',
  isComplete: false,
  priority: 0,
  target_group: 'today' as const,
  date: '2026-09-26',
  label: 'Design',
};
test('note bullets share one identity between note and calendar and survive relaunch/edit', async () => {
  const notes = saveNote([], {
    title: 'Project',
    body: 'Brief',
    tasks: [task],
  });
  await writePlanner(GUEST_ID, 'note', notes);
  const repository = taskRepository();
  const [row] = await repository.read();
  expect(row).toMatchObject({
    content: task.content,
    noteTitle: 'Project',
    label: 'Design',
    date: task.date,
  });
  await repository.update(row.id, { isComplete: true, date: '2026-09-27' });
  const stored = await readPlanner(GUEST_ID, 'note');
  expect(stored[0].tasks?.[0]).toMatchObject({
    isComplete: true,
    date: '2026-09-27',
  });
  const edited = saveNote(
    stored,
    { title: 'Renamed', body: 'More detail' },
    stored[0].id,
  );
  await writePlanner(GUEST_ID, 'note', edited, stored);
  expect((await repository.read())[0]).toMatchObject({
    id: row.id,
    noteTitle: 'Renamed',
    isComplete: true,
  });
  await repository.remove(row.id);
  expect(await repository.read()).toEqual([]);
  expect((await readPlanner(GUEST_ID, 'note'))[0].body).toBe('More detail');
});
test('notes isolate owners and embedded tasks follow imported note ownership', async () => {
  const notes = saveNote([], { title: 'Private', body: '', tasks: [task] });
  await writePlanner(GUEST_ID, 'note', notes);
  expect(await readNoteTasks('other')).toEqual([]);
  await writePlanner('account', 'note', notes);
  expect((await readNoteTasks('account'))[0].user_id).toBe('account');
  const [guest] = await readNoteTasks(GUEST_ID);
  await expect(
    changeNoteTask('other', guest.id, { isComplete: true }),
  ).rejects.toThrow();
  expect((await readNoteTasks(GUEST_ID))[0].isComplete).toBe(false);
});
test('malformed embedded tasks fail without rewriting stored data', () => {
  const notes = saveNote([], { title: 'Note', body: '', tasks: [task] });
  for (const tasks of [
    [{ ...task, content: '' }],
    [task, task],
    [{ ...task, priority: NaN }],
  ])
    expect(() =>
      parseNotes(JSON.stringify([{ ...notes[0], tasks }])),
    ).toThrow();
  expect(parseNotes(JSON.stringify(notes))[0].tasks).toEqual([task]);
});
