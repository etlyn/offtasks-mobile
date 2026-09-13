import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Shuffle, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DetachedSheet } from '@/components/DetachedSheet';
import { SheetHeader } from '@/components/SheetHeader';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { useAppTheme } from '@/theme/colors';
import {
  goalColors,
  goalEmoji,
  surpriseGoalAppearance,
  type GoalAppearance,
} from '@/lib/goalAppearance';
import { GoalAvatar } from './GoalAvatar';

export function GoalAppearanceSheet({
  name,
  total,
  initial,
  onClose,
  onSave,
  onRemove,
}: {
  name: string | null;
  total: number;
  initial: GoalAppearance;
  onClose: () => void;
  onSave: (appearance: GoalAppearance) => Promise<void>;
  onRemove: () => void;
}) {
  const display = React.useRef({ name, total });
  if (name) display.current = { name, total };
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { reduceMotion, animateLayout } = useCalendarTransition();
  const [draft, setDraft] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const busy = React.useRef(false);
  const previousName = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (name && name !== previousName.current) setDraft(initial);
    previousName.current = name;
  }, [name, initial]);
  const change = (value: GoalAppearance) => {
    animateLayout();
    setDraft(value);
  };
  const save = async () => {
    if (busy.current || !name) return;
    busy.current = true;
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch {
      Alert.alert(
        'Could not save appearance',
        'Your choices are still here. Please try again.',
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const ink = theme.colors.textPrimary;
  const muted = theme.colors.textSecondary;
  const close = () => {
    if (!busy.current) onClose();
  };
  return (
    <DetachedSheet
      visible={!!name}
      reduceMotion={reduceMotion}
      insetTop={insets.top}
      insetBottom={insets.bottom}
      dismissLabel="Dismiss goal appearance"
      onClose={close}
    >
      <SheetHeader
        onClose={close}
        onSave={save}
        closeLabel="Close goal appearance"
        saveLabel="Save goal appearance"
        action="Done"
        busy={saving}
        disabled={false}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.preview}>
          <GoalAvatar
            name={display.current.name ?? ''}
            appearance={draft}
            size={64}
          />
          <View style={s.copy}>
            <Text numberOfLines={2} style={[s.title, { color: ink }]}>
              {display.current.name}
            </Text>
            <Text style={[s.caption, { color: muted }]}>Make it yours</Text>
          </View>
          <Pressable
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Surprise me"
            accessibilityHint="Choose a new color and emoji"
            onPress={() => change(surpriseGoalAppearance(draft))}
            style={s.touch}
          >
            <Shuffle size={18} color={ink} strokeWidth={1.7} />
          </Pressable>
        </View>
        <View style={s.sectionHeading}>
          <Text style={[s.label, { color: muted }]}>Icon</Text>
          <Pressable
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Use initials avatar"
            accessibilityState={{ selected: draft.emoji === null }}
            onPress={() => change({ ...draft, emoji: null })}
            style={s.initials}
          >
            <Text style={[s.caption, { color: ink }]}>Initials</Text>
            {draft.emoji === null ? <Check size={13} color={ink} /> : null}
          </Pressable>
        </View>
        <View style={s.grid}>
          {goalEmoji.map(emoji => (
            <Pressable
              key={emoji}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={`Use ${emoji} emoji`}
              accessibilityState={{ selected: draft.emoji === emoji }}
              onPress={() => change({ ...draft, emoji })}
              style={s.emojiTouch}
            >
              <View
                style={[
                  s.emojiSurface,
                  {
                    backgroundColor:
                      draft.emoji === emoji
                        ? theme.isDark
                          ? '#3A5145'
                          : '#E4EEE7'
                        : 'transparent',
                  },
                ]}
              >
                <Text style={s.emoji}>{emoji}</Text>
                {draft.emoji === emoji ? <View style={s.selectedDot} /> : null}
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={[s.label, { color: muted }]}>Color</Text>
        <View style={s.colors}>
          {goalColors.map((color, index) => (
            <Pressable
              key={color.name}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={`${color.name} color`}
              accessibilityState={{ selected: draft.color === index }}
              onPress={() => change({ ...draft, color: index })}
              style={s.colorTouch}
            >
              <View
                style={[
                  s.swatch,
                  { backgroundColor: theme.isDark ? color.dark : color.light },
                ]}
              >
                {draft.color === index ? (
                  <Check
                    size={16}
                    color={theme.isDark ? color.light : color.ink}
                    strokeWidth={2}
                  />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={[s.local, { color: muted }]}>
          Appearance is saved on this device.
        </Text>
        {display.current.total === 0 ? (
          <Pressable
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={`Remove empty goal ${name}`}
            onPress={onRemove}
            style={s.remove}
          >
            <Trash2 size={15} color={muted} strokeWidth={1.7} />
            <Text style={[s.caption, { color: muted }]}>Remove empty goal</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </DetachedSheet>
  );
}
const s = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 18, gap: 10 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 4,
  },
  copy: { flex: 1, gap: 5 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: '500' },
  touch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  initials: {
    minHeight: 44,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: -8 },
  emojiTouch: {
    width: '16.666%',
    minWidth: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSurface: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  selectedDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#689B79',
    position: 'absolute',
    bottom: 1,
  },
  colors: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  local: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  remove: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
