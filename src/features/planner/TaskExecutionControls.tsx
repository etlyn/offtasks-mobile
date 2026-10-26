import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/theme/colors';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import {
  goalIntegration,
  integrationError,
  integrationRequestKey,
  type TaskContext,
} from '@/lib/goalIntegration';

export function TaskExecutionControls({
  taskId,
  onChanged,
  onBusyChange,
}: {
  taskId: string;
  onChanged: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const owner = useAuth().session?.user.id;
  const theme = useAppTheme();
  const { animateLayout } = useCalendarTransition();
  const [context, setContext] = React.useState<TaskContext | null>(null);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const version = React.useRef(0);
  const lock = React.useRef(false);
  const callbacks = React.useRef({ onChanged, onBusyChange, animateLayout });
  callbacks.current = { onChanged, onBusyChange, animateLayout };
  const mutation = React.useRef<{ payload: string; key: string } | null>(null);

  const load = React.useCallback(async () => {
    if (!owner || taskId.startsWith('note-task:')) return;
    const current = ++version.current;
    setError('');
    try {
      const result = await goalIntegration.getTask(taskId);
      if (version.current === current) setContext(result);
    } catch (caught) {
      if (version.current === current) setError(integrationError(caught));
    }
  }, [owner, taskId]);
  React.useEffect(() => {
    setContext(null);
    mutation.current = null;
    void load();
    return () => {
      version.current += 1;
      callbacks.current.onBusyChange(false);
    };
  }, [load]);

  const toggle = async () => {
    if (!context || lock.current) return;
    const current = version.current;
    lock.current = true;
    setBusy(true);
    callbacks.current.onBusyChange(true);
    setError('');
    const target = context.task.execution_target === 'codex' ? null : 'codex';
    const payload = JSON.stringify([
      context.task.id,
      context.task.revision,
      target,
    ]);
    if (mutation.current?.payload !== payload)
      mutation.current = { payload, key: integrationRequestKey() };
    try {
      const result = await goalIntegration.setTarget(
        context.task,
        target,
        mutation.current.key,
      );
      if (current !== version.current) return;
      callbacks.current.animateLayout();
      setContext(previous =>
        previous ? { ...previous, task: result.task } : previous,
      );
      mutation.current = null;
      callbacks.current.onChanged();
    } catch (caught) {
      if (current === version.current) setError(integrationError(caught));
    } finally {
      lock.current = false;
      callbacks.current.onBusyChange(false);
      if (current === version.current) setBusy(false);
    }
  };
  const muted = { color: theme.colors.textSecondary };
  const ink = { color: theme.colors.textPrimary };
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  if (!owner || taskId.startsWith('note-task:')) return null;
  return (
    <View style={[s.container, { borderColor: theme.colors.border }]}>
      <View style={s.row}>
        <View style={s.copy}>
          <Text style={[s.label, ink]}>For Codex</Text>
          <Text style={[s.caption, muted]}>
            Available when you request work in a connected session.
          </Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Available for Codex"
          accessibilityState={{
            checked: context?.task.execution_target === 'codex',
            disabled: busy || !context,
          }}
          disabled={busy || !context}
          onPress={() => void toggle()}
          style={s.touch}
        >
          <View
            style={[
              s.track,
              {
                backgroundColor:
                  context?.task.execution_target === 'codex'
                    ? brand
                    : theme.colors.switchTrackOff,
              },
            ]}
          >
            <View
              style={[
                s.thumb,
                {
                  alignSelf:
                    context?.task.execution_target === 'codex'
                      ? 'flex-end'
                      : 'flex-start',
                  backgroundColor:
                    context?.task.execution_target === 'codex' && theme.isDark
                      ? '#101916'
                      : '#fff',
                },
              ]}
            />
          </View>
        </Pressable>
      </View>
      {error ? (
        <View>
          <Text accessibilityRole="alert" style={[s.caption, ink]}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void load()}
            style={s.touch}
          >
            <Text style={[s.label, { color: brand }]}>
              Refresh task context
            </Text>
          </Pressable>
        </View>
      ) : null}
      {context ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Task progress and results"
            accessibilityState={{ expanded }}
            disabled={busy}
            onPress={() => {
              animateLayout();
              setExpanded(value => !value);
            }}
            style={s.history}
          >
            <Text style={[s.label, { color: brand }]}>Progress & results</Text>
            <Text style={[s.caption, muted]}>
              {context.task.isComplete
                ? 'done'
                : context.task.work_stage?.replace(/_/g, ' ') ?? 'not started'}
            </Text>
          </Pressable>
          {expanded ? (
            <View style={s.updates}>
              {!context.recent_updates?.length ? (
                <Text style={[s.caption, muted]}>No work updates yet.</Text>
              ) : null}
              {(context.recent_updates ?? []).map(update => (
                <View
                  key={update.id}
                  style={[s.update, { borderColor: theme.colors.border }]}
                >
                  <Text style={[s.body, ink]}>{update.summary}</Text>
                  <Text style={[s.caption, muted]}>
                    {new Date(update.created_at).toLocaleDateString()}
                  </Text>
                  {!!update.blockers?.length && (
                    <Text style={[s.caption, muted]}>
                      Blocked:{' '}
                      {Array.isArray(update.blockers)
                        ? update.blockers.join('; ')
                        : update.blockers}
                    </Text>
                  )}
                  {!!update.validation?.length && (
                    <Text style={[s.caption, muted]}>
                      Validation:{' '}
                      {Array.isArray(update.validation)
                        ? update.validation.join('; ')
                        : update.validation}
                    </Text>
                  )}
                  {(update.links ?? []).map((link, index) => {
                    const url = typeof link === 'string' ? link : link.url;
                    if (!/^https:\/\//i.test(url)) return null;
                    return (
                      <Pressable
                        key={`${url}-${index}`}
                        accessibilityRole="link"
                        onPress={() => {
                          void Linking.openURL(url).catch(() =>
                            setError('This link could not be opened.'),
                          );
                        }}
                        style={s.touch}
                      >
                        <Text style={[s.caption, { color: brand }]}>
                          {typeof link === 'string' ? url : link.label || url}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  copy: { flex: 1, gap: 4 },
  touch: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  label: { fontSize: 13, lineHeight: 19 },
  caption: { fontSize: 12, lineHeight: 18 },
  body: { fontSize: 14, lineHeight: 20 },
  track: { width: 38, height: 24, borderRadius: 12, padding: 3 },
  thumb: { width: 18, height: 18, borderRadius: 9 },
  history: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  updates: { gap: 12 },
  update: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 6 },
});
