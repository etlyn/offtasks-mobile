import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
} from 'react-native';
import { Search, X, type LucideIcon } from 'lucide-react-native';
import { GlassSurface } from './GlassSurface';
import { useAppTheme } from '@/theme/colors';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';

export { CalendarBackdrop as PageBackdrop } from './PageBackdrop';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function GentlePressable({
  style,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps) {
  const { reduceMotion } = useCalendarTransition();
  const opacity = React.useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = React.useState(false);
  React.useEffect(() => () => opacity.stopAnimation(), [opacity]);
  const feedback = (pressed: boolean) => {
    setPressed(pressed);
    opacity.stopAnimation();
    if (reduceMotion) {
      opacity.setValue(pressed ? 0.65 : 1);
      return;
    }
    Animated.timing(opacity, {
      toValue: pressed ? 0.65 : 1,
      duration: 160,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };
  return (
    <AnimatedPressable
      {...props}
      onPressIn={event => {
        feedback(true);
        onPressIn?.(event);
      }}
      onPressOut={event => {
        feedback(false);
        onPressOut?.(event);
      }}
      style={[
        typeof style === 'function' ? style({ pressed }) : style,
        { opacity: props.disabled ? 0.4 : opacity },
      ]}
    />
  );
}

export function QuietSearch({
  value,
  onChange,
  label,
  clearLabel,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  clearLabel: string;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const theme = useAppTheme();
  const input = React.useRef<TextInput>(null);
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  return (
    <GlassSurface style={[s.search, theme.isDark ? s.edgeDark : s.edgeLight]}>
      <Search size={18} strokeWidth={1.8} color={brand} />
      <TextInput
        ref={inputRef ?? input}
        accessibilityLabel={label}
        placeholder={label}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChange}
        style={[s.input, { color: theme.colors.textPrimary }]}
        selectionColor={brand}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        keyboardAppearance={theme.keyboardAppearance}
      />
      {value ? (
        <GentlePressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          style={s.clear}
          onPress={() => {
            onChange('');
            (inputRef ?? input).current?.focus();
          }}
        >
          <X size={16} strokeWidth={1.8} color={brand} />
        </GentlePressable>
      ) : null}
    </GlassSurface>
  );
}

export function QuietEmpty({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={s.empty}>
      <Icon
        size={24}
        strokeWidth={1.4}
        color={theme.isDark ? '#A9D9C7' : '#628476'}
      />
      <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  search: {
    marginHorizontal: 24,
    marginBottom: 12,
    minHeight: 44,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  edgeDark: { borderColor: 'rgba(216,243,229,0.18)' },
  edgeLight: { borderColor: 'rgba(21,45,37,0.12)' },
  input: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 0,
    fontSize: 15,
  },
  clear: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    minHeight: 116,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 13, lineHeight: 20, flexShrink: 1 },
});
