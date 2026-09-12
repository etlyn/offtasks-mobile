import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  filterNotes,
  notesStorageKey,
  parseNotes,
  readNotes,
  saveNote,
  writeNotes,
  clearNotes,
} from '../src/lib/notes';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('notes persist per account without leaking to another account', async () => {
  const notes = saveNote([], {
    title: 'App ideas',
    body: 'Calendar and goals',
  });
  await writeNotes('account-one', notes);
  expect(await readNotes('account-one')).toEqual(notes);
  expect(await readNotes('account-two')).toEqual([]);
  expect(notesStorageKey('account-one')).not.toBe(
    notesStorageKey('account-two'),
  );
  await clearNotes('account-one');
  expect(await readNotes('account-one')).toEqual([]);
  expect(() => notesStorageKey('')).toThrow();
});

test('editing retains identity and pin state; search includes body and pinned filter', () => {
  const first = saveNote(
    [],
    { title: 'Ideas', body: 'Calendar' },
    undefined,
    '2026-08-20T10:00:00Z',
  );
  first[0].pinned = true;
  const edited = saveNote(
    first,
    { title: 'App ideas', body: 'Calendar and goals' },
    first[0].id,
    '2026-08-21T10:00:00Z',
  );
  const notes = saveNote(
    edited,
    { title: 'Shopping', body: 'Milk' },
    undefined,
    '2026-08-22T10:00:00Z',
  );
  expect(edited[0].pinned).toBe(true);
  expect(filterNotes(notes, ' GOALS ', false)).toEqual(edited);
  expect(filterNotes(notes, '', true)).toEqual(edited);
  expect(filterNotes(notes, '', false)[0].id).toBe(first[0].id);
  expect(() => saveNote(notes, { title: ' ', body: ' ' })).toThrow();
  expect(() =>
    saveNote(notes, { title: 'Missing', body: '' }, 'missing'),
  ).toThrow();
});

test('corrupt storage is not silently erased', async () => {
  const key = notesStorageKey('account-one');
  await AsyncStorage.setItem(key, '{bad');
  await expect(readNotes('account-one')).rejects.toThrow();
  expect(await AsyncStorage.getItem(key)).toBe('{bad');
  expect(() => parseNotes('[{"id":"bad"}]')).toThrow();
});
