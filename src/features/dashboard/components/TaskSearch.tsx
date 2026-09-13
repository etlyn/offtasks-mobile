import React from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { GlassSurface } from '@/components/GlassSurface';
import { useAppTheme } from '@/theme/colors';
import { useCalendarTransition } from './useCalendarTransition';
import { HeaderSlot, useSharedHeader } from '@/navigation/SharedHeader';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TaskSearchButton({ onPress }: { onPress: () => void }) {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const feedback = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => () => feedback.stopAnimation(), [feedback]);
  const easePress = (pressed: boolean) => {
    feedback.stopAnimation();
    if (reduceMotion) {
      feedback.setValue(pressed ? 0.65 : 1);
      return;
    }
    Animated.timing(feedback, {
      toValue: pressed ? 0.65 : 1,
      duration: 160,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Search tasks"
      onPress={onPress}
      onPressIn={() => easePress(true)}
      onPressOut={() => easePress(false)}
      style={[s.trigger, { opacity: feedback }]}
    >
      <GlassSurface
        testID="calendar-search-surface"
        style={[s.triggerSurface, theme.isDark ? s.fieldDark : s.fieldLight]}
      >
        <Search
          size={18}
          strokeWidth={2}
          color={theme.isDark ? '#D8F3E5' : '#152D25'}
        />
      </GlassSurface>
    </AnimatedPressable>
  );
}

export function TaskSearchHeader({
  registerHeader = true,
  ...props
}: React.ComponentProps<typeof SearchHeaderContent> & {
  registerHeader?: boolean;
}) {
  const sharedHeader = useSharedHeader();
  if (!sharedHeader || !registerHeader)
    return <SearchHeaderContent {...props} />;
  return (
    <>
      <HeaderSlot searching />
      <SearchHeaderContent {...props} />
    </>
  );
}

function SearchHeaderContent({
  topInset,
  value,
  onChange,
  onClose,
  progress,
  fieldProgress,
  ready,
  resultCount,
  scope = 'tasks',
}: {
  topInset: number;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  progress: Animated.Value;
  fieldProgress: Animated.Value;
  ready: boolean;
  resultCount: number;
  scope?: 'tasks' | 'notes' | 'goals' | 'items';
}) {
  const theme = useAppTheme();
  const input = React.useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const fieldWidth = Math.max(44, width - 48);
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';

  React.useEffect(() => {
    if (ready) input.current?.focus();
    else input.current?.blur();
  }, [ready]);

  return (
    <Animated.View
      testID="task-search-header"
      onAccessibilityEscape={onClose}
      style={[
        s.header,
        {
          paddingTop: topInset + 4,
        },
      ]}
    >
      <View testID="task-search-full-width" style={s.fieldTrack}>
        <Animated.View
          testID="task-search-expanding-field"
          style={[
            s.fieldShadow,
            {
              width: fieldProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [36, fieldWidth],
              }),
              height: fieldProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [36, 44],
              }),
              marginRight: fieldProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 0],
              }),
              shadowOpacity: fieldProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.06],
              }),
            },
          ]}
        >
          <GlassSurface
            testID="task-search-field"
            style={[s.field, theme.isDark ? s.fieldDark : s.fieldLight]}
          >
            <Animated.View
              style={[
                s.fieldContent,
                {
                  width: fieldWidth,
                  paddingLeft: fieldProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 14],
                  }),
                },
              ]}
            >
              <Search size={18} strokeWidth={1.8} color={brand} />
              <Animated.View
                style={[
                  s.inputContent,
                  {
                    opacity: progress.interpolate({
                      inputRange: [0, 0.35, 1],
                      outputRange: [0, 0, 1],
                    }),
                  },
                ]}
              >
                <TextInput
                  ref={input}
                  accessibilityLabel={
                    scope === 'items'
                      ? 'Search'
                      : scope === 'tasks'
                      ? 'Search all tasks'
                      : `Search ${scope}`
                  }
                  placeholder={
                    scope === 'items'
                      ? 'Search'
                      : scope === 'tasks'
                      ? 'Search all tasks'
                      : `Search ${scope}`
                  }
                  placeholderTextColor={theme.colors.textSecondary}
                  selectionColor={brand}
                  style={[s.input, { color: theme.colors.textPrimary }]}
                  value={value}
                  onChangeText={onChange}
                  editable={ready}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={Keyboard.dismiss}
                  keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                />
                {value.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      scope === 'tasks' || scope === 'items'
                        ? 'Clear search'
                        : `Clear ${scope.slice(0, -1)} search`
                    }
                    onPress={() => {
                      onChange('');
                      input.current?.focus();
                    }}
                    style={s.clear}
                  >
                    <View
                      style={[
                        s.clearIcon,
                        theme.isDark ? s.clearDark : s.clearLight,
                      ]}
                    >
                      <X size={12} strokeWidth={2} color={brand} />
                    </View>
                  </Pressable>
                ) : null}
              </Animated.View>
            </Animated.View>
          </GlassSurface>
        </Animated.View>
      </View>
      <Animated.View
        testID="task-search-second-row"
        style={[
          s.secondRow,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.15, 1],
              outputRange: [0, 0, 1],
            }),
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TaskSearchSummary
          scope={scope}
          count={resultCount}
          hasQuery={value.trim().length > 0}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close search"
          onPress={onClose}
          style={s.cancel}
        >
          <Text style={[s.cancelText, { color: brand }]}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function TaskSearchSummary({
  count,
  hasQuery,
  scope,
}: {
  count: number;
  hasQuery: boolean;
  scope: 'tasks' | 'notes' | 'goals' | 'items';
}) {
  const theme = useAppTheme();
  return (
    <View style={s.summary}>
      <Text
        accessibilityRole="header"
        style={[s.title, { color: theme.colors.textPrimary }]}
      >
        {hasQuery
          ? 'Results'
          : scope === 'items'
          ? 'Everything'
          : `All ${scope}`}
      </Text>
      {hasQuery ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${count} ${
            count === 1 ? scope.slice(0, -1) : scope
          } found`}
          style={[s.count, { color: theme.colors.textSecondary }]}
        >
          {count}
        </Text>
      ) : null}
    </View>
  );
}

export function TaskSearchEmpty({ hasQuery }: { hasQuery: boolean }) {
  const theme = useAppTheme();
  return (
    <View testID="task-search-empty" style={s.empty}>
      <Search
        size={22}
        strokeWidth={1.4}
        color={theme.isDark ? '#A9D9C7' : '#628476'}
      />
      <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>
        {hasQuery ? 'No matching tasks' : 'Find a task, from any day'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  trigger: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerSurface: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
  },
  fieldShadow: {
    alignSelf: 'flex-end',
    shadowColor: '#152D25',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  field: {
    flex: 1,
    borderRadius: 22,
  },
  fieldTrack: { width: '100%', height: 44, justifyContent: 'center' },
  inputContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 14,
    gap: 9,
  },
  fieldDark: { borderColor: 'rgba(216,243,229,0.18)' },
  fieldLight: { borderColor: 'rgba(21,45,37,0.12)' },
  clearDark: { backgroundColor: 'rgba(216,243,229,0.12)' },
  clearLight: { backgroundColor: 'rgba(21,45,37,0.08)' },
  input: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 0,
    paddingRight: 12,
    fontSize: 15,
  },
  clear: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  clearIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancel: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '500' },
  summary: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  count: { fontSize: 12, fontVariant: ['tabular-nums'] },
  empty: {
    minHeight: 88,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 13, flexShrink: 1, lineHeight: 20 },
});
