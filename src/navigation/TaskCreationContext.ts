import { createContext, useContext } from 'react';

export const TaskCreationContext = createContext<{
  calendarDay: string;
  setCalendarDay: (day: string) => void;
  openTask: (day?: string) => void;
} | null>(null);

export const useTaskCreation = () => useContext(TaskCreationContext);
