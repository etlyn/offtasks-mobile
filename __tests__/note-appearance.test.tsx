import React from 'react';
import { Alert, Modal } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { NoteAppearanceSheet } from '../src/features/planner/NoteAppearanceSheet';
import { NoteCard } from '../src/features/planner/NoteCard';
import { parseNotes, saveNote, type Note } from '../src/lib/notes';
import { getNoteTone } from '../src/lib/noteAppearance';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({ reduceMotion: true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
const note: Note = {
  id: 'n',
  title: 'Small ideas',
  body: 'Keep the useful details.',
  pinned: true,
  updatedAt: '2026-09-12T12:00:00Z',
  tone: 'sage',
};

test('old notes remain valid and editing keeps a chosen paper color', () => {
  const legacy = { ...note };
  delete legacy.tone;
  expect(parseNotes(JSON.stringify([legacy]))).toEqual([legacy]);
  const edited = saveNote(
    [note],
    { title: 'New title', body: note.body },
    note.id,
  );
  expect(edited[0]).toMatchObject({
    tone: 'sage',
    pinned: true,
    id: note.id,
    body: note.body,
  });
  expect(() =>
    parseNotes(JSON.stringify([{ ...note, tone: 'invalid' }])),
  ).toThrow();
  expect(getNoteTone(undefined).id).toBe('paper');
});

test('note cards keep writing prominent and expose independent 44-point actions', () => {
  const open = jest.fn(),
    pin = jest.fn(),
    appearance = jest.fn();
  render(
    <NoteCard
      note={note}
      onOpen={open}
      onPin={pin}
      onOptions={appearance}
      disabled={false}
    />,
  );
  expect(screen.getByText(note.body)).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Open note Small ideas'));
  fireEvent.press(screen.getByLabelText('Unpin Small ideas'));
  fireEvent.press(screen.getByLabelText('Appearance for Small ideas'));
  expect(open).toHaveBeenCalledTimes(1);
  expect(pin).toHaveBeenCalledTimes(1);
  expect(appearance).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Appearance for Small ideas')).toHaveStyle({
    width: 44,
    height: 44,
  });
});

test('appearance stages color choices and closes without saving', () => {
  const close = jest.fn(),
    save = jest.fn();
  render(<NoteAppearanceSheet note={note} onClose={close} onSave={save} />);
  fireEvent(screen.UNSAFE_getByType(Modal), 'show');
  expect(screen.getByLabelText('Sage paper')).toBeSelected();
  fireEvent.press(screen.getByLabelText('Lilac paper'));
  expect(screen.getByLabelText('Lilac paper')).toBeSelected();
  expect(screen.getByText(note.body)).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Close note appearance'));
  expect(close).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
});

test('failed appearance save retains the choice and supports retry', async () => {
  const close = jest.fn();
  const save = jest
    .fn()
    .mockRejectedValueOnce(new Error('Full'))
    .mockResolvedValueOnce(true);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<NoteAppearanceSheet note={note} onClose={close} onSave={save} />);
  fireEvent(screen.UNSAFE_getByType(Modal), 'show');
  fireEvent.press(screen.getByLabelText('Default paper'));
  fireEvent.press(screen.getByLabelText('Save note appearance'));
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Default paper')).toBeSelected();
  fireEvent.press(screen.getByLabelText('Save note appearance'));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenLastCalledWith('paper');
  alert.mockRestore();
});
