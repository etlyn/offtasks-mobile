import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { OfftasksLoader } from '@/components/OfftasksLoader';
import { DashboardScreen } from '@/features/dashboard/Dashboard.screen';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/theme/colors';
import {
  goalIntegration,
  integrationError,
  integrationRequestKey,
  planIsStale,
  type GoalContext,
} from '@/lib/goalIntegration';

export function GoalWorkspace({
  name,
  onBack,
  onBusyChange,
}: {
  name: string;
  onBack: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const owner = useAuth().session?.user.id;
  const theme = useAppTheme();
  const { animateLayout } = useCalendarTransition();
  const motion = React.useRef(animateLayout);
  motion.current = animateLayout;
  const [tab, setTab] = React.useState<'tasks' | 'brief' | 'plan'>('tasks');
  const [codexOnly, setCodexOnly] = React.useState(false);
  const [context, setContext] = React.useState<GoalContext | null>(null);
  const [markdown, setMarkdown] = React.useState('');
  const [criteria, setCriteria] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const request = React.useRef(0);
  const activeOwner = React.useRef(owner);
  activeOwner.current = owner;
  const mutation = React.useRef<{ payload: string; key: string } | null>(null);
  const lock = React.useRef(false);
  const busyCallback = React.useRef(onBusyChange);
  busyCallback.current = onBusyChange;
  React.useEffect(() => {
    busyCallback.current?.(saving);
    return () => busyCallback.current?.(false);
  }, [saving]);

  const load = React.useCallback(
    async (keepDraft = true) => {
      if (!owner) return;
      const version = ++request.current;
      setLoading(true);
      setError('');
      try {
        const goal = await goalIntegration.findGoal(name);
        if (!goal) throw new Error('not_found');
        const next = await goalIntegration.getGoal(goal.id);
        if (version !== request.current || activeOwner.current !== owner)
          return;
        motion.current();
        setContext(next);
        if (!keepDraft) {
          setMarkdown(next.prd?.markdown ?? '');
          setCriteria(next.prd?.acceptance_criteria.join('\n') ?? '');
        } else setNotice('Context refreshed. Review your draft before saving.');
      } catch (caught) {
        if (version === request.current && activeOwner.current === owner)
          setError(integrationError(caught));
      } finally {
        if (version === request.current && activeOwner.current === owner)
          setLoading(false);
      }
    },
    [owner, name],
  );

  React.useEffect(() => {
    setContext(null);
    setMarkdown('');
    setCriteria('');
    setError('');
    setNotice('');
    mutation.current = null;
    void load(false);
    return () => {
      request.current += 1;
    };
  }, [load]);

  const save = async () => {
    if (!context || !owner || lock.current) return;
    lock.current = true;
    setSaving(true);
    setError('');
    setNotice('');
    const items = criteria
      .split('\n')
      .map(value => value.trim())
      .filter(Boolean);
    const payload = JSON.stringify([
      context.goal.id,
      context.goal.revision,
      context.prd?.revision,
      markdown,
      items,
    ]);
    if (mutation.current?.payload !== payload)
      mutation.current = { payload, key: integrationRequestKey() };
    try {
      const result = await goalIntegration.savePrd(
        context,
        markdown,
        items,
        mutation.current.key,
      );
      if (activeOwner.current !== owner) return;
      animateLayout();
      setContext(previous =>
        previous
          ? { ...previous, goal: result.goal, prd: result.prd }
          : previous,
      );
      mutation.current = null;
      setNotice('Brief saved.');
    } catch (caught) {
      if (activeOwner.current === owner) setError(integrationError(caught));
    } finally {
      lock.current = false;
      if (activeOwner.current === owner) setSaving(false);
    }
  };

  const ink = { color: theme.colors.textPrimary };
  const muted = { color: theme.colors.textSecondary };
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const toolbar = (
    <View style={s.toolbar}>
      <View accessibilityRole="tablist" style={s.tabs}>
        {(['tasks', 'brief', 'plan'] as const).map(value => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === value }}
            disabled={saving}
            onPress={() => {
              animateLayout();
              setTab(value);
            }}
            style={s.touch}
          >
            <Text
              style={[
                s.label,
                tab === value ? { color: brand, fontWeight: '600' } : muted,
              ]}
            >
              {value === 'tasks'
                ? 'Tasks'
                : value === 'brief'
                ? 'Brief'
                : 'Plan'}
            </Text>
            <View
              style={[
                s.underline,
                { backgroundColor: tab === value ? brand : 'transparent' },
              ]}
            />
          </Pressable>
        ))}
      </View>
      {tab === 'tasks' && owner ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter tasks for Codex"
          accessibilityState={{ selected: codexOnly }}
          onPress={() => {
            animateLayout();
            setCodexOnly(value => !value);
          }}
          style={s.touch}
        >
          <Text style={[s.label, { color: brand }]}>
            {codexOnly ? 'Codex' : 'All tasks'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
  const panel =
    tab === 'tasks' ? undefined : (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        {!owner ? (
          <Text style={[s.body, muted]}>
            Sign in for synced briefs and plans. Your local goal and tasks stay
            on this device.
          </Text>
        ) : (
          <>
            {loading && !context ? <OfftasksLoader /> : null}
            {error ? (
              <Text accessibilityRole="alert" style={[s.body, ink]}>
                {error}
              </Text>
            ) : null}
            {notice ? (
              <Text accessibilityLiveRegion="polite" style={[s.caption, muted]}>
                {notice}
              </Text>
            ) : null}
            <View style={s.actions}>
              <Text style={[s.caption, muted]}>
                {context
                  ? `Brief ${context.prd?.revision ?? 'not written'}`
                  : 'Goal context'}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={saving || loading}
                onPress={() => void load(true)}
                style={s.touch}
              >
                <Text style={[s.label, { color: brand }]}>
                  {loading ? 'Refreshing…' : 'Refresh'}
                </Text>
              </Pressable>
            </View>
            {context && tab === 'brief' ? (
              <>
                {context.goal.outcome ? (
                  <Text style={[s.body, muted]}>{context.goal.outcome}</Text>
                ) : null}
                <Text style={[s.label, ink]}>Requirements</Text>
                <TextInput
                  accessibilityLabel="Goal requirements"
                  value={markdown}
                  onChangeText={setMarkdown}
                  editable={!saving}
                  multiline
                  textAlignVertical="top"
                  placeholder="What should this goal achieve?"
                  placeholderTextColor={theme.colors.textMuted}
                  selectionColor={brand}
                  keyboardAppearance={theme.keyboardAppearance}
                  style={[
                    s.editor,
                    ink,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.inputBackground,
                    },
                  ]}
                />
                <Text style={[s.label, ink]}>Acceptance criteria</Text>
                <TextInput
                  accessibilityLabel="Goal acceptance criteria"
                  value={criteria}
                  onChangeText={setCriteria}
                  editable={!saving}
                  multiline
                  textAlignVertical="top"
                  placeholder="One clear criterion per line"
                  placeholderTextColor={theme.colors.textMuted}
                  selectionColor={brand}
                  keyboardAppearance={theme.keyboardAppearance}
                  style={[
                    s.editor,
                    s.criteria,
                    ink,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.inputBackground,
                    },
                  ]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save goal brief"
                  disabled={saving || loading || !markdown.trim()}
                  onPress={() => void save()}
                  style={[
                    s.save,
                    { backgroundColor: brand },
                    (saving || !markdown.trim()) && s.disabled,
                  ]}
                >
                  <Text
                    style={[
                      s.label,
                      { color: theme.isDark ? '#101916' : '#fff' },
                    ]}
                  >
                    {saving ? 'Saving…' : 'Save brief'}
                  </Text>
                </Pressable>
              </>
            ) : context && tab === 'plan' ? (
              context.plan ? (
                <>
                  {planIsStale(context) ? (
                    <Text accessibilityRole="alert" style={[s.body, ink]}>
                      Requirements changed. Reconcile this plan before starting
                      work.
                    </Text>
                  ) : null}
                  <Text style={[s.caption, muted]}>
                    Plan {context.plan.revision} · Brief{' '}
                    {context.plan.source_prd_revision}
                  </Text>
                  {context.plan.summary ? (
                    <Text style={[s.body, ink]}>{context.plan.summary}</Text>
                  ) : null}
                  {context.plan.items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[s.step, { borderColor: theme.colors.border }]}
                    >
                      <Text style={[s.body, ink]}>
                        {index + 1}. {item.title}
                      </Text>
                      {item.description ? (
                        <Text style={[s.body, muted]}>{item.description}</Text>
                      ) : null}
                      {context.tasks
                        .filter(
                          task =>
                            task.source_plan_id === context.plan?.id &&
                            task.source_plan_item_id === item.id,
                        )
                        .map(task => (
                          <Text key={task.id} style={[s.caption, muted]}>
                            {task.content} ·{' '}
                            {task.isComplete
                              ? 'done'
                              : task.work_stage?.replace(/_/g, ' ') ??
                                'not started'}
                          </Text>
                        ))}
                    </View>
                  ))}
                </>
              ) : (
                <Text style={[s.body, muted]}>No saved plan yet.</Text>
              )
            ) : null}
          </>
        )}
      </ScrollView>
    );
  return (
    <DashboardScreen
      route={{ params: { view: 'goal', category: name, group: 'upcoming' } }}
      onBack={() => {
        if (!lock.current) onBack();
      }}
      goalToolbar={toolbar}
      goalPanel={panel}
      codexOnly={codexOnly}
    />
  );
}

const s = StyleSheet.create({
  toolbar: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tabs: { flexDirection: 'row', gap: 12 },
  touch: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  underline: {
    position: 'absolute',
    bottom: 4,
    height: 2,
    left: 0,
    right: 0,
    borderRadius: 1,
  },
  label: { fontSize: 13, lineHeight: 19 },
  caption: { fontSize: 12, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 22 },
  content: { padding: 24, paddingTop: 8, paddingBottom: 130, gap: 14 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editor: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 180,
  },
  criteria: { minHeight: 104 },
  save: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  step: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  disabled: { opacity: 0.5 },
});
