import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { TasksProvider, useTasks } from '../src/providers/TasksProvider';
const mockRead = jest.fn().mockResolvedValue([]);
const mockRepository = { read: mockRead, update: jest.fn() };
jest.mock('../src/lib/taskRepository', () => ({
  useTaskRepository: () => mockRepository,
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ movePastTasksToLater: false, themeMode: 'Light' }),
}));
jest.mock('../src/lib/widgetBridge', () => ({
  publishWidgetSnapshot: async () => {},
}));
let current: ReturnType<typeof useTasks>;
function Probe() {
  current = useTasks();
  return <Text>{current.error ?? 'ready'}</Text>;
}
test('explicit account refresh rejects failures while ordinary background refresh remains handled', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <TasksProvider>
      <Probe />
    </TasksProvider>,
  );
  await waitFor(() => expect(current.loaded).toBe(true));
  const failure = new Error('offline');
  mockRead.mockRejectedValue(failure);
  await act(async () => {
    await expect(current.refresh({ throwOnError: true })).rejects.toBe(failure);
  });
  expect(current.error).toBe('offline');
  await act(async () => {
    await expect(current.refresh()).resolves.toBeUndefined();
  });
  log.mockRestore();
});
