import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DetachedSheet } from '@/components/DetachedSheet';
import { SheetHeader } from '@/components/SheetHeader';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAppTheme } from '@/theme/colors';
import { noteTones, type NoteTone } from '@/lib/noteAppearance';
import type { Note } from '@/lib/notes';
import { NotePaper } from './NoteCard';

export function NoteAppearanceSheet({
  note,
  onClose,
  onSave,
}: {
  note: Note | null;
  onClose: () => void;
  onSave: (tone: NoteTone) => Promise<boolean>;
}) {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const insets = useSafeAreaInsets();
  const [tone, setTone] = React.useState<NoteTone>('paper');
  const [saving, setSaving] = React.useState(false);
  const busy = React.useRef(false);
  const display = React.useRef(note);
  if (note) display.current = note;
  React.useEffect(() => {
    if (note) setTone(note.tone ?? 'paper');
  }, [note]);
  const close = () => {
    if (!busy.current) onClose();
  };
  const save = async () => {
    if (!note || busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      if (await onSave(tone)) onClose();
    } catch {
      Alert.alert(
        'Could not save appearance',
        'Your choice is still here. Please try again.',
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <DetachedSheet
      visible={!!note}
      onClose={close}
      reduceMotion={reduceMotion}
      insetTop={insets.top}
      insetBottom={insets.bottom}
      dismissLabel="Dismiss note appearance"
    >
      <SheetHeader
        closeLabel="Close note appearance"
        saveLabel="Save note appearance"
        onClose={close}
        onSave={save}
        action="Done"
        busy={saving}
        disabled={false}
      />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <NotePaper tone={tone} style={s.preview}>
          <Text
            numberOfLines={2}
            style={[s.title, { color: theme.colors.textPrimary }]}
          >
            {display.current?.title}
          </Text>
          <Text
            numberOfLines={3}
            style={[s.body, { color: theme.colors.textSecondary }]}
          >
            {display.current?.body || 'A little space for your thoughts.'}
          </Text>
        </NotePaper>
        <View style={s.labelRow}>
          <Text style={[s.label, { color: theme.colors.textSecondary }]}>
            Paper color
          </Text>
          <Text style={[s.label, { color: theme.colors.textSecondary }]}>
            {noteTones.find(item => item.id === tone)?.name}
          </Text>
        </View>
        <View style={s.colors}>
          {noteTones.map(color => (
            <Pressable
              key={color.id}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={`${
                color.id === 'paper' ? 'Default' : color.name
              } paper`}
              accessibilityState={{ selected: tone === color.id }}
              onPress={() => setTone(color.id)}
              style={s.colorTouch}
            >
              <View
                style={[
                  s.swatch,
                  {
                    backgroundColor: theme.isDark ? color.dark : color.light,
                    borderColor: color.accent,
                  },
                ]}
              >
                {tone === color.id ? (
                  <Check
                    size={16}
                    strokeWidth={1.8}
                    color={theme.colors.textPrimary}
                  />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </DetachedSheet>
  );
}
const s = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  preview: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 100,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  body: { fontSize: 13, lineHeight: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12 },
  colors: { flexDirection: 'row', flexWrap: 'wrap' },
  colorTouch: {
    width: '16.666%',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
