import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useTaskCategories } from '../src/hooks/useTaskCategories';
import { readPlanner } from '../src/lib/plannerSync';

let mockFocus: () => (() => void) | void;
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => (() => void) | void) => {
    mockFocus = callback;
    require('react').useEffect(callback, [callback]);
  },
}));
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { id: 'goal-refresh-user' } } }),
}));
jest.mock('../src/lib/plannerSync', () => ({
  readPlanner: jest.fn().mockResolvedValue(['Health', 'Work']),
  syncPlanner: jest.fn().mockResolvedValue(undefined),
  writePlanner: jest.fn(),
}));

test('refocusing loaded goals retains rows and does not enter a loading state', async () => {
  const view = renderHook(useTaskCategories);
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  const categories = view.result.current.categories;
  const finish: Array<(value: string[]) => void> = [];
  jest
    .mocked(readPlanner)
    .mockImplementation(
      () => new Promise(resolve => finish.push(resolve)) as never,
    );
  let blur: (() => void) | void;
  await act(async () => {
    blur = mockFocus();
  });
  expect(view.result.current.loading).toBe(false);
  expect(view.result.current.categories).toBe(categories);
  await act(async () => {
    finish.forEach(resolve => resolve(['Health', 'Work']));
  });
  expect(view.result.current.categories).toBe(categories);
  expect(view.result.current.error).toBeNull();
  act(() => blur?.());
  view.unmount();
});
