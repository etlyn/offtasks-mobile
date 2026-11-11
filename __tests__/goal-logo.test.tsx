import React from 'react';
import { Modal } from 'react-native';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { GUEST_ID } from '../src/lib/localTasks';
import {
  parseGoalLogo,
  readGoalLogos,
  writeGoalLogo,
  type GoalLogo,
} from '../src/lib/goalLogo';
import { supabaseClient } from '../src/lib/supabase';
import { GoalAppearanceSheet } from '../src/features/planner/GoalAppearanceSheet';
import { GoalRow } from '../src/features/planner/GoalRow';
import { useGoalLogos } from '../src/hooks/useGoalLogos';

let mockOwner: string | null = null;
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: mockOwner ? { user: { id: mockOwner } } : null }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: { from: jest.fn(), rpc: jest.fn() },
}));

const imagePicker = jest.mocked(launchImageLibrary);
const from = jest.mocked(supabaseClient.from);
const rpc = jest.mocked(supabaseClient.rpc);
const logo: GoalLogo = {
  mimeType: 'image/png',
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lM0AAAAASUVORK5CYII=',
};
const signal = () => new AbortController().signal;

beforeEach(async () => {
  jest.clearAllMocks();
  mockOwner = null;
  await AsyncStorage.clear();
});

test('checks image signatures, type and decoded byte size', () => {
  expect(parseGoalLogo(logo.mimeType, logo.base64)).toEqual(logo);
  expect(parseGoalLogo('image/svg+xml', logo.base64)).toBeNull();
  expect(parseGoalLogo('image/jpeg', logo.base64)).toBeNull();
  expect(parseGoalLogo('image/jpeg', '/9j/%%%%')).toBeNull();
  expect(parseGoalLogo('image/jpeg', '/9j/' + 'AAAA'.repeat(44000))).toBeNull();
});

test('a guest logo persists on this device and never calls the account service', async () => {
  await writeGoalLogo(GUEST_ID, ' My Goal ', logo, signal());
  expect((await readGoalLogos(GUEST_ID, signal())).get('my goal')).toEqual(
    logo,
  );
  await writeGoalLogo(GUEST_ID, 'my goal', null, signal());
  expect((await readGoalLogos(GUEST_ID, signal())).size).toBe(0);
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});

test('the account writes an owned active canonical goal, including removal', async () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: { id: 'goal-uuid' }, error: null }),
  };
  from.mockReturnValue(query as never);
  rpc.mockReturnValue({
    abortSignal: jest.fn().mockResolvedValue({ data: null, error: null }),
  } as never);

  await writeGoalLogo('owner-a', 'My Goal', logo, signal());
  expect(from).toHaveBeenCalledWith('offtask_goals');
  expect(query.eq.mock.calls).toEqual([
    ['user_id', 'owner-a'],
    ['legacy_goal_id', 'my goal'],
    ['status', 'active'],
  ]);
  expect(rpc).toHaveBeenLastCalledWith('offtask_set_goal_logo', {
    goal_id: 'goal-uuid',
    mime_type: 'image/png',
    image_base64: logo.base64,
  });
  await writeGoalLogo('owner-a', 'My Goal', null, signal());
  expect(rpc).toHaveBeenLastCalledWith('offtask_set_goal_logo', {
    goal_id: 'goal-uuid',
    mime_type: null,
    image_base64: null,
  });
});

test('changing accounts hides the guest logo and reads only the active owner', async () => {
  await writeGoalLogo(GUEST_ID, 'Travel', logo, signal());
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
  from.mockReturnValue(query as never);
  const { result, rerender } = renderHook(() => useGoalLogos());
  await waitFor(() => expect(result.current.get('Travel')).toEqual(logo));

  mockOwner = 'owner-b';
  rerender(undefined);
  expect(result.current.get('Travel')).toBeUndefined();
  await waitFor(() =>
    expect(query.eq).toHaveBeenCalledWith('offtask_goals.user_id', 'owner-b'),
  );
  expect(rpc).not.toHaveBeenCalled();

  mockOwner = null;
  rerender(undefined);
  await waitFor(() => expect(result.current.get('Travel')).toEqual(logo));
});

test('stages a selected logo, keeps it after failed save, and removes it explicitly', async () => {
  const onClose = jest.fn();
  const onSaveLogo = jest
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue(undefined);
  imagePicker.mockResolvedValueOnce({ didCancel: true }).mockResolvedValueOnce({
    assets: [{ type: logo.mimeType, base64: logo.base64 }],
  });
  render(
    <GoalAppearanceSheet
      name="Travel"
      total={2}
      initial={{ color: 0, emoji: null }}
      onClose={onClose}
      onSave={jest.fn().mockResolvedValue(undefined)}
      onSaveLogo={onSaveLogo}
      onRemove={jest.fn()}
    />,
  );
  fireEvent(screen.UNSAFE_getByType(Modal), 'show');
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Add goal logo'));
  });
  expect(
    screen.queryByTestId('goal-avatar-logo', { includeHiddenElements: true }),
  ).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Add goal logo'));
  });
  expect(
    screen.getByTestId('goal-avatar-logo', { includeHiddenElements: true }),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Replace goal logo')).toBeOnTheScreen();
  expect(onSaveLogo).not.toHaveBeenCalled();

  fireEvent.press(screen.getByLabelText('Save goal appearance'));
  await screen.findByText('Could not save the logo. Try again.');
  expect(onClose).not.toHaveBeenCalled();
  expect(onSaveLogo).toHaveBeenLastCalledWith(logo);

  fireEvent.press(screen.getByLabelText('Remove goal logo'));
  expect(
    screen.queryByTestId('goal-avatar-logo', { includeHiddenElements: true }),
  ).toBeNull();
  fireEvent.press(screen.getByLabelText('Save goal appearance'));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(onSaveLogo).toHaveBeenLastCalledWith(null);
});

test('list artwork falls back to initials if the image cannot render', () => {
  render(
    <GoalRow
      goal={{ name: 'Travel', total: 0, completed: 0 }}
      logo={logo}
      disabled={false}
      onOpen={jest.fn()}
      onOptions={jest.fn()}
      onRemove={jest.fn()}
    />,
  );
  fireEvent(
    screen.getByTestId('goal-avatar-logo', { includeHiddenElements: true }),
    'error',
  );
  expect(
    screen.queryByTestId('goal-avatar-logo', { includeHiddenElements: true }),
  ).toBeNull();
  expect(
    screen.getByText('T', { includeHiddenElements: true }),
  ).toBeOnTheScreen();
});
