import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { GoalWorkspace } from '../src/features/planner/GoalWorkspace';
import { TaskExecutionControls } from '../src/features/planner/TaskExecutionControls';
import {
  goalIntegration,
  type GoalContext,
  type TaskContext,
} from '../src/lib/goalIntegration';

let mockOwner: string | undefined = 'owner-a';
jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ session: mockOwner ? { user: { id: mockOwner } } : null }),
}));
jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: { rpc: jest.fn() },
}));
jest.mock('../src/lib/goalIntegration', () => ({
  ...jest.requireActual('../src/lib/goalIntegration'),
  goalIntegration: {
    findGoal: jest.fn(),
    getGoal: jest.fn(),
    savePrd: jest.fn(),
    getTask: jest.fn(),
    setTarget: jest.fn(),
  },
}));
jest.mock('../src/features/dashboard/Dashboard.screen', () => {
  const NativeView = require('react-native').View;
  return {
    DashboardScreen: ({
      goalToolbar,
      goalPanel,
    }: {
      goalToolbar: React.ReactNode;
      goalPanel: React.ReactNode;
    }) => (
      <NativeView>
        {goalToolbar}
        {goalPanel}
      </NativeView>
    ),
  };
});

const api = jest.mocked(goalIntegration);
const goal = {
  id: 'goal-a',
  legacy_goal_id: 'work',
  title: 'Work',
  outcome: '',
  revision: '3',
  priority: 0,
  status: 'active' as const,
};
const context: GoalContext = {
  goal,
  prd: {
    id: 'prd-a',
    revision: '2',
    markdown: 'Saved brief',
    acceptance_criteria: ['A clear outcome'],
  },
  plan: null,
  tasks: [],
};
beforeEach(() => {
  jest.clearAllMocks();
  mockOwner = 'owner-a';
  api.findGoal.mockResolvedValue(goal);
  api.getGoal.mockResolvedValue(context);
});

test('a failed PRD save retains the draft and criteria without claiming success', async () => {
  api.savePrd.mockRejectedValue(new Error('revision_conflict'));
  render(<GoalWorkspace name="Work" onBack={jest.fn()} />);
  fireEvent.press(screen.getByRole('tab', { name: 'Brief' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Goal requirements').props.value).toBe(
      'Saved brief',
    ),
  );
  fireEvent.changeText(
    screen.getByLabelText('Goal requirements'),
    'My unsaved draft',
  );
  fireEvent.press(screen.getByLabelText('Save goal brief'));
  await screen.findByText(/Changed elsewhere/);
  expect(screen.getByLabelText('Goal requirements').props.value).toBe(
    'My unsaved draft',
  );
  expect(screen.getByLabelText('Goal acceptance criteria').props.value).toBe(
    'A clear outcome',
  );
  expect(screen.queryByText('Brief saved.')).toBeNull();
});

test('guest brief is sign-in gated and never calls cloud data services', async () => {
  mockOwner = undefined;
  render(<GoalWorkspace name="Local goal" onBack={jest.fn()} />);
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.press(screen.getByRole('tab', { name: 'Brief' }));
  expect(screen.getByText(/Sign in for synced briefs/)).toBeTruthy();
  expect(api.findGoal).not.toHaveBeenCalled();
  expect(api.savePrd).not.toHaveBeenCalled();
});

test('plan view shows real steps and warns when requirements changed', async () => {
  api.getGoal.mockResolvedValue({
    ...context,
    plan: {
      id: 'plan-a',
      revision: '1',
      source_prd_revision: '1',
      summary: 'Build carefully',
      items: [{ id: 'step-a', title: 'Validate access' }],
    },
  });
  render(<GoalWorkspace name="Work" onBack={jest.fn()} />);
  fireEvent.press(screen.getByRole('tab', { name: 'Plan' }));
  await screen.findByText('1. Validate access');
  expect(screen.getByText(/Requirements changed/)).toBeTruthy();
});

test('execution intent is awaited, protected from repeated presses and does not complete the task', async () => {
  const task = {
    id: 'task-a',
    content: 'Ship feature',
    user_id: 'owner-a',
    revision: '1',
    execution_target: null,
    isComplete: false,
    priority: 0,
    target_group: 'upcoming',
    date: null,
  } as TaskContext['task'];
  api.getTask.mockResolvedValue({ task, recent_updates: [] });
  let finish!: (value: { task: typeof task }) => void;
  api.setTarget.mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const changed = jest.fn();
  render(
    <TaskExecutionControls
      taskId="task-a"
      onChanged={changed}
      onBusyChange={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(
      screen.getByLabelText('Available for Codex').props.accessibilityState
        .disabled,
    ).toBe(false),
  );
  fireEvent.press(screen.getByLabelText('Available for Codex'));
  fireEvent.press(screen.getByLabelText('Available for Codex'));
  expect(api.setTarget).toHaveBeenCalledTimes(1);
  expect(changed).not.toHaveBeenCalled();
  expect(api.setTarget.mock.calls[0][1]).toBe('codex');
  await act(async () =>
    finish({ task: { ...task, execution_target: 'codex', revision: '2' } }),
  );
  expect(
    screen.getByLabelText('Available for Codex').props.accessibilityState
      .checked,
  ).toBe(true);
  expect(changed).toHaveBeenCalledTimes(1);
  expect(task.isComplete).toBe(false);
});
