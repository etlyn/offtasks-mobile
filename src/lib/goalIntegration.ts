import { supabaseClient } from './supabase';
import type { Task } from '@/types/task';

export interface FeatureGoal {
  id: string;
  legacy_goal_id: string;
  title: string;
  outcome: string;
  revision: string;
  priority: number;
  status: 'active' | 'archived';
}
export interface GoalPrd {
  id: string;
  revision: string;
  markdown: string;
  acceptance_criteria: string[];
}
export interface GoalPlan {
  id: string;
  revision: string;
  source_prd_revision: string;
  source_prd_id?: string;
  requirements_changed?: boolean;
  summary: string;
  items: Array<{ id: string; title: string; description?: string }>;
}
export interface IntegrationTask extends Omit<Task, 'user_id'> {
  revision: string;
  execution_target: 'codex' | null;
  work_stage?: string;
  acceptance_criteria?: string[];
  source_plan_id?: string | null;
  source_plan_item_id?: string | null;
}
export interface WorkUpdate {
  id: string;
  summary: string;
  created_at: string;
  blockers?: string | string[];
  validation?: string | string[];
  links?: Array<string | { label?: string; url: string }>;
}
export interface GoalContext {
  goal: FeatureGoal;
  prd: GoalPrd | null;
  plan: GoalPlan | null;
  tasks: IntegrationTask[];
}
export interface TaskContext {
  task: IntegrationTask;
  recent_updates: WorkUpdate[];
}

export const integrationRequestKey = () =>
  `native-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function integrationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/revision_conflict|request_key_conflict/.test(message))
    return 'Changed elsewhere. Your draft is kept. Refresh before saving again.';
  if (/not_found/.test(message)) return 'This item is no longer available.';
  if (/forbidden|unauthenticated/.test(message))
    return 'Sign in again to access this account’s goal.';
  return 'Goal sync is unavailable. Your draft is kept. Try again.';
}

async function rpc<Result>(
  mode: 'read' | 'mutate',
  operation: string,
  args: Record<string, unknown>,
): Promise<Result> {
  // Never accept an actor from UI state: the database resolves auth.uid().
  let timer: ReturnType<typeof setTimeout> | undefined;
  const result = supabaseClient.rpc(`offtask_integration_${mode}`, {
    operation,
    args,
  });
  // A timeout can leave the server operation committed. The UI retains its
  // request key, so retrying returns that same operation rather than duplicating it.
  const { data, error } = await Promise.race([
    result,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Goal request timed out')),
        15000,
      );
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object')
    throw new Error('Invalid goal response');
  return data as Result;
}

export const goalIntegration = {
  async findGoal(category: string) {
    // Bounded pages avoid silently hiding a goal after the first page.
    let offset = 0;
    for (let page = 0; page < 1000; page += 1) {
      const result = await rpc<{
        goals: FeatureGoal[];
        next_offset: number | null;
      }>('read', 'list_goals', { limit: 100, offset });
      const found = result.goals.find(
        goal =>
          goal.legacy_goal_id === category.trim().toLocaleLowerCase() ||
          goal.title.trim().toLocaleLowerCase() ===
            category.trim().toLocaleLowerCase(),
      );
      if (found) return found;
      if (result.next_offset === null) return null;
      if (!Number.isInteger(result.next_offset) || result.next_offset <= offset)
        throw new Error('Invalid goal continuation');
      offset = result.next_offset;
    }
    throw new Error('Goal list limit reached');
  },
  getGoal: (goalId: string) =>
    rpc<GoalContext>('read', 'get_goal_context', { goal_id: goalId }),
  getTask: (taskId: string) =>
    rpc<TaskContext>('read', 'get_task_context', { task_id: taskId }),
  savePrd: (
    context: GoalContext,
    markdown: string,
    criteria: string[],
    key: string,
  ) =>
    rpc<{ goal: FeatureGoal; prd: GoalPrd }>('mutate', 'save_prd', {
      goal_id: context.goal.id,
      expected_goal_revision: context.goal.revision,
      expected_prd_revision: context.prd?.revision ?? null,
      markdown,
      acceptance_criteria: criteria,
      request_key: key,
    }),
  setTarget: (task: IntegrationTask, target: 'codex' | null, key: string) =>
    rpc<{ task: IntegrationTask }>('mutate', 'update_task', {
      task_id: task.id,
      expected_revision: task.revision,
      patch: { execution_target: target },
      request_key: key,
    }),
};

export const planIsStale = (context: GoalContext) =>
  !!context.plan &&
  (context.plan.requirements_changed === true ||
    context.plan.source_prd_revision !== context.prd?.revision ||
    (context.plan.source_prd_id !== undefined &&
      context.plan.source_prd_id !== context.prd?.id));
