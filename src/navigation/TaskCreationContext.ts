import { createContext, useContext } from 'react';

export type NoteCreationAction = { onPress: () => void; disabled: boolean };
export type GoalCreationAction = NoteCreationAction & {
  label: 'Add goal' | 'Add task';
};

export const TaskCreationContext = createContext<{
  calendarDay: string;
  setCalendarDay: (day: string) => void;
  openTask: (day?: string | null, category?: string) => void;
  noteAction?: NoteCreationAction | null;
  setNoteAction?: (action: NoteCreationAction | null) => void;
  goalAction?: GoalCreationAction | null;
  setGoalAction?: (action: GoalCreationAction | null) => void;
} | null>(null);

export const useTaskCreation = () => useContext(TaskCreationContext);
