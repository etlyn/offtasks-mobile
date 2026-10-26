import {
  goalIntegration,
  integrationError,
  planIsStale,
  type GoalContext,
  type IntegrationTask,
} from '../src/lib/goalIntegration';
import { supabaseClient } from '../src/lib/supabase';

jest.mock('../src/lib/supabase', () => ({
  supabaseClient: { rpc: jest.fn() },
}));
const rpc = jest.mocked(supabaseClient.rpc);
beforeEach(() => jest.clearAllMocks());

const goal = {
  id: 'goal-a',
  legacy_goal_id: 'work',
  title: 'Work',
  outcome: '',
  revision: '2',
  priority: 0,
  status: 'active' as const,
};
const context: GoalContext = { goal, prd: null, plan: null, tasks: [] };

test('goal lookup follows bounded pages and resolves the actual legacy category', async () => {
  rpc
    .mockResolvedValueOnce({
      data: { goals: [], next_offset: 100 },
      error: null,
    } as never)
    .mockResolvedValueOnce({
      data: { goals: [goal], next_offset: null },
      error: null,
    } as never);
  expect(await goalIntegration.findGoal('Work')).toEqual(goal);
  expect(rpc.mock.calls[1]).toEqual([
    'offtask_integration_read',
    { operation: 'list_goals', args: { limit: 100, offset: 100 } },
  ]);
});

test('PRD writes carry both revisions and a stable caller request key, never an actor', async () => {
  rpc.mockResolvedValue({
    data: { goal, prd: { revision: '1' } },
    error: null,
  } as never);
  await goalIntegration.savePrd(
    context,
    'Requirements',
    ['Works'],
    'retry-key',
  );
  expect(rpc).toHaveBeenCalledWith('offtask_integration_mutate', {
    operation: 'save_prd',
    args: {
      goal_id: 'goal-a',
      expected_goal_revision: '2',
      expected_prd_revision: null,
      markdown: 'Requirements',
      acceptance_criteria: ['Works'],
      request_key: 'retry-key',
    },
  });
});

test('assignment records intent only and preserves identity/completion through an allowlisted patch', async () => {
  rpc.mockResolvedValue({ data: { task: {} }, error: null } as never);
  await goalIntegration.setTarget(
    { id: 'task-a', revision: '7' } as IntegrationTask,
    'codex',
    'intent-key',
  );
  expect(rpc).toHaveBeenCalledWith('offtask_integration_mutate', {
    operation: 'update_task',
    args: {
      task_id: 'task-a',
      expected_revision: '7',
      patch: { execution_target: 'codex' },
      request_key: 'intent-key',
    },
  });
});

test('service errors are not fabricated empty lists and conflicts remain actionable', async () => {
  rpc.mockResolvedValue({
    data: null,
    error: { message: 'revision_conflict' },
  } as never);
  await expect(goalIntegration.getGoal('goal-a')).rejects.toThrow(
    'revision_conflict',
  );
  expect(integrationError(new Error('revision_conflict'))).toMatch(
    /draft is kept/,
  );
});

test('saved plan identifies changed or missing source requirements', () => {
  const plan = {
    id: 'plan-a',
    revision: '1',
    source_prd_revision: '2',
    summary: '',
    items: [],
  };
  expect(planIsStale({ ...context, plan })).toBe(true);
  expect(
    planIsStale({
      ...context,
      plan,
      prd: { id: 'prd', revision: '2', markdown: '', acceptance_criteria: [] },
    }),
  ).toBe(false);
});

test('same-revision replacement, removed PRDs and server changes invalidate a saved plan', () => {
  const plan = {
    id: 'plan-a',
    revision: '1',
    source_prd_id: 'prd-original',
    source_prd_revision: '2',
    summary: '',
    items: [],
  };
  const prd = {
    id: 'prd-original',
    revision: '2',
    markdown: 'Requirements',
    acceptance_criteria: [],
  };
  expect(planIsStale({ ...context, plan, prd })).toBe(false);
  expect(
    planIsStale({ ...context, plan, prd: { ...prd, id: 'prd-replacement' } }),
  ).toBe(true);
  expect(planIsStale({ ...context, plan, prd: null })).toBe(true);
  expect(
    planIsStale({
      ...context,
      plan: { ...plan, requirements_changed: true },
      prd,
    }),
  ).toBe(true);
});
