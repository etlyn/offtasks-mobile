import React from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Bookmark, Ellipsis, FileText } from 'lucide-react-native';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useAppTheme } from '@/theme/colors';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
import { getNoteTone, type NoteTone } from '@/lib/noteAppearance';
import type { Note } from '@/lib/notes';

/** Color updates ease from the current rendered value, even with rapid input. */
export function NotePaper({
  tone,
  children,
  style,
}: {
  tone?: NoteTone;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const color = getNoteTone(tone);
  const target = theme.isDark ? color.dark : color.light;
  const currentColor = React.useRef<string>(target);
  const transition = React.useMemo(
    () => ({
      value: new Animated.Value(0),
      from: currentColor.current,
      to: target,
    }),
    [target],
  );
  React.useEffect(() => {
    const { value, from, to } = transition;
    const listener = value.addListener(({ value: fraction }) => {
      currentColor.current =
        '#' +
        [1, 3, 5]
          .map(offset => {
            const start = parseInt(from.slice(offset, offset + 2), 16);
            const end = parseInt(to.slice(offset, offset + 2), 16);
            return Math.round(start + (end - start) * fraction)
              .toString(16)
              .padStart(2, '0');
          })
          .join('');
    });
    if (reduceMotion) {
      value.setValue(1);
      currentColor.current = to;
    } else
      Animated.timing(value, {
        toValue: 1,
        duration: 280,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
        isInteraction: false,
      }).start();
    return () => {
      value.stopAnimation();
      value.removeListener(listener);
    };
  }, [transition, reduceMotion]);
  const background = transition.value.interpolate({
    inputRange: [0, 1],
    outputRange: [transition.from, transition.to],
  });
  return (
    <Animated.View
      style={[
        s.paper,
        {
          backgroundColor: background,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(21,45,37,0.06)',
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function NoteCard({
  note,
  onOpen,
  onPin,
  onOptions,
  disabled,
}: {
  note: Note;
  onOpen: () => void;
  onPin: () => void;
  onOptions: () => void;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const tone = getNoteTone(note.tone);
  return (
    <NotePaper tone={note.tone}>
      <View style={s.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open note ${note.title}`}
          disabled={disabled}
          onPress={onOpen}
          style={s.content}
        >
          <Text
            numberOfLines={2}
            style={[s.title, { color: theme.colors.textPrimary }]}
          >
            {note.title}
          </Text>
          {note.body ? (
            <Text
              numberOfLines={3}
              style={[s.body, { color: theme.colors.textSecondary }]}
            >
              {note.body}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${note.pinned ? 'Unpin' : 'Pin'} ${note.title}`}
          accessibilityState={{ selected: note.pinned, disabled }}
          disabled={disabled}
          onPress={onPin}
          style={s.action}
        >
          <Bookmark
            size={16}
            strokeWidth={1.7}
            color={note.pinned ? brand : theme.colors.textMuted}
            fill={note.pinned ? brand : 'none'}
          />
        </Pressable>
      </View>
      <View style={s.footer}>
        <FileText size={12} strokeWidth={1.6} color={tone.accent} />
        <Text style={[s.date, { color: theme.colors.textSecondary }]}>
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Appearance for ${note.title}`}
          accessibilityHint="Choose a subtle paper color"
          disabled={disabled}
          onPress={onOptions}
          style={[s.action, s.options]}
        >
          <Ellipsis
            size={17}
            strokeWidth={1.6}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      </View>
    </NotePaper>
  );
}
const s = StyleSheet.create({
  paper: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingTop: 14,
    paddingLeft: 16,
    paddingRight: 6,
    paddingBottom: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  content: { flex: 1, minHeight: 44, gap: 6, paddingTop: 2 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  body: { fontSize: 13, lineHeight: 20 },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 11 },
  options: { marginLeft: 'auto' },
});
