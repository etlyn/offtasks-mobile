import React from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { GlassSurface } from '@/components/GlassSurface';
import { GentlePressable } from '@/components/ProductUI';
import { useAppTheme } from '@/theme/colors';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';

export function NotesFilter({
  pinnedOnly,
  onChange,
}: {
  pinnedOnly: boolean;
  onChange: (pinnedOnly: boolean) => void;
}) {
  const theme = useAppTheme();
  const { reduceMotion } = useCalendarTransition();
  const { fontScale } = useWindowDimensions();
  const optionWidth = Math.max(64, Math.ceil(64 * fontScale));
  const visibleHeight = Math.max(30, Math.ceil(18 * fontScale) + 10);
  const touchHeight = Math.max(44, visibleHeight);
  const target = pinnedOnly ? optionWidth : 0;
  const position = React.useRef(new Animated.Value(target)).current;
  React.useEffect(() => {
    position.stopAnimation();
    if (reduceMotion) {
      position.setValue(target);
      return;
    }
    const movement = Animated.timing(position, {
      toValue: target,
      duration: 280,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    movement.start();
    return () => movement.stop();
  }, [target, reduceMotion, position]);

  return (
    <View style={s.row}>
      <View
        testID="notes-filter"
        style={{ width: optionWidth * 2 + 4, minHeight: touchHeight }}
      >
        <GlassSurface
          pointerEvents="none"
          testID="notes-filter-track"
          style={[
            s.track,
            {
              top: (touchHeight - visibleHeight) / 2,
              height: visibleHeight,
              borderRadius: visibleHeight / 2,
              borderColor: theme.isDark
                ? 'rgba(216,243,229,0.12)'
                : 'rgba(21,45,37,0.08)',
            },
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(216,243,229,0.04)'
                  : 'rgba(21,45,37,0.035)',
              },
            ]}
          />
          <Animated.View
            testID="notes-filter-selection"
            style={[
              s.selection,
              {
                width: optionWidth,
                borderRadius: (visibleHeight - 4) / 2,
                backgroundColor: theme.isDark
                  ? 'rgba(216,243,229,0.16)'
                  : 'rgba(255,255,255,0.88)',
                transform: [{ translateX: position }],
              },
            ]}
          />
        </GlassSurface>
        <View style={s.options}>
          {['All', 'Pinned'].map((label, index) => {
            const selected = pinnedOnly === !!index;
            return (
              <GentlePressable
                key={label}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                onPress={() => {
                  if (!selected) onChange(!!index);
                }}
                style={[
                  s.option,
                  { width: optionWidth, minHeight: touchHeight },
                ]}
              >
                <Text
                  style={[
                    s.label,
                    {
                      color: selected
                        ? theme.isDark
                          ? '#D8F3E5'
                          : '#152D25'
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {label}
                </Text>
              </GentlePressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { marginHorizontal: 24, marginBottom: 4, alignItems: 'flex-start' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
  selection: { position: 'absolute', top: 2, bottom: 2, left: 2 },
  options: { flexDirection: 'row', paddingHorizontal: 2 },
  option: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
});
