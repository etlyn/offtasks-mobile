import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ImagePlus, Shuffle, Trash2 } from 'lucide-react-native';
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
import { pickGoalLogo } from '@/lib/pickGoalLogo';
import type { GoalLogo } from '@/lib/goalLogo';

export function GoalAppearanceSheet({
  name,
  total,
  initial,
  logo,
  logoOnDevice = false,
  onSaveLogo,
  onClose,
  onSave,
  onRemove,
}: {
  name: string | null;
  total: number;
  initial: GoalAppearance;
  logo?: GoalLogo;
  logoOnDevice?: boolean;
  onSaveLogo?: (logo: GoalLogo | null) => Promise<void>;
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
  const [choosing, setChoosing] = React.useState(false);
  const [logoChange, setLogoChange] = React.useState<GoalLogo | null>();
  const [logoError, setLogoError] = React.useState('');
  const displayedLogo = logoChange === undefined ? logo : logoChange;
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const busy = React.useRef(false);
  const previousName = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (name && name !== previousName.current) {
      setDraft(initial);
      setLogoChange(undefined);
      setLogoError('');
    }
    previousName.current = name;
  }, [name, initial]);
  const change = (value: GoalAppearance) => {
    animateLayout();
    setDraft(value);
  };
  const chooseLogo = async () => {
    if (busy.current || !name) return;
    busy.current = true;
    setChoosing(true);
    setLogoError('');
    try {
      const next = await pickGoalLogo();
      if (next && mounted.current) setLogoChange(next);
    } catch (error) {
      if (mounted.current)
        setLogoError(
          error instanceof Error
            ? error.message
            : 'The photo could not be opened.',
        );
    } finally {
      busy.current = false;
      if (mounted.current) setChoosing(false);
    }
  };
  const save = async () => {
    if (busy.current || !name) return;
    busy.current = true;
    setSaving(true);
    setLogoError('');
    try {
      await onSave(draft);
      if (onSaveLogo && logoChange !== undefined) {
        try {
          await onSaveLogo(logoChange);
        } catch {
          if (mounted.current)
            setLogoError('Could not save the logo. Try again.');
          return;
        }
      }
      if (mounted.current) onClose();
    } catch {
      if (mounted.current)
        Alert.alert(
          'Could not save appearance',
          'Your choices are still here. Please try again.',
        );
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const ink = theme.colors.textPrimary;
  const muted = theme.colors.textSecondary;
  const editing = saving || choosing;
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
        disabled={choosing}
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
            logo={displayedLogo}
            size={64}
          />
          <View style={s.copy}>
            <Text numberOfLines={2} style={[s.title, { color: ink }]}>
              {display.current.name}
            </Text>
            <Text style={[s.caption, { color: muted }]}>Make it yours</Text>
          </View>
          <Pressable
            disabled={editing}
            accessibilityRole="button"
            accessibilityLabel="Surprise me"
            accessibilityHint="Choose a new color and emoji"
            onPress={() => change(surpriseGoalAppearance(draft))}
            style={s.touch}
          >
            <Shuffle size={18} color={ink} strokeWidth={1.7} />
          </Pressable>
        </View>
        {onSaveLogo ? (
          <>
            <View style={s.logoActions}>
              <Pressable
                disabled={editing}
                accessibilityRole="button"
                accessibilityLabel={
                  displayedLogo ? 'Replace goal logo' : 'Add goal logo'
                }
                onPress={chooseLogo}
                style={s.logoAction}
              >
                <ImagePlus size={16} color={ink} strokeWidth={1.7} />
                <Text style={[s.caption, { color: ink }]}>
                  {displayedLogo ? 'Replace logo' : 'Add logo'}
                </Text>
              </Pressable>
              {displayedLogo ? (
                <Pressable
                  disabled={editing}
                  accessibilityRole="button"
                  accessibilityLabel="Remove goal logo"
                  onPress={() => {
                    setLogoChange(null);
                    setLogoError('');
                  }}
                  style={s.logoAction}
                >
                  <Text style={[s.caption, { color: muted }]}>Remove logo</Text>
                </Pressable>
              ) : null}
            </View>
            {logoError ? (
              <Text
                accessibilityRole="alert"
                style={[s.caption, { color: ink }]}
              >
                {logoError}
              </Text>
            ) : null}
          </>
        ) : null}
        <View style={s.sectionHeading}>
          <Text style={[s.label, { color: muted }]}>Icon</Text>
          <Pressable
            disabled={editing}
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
              disabled={editing}
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
              disabled={editing}
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
          {onSaveLogo && !logoOnDevice
            ? 'Logos sync to your account. Colors and emoji stay on this device.'
            : 'Appearance is saved on this device.'}
        </Text>
        {display.current.total === 0 ? (
          <Pressable
            disabled={editing}
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
  logoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  logoAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
